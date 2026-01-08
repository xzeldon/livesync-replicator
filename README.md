# LiveSync Replicator

A standalone tool to download and decrypt your [Obsidian](https://obsidian.md) [Self-hosted LiveSync](https://github.com/vrtmrz/obsidian-livesync) vault into local files.

## Why?

[Self-hosted LiveSync](https://github.com/vrtmrz/obsidian-livesync) is an excellent plugin for synchronizing your Obsidian Vault across different devices. However, it is designed for _synchronization_, not for _backups_.

The data in [CouchDB](https://couchdb.apache.org) is stored as chunks and blobs. You cannot simply back up the database and expect to read your Markdown files later.

Previously, if you wanted to create a readable backup of your Vault on a server, you had to run a full instance of Obsidian with a GUI. This required complex workarounds like running [KasmVM](https://kasm.com/kasmvnc) or X11/VNC on your server, which is difficult to set up and consumes a lot of system resources.

**LiveSync Replicator** solves this problem. It uses the [core logic from the LiveSync plugin](https://github.com/vrtmrz/livesync-commonlib) itself to connect to your database, decrypt your data, and reconstruct your files. It runs entirely without a GUI (headless), making it lightweight and perfect for automated server backups.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine.

### Prerequisites

You need the following tools installed on your system:

- [Deno](https://deno.com) (v2.x recommended)
- [Git](https://git-scm.com)

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
   	"localDir": "./vault",
   	"dryRun": false,
   	"concurrency": 20,
   	"requestTimeout": 60000
   }
   ```

   **Option B: Environment Variables**:
   Useful for servers or Docker (coming soon).

   - `LIVESYNC_URL`: The URL of your CouchDB instance (e.g., `http://127.0.0.1:5984`).
   - `LIVESYNC_DATABASE`: The database name (default: `livesync`).
   - `LIVESYNC_USERNAME`: CouchDB username.
   - `LIVESYNC_PASSWORD`: CouchDB password.
   - `LIVESYNC_PASSPHRASE`: Your Obsidian End-to-End Encryption passphrase.
   - `LIVESYNC_LOCAL_DIR`: Directory where files will be saved.
   - `LIVESYNC_DRY_RUN`: Set to `true` to simulate the process without writing files.
   - `LIVESYNC_CONCURRENCY`: Number of parallel downloads (default: `20`). Increase for faster speeds on good networks and servers.
   - `LIVESYNC_TIMEOUT`: Request timeout in milliseconds (default: `60000`). Increase if you have large files or a slow connection.

3. **Run the replicator**

   ```bash
   deno task start
   ```

   The script will prepare the library, connect to the database, and download your decrypted files to the target directory.

## Deployment

Docker instructions coming soon.

## License

Licensed under the MIT License.
