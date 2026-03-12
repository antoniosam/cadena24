# --- Etapa de Construcción (Builder) ---
FROM node:20.19.0-alpine AS builder

WORKDIR /app

# Instalar openssl para Prisma (necesario en Alpine)
RUN apk add --no-cache openssl

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copiar configuración y esquema de Prisma primero
# Nota: Copiamos el config.ts que está en apps/backend
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

# Generar el cliente de Prisma (usamos una URL dummy para el build)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Copiar el resto del código y construir la aplicación
COPY . .
RUN npm run build:prod:frontend && npm run build:prod:backend

# --- Etapa de Runtime (Producción) ---
FROM node:20.19.0-alpine

WORKDIR /app

# Instalar openssl para que Prisma funcione en ejecución
RUN apk add --no-cache openssl

# Instalar solo dependencias de producción
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copiar los artefactos construidos y el cliente de Prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

# Comando de inicio:
# 1. Ejecuta migraciones usando el config file específico
# 2. Inicia el servidor de backend
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=apps/backend/prisma/schema.prisma --config=apps/backend/prisma.config.ts && node dist/apps/backend/main.js"]
