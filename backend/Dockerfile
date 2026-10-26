# Build from the repository root: docker build -f backend/Dockerfile .
# Keep ../shared imports at the same relative path as local development.
FROM node:22-bookworm-slim

WORKDIR /app/backend

# Copy package files
COPY backend/package.json backend/package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY --chown=node:node backend/ ./
COPY --chown=node:node shared/ /app/shared/

# Cloud Run uses PORT environment variable
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

USER node

# Start the server
CMD ["node", "server.js"]
