# Build from the repository root; see docs/FRONTEND_IMAGE.md.
# Stage 1: Build
FROM node:22-bookworm-slim AS builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN CYPRESS_INSTALL_BINARY=0 npm ci --include=dev

COPY frontend/ ./
# Secret contents do not invalidate Docker's cache: bind their public config hash.
ARG PUBLIC_CONFIG_SHA256
RUN --mount=type=secret,id=frontend_env,required=true \
    node scripts/build-image.cjs /run/secrets/frontend_env "$PUBLIC_CONFIG_SHA256"

# Stage 2: Serve with nginx
FROM nginx:1.30.1-alpine

# Copy built files into /herbalism/ sub-path so nginx can serve under /herbalism/
COPY --from=builder /app/frontend/build /usr/share/nginx/html/herbalism

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
