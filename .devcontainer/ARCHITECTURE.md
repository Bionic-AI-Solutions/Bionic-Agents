# DevContainer Architecture

## Overview

This devcontainer is configured with a **hybrid approach** where:
- **Source code** is mounted from the host filesystem
- **Dependencies** (`node_modules`) are installed and stored in the container
- **Build outputs** (`dist`) are in the container only

## Volume Configuration

### Source Code (Host → Container)
```
Host: /home/developer/Bionic-Agents
  ↓ (bind mount)
Container: /workspace
```

All source files are mounted from host, so:
- ✅ Edit files on your host machine
- ✅ Changes are immediately visible in container
- ✅ Use your favorite editor on host
- ✅ Git operations work on host

### Dependencies (Container Only)
```
Container: /workspace/Agent-Builder/node_modules
Container: /workspace/Agent-Dashboard/node_modules
Container: /workspace/Agent-Runtime/node_modules
```

These use **anonymous volumes** which:
- ✅ Keep `node_modules` in container filesystem
- ✅ Don't sync to host (keeps host clean)
- ✅ Isolated from host's node_modules (if any)
- ✅ Consistent environment across team

### Build Outputs (Container Only)
```
Container: /workspace/Agent-Builder/dist
Container: /workspace/Agent-Dashboard/dist
Container: /workspace/Agent-Runtime/dist
```

Build outputs stay in container:
- ✅ Don't clutter host filesystem
- ✅ Faster builds (container filesystem)
- ✅ Clean separation

## How It Works

### Volume Mount Order

Docker processes volumes in order. The configuration:

1. **First**: Mount entire workspace from host
   ```yaml
   - ..:/workspace:cached
   ```

2. **Then**: Override specific paths with anonymous volumes
   ```yaml
   - /workspace/Agent-Builder/node_modules
   - /workspace/Agent-Dashboard/node_modules
   - /workspace/Agent-Runtime/node_modules
   - /workspace/Agent-Builder/dist
   - /workspace/Agent-Dashboard/dist
   - /workspace/Agent-Runtime/dist
   ```

This means:
- Source code from host is visible
- `node_modules` directories are "masked" by anonymous volumes
- Dependencies installed in container go to the anonymous volumes
- Host's `node_modules` (if any) are hidden

## Benefits

### For Development
- **Fast iteration**: Edit on host, run in container
- **Clean host**: No `node_modules` on your machine
- **Consistent**: Same Node.js/pnpm versions for everyone
- **Isolated**: Container dependencies don't affect host

### For Team
- **Reproducible**: Everyone gets same environment
- **No conflicts**: Host OS/architecture differences don't matter
- **Easy onboarding**: Just open in devcontainer

## File System Layout

```
Host Machine:
├── Bionic-Agents/
│   ├── Agent-Builder/
│   │   ├── src/          ← Mounted to container
│   │   ├── package.json  ← Mounted to container
│   │   └── node_modules/ ← NOT on host (in container)
│   ├── Agent-Dashboard/
│   │   └── ... (same pattern)
│   └── Agent-Runtime/
│       └── ... (same pattern)

Container:
└── /workspace/
    ├── Agent-Builder/
    │   ├── src/          ← From host (bind mount)
    │   ├── package.json  ← From host (bind mount)
    │   └── node_modules/ ← In container (anonymous volume)
    ├── Agent-Dashboard/
    │   └── ... (same pattern)
    └── Agent-Runtime/
        └── ... (same pattern)
```

## Common Operations

### Installing New Dependencies

```bash
# In container
cd Agent-Builder
pnpm add some-package

# node_modules updated in container only
# package.json updated on host (via bind mount)
```

### Editing Code

```bash
# On host - edit any file
vim Agent-Builder/server/routers.ts

# Changes immediately visible in container
# No need to sync or rebuild
```

### Rebuilding Dependencies

```bash
# In container
cd Agent-Builder
rm -rf node_modules
pnpm install

# Fresh install in container
# Host remains clean
```

## Troubleshooting

### Host node_modules interfering

If you have `node_modules` on host that cause issues:

```bash
# On host - remove them (they're not needed)
rm -rf Agent-Builder/node_modules
rm -rf Agent-Dashboard/node_modules
rm -rf Agent-Runtime/node_modules
```

The container will use its own `node_modules` from anonymous volumes.

### Dependencies not updating

If changes to `package.json` aren't reflected:

```bash
# In container - reinstall
cd Agent-Builder
pnpm install
```

### Build outputs on host

If you see `dist` folders on host, they're from previous builds. They won't interfere because container uses its own `dist` in anonymous volumes.

## Summary

This architecture provides the **best of both worlds**:
- ✅ Edit code on host (fast, familiar tools)
- ✅ Run in container (consistent, isolated environment)
- ✅ Dependencies in container (clean host, no conflicts)
- ✅ Fast iteration (immediate file sync)

Perfect for development! 🚀

