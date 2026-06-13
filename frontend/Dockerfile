# Frontend Dockerfile for Cloud Run
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files into /herbalism/ sub-path so nginx can serve under /herbalism/
COPY --from=builder /app/build /usr/share/nginx/html/herbalism

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
