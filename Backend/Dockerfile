# ----- Build Stage ----- 

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY Backend/ ./Backend/

# ----- Runtime Stage -----

FROM node:20-alpine
WORKDIR /app

# ----- Create non root user -----

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/Backend ./Backend
COPY package*.json ./

USER appuser

EXPOSE 5000
ENV PORT=5000

CMD ["node", "Backend/server.js"]