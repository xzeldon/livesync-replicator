import { dirname, ensureDir } from "../deps.ts";
import { Logger } from "./logger.ts";

export class FileSystemAdapter {
	constructor(private baseDir: string) {}

	async write(
		relativePath: string,
		data: Uint8Array | string,
		mtime?: number
	): Promise<void> {
		const fullPath = this.resolvePath(relativePath);
		await ensureDir(dirname(fullPath));

		if (typeof data === "string") {
			await Deno.writeTextFile(fullPath, data);
		} else {
			await Deno.writeFile(fullPath, data);
		}

		if (mtime) {
			try {
				const date = new Date(mtime);
				await Deno.utime(fullPath, date, date);
			} catch {
				// Warning suppressed, utime is not critical
			}
		}
	}

	async delete(relativePath: string): Promise<void> {
		const fullPath = this.resolvePath(relativePath);
		try {
			await Deno.remove(fullPath);
			Logger.info(`Deleted file: ${relativePath}`);
		} catch (e) {
			if (!(e instanceof Deno.errors.NotFound)) {
				Logger.warn(`Failed to delete ${relativePath}: ${e}`);
			}
		}
	}

	async exists(relativePath: string): Promise<boolean> {
		try {
			await Deno.stat(this.resolvePath(relativePath));
			return true;
		} catch {
			return false;
		}
	}

	async getMTime(relativePath: string): Promise<number> {
		try {
			const stat = await Deno.stat(this.resolvePath(relativePath));
			if (!stat.mtime) return 0;
			// Convert to seconds to match LiveSync format
			return Math.floor(stat.mtime.getTime() / 1000);
		} catch {
			return -1;
		}
	}

	private resolvePath(relativePath: string): string {
		return `${this.baseDir}/${relativePath}`;
	}
}
