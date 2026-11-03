# Multi-stage production Dockerfile for Kumbhakaran Backend
# NestJS + Fastify + Prisma + PostGIS
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy root workspace configurations
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/api-client/package.json ./packages/api-client/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/shared-types ./packages/shared-types
COPY packages/api-client ./packages/api-client
COPY backend ./backend

# Generate Prisma Client and Build
WORKDIR /app/backend
RUN pnpm prisma generate
RUN pnpm run build

# Production runtime stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/backend/node_modules ./backend/node_modules
COPY --from=base /app/backend/dist ./backend/dist
COPY --from=base /app/backend/prisma ./backend/prisma
COPY --from=base /app/backend/package.json ./backend/package.json

WORKDIR /app/backend

EXPOSE 3001

CMD ["node", "dist/main.js"]
