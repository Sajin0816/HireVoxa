# =========================================================================
# Multi-Stage Production Dockerfile for Hirevoxa Recruitment Marketplace
# =========================================================================

# Stage 1: Build Frontend Assets
FROM node:22-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Install Server Production Dependencies
FROM node:22-alpine AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# Stage 3: Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create unprivileged application user
RUN addgroup -S hirevoxa && adduser -S hirevoxa -G hirevoxa

# Copy server production dependencies and code
COPY --chown=hirevoxa:hirevoxa server/package*.json ./server/
COPY --from=server-deps --chown=hirevoxa:hirevoxa /app/server/node_modules ./server/node_modules
COPY --chown=hirevoxa:hirevoxa server/ ./server/

# Copy compiled frontend assets
COPY --from=client-builder --chown=hirevoxa:hirevoxa /app/client/dist ./client/dist

# Create storage directory for resumes with proper permissions
RUN mkdir -p ./server/storage/resumes && chown -R hirevoxa:hirevoxa ./server/storage

USER hirevoxa

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

WORKDIR /app/server
CMD ["node", "src/server.js"]
