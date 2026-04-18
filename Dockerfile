# ── Stage 1: Build React client ──────────────────────────
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ── Stage 2: Run Express server ──────────────────────────
FROM node:20-alpine

WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./

# Copy built React files into server folder so Express can serve them
COPY --from=client-build /app/client/dist ../client/dist

EXPOSE 4000
CMD ["node", "index.js"]
