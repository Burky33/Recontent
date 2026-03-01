# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install server deps first (better caching)
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy server source
COPY server ./server

# Build server -> dist/index.cjs
RUN cd server && npm run build


# ---------- Run stage ----------
FROM node:20-alpine AS run
WORKDIR /app

ENV NODE_ENV=production

# Copy built output + node_modules from build stage
COPY --from=build /app/server ./server

# Railway provides PORT at runtime; your server should listen on process.env.PORT
EXPOSE 3000

CMD ["node", "server/dist/index.cjs"]