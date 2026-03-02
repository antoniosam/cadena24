# 🚂 Railway Deployment Guide - Cadena24 WMS

Guía completa y actualizada para desplegar el monorepo NestJS + Angular en Railway.
Última actualización: 2026-03-02

---

## 📐 Arquitectura de producción

```
Railway Project: cadena24-wms
├── Service: Postgres   → Base de datos PostgreSQL (managed by Railway)
└── Service: cadena24   → NestJS sirve API + Angular estático (UN SOLO SERVICIO)
```

### ¿Por qué un solo servicio?

Anteriormente el proyecto usaba dos servicios separados:

- `backend` → NestJS con nixpacks
- `frontend` → Angular con `http-server`

**Esto fue consolidado** porque NestJS puede servir los archivos estáticos de Angular
directamente usando `@nestjs/serve-static`. Ventajas:

- Un solo servicio → menos costo en Railway
- Sin problemas de CORS en producción (mismo origen)
- Despliegue más simple
- Se eliminó la dependencia `http-server`

---

## 🛠️ Stack de tecnologías y versiones clave

| Tecnología | Versión | Notas                                                |
| ---------- | ------- | ---------------------------------------------------- |
| Node.js    | 20.19.0 | Mínimo requerido por Angular 21. Ver `.node-version` |
| Angular    | 21.x    | Requiere Node `^20.19.0 \|\| ^22.12.0 \|\| >=24`     |
| NestJS     | 11.x    | Compatible con Node 16+                              |
| Prisma     | 6.x     | PostgreSQL provider                                  |

### ⚠️ Por qué Node 20.19.0 exacto

Angular 21 usa `@angular/compiler-cli` como módulo ESM puro. Node versiones anteriores
a `20.19.0` (ej. `20.11.x`) no tienen el fix de ESM y lanzan:

```
Error [ERR_REQUIRE_ESM]: require() of ES Module .../compiler-cli/bundles/index.js not supported
```

La versión se fija en tres lugares para que Railway no la ignore:

- `.node-version` → `20.19.0` (máxima prioridad en Railway)
- `package.json` → `engines.node: ">=20.19.0"`
- `Dockerfile` → `FROM node:20.19.0-alpine`

---

## 🐳 Dockerfile (estrategia multi-stage)

El proyecto usa un `Dockerfile` explícito en la raíz. Railway lo detecta automáticamente
y lo usa en lugar de su auto-generado (que usaba Node 18).

```
Stage 1 — builder:
  - Node 20.19.0-alpine
  - npm ci (instala devDeps + deps)
  - Copia schema Prisma → prisma generate con DATABASE_URL dummy
  - Copia todo el fuente → build frontend + backend

Stage 2 — runtime:
  - Node 20.19.0-alpine (imagen limpia)
  - npm ci --omit=dev (solo deps de producción)
  - Copia desde builder: dist/ + prisma/ + .prisma/
  - CMD: prisma migrate deploy → node main.js
```

### ¿Por qué DATABASE_URL dummy en el build?

`prisma generate` no se conecta a la base de datos, solo lee el schema para generar
el client TypeScript. Sin embargo, Prisma valida que la variable `DATABASE_URL` exista
en el entorno. Se pasa una URL dummy solo para satisfacer esa validación:

```dockerfile
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
    npx prisma generate --schema=apps/backend/prisma/schema.prisma
```

---

## 📦 Dependencias importantes

### `@nestjs/serve-static`

Permite que NestJS sirva los archivos estáticos del build de Angular.
Configurado en `app.module.ts`:

```typescript
ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'frontend', 'browser'),
  exclude: ['/api/(.*)'],
});
```

- `__dirname` en el build compilado apunta a `dist/apps/backend`
- Por lo tanto la ruta resuelve a `dist/apps/frontend/browser`
- Cualquier ruta que no sea `/api/*` devuelve el `index.html` de Angular (SPA fallback)

### `@angular/compiler-cli`

Compilador AOT de Angular. Estaba ausente del `package.json` original.
Es `devDependency` porque solo se necesita en build-time, no en runtime.
Sin este paquete el build falla con el error de ESM mencionado arriba.

---

## 🔧 Scripts relevantes en package.json

```json
"start": "prisma migrate deploy && node dist/apps/backend/main.js",
"build": "npm run build:prod:frontend && npm run build:prod:backend",
"build:prod:frontend": "nx build frontend --configuration=production",
"build:prod:backend": "nx build backend --configuration=production"
```

**Nota:** El script `start` ya no tiene lógica condicional `RAILWAY_SERVICE_NAME`
porque ahora solo hay un servicio.

---

## 🔒 CORS

En desarrollo: activo para `localhost:4200` y `localhost:4300`.
En producción: **deshabilitado** — no es necesario porque frontend y backend
corren en el mismo origen (mismo proceso NestJS).

```typescript
// main.ts
if (!isProd) {
  app.enableCors({
    origin: ['http://localhost:4200', 'http://localhost:4300'],
    ...
  });
}
```

---

## 🚀 Pasos para desplegar en Railway

### 1. Crear proyecto en Railway

1. https://railway.app/dashboard → **New Project**
2. **Deploy from GitHub repo** → seleccionar `cadena24`

### 2. Agregar PostgreSQL

1. **New** → **Database** → **PostgreSQL**
2. Railway crea la instancia y expone `DATABASE_URL` automáticamente

### 3. Configurar el servicio de la app

En **Variables** del servicio `cadena24`, agregar:

| Variable       | Valor                        | Notas                            |
| -------------- | ---------------------------- | -------------------------------- |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Referencia automática a Postgres |
| `NODE_ENV`     | `production`                 |                                  |
| `API_VERSION`  | `v1`                         | o la versión que corresponda     |

> ⚠️ Asegurarse de hacer **Deploy** después de agregar variables.
> El panel muestra "N Changes" si hay cambios pendientes sin desplegar.

### 4. Generar dominio público

1. **Settings** → **Networking** → **Generate Domain**
2. Railway pregunta el puerto — ingresar **`8080`** (Railway asigna `PORT=8080` por defecto)
3. Hacer clic en **Generate Domain**

> ⚠️ **Puerto importante:** Railway inyecta la variable `PORT` automáticamente.
> NestJS la toma con `process.env['PORT'] || 3000`. En Railway el valor real es `8080`,
> por eso al generar el dominio hay que especificar `8080` y NO `3000`.
> No agregar `PORT` manualmente en Variables — Railway lo gestiona solo.

### 5. Verificar el despliegue

```bash
# Health check
curl https://tu-app.up.railway.app/api/health

# La app Angular debe cargar en:
# https://tu-app.up.railway.app
```

---

## 🐛 Errores conocidos y soluciones

### `ERR_REQUIRE_ESM` en build de Angular

**Causa:** Node < 20.19.0  
**Solución:** Asegurarse que `.node-version` tenga `20.19.0` y que Railway use el Dockerfile

### `Cannot find module '@angular/compiler-cli'`

**Causa:** Paquete no declarado en `package.json`  
**Solución:** Está en `devDependencies` como `@angular/compiler-cli: ^21.2.0`

### `Environment variable not found: DATABASE_URL` en build

**Causa:** `prisma generate` valida la variable aunque no la use  
**Solución:** Pasar `DATABASE_URL=dummy` como variable de entorno en el comando del Dockerfile

### `Environment variable not found: DATABASE_URL` en runtime

**Causa:** Variables no desplegadas en Railway (cambios pendientes)  
**Solución:** Hacer Deploy desde el panel de Railway para aplicar los cambios

### Railway ignora `.node-version` y usa Node 18

**Causa:** Railway auto-genera un Dockerfile con imagen Node 18 por defecto  
**Solución:** Tener un `Dockerfile` explícito en la raíz con `FROM node:20.19.0-alpine`

### `Application failed to respond` al abrir la URL

**Causa:** El dominio fue generado con puerto `3000` pero Railway asigna `PORT=8080`  
**Solución:** Eliminar el dominio y regenerarlo especificando el puerto **`8080`**  
**Detalle:** No agregar `PORT` manualmente en Variables — Railway lo inyecta solo con valor `8080`

---

## 📁 Archivos clave de despliegue

```
cadena24/
├── Dockerfile                        # Build multi-stage, fuerza Node 20.19.0
├── .node-version                     # Node 20.19.0 (para Railway y desarrollo local)
├── package.json                      # engines.node >= 20.19.0
├── apps/
│   └── backend/
│       ├── nixpacks.toml             # Fallback si Railway no usa Dockerfile
│       └── src/
│           ├── main.ts               # CORS solo en desarrollo
│           └── app/app.module.ts     # ServeStaticModule registrado aquí
```

---

## 📚 Historial de decisiones de arquitectura

| Fecha      | Decisión                                          | Motivo                                      |
| ---------- | ------------------------------------------------- | ------------------------------------------- |
| 2026-03-02 | Consolidar frontend + backend en un solo servicio | Reducir costo y complejidad en Railway      |
| 2026-03-02 | Usar `@nestjs/serve-static` para Angular          | Eliminar servicio frontend + `http-server`  |
| 2026-03-02 | Fijar Node 20.19.0 con Dockerfile explícito       | Angular 21 requiere ESM fix de Node 20.19   |
| 2026-03-02 | Agregar `@angular/compiler-cli` a devDependencies | Faltaba en package.json, rompía el build    |
| 2026-03-02 | Multi-stage Dockerfile                            | Imagen de producción sin devDependencies    |
| 2026-03-02 | DATABASE_URL dummy en prisma generate del builder | Prisma valida la variable aunque no conecte |
| 2026-03-02 | Puerto del dominio Railway es 8080, no 3000       | Railway inyecta PORT=8080 automáticamente   |
