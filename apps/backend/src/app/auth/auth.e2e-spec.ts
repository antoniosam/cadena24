/**
 * Auth E2E tests
 *
 * Tests the full auth flow: login, refresh, logout, me.
 * Also verifies the global JwtAuthGuard protects all routes.
 *
 * Pre-requisite: DATABASE_URL must point to a TEST database.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../users/password.service';

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: 'auth-test@example.com',
    firstName: 'Auth',
    lastName: 'Test',
    password: 'TestPass1!',
    role: 'USER' as const,
  };

  const getLoginCookies = async (): Promise<string[]> => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });
    return res.headers['set-cookie'] as unknown as string[];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      })
    );

    await app.init();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.cleanDatabase();

    // Create test user
    const passwordService = app.get(PasswordService);
    const hashed = await passwordService.hash(testUser.password);
    await prisma.user.create({
      data: {
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        password: hashed,
        role: testUser.role,
        active: true,
      },
    });
  });

  // ── Suite 1: POST /api/auth/login ────────────────────────────────────────────

  describe('POST /api/auth/login', () => {
    it('E1 — returns 201 with ITokenUser on valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        id: expect.any(Number),
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        role: testUser.role,
        active: true,
      });
    });

    it('E2 — response body does NOT contain password or raw refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201);

      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('refreshToken');
    });

    it('E3 — response sets access_token cookie (httpOnly)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const accessCookie = cookies.find((c: string) => c.startsWith('access_token='));
      expect(accessCookie).toBeDefined();
      expect(accessCookie).toContain('HttpOnly');
    });

    it('E4 — response sets refresh_token cookie (httpOnly)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(201);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      const refreshCookie = cookies.find((c: string) => c.startsWith('refresh_token='));
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
    });

    it('E5 — returns 401 with "Credenciales incorrectas" for wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.message).toBe('Credenciales incorrectas');
    });

    it('E6 — returns 401 with "Credenciales incorrectas" for non-existent email (no enumeration)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'AnyPassword!' })
        .expect(401);

      expect(res.body.message).toBe('Credenciales incorrectas');
    });

    it('E7 — returns 401 with inactive user message for inactive user', async () => {
      await prisma.user.updateMany({
        where: { email: testUser.email },
        data: { active: false },
      });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(401);

      expect(res.body.message).toContain('desactivada');
    });

    it('E8 — returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'SomePass1!' })
        .expect(400);
    });

    it('E9 — returns 400 when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: testUser.email })
        .expect(400);
    });
  });

  // ── Suite 2: POST /api/auth/refresh ─────────────────────────────────────────

  describe('POST /api/auth/refresh', () => {
    it('E10 — returns 200 with ITokenUser using valid refresh token cookie', async () => {
      const cookies = await getLoginCookies();

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        email: testUser.email,
      });
    });

    it('E11 — sets new access_token cookie in response', async () => {
      const cookies = await getLoginCookies();

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      const newCookies = res.headers['set-cookie'] as unknown as string[];
      expect(newCookies.some((c: string) => c.startsWith('access_token='))).toBe(true);
    });

    it('E12 — sets new refresh_token cookie in response (rotation)', async () => {
      const cookies = await getLoginCookies();

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', cookies)
        .expect(200);

      const newCookies = res.headers['set-cookie'] as unknown as string[];
      expect(newCookies.some((c: string) => c.startsWith('refresh_token='))).toBe(true);
    });

    it('E13 — returns 401 when no refresh token cookie', async () => {
      await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
    });

    it('E14 — returns 401 when refresh token is invalid', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .set('Cookie', ['refresh_token=invalid.jwt.token'])
        .expect(401);
    });
  });

  // ── Suite 3: POST /api/auth/logout ──────────────────────────────────────────

  describe('POST /api/auth/logout', () => {
    it('E15 — returns 200 when authenticated', async () => {
      const cookies = await getLoginCookies();

      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('E16 — clears both cookies in response', async () => {
      const cookies = await getLoginCookies();

      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      const setCookies = res.headers['set-cookie'] as unknown as string[];
      // Cleared cookies have expires in the past or maxAge=0
      const accessCleared = setCookies.some(
        (c: string) => c.startsWith('access_token=') && c.includes('Expires=')
      );
      const refreshCleared = setCookies.some(
        (c: string) => c.startsWith('refresh_token=') && c.includes('Expires=')
      );
      expect(accessCleared || refreshCleared).toBe(true);
    });

    it('E17 — DB refreshToken field is null after logout', async () => {
      const cookies = await getLoginCookies();

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', cookies)
        .expect(200);

      const user = await prisma.user.findUnique({ where: { email: testUser.email } });
      expect(user?.refreshToken).toBeNull();
    });

    it('E18 — returns 401 when no access token (unauthenticated)', async () => {
      await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });
  });

  // ── Suite 4: GET /api/auth/me ────────────────────────────────────────────────

  describe('GET /api/auth/me', () => {
    it('E19 — returns 200 with ITokenUser when authenticated', async () => {
      const cookies = await getLoginCookies();

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it('E20 — returns 401 when no access token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  // ── Suite 5: Global guard verification ──────────────────────────────────────

  describe('Global JwtAuthGuard', () => {
    it('E21 — GET /api/users returns 401 without access token cookie', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('E22 — GET /api/users returns 200 with valid access token cookie', async () => {
      const cookies = await getLoginCookies();

      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
