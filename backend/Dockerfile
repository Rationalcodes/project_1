# Multi-stage production Dockerfile for Kumbhakaran Backend
# NestJS + Fastify + Prisma + PostGIS
FROM node:22-alpine AS base

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and Prisma schema
COPY tsconfig.json nest-cli.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client and Build NestJS
RUN npx prisma generate
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=10000

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/package.json ./package.json

EXPOSE 10000

CMD ["node", "dist/main.js"]
