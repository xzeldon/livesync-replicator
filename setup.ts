import { join } from "@std/path";

async function patchLibrary() {
  console.log("[SETUP] Patching livesync-commonlib for Deno environment...");

  const workerDir = join("lib", "src", "worker");
  const realWorker = join(workerDir, "bgWorker.ts");
  const mockWorker = join(workerDir, "bgWorker.mock.ts");

  try {
    const mockContent = await Deno.readTextFile(mockWorker);

    // Overwrite the real worker file with the mock implementation.
    // This removes Vite-specific import syntax ("?worker&inline") which crashes Deno.
    await Deno.writeTextFile(realWorker, mockContent);

    console.log("[SETUP] Success: bgWorker.ts patched.");
  } catch (error) {
    console.error("[SETUP] Error: Failed to patch library.");
    console.error(error);
    console.error(
      "Hint: Did you run 'git submodule update --init --recursive'?",
    );
    Deno.exit(1);
  }
}

if (import.meta.main) {
  await patchLibrary();
}
