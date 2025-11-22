# DevContainer Setup for Bionic-Agents

This directory contains the development container configuration for the Bionic-Agents project.

## What's Included

- **Node.js 22** - Latest LTS version
- **pnpm** - Fast, disk space efficient package manager
- **PostgreSQL 16** - Database server
- **Git** - Version control
- **kubectl** - Kubernetes CLI tool
- **PostgreSQL client** - For database management

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [VS Code](https://code.visualstudio.com/) with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

## Getting Started

### Option 1: Using VS Code

1. Open the project in VS Code
2. When prompted, click "Reopen in Container" or press `F1` and select "Dev Containers: Reopen in Container"
3. Wait for the container to build and start (first time may take a few minutes)
4. The post-create script will automatically:
   - Install dependencies for all components
   - Set up the PostgreSQL database
   - Run database migrations

### Option 2: Using Docker Compose Directly

```bash
cd .devcontainer
docker compose up -d
docker compose exec app bash
```

## Services

The devcontainer includes:

- **app**: Main development container with Node.js and tools
- **postgres**: PostgreSQL 16 database server

## Port Forwarding

The following ports are automatically forwarded:

- `3000` - Agent-Builder (default)
- `3001` - Agent-Dashboard (if needed)
- `3002` - Agent-Runtime (if needed)
- `5432` - PostgreSQL database
- `8080` - Agent-Runtime API

## Database Connection

The database is automatically configured with:

- **Host**: `postgres` (within container) or `localhost` (from host)
- **Port**: `5432`
- **Database**: `liveagents`
- **Username**: `postgres`
- **Password**: `postgres`
- **Connection String**: `postgresql://postgres:postgres@postgres:5432/liveagents`

## Development Workflow

### Starting Individual Components

```bash
# Agent-Builder
cd Agent-Builder
pnpm dev

# Agent-Dashboard
cd Agent-Dashboard
pnpm dev

# Agent-Runtime
cd Agent-Runtime
pnpm dev
```

### Running Database Migrations

```bash
# Agent-Builder
cd Agent-Builder
export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/liveagents"
pnpm db:push

# Agent-Dashboard
cd Agent-Dashboard
export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/liveagents"
pnpm db:push

# Agent-Runtime
cd Agent-Runtime
export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/liveagents"
pnpm db:push
```

### Accessing PostgreSQL

From within the container:

```bash
psql -h postgres -U postgres -d liveagents
```

From the host machine (if port is forwarded):

```bash
psql -h localhost -p 5432 -U postgres -d liveagents
```

## Troubleshooting

### Container won't start

1. Ensure Docker is running
2. Check Docker logs: `docker compose logs`
3. Try rebuilding: `docker compose build --no-cache`

### Database connection issues

1. Check if PostgreSQL is healthy: `docker compose ps`
2. Check PostgreSQL logs: `docker compose logs postgres`
3. Verify connection string matches the service name `postgres`

### Node modules issues

If you encounter issues with node_modules:

```bash
# Reinstall dependencies in container
docker compose exec app bash -c "cd Agent-Builder && rm -rf node_modules && pnpm install"
docker compose exec app bash -c "cd Agent-Dashboard && rm -rf node_modules && pnpm install"
docker compose exec app bash -c "cd Agent-Runtime && rm -rf node_modules && pnpm install"

# Or rebuild container
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port conflicts

If ports are already in use, modify the port mappings in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Use 5433 instead of 5432
```

## Customization

### Adding Environment Variables

Edit `.devcontainer/devcontainer.json` and add to `remoteEnv`:

```json
"remoteEnv": {
  "DATABASE_URL": "postgresql://postgres:postgres@postgres:5432/liveagents",
  "CUSTOM_VAR": "value"
}
```

### Installing Additional Tools

Edit `.devcontainer/Dockerfile` and add packages:

```dockerfile
RUN apt-get update && apt-get install -y \
    your-package-here \
    && rm -rf /var/lib/apt/lists/*
```

## Notes

- **Source Code**: Mounted from host - all code changes are immediately reflected
- **Dependencies**: Installed in container - `node_modules` stay in the container filesystem
- **Database**: Data persists in a Docker volume (`postgres-data`)
- **Build Outputs**: `dist` folders are in container, not synced to host
- Changes to source code on host are immediately available in container
- Dependencies are isolated in container and don't affect host

