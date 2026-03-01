# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app/server

# Copy package files and install (include dev deps for tsx/esbuild)
COPY server/package*.json ./
ENV NODE_ENV=development
RUN npm install --include=dev

# Copy server source
COPY server ./

# Build backend only
RUN npm run build


# ---------- Run stage ----------
FROM node:20-alpine

WORKDIR /app/server
ENV NODE_ENV=production

# Copy built server + node_modules
COPY --from=build /app/server ./

EXPOSE 3000
CMD ["node", "dist/index.cjs"]