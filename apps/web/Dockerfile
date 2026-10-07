FROM node:20-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy root workspace configs
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy web app source code
COPY apps/web/ ./apps/web/

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build web application
RUN pnpm --filter @phytosense/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@phytosense/web", "start", "-p", "3000"]
