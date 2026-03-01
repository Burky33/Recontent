# ---------- Build stage ----------
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy only server package files first
COPY server/package*.json ./server/

# Move into server folder
WORKDIR /app/server

# Install dependencies
RUN npm install

# Go back to root of app
WORKDIR /app

# Copy full server source
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