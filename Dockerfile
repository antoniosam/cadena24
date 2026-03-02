FROM node:20.19.0-alpine AS builder

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Generate Prisma client (schema needed before full source copy)
COPY apps/backend/prisma ./apps/backend/prisma
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Copy source and build
COPY . .
RUN npm run build:prod:frontend && npm run build:prod:backend

# --- Runtime stage ---
FROM node:20.19.0-alpine

WORKDIR /app

RUN apk add --no-cache openssl

# Only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy built artifacts and prisma client from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && node dist/apps/backend/main.js"]
