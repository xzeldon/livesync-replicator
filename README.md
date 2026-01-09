# LiveSync Replicator

A standalone tool to download and decrypt your [Obsidian](https://obsidian.md) [Self-hosted LiveSync](https://github.com/vrtmrz/obsidian-livesync) vault into local files.

## Why?

[Self-hosted LiveSync](https://github.com/vrtmrz/obsidian-livesync) is an excellent plugin for synchronizing your Obsidian Vault across different devices. However, it is designed for _synchronization_, not for _backups_.

The data in [CouchDB](https://couchdb.apache.org) is stored as chunks and blobs. You cannot simply back up the database and expect to read your Markdown files later.

Previously, if you wanted to create a readable backup of your Vault on a server, you had to run a full instance of Obsidian with a GUI. This required complex workarounds like running [KasmVM](https://kasm.com/kasmvnc) or X11/VNC on your server, which is difficult to set up and consumes a lot of system resources.

**LiveSync Replicator** solves this problem. It uses the [core logic from the LiveSync plugin](https://github.com/vrtmrz/livesync-commonlib) itself to connect to your database, decrypt your data, and reconstruct your files. It runs entirely without a GUI (headless), making it lightweight and perfect for automated server backups.

## Getting Started

These instructions will help you set up the project on your local machine or server.

### Prerequisites

Depending on how you want to run the tool, you need:

**For Local Run:**
- [Deno](https://deno.com) (v2.x recommended)
- [Git](https://git-scm.com)

**For Docker:**
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com)

### Installation

1. **Clone the repository**

First, clone the project and initialize the required submodules (essential for both Local and Docker methods).

```bash
git clone https://github.com/xzeldon/livesync-replicator.git
cd livesync-replicator
git submodule update --init --recursive
```

2. **Configuration**

You can configure the application using a `config.json` file **OR** Environment Variables. Environment variables take precedence over the configuration file.

**Option A: config.json (Recommended for Local Run)**:

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

**Option B: Environment Variables (Recommended for Docker)**:

- `LIVESYNC_URL`: The URL of your CouchDB instance (e.g., `http://127.0.0.1:5984`).
- `LIVESYNC_DATABASE`: The database name (default: `livesync`).
- `LIVESYNC_USERNAME`: CouchDB username.
- `LIVESYNC_PASSWORD`: CouchDB password.
- `LIVESYNC_PASSPHRASE`: Your Obsidian End-to-End Encryption passphrase.
- `LIVESYNC_LOCAL_DIR`: Directory where files will be saved.
- `LIVESYNC_DRY_RUN`: Set to `true` to simulate the process without writing files.
- `LIVESYNC_CONCURRENCY`: Number of parallel downloads (default: `20`). Increase for faster speeds on good networks.
- `LIVESYNC_TIMEOUT`: Request timeout in milliseconds (default: `60000`).
- `LIVESYNC_INTERVAL`: **(Docker Only)** Interval in seconds for continuous synchronization (e.g., `3600` for 1 hour). If unset, the container runs once and exits.

---

## Running Locally

If you have Deno installed and want to run the script directly:

```bash
deno task start
```

The script will prepare the library, connect to the database, and download your decrypted files to the target directory specified in your config.

---

## Running with Docker

This method is recommended for always-on servers or scheduled backups as it handles dependencies and permissions automatically.

### 1. Setup Environment Variables
Copy the example environment file and configure your credentials:

```bash
cp .env.example .env
nano .env
```

Fill in your CouchDB details inside the `.env` file. 

> **Note:** You generally do not need to change `LIVESYNC_LOCAL_DIR` when using Docker, as the container is pre-configured to save data to `/app/vault`.

### 2. Choose Operation Mode

You can run the replicator in two modes by adjusting the `LIVESYNC_INTERVAL` variable in your `docker-compose.yml` or `.env` file.

*   **Daemon Mode (Recommended):**  
    Set `LIVESYNC_INTERVAL` to a value in seconds (e.g., `3600` for every hour). The container will remain running and automatically sync your vault.
    
*   **One-Off Mode:**  
    Remove or comment out the `LIVESYNC_INTERVAL` variable. The container will perform a single sync and then exit. This is useful if you prefer to use an external scheduler (like cron).
	> **Important:** In this mode, change `restart: unless-stopped` to `restart: no` in your `docker-compose.yml`. Otherwise, Docker will endlessly restart the container immediately after it finishes.

### 3. Run with Docker Compose
Start the container in detached mode:

```bash
docker compose up -d --build
```

The replicator will start, and your vault files will appear in the `./vault` folder on your host machine (mapped via volumes).

### 4. Permissions (PUID/PGID)
To ensure the downloaded files are owned by your host user (and not `root`), the container supports `PUID` (User ID) and `PGID` (Group ID).

The default in `docker-compose.yml` is set to `1000:1000`. If your user ID on the host is different, update the environment variables in `docker-compose.yml`:

```yaml
environment:
  - PUID=1001 # Change to your UID (run `id -u` to find out)
  - PGID=1001 # Change to your GID (run `id -g` to find out)
```

### 5. Viewing Logs
To check the progress or debug issues:

```bash
docker compose logs -f
```

## License

Licensed under the MIT License.
