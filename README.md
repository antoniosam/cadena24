# Cadena24 WMS - Warehouse Management System

Modern WMS (Warehouse Management System) built with NestJS + Angular monorepo architecture.

## 📁 Monorepo Structure

```
ferre/
├── apps/
│   ├── backend/          → NestJS REST API (port 3000)
│   └── frontend/         → Angular Application (port 4300)
├── libs/
│   └── shared/           → Shared TypeScript interfaces and types
├── prisma/               → Prisma schema and migrations
└── package.json
```

## 🚀 Prerequisites

- **Node.js**: v20.19 or higher
- **npm**: Latest version
- **MariaDB**: 10.x or higher (or MySQL 8.x)

## ⚙️ Installation

1. Clone the repository:

```bash
cd C:\All\dev\ferre\cadena24-api
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and configure your database connection
DATABASE_URL="mysql://username:password@localhost:3306/cadena24_wms"
```

4. Generate Prisma Client and create database:

```bash
npm run prisma:generate
npm run prisma:push
```

## 🏃 Running the Application

### Development Mode (Full Stack)

```bash
npm run dev
```

This will start both:

- **Backend**: http://localhost:3000/api
- **Frontend**: http://localhost:4300

### Development Mode (Individual)

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

### Production Build

```bash
# Build both apps
npm run build

# Build individual apps
npm run build:backend
npm run build:frontend
```

## 🧪 Testing

### Run unit tests

```bash
npm run test
```

### Run E2E tests

```bash
npm run test:e2e
```

## 📦 Available Scripts

| Command                   | Description                                 |
| ------------------------- | ------------------------------------------- |
| **Development**           |                                             |
| `npm run dev`             | Start both backend and frontend in parallel |
| `npm run dev:backend`     | Start backend only (port 3000)              |
| `npm run dev:frontend`    | Start frontend only (port 4300)             |
| **Build**                 |                                             |
| `npm run build`           | Build both apps for production              |
| `npm run build:backend`   | Build backend only                          |
| `npm run build:frontend`  | Build frontend only                         |
| **Testing**               |                                             |
| `npm run test`            | Run all tests (backend + frontend)          |
| `npm run test:backend`    | Run backend tests only                      |
| `npm run test:frontend`   | Run frontend tests only                     |
| **Linting**               |                                             |
| `npm run lint`            | Lint all code                               |
| `npm run lint:backend`    | Lint backend only                           |
| `npm run lint:frontend`   | Lint frontend only                          |
| **Formatting**            |                                             |
| `npm run format`          | Format all code with Prettier               |
| `npm run format:check`    | Check code formatting                       |
| **Database**              |                                             |
| `npm run prisma:generate` | Generate Prisma Client                      |
| `npm run prisma:push`     | Push schema to database                     |
| `npm run prisma:migrate`  | Run migrations                              |
| `npm run prisma:studio`   | Open Prisma Studio (GUI)                    |

## 🗄️ Database

This project uses **Prisma ORM** with **MariaDB** (or MySQL).

### Database Schema

See `prisma/schema.prisma` for the complete database schema.

### Migrations

```bash
# Create a new migration
npm run prisma:migrate

# Apply migrations
npm run prisma:push

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## 🏗️ Architecture

### Backend (NestJS)

- **Pattern**: Controller → Service → Repository (Prisma)
- **Port**: 3000
- **API Prefix**: /api
- **Validation**: Global ValidationPipe
- **CORS**: Enabled

### Frontend (Angular)

- **Pattern**: Component → Service (with Signals) → API Service
- **Port**: 4300
- **UI Framework**: Bootstrap 5.3.8
- **State Management**: Angular Signals
- **Routing**: Lazy-loaded routes
- **Builder**: esbuild

### Shared Library

- **Location**: `libs/shared/src`
- **Content**: TypeScript interfaces, types, and constants
- **Import**: `@cadena24-wms/shared`

## 📝 Code Standards

- **Language**: English for code, Spanish for user-facing labels
- **No `any` types**: Always use proper TypeScript types
- **Formatting**: Prettier (run `npm run format`)
- **Linting**: ESLint with strict rules
- **Testing**: Jest for unit tests

## 📚 Documentation

### API Documentation

- Health check endpoint: `GET /api` → Returns API status

### Prisma Service

The global `PrismaService` is available in all modules:

```typescript
import { PrismaService } from './prisma/prisma.service';

constructor(private prisma: PrismaService) {}
```

## 🔐 Environment Variables

| Variable       | Description               | Default     |
| -------------- | ------------------------- | ----------- |
| `DATABASE_URL` | MariaDB connection string | -           |
| `PORT`         | Backend server port       | 3000        |
| `NODE_ENV`     | Environment mode          | development |
| `API_VERSION`  | API version               | v1          |

## 🛠️ Tech Stack

| Category         | Technology      | Version |
| ---------------- | --------------- | ------- |
| **Backend**      | NestJS          | 11.1.14 |
| **Frontend**     | Angular         | 21.2.0  |
| **Database**     | MariaDB/MySQL   | -       |
| **ORM**          | Prisma          | 7.4.1   |
| **Monorepo**     | Nx              | 22.5.3  |
| **UI Framework** | Bootstrap       | 5.3.8   |
| **Icons**        | Bootstrap Icons | 1.13.1  |
| **Language**     | TypeScript      | 5.9.2   |
| **Testing**      | Jest            | 30.2.0  |
| **Linting**      | ESLint          | 9.0.0   |
| **Formatting**   | Prettier        | 3.8.1   |

## 📄 License

MIT

---

**Project**: Cadena24 WMS  
**Version**: 1.0.0  
**Created**: 2026
