# Frontend - Cadena24 WMS

Angular application for Cadena24 WMS (Warehouse Management System).

## 🚀 Technology Stack

- **Framework**: Angular 21.2.0
- **Build Tool**: esbuild (via @angular/build)
- **Styling**: Bootstrap 5.3.8 + SCSS
- **Icons**: Bootstrap Icons 1.13.1
- **State Management**: Angular Signals
- **HTTP Client**: Angular HttpClient with RxJS
- **Testing**: Jest
- **TypeScript**: 5.9.2

## 📁 Project Structure

```
apps/frontend/src/
├── app/
│   ├── core/
│   │   └── services/          # Core services (API, etc.)
│   ├── layout/
│   │   ├── navbar/           # Navigation bar component
│   │   └── footer/           # Footer component
│   ├── pages/
│   │   ├── home/             # Home page
│   │   └── dashboard/        # Dashboard page
│   ├── app.config.ts         # App configuration
│   ├── app.routes.ts         # Route definitions
│   ├── app.ts                # Root component
│   └── app.html              # Root template
├── styles.scss               # Global styles
└── index.html                # HTML entry point
```

## 🏃 Running the Application

### Development Server

```bash
# From monorepo root
npm run dev:frontend

# Or directly with nx
nx serve frontend
```

The app will run on: **http://localhost:4200**

### Production Build

```bash
npm run build:frontend
```

### Run Tests

```bash
npm run test:frontend
```

### Lint Code

```bash
npm run lint:frontend
```

## 🔌 API Integration

### Proxy Configuration

The frontend uses a proxy to connect with the backend API during development:

**File**: `proxy.conf.json`

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

This means:

- Frontend calls: `http://localhost:4200/api/...`
- Proxied to: `http://localhost:3000/api/...`

### API Service

All API calls go through the `ApiService`:

```typescript
// apps/frontend/src/app/core/services/api.service.ts
import { ApiService } from './core/services/api.service';

constructor(private apiService: ApiService) {}

this.apiService.getHealth().subscribe(response => {
  console.log(response);
});
```

## 🎨 Styling

### Bootstrap

Bootstrap is imported globally in `styles.scss`:

```scss
@import 'bootstrap/scss/bootstrap';
@import 'bootstrap-icons/font/bootstrap-icons.css';
```

### Custom Variables

```scss
:root {
  --primary-color: #0d6efd;
  --secondary-color: #6c757d;
  // ... more variables
}
```

### Component Styles

Each component has its own SCSS file:

```
component.ts
component.html
component.scss  ← Component-specific styles
component.spec.ts
```

## 🧩 Components

### Layout Components

#### Navbar

- Responsive navigation bar
- Bootstrap collapse for mobile
- Router links with active state
- Located: `app/layout/navbar/`

#### Footer

- Simple footer with copyright
- Version display
- Located: `app/layout/footer/`

### Page Components

#### Home

- Welcome page
- API health check display
- Uses Signals for state management
- Located: `app/pages/home/`

#### Dashboard

- Dashboard overview
- Statistics cards
- Located: `app/pages/dashboard/`

## 🔄 State Management with Signals

This project uses **Angular Signals** for reactive state management:

```typescript
import { signal } from '@angular/core';

export class HomeComponent {
  // Define signals
  apiStatus = signal<ApiStatus | null>(null);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Update signals
  updateStatus(status: ApiStatus) {
    this.apiStatus.set(status);
  }

  // Read signals in template
  // {{ apiStatus() }}
}
```

### Why Signals?

- ✅ Simpler than NgRx
- ✅ Better performance
- ✅ Less boilerplate
- ✅ Built into Angular 17+

## 🧪 Testing

### Jest Configuration

Jest is configured for Angular testing:

**File**: `jest.config.cts`

### Running Tests

```bash
# All frontend tests
npm run test:frontend

# Watch mode
nx test frontend --watch

# Coverage
nx test frontend --coverage
```

### Test Structure

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## 🛣️ Routing

### Route Configuration

**File**: `app.routes.ts`

```typescript
export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: '**', redirectTo: '' },
];
```

### Lazy Loading

All routes use lazy loading for better performance:

```typescript
{
  path: 'dashboard',
  loadComponent: () => import('./pages/dashboard/dashboard.component')
    .then(m => m.DashboardComponent)
}
```

## 📦 Shared Library

The frontend uses types from the shared library:

```typescript
import { ApiResponse, PaginationParams } from '@cadena24-wms/shared';
```

This ensures type consistency between frontend and backend.

## 🔧 Environment Variables

Currently using proxy configuration. For production, you would configure:

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com',
};
```

## 📝 Code Standards

- ✅ **Standalone Components**: All components are standalone (Angular 17+ best practice)
- ✅ **TypeScript Strict Mode**: No `any` types
- ✅ **Signals**: Use signals for reactive state
- ✅ **RxJS**: Use for HTTP and async operations
- ✅ **Testing**: All components have tests
- ✅ **Formatting**: Prettier with project config

## 🚀 Next Steps

After setting up, you can:

1. **Run both backend and frontend**:

   ```bash
   npm run dev
   ```

2. **Access the application**:
   - Frontend: http://localhost:4200
   - Backend: http://localhost:3000/api

3. **Verify the connection**:
   - The home page shows API health status
   - Should display "healthy" and version "1.0.0"

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 4200
npx kill-port 4200
```

### API Connection Issues

- Verify backend is running on port 3000
- Check `proxy.conf.json` configuration
- Check browser console for CORS errors

### Build Errors

```bash
# Clean nx cache
nx reset

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

**Version**: 1.0.0  
**Framework**: Angular 21.2.0  
**Last Updated**: 2026-02-27
