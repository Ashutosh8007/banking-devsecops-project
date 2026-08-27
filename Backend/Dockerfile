# ----- Build Stage -----
FROM node:20-alpine AS builder
RUN apk upgrade --no-cache
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY Backend/ ./Backend/

# ----- Runtime Stage -----
FROM node:20-alpine
RUN apk upgrade --no-cache
WORKDIR /app

# ----- Create non root user -----
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/Backend ./Backend
COPY package*.json ./

# Remove npm CLI from runtime image - not needed at runtime, only 'node' is.
# This also eliminates npm's own bundled dependency CVEs from the final image.
RUN npm uninstall -g npm corepack yarn 2>/dev/null; \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-*

USER appuser

EXPOSE 5000
ENV PORT=5000

CMD ["node", "Backend/server.js"]
