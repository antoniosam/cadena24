# 🚂 Railway Deployment Guide - Cadena24 WMS

Complete guide to deploy the NestJS + Angular monorepo to Railway.

---

## 📋 Prerequisites

- ✅ Railway account (sign up at https://railway.app)
- ✅ GitHub repository connected to Railway
- ✅ Project pushed to GitHub

---

## 🏗️ Architecture Overview

```
Railway Project: cadena24-wms
├── Service 1: PostgreSQL Database (managed)
├── Service 2: Backend (NestJS API)
└── Service 3: Frontend (Angular SPA)
```

---

## 🚀 Deployment Steps

### **Step 1: Create Railway Project**

1. Go to https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `cadena24` repository
5. Name your project: `cadena24-wms`

---

### **Step 2: Add PostgreSQL Database**

1. In your Railway project, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Railway will automatically create a PostgreSQL instance
3. Copy the `DATABASE_URL` from the PostgreSQL service variables (you'll need it for the backend)

---

### **Step 3: Deploy Backend Service**

#### 3.1 Create Backend Service

1. Click **"New"** → **"GitHub Repo"** → Select your repo
2. Name the service: `backend`
3. Click **"Add service"**

#### 3.2 Configure Backend Settings

Go to **Settings** tab:

- **Root Directory**: Leave empty (monorepo root)
- **Custom Build Command**: `npm ci --legacy-peer-deps && npx prisma generate --schema=apps/backend/prisma/schema.prisma && npm run build:backend`
- **Custom Start Command**: `npx prisma migrate deploy --schema=apps/backend/prisma/schema.prisma && node dist/apps/backend/main.js`

**Note:** Railway will detect the `nixpacks.toml` file, but we're overriding with custom commands to ensure proper execution order.

#### 3.3 Set Backend Environment Variables

Go to **Variables** tab and add:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=sxX4l1I4ywIYnMj5L4TJWuL9+kJtyTyY7GoLvBQB2ts=
FRONTEND_URL=https://your-frontend-url.up.railway.app
```

**Important Notes:**

- Replace `JWT_SECRET` with your generated secret (see generation command below)
- `DATABASE_URL` will automatically reference the PostgreSQL service
- Update `FRONTEND_URL` after deploying frontend (Step 4)

**Generate a strong JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### 3.4 Deploy Backend

1. Railway will automatically detect the `nixpacks.toml` configuration
2. The build process will:
   - Install dependencies
   - Generate Prisma client
   - Build the NestJS application
   - Run database migrations
   - Start the server
3. Check the **Deployments** tab for build logs
4. Once deployed, note the **public URL** (e.g., `https://backend-production-xxxx.up.railway.app`)

---

### **Step 4: Deploy Frontend Service**

#### 4.1 Create Frontend Service

1. Click **"New"** → **"GitHub Repo"** → Select your repo
2. Name the service: `frontend`
3. Click **"Add service"**

#### 4.2 Configure Frontend Settings

Go to **Settings** tab:

- **Root Directory**: `apps/frontend`
- **Build Command**: `npm ci --legacy-peer-deps && npm run build:prod:frontend`
- **Start Command**: `npx http-server dist/apps/frontend/browser -p $PORT --gzip`

#### 4.3 Set Frontend Environment Variables

Go to **Variables** tab and add:

```bash
NODE_ENV=production
PORT=8080
API_URL=https://backend-production-xxxx.up.railway.app/api
```

**Important:**

- Replace `API_URL` with your actual backend public URL from Step 3.4

#### 4.4 Deploy Frontend

1. Railway will build the Angular application in production mode
2. Static files will be served with http-server
3. Check the **Deployments** tab for build logs
4. Once deployed, note the **public URL** (e.g., `https://frontend-production-xxxx.up.railway.app`)

#### 4.5 Update Backend CORS

Go back to **Backend service** → **Variables** tab:

Update `FRONTEND_URL` with the frontend public URL:

```bash
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
```

Railway will automatically redeploy the backend with updated CORS settings.

---

## 🔍 Verification & Testing

### **1. Check Backend Health**

```bash
curl https://backend-production-xxxx.up.railway.app/api/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-02T...",
  "service": "cadena24-wms-backend",
  "version": "1.0.0",
  "environment": "production"
}
```

### **2. Check Database Connection**

```bash
curl https://backend-production-xxxx.up.railway.app/api/health/ready
```

Expected response:

```json
{
  "status": "ready",
  "timestamp": "2026-03-02T...",
  "checks": {
    "database": "connected"
  }
}
```

### **3. Test Frontend**

Open the frontend URL in your browser:

```
https://frontend-production-xxxx.up.railway.app
```

The Angular application should load and be able to communicate with the backend API.

---

## 🔄 Continuous Deployment

Railway automatically deploys on every push to your main branch.

**Workflow:**

1. Make changes locally
2. Commit and push to GitHub
3. Railway detects the push
4. Automatically builds and deploys both services
5. Check deployment logs in Railway dashboard

**Disable auto-deploy (optional):**

Go to **Settings** → **Service** → Toggle **"Auto Deploy"** off

---

## 📊 Monitoring & Logs

### **View Logs**

1. Go to your service in Railway dashboard
2. Click **"Deployments"** tab
3. Select the active deployment
4. View real-time logs

### **Health Check Endpoints**

- **General health**: `/api/health`
- **Readiness probe**: `/api/health/ready` (includes DB check)
- **Liveness probe**: `/api/health/live` (simple alive check)

### **Database Management**

**Option 1: Railway Dashboard**

- Click on PostgreSQL service
- Go to **"Data"** tab
- Use built-in query editor

**Option 2: Prisma Studio (via Railway CLI)**

```bash
railway run npx prisma studio --schema=apps/backend/prisma/schema.prisma
```

**Option 3: External Client**

- Use the `DATABASE_URL` from Railway
- Connect with tools like pgAdmin, DBeaver, or TablePlus

---

## 🔐 Environment Variables Reference

### **Backend Service**

| Variable       | Description                         | Example                               |
| -------------- | ----------------------------------- | ------------------------------------- |
| `NODE_ENV`     | Environment mode                    | `production`                          |
| `PORT`         | Server port (Railway provides this) | `3000`                                |
| `DATABASE_URL` | PostgreSQL connection string        | `${{Postgres.DATABASE_URL}}`          |
| `JWT_SECRET`   | Secret for JWT tokens               | `your-generated-secret`               |
| `FRONTEND_URL` | Frontend URL for CORS               | `https://frontend-xxx.up.railway.app` |

### **Frontend Service**

| Variable   | Description          | Example                                  |
| ---------- | -------------------- | ---------------------------------------- |
| `NODE_ENV` | Environment mode     | `production`                             |
| `PORT`     | Server port          | `8080`                                   |
| `API_URL`  | Backend API base URL | `https://backend-xxx.up.railway.app/api` |

### **PostgreSQL Service**

Railway automatically provides:

- `DATABASE_URL`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGPASSWORD`
- `PGDATABASE`

---

## 🛠️ Troubleshooting

### **Backend fails to start**

**Check logs:**

1. Go to Backend service → Deployments
2. Look for error messages

**Common issues:**

- Missing `DATABASE_URL` variable
- Invalid Prisma schema
- Migration failures

**Solution:**

```bash
# Run migrations manually via Railway CLI
railway run npm run prisma:migrate:deploy
```

---

### **Frontend can't connect to backend**

**Check:**

1. `API_URL` in frontend variables matches backend public URL
2. Backend `FRONTEND_URL` includes frontend public URL
3. Backend CORS is properly configured

**Test backend directly:**

```bash
curl https://backend-xxx.up.railway.app/api/health
```

---

### **Database connection errors**

**Check:**

1. PostgreSQL service is running
2. `DATABASE_URL` is correctly set in backend variables
3. Migrations have been applied

**View database logs:**
Go to PostgreSQL service → Deployments → Logs

---

### **Build failures**

**Common causes:**

- Missing dependencies
- TypeScript compilation errors
- Prisma generation failures

**Check build logs carefully** and fix errors locally first.

**Rebuild:**
Go to Deployments → Click "Redeploy"

---

## 💰 Pricing & Usage

### **Free Tier**

- $5 USD free credits per month
- Enough for development/testing
- ~140 hours of service uptime

### **Usage Monitoring**

- Railway dashboard shows credit usage
- Monitor in **Settings** → **Usage**

### **Optimize Costs**

1. Delete unused services
2. Pause services not in use
3. Use smaller database instances for testing
4. Upgrade to paid plan for production

---

## 🎯 Next Steps

### **Custom Domains**

1. Go to service → **Settings** → **Domains**
2. Click **"Add Domain"**
3. Follow DNS configuration instructions

### **SSL Certificates**

- Automatically provided by Railway
- HTTPS enabled by default

### **CI/CD Integration**

- Already configured via GitHub integration
- Optional: Add GitHub Actions for testing before deploy

### **Staging Environment**

1. Create separate Railway project: `cadena24-wms-staging`
2. Connect to a different branch (e.g., `develop`)
3. Use separate database instance

---

## 📚 Additional Resources

- **Railway Docs**: https://docs.railway.app
- **Railway CLI**: https://docs.railway.app/develop/cli
- **Prisma + Railway**: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway
- **NestJS Production**: https://docs.nestjs.com/techniques/performance

---

## ✅ Deployment Checklist

- [ ] Railway project created
- [ ] PostgreSQL database added
- [ ] Backend service deployed with correct environment variables
- [ ] Database migrations applied successfully
- [ ] Frontend service deployed with correct API_URL
- [ ] Backend CORS updated with frontend URL
- [ ] Health checks passing (`/api/health`, `/api/health/ready`)
- [ ] Frontend loads and connects to backend
- [ ] Continuous deployment working (push to trigger deploy)

---

**🎉 Your Cadena24 WMS is now live on Railway!**

For support, check Railway documentation or open an issue in the repository.
