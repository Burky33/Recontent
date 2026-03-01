# ---------- Build stage ----------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy root script and shared folders (needed for build)
COPY script ./script
COPY shared ./shared

# Copy server package files first (better caching)
COPY server/package*.json ./server/

# Install server dependencies
WORKDIR /app/server
RUN npm install --include=dev

# Go back to root and copy full server source
WORKDIR /app
COPY server ./server

# Build the server
WORKDIR /app/server
RUN npm run build


# ---------- Run stage ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy built server from build stage
COPY --from=build /app/server ./server

EXPOSE 3000

CMD ["node", "server/dist/index.cjs"]