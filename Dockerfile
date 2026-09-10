# Dockerfile optimizado para Backend Puro en Render / Koyeb
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copiar archivos de dependencias e instalar solo las de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar código del backend y scripts necesarios
COPY src/ ./src/
COPY scripts/ ./scripts/

EXPOSE 3000

CMD ["node", "src/server.js"]
