import { parseJsonC } from "../deps.ts";
import { Logger } from "./logger.ts";
import { AppConfig } from "./types.ts";

const CONFIG_FILE = "config.json";

const DEFAULTS: Partial<AppConfig> = {
	baseDir: "",
	localDir: "./vault",
	dryRun: false,
	purgeUnused: false,
	// Default to V2 as it is the current standard, can be overridden via Env
	E2EEAlgorithm: "AES-GCM-V2" as AppConfig["E2EEAlgorithm"],
};

export class ConfigProvider {
	/**
	 * Loads configuration with the following priority:
	 * 1. Environment Variables
	 * 2. config.json file
	 * 3. Default values
	 */
	static async load(): Promise<AppConfig> {
		const fileConfig = await this.loadFromFile();
		const envConfig = this.loadFromEnv();

		const merged = {
			...DEFAULTS,
			...fileConfig,
			...envConfig,
		};

		this.validate(merged);

		// Ensure obfuscatePassphrase matches passphrase if not explicitly set
		// This is required for decrypting file paths.
		if (merged.passphrase && !merged.obfuscatePassphrase) {
			merged.obfuscatePassphrase = merged.passphrase;
		}

		return merged as AppConfig;
	}

	private static async loadFromFile(): Promise<Partial<AppConfig>> {
		try {
			const text = await Deno.readTextFile(CONFIG_FILE);
			return parseJsonC(text) as Partial<AppConfig>;
		} catch (_e) {
			Logger.warn(
				`Configuration file ${CONFIG_FILE} not found or invalid. Using defaults/env.`
			);
			return {};
		}
	}

	private static loadFromEnv(): Partial<AppConfig> {
		const config: Partial<AppConfig> = {};

		const url = Deno.env.get("LIVESYNC_URL");
		const db = Deno.env.get("LIVESYNC_DATABASE");
		const user = Deno.env.get("LIVESYNC_USERNAME");
		const pass = Deno.env.get("LIVESYNC_PASSWORD");
		const passphrase = Deno.env.get("LIVESYNC_PASSPHRASE");
		const localDir = Deno.env.get("LIVESYNC_LOCAL_DIR");
		const algo = Deno.env.get("LIVESYNC_ALGO");

		if (url) config.url = url;
		if (db) config.database = db;
		if (user) config.username = user;
		if (pass) config.password = pass;
		if (passphrase) config.passphrase = passphrase;
		if (localDir) config.localDir = localDir;
		if (algo) config.E2EEAlgorithm = algo as AppConfig["E2EEAlgorithm"];

		const dryRun = Deno.env.get("LIVESYNC_DRY_RUN");
		if (dryRun) config.dryRun = dryRun === "true";

		return config;
	}

	private static validate(config: Partial<AppConfig>) {
		const missing = [];
		if (!config.url) missing.push("url");
		if (!config.database) missing.push("database");
		if (!config.username) missing.push("username");
		if (!config.password) missing.push("password");
		if (!config.passphrase) missing.push("passphrase");

		if (missing.length > 0) {
			throw new Error(`Missing required configuration: ${missing.join(", ")}`);
		}
	}
}
