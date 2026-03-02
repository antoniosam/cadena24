FROM node:20.19.0-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Install dependencies (postinstall runs prisma generate)
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build:prod:frontend && npm run build:prod:backend

# --- Runtime stage ---
FROM node:20.19.0-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Only production dependencies
# --ignore-scripts skips postinstall (prisma generate) — client already built in builder stage
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts --legacy-peer-deps

# Copy built artifacts and prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && node dist/apps/backend/main.js"]
