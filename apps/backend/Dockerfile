FROM node:20-alpine AS base
RUN apk add --no-cache openssl
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=apps/backend/prisma/schema.prisma

# Build backend only
RUN npm run build:prod:backend

# Expose port
EXPOSE 3000

# Run migrations and start
CMD npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && node dist/apps/backend/main.js
