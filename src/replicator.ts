import { decodeBinary, getDocData, ReadyEntry } from "../deps.ts";
import { FileSystemAdapter } from "./fs.ts";
import { LiveSyncAdapter } from "./livesync.ts";
import { Logger } from "./logger.ts";
import { AppConfig, ProcessingStats } from "./types.ts";

export class ReplicationService {
	private liveSync: LiveSyncAdapter;
	private fs: FileSystemAdapter;
	private stats: ProcessingStats = {
		totalDocs: 0,
		processed: 0,
		downloaded: 0,
		failed: 0,
		skipped: 0,
	};
	private readonly MAX_FAILURES = 10;

	constructor(private config: AppConfig) {
		this.liveSync = new LiveSyncAdapter(config);
		this.fs = new FileSystemAdapter(config.localDir);
	}

	async run(): Promise<void> {
		Logger.info("Initializing replication service...");

		try {
			if (this.liveSync.ready) {
				await this.liveSync.ready.promise;
			}

			await this.processDocuments();
		} catch (error) {
			Logger.error("Fatal error during replication flow", error);
			throw error;
		} finally {
			if (this.liveSync.close) {
				await this.liveSync.close();
			}
		}
	}

	private async processDocuments() {
		const generator = this.liveSync.fetchAllDocuments();
		let consecutiveFailures = 0;

		for await (const result of generator) {
			this.stats.totalDocs++;

			if (!result.success) {
				this.handleDecryptionFailure(result.id, result.error);
				consecutiveFailures++;
				if (consecutiveFailures >= this.MAX_FAILURES) {
					throw new Error(
						"Aborting due to excessive decryption failures. Check configuration."
					);
				}
				continue;
			}

			// Reset failure counter on success
			consecutiveFailures = 0;
			const doc = result.doc as ReadyEntry;

			// Filter by base directory if configured
			if (this.config.baseDir && !doc.path.startsWith(this.config.baseDir)) {
				continue;
			}

			await this.syncFile(doc);

			if (this.stats.totalDocs % 50 === 0) {
				Logger.info(`Progress: Scanned ${this.stats.totalDocs} documents...`);
			}
		}

		this.logSummary();
	}

	private async syncFile(doc: ReadyEntry) {
		const remoteMTime = doc.mtime ? Math.floor(doc.mtime / 1000) : 0;
		const deletionCandidate = doc as ReadyEntry & {
			_deleted?: boolean;
			deleted?: boolean;
		};
		const isDeleted = deletionCandidate._deleted || deletionCandidate.deleted;

		if (isDeleted) {
			if (await this.fs.exists(doc.path)) {
				if (!this.config.dryRun) {
					await this.fs.delete(doc.path);
				} else {
					Logger.info(`[DRY RUN] Would delete: ${doc.path}`);
				}
			}
			return;
		}

		const localMTime = await this.fs.getMTime(doc.path);

		if (localMTime >= remoteMTime) {
			this.stats.skipped++;
			return;
		}

		Logger.info(
			`Downloading: ${doc.path} (Remote: ${remoteMTime} > Local: ${localMTime})`
		);
		this.stats.downloaded++;

		if (this.config.dryRun) return;

		try {
			await this.writeToDisk(doc);
			this.stats.processed++;
		} catch (e) {
			Logger.error(`Failed to write file ${doc.path}`, e);
			this.stats.failed++;
		}
	}

	private async writeToDisk(doc: ReadyEntry) {
		let content: Uint8Array | string;

		if (doc.type === "newnote") {
			const binary = decodeBinary(doc.data);
			content = new Uint8Array(binary);
		} else {
			content = getDocData(doc.data);
		}

		await this.fs.write(doc.path, content, doc.mtime);
	}

	private handleDecryptionFailure(id: string, error: unknown) {
		this.stats.failed++;
		const msg = error instanceof Error ? error.message : String(error);

		// Log first few errors, suppress the rest to avoid log spam until abort
		if (this.stats.failed <= 5) {
			Logger.warn(`Decryption failed for ID ${id}: ${msg}`);
		}
	}

	private logSummary() {
		Logger.info("------------------------------------------------");
		Logger.info("Replication Summary:");
		Logger.info(`Total Scanned: ${this.stats.totalDocs}`);
		Logger.info(`Downloaded/Updated: ${this.stats.downloaded}`);
		Logger.info(`Skipped (Up-to-date): ${this.stats.skipped}`);
		Logger.info(`Failed: ${this.stats.failed}`);
		Logger.info("------------------------------------------------");
	}
}
