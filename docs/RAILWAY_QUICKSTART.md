# 🚀 Railway Quick Start - Cadena24 WMS

Guía rápida para desplegar en Railway en 10 minutos.

---

## 📝 Pre-requisitos

1. Cuenta en Railway (https://railway.app)
2. Repositorio en GitHub
3. Código pusheado a GitHub

---

## 🎯 Paso a Paso

### **1️⃣ Crear Proyecto en Railway**

1. Ve a https://railway.app/dashboard
2. Click **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige tu repositorio `cadena24`
5. Nombra el proyecto: `cadena24-wms`

---

### **2️⃣ Agregar Base de Datos PostgreSQL**

1. En tu proyecto, click **"New"**
2. Selecciona **"Database"** → **"PostgreSQL"**
3. ¡Listo! Railway creará automáticamente la base de datos

**No necesitas configurar nada**, Railway provee automáticamente `DATABASE_URL`

---

### **3️⃣ Configurar Servicio Backend**

#### Crear el servicio:

1. Click **"New"** → **"GitHub Repo"** → Selecciona tu repo
2. Nombra: `backend`

#### Configurar en Settings:

**⚠️ IMPORTANTE - Root Directory:**

```
apps/backend
```

**Watch Paths:**

```
apps/backend/**
libs/shared/**
```

Railway detectará automáticamente `nixpacks.toml` en `apps/backend/` y ejecutará:

- Install: `npm ci --legacy-peer-deps`
- Build: `npm run build:prod:backend`
- Start: `npx prisma migrate deploy && npm run start`

> **Nota:** No necesitas configurar Custom Build/Start Commands si Railway detecta el `nixpacks.toml` correctamente

#### Variables de entorno (tab "Variables"):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=sxX4l1I4ywIYnMj5L4TJWuL9+kJtyTyY7GoLvBQB2ts=
FRONTEND_URL=https://tu-frontend.up.railway.app
```

⚠️ **Importante:**

- Genera tu propio `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- Actualiza `FRONTEND_URL` después de desplegar el frontend (paso 4)

#### Generar dominio público:

1. Tab **"Settings"**
2. Sección **"Networking"**
3. Click **"Generate Domain"**
4. Copia la URL (ej: `https://backend-production-abc123.up.railway.app`)

---

### **4️⃣ Configurar Servicio Frontend**

#### Crear el servicio:

1. Click **"New"** → **"GitHub Repo"** → Selecciona tu repo
2. Nombra: `frontend`

#### Configurar en Settings:

**⚠️ IMPORTANTE - Root Directory:**

```
apps/frontend
```

**Watch Paths:**

```
apps/frontend/**
libs/shared/**
```

Railway detectará automáticamente `nixpacks.toml` en `apps/frontend/` y ejecutará:

- Install: `npm ci --legacy-peer-deps`
- Build: `npm run build:prod:frontend`
- Start: `npm run start:frontend`

> **Nota:** No necesitas configurar Custom Build/Start Commands si Railway detecta el `nixpacks.toml` correctamente

#### Variables de entorno (tab "Variables"):

```
NODE_ENV=production
PORT=8080
API_URL=https://backend-production-abc123.up.railway.app/api
```

⚠️ **Importante:** Reemplaza `API_URL` con tu URL real del backend del paso 3

#### Generar dominio público:

1. Tab **"Settings"**
2. Sección **"Networking"**
3. Click **"Generate Domain"**
4. Copia la URL (ej: `https://frontend-production-xyz789.up.railway.app`)

---

### **5️⃣ Actualizar CORS del Backend**

Ahora que tienes la URL del frontend:

1. Ve al servicio **Backend**
2. Tab **"Variables"**
3. Edita `FRONTEND_URL` con la URL real del frontend
4. Railway automáticamente redespleará el backend

---

## ✅ Verificación

### Backend Health Check:

```bash
curl https://tu-backend.up.railway.app/api/health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "cadena24-wms-backend",
  "environment": "production"
}
```

### Frontend:

Abre en el navegador:

```
https://tu-frontend.up.railway.app
```

Deberías ver tu aplicación Angular funcionando.

---

## 🐛 Troubleshooting Rápido

### ❌ Error: "No start command was found"

**Solución:**

- **Opción 1 (Recomendada):** Deja que Railway use el `nixpacks.toml` automáticamente (no configures custom commands)
- **Opción 2:** Configura el **Custom Start Command** en Settings como se indica arriba
- El `package.json` ahora tiene un script `start` que Railway puede detectar automáticamente

---

### ❌ Backend no conecta a la base de datos

**Verifica:**

1. Variable `DATABASE_URL` está configurada como `${{Postgres.DATABASE_URL}}`
2. El servicio PostgreSQL está corriendo
3. Revisa los logs del backend (tab Deployments)

---

### ❌ Frontend no conecta al backend (CORS error)

**Verifica:**

1. `API_URL` en frontend apunta a la URL correcta del backend
2. `FRONTEND_URL` en backend tiene la URL correcta del frontend
3. Ambos servicios están desplegados exitosamente

---

### ❌ Build fails

**Revisa los logs detalladamente:**

1. Ve a tab **"Deployments"**
2. Click en el deployment fallido
3. Lee los errores en los logs

**Causas comunes:**

- Errores de TypeScript (arreglar localmente primero)
- Falta alguna dependencia
- Error en Prisma schema o migraciones

---

## 📊 Monitoreo

### Ver logs en tiempo real:

1. Servicio → **Deployments** → Click en deployment activo
2. Los logs se actualizan automáticamente

### Uso de recursos:

1. Proyecto → **Settings** → **Usage**
2. Verifica tu consumo mensual

---

## 💰 Costos

**Plan Gratuito:**

- $5 USD de créditos mensuales
- ~140 horas de uptime por servicio
- Perfecto para desarrollo y pruebas

**Tip:** Pausa servicios que no uses para ahorrar créditos

---

## 🎉 ¡Listo!

Tu aplicación está desplegada en Railway con:

✅ PostgreSQL managed database  
✅ Backend NestJS con health checks  
✅ Frontend Angular optimizado  
✅ HTTPS automático  
✅ Continuous deployment desde GitHub

---

## 🔗 Links Útiles

- **Railway Docs**: https://docs.railway.app
- **Guía completa**: Ver `docs/RAILWAY_DEPLOYMENT.md`
- **Health endpoints**:
  - `/api/health` - Estado general
  - `/api/health/ready` - Readiness (DB check)
  - `/api/health/live` - Liveness

---

**¿Problemas?** Revisa la guía completa en `RAILWAY_DEPLOYMENT.md` o los logs en Railway dashboard.
