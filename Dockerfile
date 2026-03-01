# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Copy root package.json so we can install root deps (needed for /app/node_modules)
COPY package.json ./

# Install esbuild at repo root so /app/script/build.ts can require it
RUN npm install esbuild

# Copy folders needed during build
COPY script ./script
COPY shared ./shared

# Copy server package files first (cache layer)
COPY server/package*.json ./server/

# Install server deps INCLUDING devDependencies (tsx lives here)
WORKDIR /app/server
ENV NODE_ENV=development
RUN npm install --include=dev

# Copy full server source
WORKDIR /app
COPY server ./server

# Build the server
WORKDIR /app/server
RUN npm run build


# ---------- Run stage ----------
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/server ./server

EXPOSE 3000
CMD ["node", "server/dist/index.cjs"]