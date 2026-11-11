FROM node:22-bookworm-slim

# Prisma necesita OpenSSL para cargar su motor de consultas
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1) Dependencias: se copian solo los package*.json 
COPY package.json package-lock.json ./
RUN npm ci

# 2) Cliente de Prisma: se genera dentro de la imagen (no se conecta a ninguna base)
COPY prisma ./prisma
RUN npx prisma generate

# 3) Código de la app
COPY src ./src

EXPOSE 3000
CMD ["node", "src/index.js"]