# Use Node.js 22 as base image
FROM node:22-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    postgresql-client \
    kubectl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create a non-root user
RUN useradd -m -s /bin/bash node && \
    usermod -aG sudo node

# Set working directory
WORKDIR /workspace

# Switch to non-root user
USER node

# Set environment variables
ENV NODE_ENV=development
ENV PNPM_HOME="/home/node/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Default command (will be overridden by docker-compose)
CMD ["sleep", "infinity"]

