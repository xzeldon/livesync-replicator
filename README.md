# LiveSync Replicator

A standalone tool to download and decrypt your Obsidian Self-hosted LiveSync database into local files.

## Why?

Self-hosted LiveSync is an excellent plugin for synchronizing your Obsidian Vault across different devices. However, it is designed for _synchronization_, not for _backups_.

The data in CouchDB is stored as chunks and blobs. You cannot simply back up the database and expect to read your Markdown files later.

Previously, if you wanted to create a readable backup of your Vault on a server, you had to run a full instance of Obsidian with a GUI. This required complex workarounds like running KasmVM or X11/VNC on your server, which is difficult to set up and consumes a lot of system resources.

**LiveSync Replicator** solves this problem. It uses the core logic from the LiveSync plugin itself to connect to your database, decrypt your data, and reconstruct your files. It runs entirely without a GUI (headless), making it lightweight and perfect for automated server backups.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

You need the following tools installed on your system:

- [Deno](https://deno.com/deploy) (v2.x recommended)
- [Git](https://git-scm.com/)

### Installing

1. **Clone the repository**

   Clone the project and initialize the required submodules.

   ```bash
   git clone https://github.com/xzeldon/livesync-replicator.git
   cd livesync-replicator
   git submodule update --init --recursive
   ```

2. **Configuration**

   You can configure the application using a `config.json` file **OR** Environment Variables. Environment variables take precedence over the file.

   **Option A: config.json**:
   Create a file named `config.json` in the root directory:

   ```json
   {
   	"url": "http://127.0.0.1:5984",
   	"database": "livesync",
   	"username": "admin",
   	"password": "your_couchdb_password",
   	"passphrase": "your_obsidian_e2ee_passphrase",
   	"localDir": "./restored_vault",
   	"dryRun": false
   }
   ```

   **Option B: Environment Variables**:
   Useful for servers or Docker (coming soon).

   - `LIVESYNC_URL`
   - `LIVESYNC_DATABASE`
   - `LIVESYNC_USERNAME`
   - `LIVESYNC_PASSWORD`
   - `LIVESYNC_PASSPHRASE`
   - `LIVESYNC_LOCAL_DIR`
   - `LIVESYNC_DRY_RUN` (set to `true` or `false`)

3. **Run the replicator**

   ```bash
   deno task start
   ```

   The script will prepare the library, connect to the database, and download your decrypted files to the target directory.

## Deployment

Docker instructions coming soon.

## License

Licensed under the MIT License.
