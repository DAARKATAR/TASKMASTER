# Multi-stage Dockerfile para TaskMaster (Backend Express + Frontend React)
# Optimizado para Koyeb, Render o Fly.io en el tier gratuito

# --- Etapa 1: Compilación del Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# --- Etapa 2: Servidor Node.js de Producción ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --only=production

# Copiar código del backend
COPY src/ ./src/
COPY scripts/ ./scripts/

# Copiar bundle del frontend compilado a la carpeta public servida por Express
COPY --from=frontend-builder /app/public ./public

EXPOSE 3000

CMD ["node", "src/server.js"]
