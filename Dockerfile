# --- Etapa de Construcción (Builder) ---
FROM node:20.19.0-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copiamos Prisma y generamos el cliente
COPY apps/backend/prisma ./apps/backend/prisma
COPY apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts

# --- AQUÍ DEFINES LAS VARIABLES DUMMY PARA EL BUILD ---
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV JWT_SECRET="dummy_secret_only_for_build"
# ------------------------------------------------------
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

COPY . .
RUN npm run build:prod:frontend && npm run build:prod:backend

# --- Etapa de Runtime (Producción) ---
FROM node:20.19.0-alpine
WORKDIR /app
RUN apk add --no-cache openssl

# Instalamos  dependencias
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# --- TRUCO PARA PRISMA ---
# Copiamos el binario de Prisma y sus dependencias de la etapa builder
# para que esté disponible aunque sea una devDependency
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
# -------------------------

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

# Usamos 'npx' para que resuelva el path correctamente o el path directo
#CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --schema=apps/backend/prisma/schema.prisma --config=apps/backend/prisma.config.ts && node dist/apps/backend/main.js"]
# Cambiamos 'migrate deploy' por 'db push'
CMD ["sh", "-c", "npx prisma db push --schema=apps/backend/prisma/schema.prisma --accept-data-loss && node dist/apps/backend/main.js"]
