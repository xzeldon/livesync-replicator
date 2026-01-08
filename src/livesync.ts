import { pooledMap } from "@std/async";
import { DirectFileManipulator, PouchDB, ReadyEntry } from "../deps.ts";
import { Logger } from "./logger.ts";
import { AppConfig, FetchResult } from "./types.ts";

/**
 * Adapter extending the library's manipulator to enforce
 * usage of the native Deno fetch API and robust enumeration.
 */
export class LiveSyncAdapter extends DirectFileManipulator {
	private config: AppConfig;

	constructor(config: AppConfig) {
		super(config);
		this.config = config;
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
		const url = `${this.config.url}/${this.config.database}`;

		return new PouchDB(url, {
			adapter: "http",
			auth: {
				username: this.config.username,
				password: this.config.password,
			},
			// Inject native fetch to handle HTTP/2 and Keep-Alive correctly
			fetch: async (url: string | Request, opts?: RequestInit) => {
				const fetchUrl = typeof url === "string" ? url : url.url;
				const headers = opts?.headers
					? new Headers(opts.headers)
					: new Headers();

				const controller = new AbortController();
				const timeoutId = setTimeout(
					() => controller.abort(),
					this.config.requestTimeout
				);

				try {
					return await fetch(fetchUrl, {
						...opts,
						headers,
						signal: controller.signal,
					});
				} finally {
					clearTimeout(timeoutId);
				}
			},
		});
	}

	/**
	 * Robust enumeration method that fetches all documents first,
	 * then attempts to decrypt them concurrently using a pool.
	 * This bypasses the library's prefix-based scanning which fails on some DB versions.
	 */
	async *fetchAllDocuments(concurrency: number): AsyncGenerator<FetchResult> {
		Logger.info("Fetching document list from database...");

		const db = this.liveSyncLocalDB.localDatabase;
		let result;

		try {
			// Fetch only metadata
			result = await db.allDocs({ include_docs: false });
		} catch (e) {
			Logger.error("Failed to connect to CouchDB.", e);
			throw e;
		}

		const rows = result.rows.filter(
			(row) => !row.id.startsWith("_design") && !row.id.startsWith("_local")
		);

		Logger.info(
			`Found ${rows.length} total entries. Processing with concurrency: ${concurrency}`
		);

		// Yield metadata first
		yield { type: "meta", total: rows.length };

		const processRow = async (row: (typeof rows)[0]): Promise<FetchResult> => {
			const id = row.id;
			try {
				const doc = await this.getById(id);

				if (!doc) return { type: "skipped", id };

				if (doc.type === "newnote" || doc.type === "plain") {
					return { type: "doc", success: true, doc: doc as ReadyEntry, id };
				}

				// It's a chunk, revision, or other internal data
				return { type: "skipped", id };
			} catch (e) {
				return { type: "doc", success: false, error: e, id };
			}
		};

		const results = pooledMap(concurrency, rows, processRow);

		for await (const res of results) {
			yield res;
		}
	}
}
