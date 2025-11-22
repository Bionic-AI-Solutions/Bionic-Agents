#!/bin/bash

echo "🚀 Setting up Bionic-Agents development environment..."

# Install pnpm if not already installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    corepack enable
    corepack prepare pnpm@latest --activate
fi

# Clean any existing node_modules from host (they'll be in container)
echo "🧹 Cleaning host node_modules (will be installed in container)..."
if [ -d "/workspace/Agent-Builder/node_modules" ]; then
    rm -rf /workspace/Agent-Builder/node_modules
fi
if [ -d "/workspace/Agent-Dashboard/node_modules" ]; then
    rm -rf /workspace/Agent-Dashboard/node_modules
fi
if [ -d "/workspace/Agent-Runtime/node_modules" ]; then
    rm -rf /workspace/Agent-Runtime/node_modules
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U postgres; do
    echo "PostgreSQL is unavailable - sleeping"
    sleep 2
done
echo "✅ PostgreSQL is ready!"

# Install dependencies for each component
echo "📦 Installing dependencies..."

if [ -d "/workspace/Agent-Builder" ]; then
    echo "  → Agent-Builder..."
    cd /workspace/Agent-Builder
    pnpm install
fi

if [ -d "/workspace/Agent-Dashboard" ]; then
    echo "  → Agent-Dashboard..."
    cd /workspace/Agent-Dashboard
    pnpm install
fi

if [ -d "/workspace/Agent-Runtime" ]; then
    echo "  → Agent-Runtime..."
    cd /workspace/Agent-Runtime
    pnpm install
fi

# Run database migrations
echo "🗄️  Setting up database..."
cd /workspace

# Create database if it doesn't exist
PGPASSWORD=postgres psql -h postgres -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'liveagents'" | grep -q 1 || \
    PGPASSWORD=postgres psql -h postgres -U postgres -c "CREATE DATABASE liveagents;"

# Run migrations for Agent-Builder
if [ -d "/workspace/Agent-Builder" ]; then
    echo "  → Running Agent-Builder migrations..."
    cd /workspace/Agent-Builder
    export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/liveagents"
    pnpm db:push || echo "⚠️  Agent-Builder migrations failed (may need manual setup)"
fi

# Run migrations for Agent-Dashboard
if [ -d "/workspace/Agent-Dashboard" ]; then
    echo "  → Running Agent-Dashboard migrations..."
    cd /workspace/Agent-Dashboard
    export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/liveagents"
    pnpm db:push || echo "⚠️  Agent-Dashboard migrations failed (may need manual setup)"
fi

# Run migrations for Agent-Runtime
if [ -d "/workspace/Agent-Runtime" ]; then
    echo "  → Running Agent-Runtime migrations..."
    cd /workspace/Agent-Runtime
    export DATABASE_URL="postgresql://postgres:postgres@postgres:5432/liveagents"
    pnpm db:push || echo "⚠️  Agent-Runtime migrations failed (may need manual setup)"
fi

echo ""
echo "✅ Development environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start Agent-Builder:    cd Agent-Builder && pnpm dev"
echo "   2. Start Agent-Dashboard: cd Agent-Dashboard && pnpm dev"
echo "   3. Start Agent-Runtime:    cd Agent-Runtime && pnpm dev"
echo ""
echo "💡 Database connection:"
echo "   DATABASE_URL=postgresql://postgres:postgres@postgres:5432/liveagents"
echo ""

