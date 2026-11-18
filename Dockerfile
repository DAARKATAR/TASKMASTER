# Dockerfile Multi-Stage para Backend TypeScript optimizado en Render / Koyeb
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
# Mitigación SonarQube docker:S6505: Evitar ejecución arbitraria de scripts en build
RUN npm ci --ignore-scripts
COPY src/ ./src/
RUN npm run build:server

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
# Mitigación SonarQube docker:S6505
RUN npm ci --only=production --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY scripts/ ./scripts/

# Mitigación SonarQube docker:S6471: Principio de menor privilegio, usar usuario no root
USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]
