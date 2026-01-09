#!/bin/sh
set -e

USER_ID=${PUID:-1000}
GROUP_ID=${PGID:-1000}

if [ ! -d "$LIVESYNC_LOCAL_DIR" ]; then
    echo "[Entrypoint] Creating directory: $LIVESYNC_LOCAL_DIR"
    mkdir -p "$LIVESYNC_LOCAL_DIR"
fi

echo "[Entrypoint] Fixing permissions for: $LIVESYNC_LOCAL_DIR"
chown -R "$USER_ID:$GROUP_ID" "$LIVESYNC_LOCAL_DIR"

RUN_CMD="deno run --allow-net --allow-read --allow-write --allow-env --sloppy-imports main.ts"

if [ -z "$LIVESYNC_INTERVAL" ]; then
    echo "[Entrypoint] Mode: Run Once"
    exec su-exec "$USER_ID:$GROUP_ID" $RUN_CMD
fi

echo "[Entrypoint] Mode: Daemon (Interval: ${LIVESYNC_INTERVAL}s)"

run_loop() {
    while true; do
        echo "[Daemon] Starting sync job at $(date)"

        set +e
        su-exec "$USER_ID:$GROUP_ID" $RUN_CMD
        EXIT_CODE=$?
        set -e

        if [ $EXIT_CODE -ne 0 ]; then
            echo "[Daemon] Job failed with exit code $EXIT_CODE"
        else
            echo "[Daemon] Job finished successfully"
        fi

        echo "[Daemon] Sleeping for ${LIVESYNC_INTERVAL}s..."
        sleep "$LIVESYNC_INTERVAL" &

        wait $!
    done
}

trap "echo '[Daemon] Stopping...'; exit 0" SIGTERM SIGINT

run_loop
