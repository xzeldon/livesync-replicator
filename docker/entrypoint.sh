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

echo "[Entrypoint] Starting Replicator..."
exec su-exec "$USER_ID:$GROUP_ID" deno run \
    --allow-net \
    --allow-read \
    --allow-write \
    --allow-env \
    --sloppy-imports \
    main.ts
