import { DirectFileManipulatorOptions, ReadyEntry } from "../deps.ts";

export interface AppConfig extends DirectFileManipulatorOptions {
	localDir: string;
	baseDir?: string;
	dryRun: boolean;
	purgeUnused: boolean;
	concurrency: number;
}

export interface ProcessingStats {
	totalDocs: number;
	processed: number;
	downloaded: number;
	failed: number;
	skipped: number;
}

export type FetchResult =
	| { type: "meta"; total: number }
	| { type: "doc"; success: true; doc: ReadyEntry; id: string }
	| { type: "doc"; success: false; error: unknown; id: string };
