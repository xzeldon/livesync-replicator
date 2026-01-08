import { DirectFileManipulatorOptions } from "../deps.ts";

export interface AppConfig extends DirectFileManipulatorOptions {
	localDir: string;
	baseDir?: string;
	dryRun: boolean;
	purgeUnused: boolean;
}

export interface ProcessingStats {
	totalDocs: number;
	processed: number;
	downloaded: number;
	failed: number;
	skipped: number;
}
