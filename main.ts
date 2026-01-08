import { ConfigProvider } from "./src/config.ts";
import { Logger } from "./src/logger.ts";
import { ReplicationService } from "./src/replicator.ts";

async function main() {
	try {
		const config = await ConfigProvider.load();

		Logger.info(`Starting replication to: ${config.localDir}`);
		if (config.dryRun) {
			Logger.warn(
				"Running in DRY-RUN mode. No changes will be written to disk."
			);
		}

		const service = new ReplicationService(config);
		const start = performance.now();

		await service.run();

		const duration = ((performance.now() - start) / 1000).toFixed(2);
		Logger.info(`Replication process completed in ${duration}s.`);

		Deno.exit(0);
	} catch (error) {
		Logger.error("Application crashed", error);
		Deno.exit(1);
	}
}

if (import.meta.main) {
	main();
}
