FROM node:22-bookworm-slim

WORKDIR /app

# Dependencias: se copian solo los package*.json para aprovechar la caché de capas
COPY package.json package-lock.json ./
RUN npm ci

# Archivos que necesita el servidor de desarrollo de Vite
COPY index.html vite.config.js vite.config.docker.js ./
COPY public ./public
COPY src ./src

EXPOSE 5173
CMD ["node_modules/.bin/vite", "--config", "vite.config.docker.js"]