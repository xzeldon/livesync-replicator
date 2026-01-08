import {
	DirectFileManipulator,
	DirectFileManipulatorOptions,
	PouchDB,
	ReadyEntry,
} from "../deps.ts";
import { Logger } from "./logger.ts";

/**
 * Adapter extending the library's manipulator to enforce
 * usage of the native Deno fetch API and robust enumeration.
 */
export class LiveSyncAdapter extends DirectFileManipulator {
	constructor(options: DirectFileManipulatorOptions) {
		super(options);
	}

	/**
	 * Override internal PouchDB instance creation to inject native fetch.
	 * This resolves "socket hang up" issues with node-fetch in Deno.
	 */
	// @ts-expect-error: Overriding protected/internal method
	protected $$createPouchDBInstance(
		_name?: string,
		_options?: unknown
	): unknown {
		const url = `${this.options.url}/${this.options.database}`;

		return new PouchDB(url, {
			adapter: "http",
			auth: {
				username: this.options.username,
				password: this.options.password,
			},
			// Inject native fetch to handle HTTP/2 and Keep-Alive correctly
			fetch: (url: string | Request, opts?: RequestInit) => {
				const fetchUrl = typeof url === "string" ? url : url.url;
				const headers = opts?.headers
					? new Headers(opts.headers)
					: new Headers();

				return fetch(fetchUrl, {
					...opts,
					headers,
				});
			},
		});
	}

	/**
	 * Robust enumeration method that fetches all documents first,
	 * then attempts to decrypt them one by one.
	 * This bypasses the library's prefix-based scanning which fails on some DB versions.
	 */
	async *fetchAllDocuments() {
		Logger.info("Fetching document list from database...");

		const db = this.liveSyncLocalDB.localDatabase;
		let result;

		try {
			// Fetch only metadata (include_docs: false) to prevent crash on decrypt error
			result = await db.allDocs({ include_docs: false });
		} catch (e) {
			Logger.error("Failed to connect to CouchDB.", e);
			throw e;
		}

		Logger.info(`Found ${result.rows.length} total entries in index.`);

		for (const row of result.rows) {
			// Skip design docs and local PouchDB metadata
			if (row.id.startsWith("_design") || row.id.startsWith("_local")) continue;

			try {
				// Attempt to fetch and decrypt the document
				const doc = await this.getById(row.id);

				if (!doc) continue;

				// Filter valid note types
				if (doc.type === "newnote" || doc.type === "plain") {
					yield { success: true, doc: doc as ReadyEntry, id: row.id };
				}
			} catch (e) {
				yield { success: false, error: e, id: row.id };
			}
		}
	}
}
