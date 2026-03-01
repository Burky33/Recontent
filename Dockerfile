# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy server package files first
COPY server/package*.json ./server/

# Install server deps
WORKDIR /app/server
RUN npm install

# Go back to repo root
WORKDIR /app

# ✅ Copy build script folder from repo root (you need this)
COPY script ./script

# Copy full server source
COPY server ./server

# Build the server (expects tsx script/build.ts)
WORKDIR /app/server
RUN npm run build


# ---------- Run stage ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/server ./server

EXPOSE 3000
CMD ["node", "server/dist/index.cjs"]