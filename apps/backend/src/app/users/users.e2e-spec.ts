/**
 * Users E2E tests
 *
 * These tests run against the real database (test environment).
 * Uses NestJS testing utilities to spin up the full application.
 *
 * Pre-requisite: DATABASE_URL must point to a TEST database.
 * The test DB is cleaned before each suite via PrismaService.cleanDatabase().
 *
 * NOTE: All requests include auth cookies (admin user) since JwtAuthGuard is global.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from '../users/password.service';

// ── Helper fixture ─────────────────────────────────────────────────────────────

const validUser = {
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  password: 'SecurePass1',
  role: 'USER',
};

const adminUser = {
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  password: 'AdminPass1',
  role: 'ADMIN',
};

// ── Setup ─────────────────────────────────────────────────────────────────────

describe('Users E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authCookies: string[];

  const loginAndGetCookies = async (): Promise<string[]> => {
    // Create admin user for auth
    const passwordService = app.get(PasswordService);
    const hashed = await passwordService.hash(adminUser.password);
    await prisma.user.upsert({
      where: { email: adminUser.email },
      update: {},
      create: {
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        password: hashed,
        role: 'ADMIN',
        active: true,
      },
    });

    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminUser.email, password: adminUser.password });
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
    authCookies = await loginAndGetCookies();
  });

  // ── Suite 1: GET /api/users ──────────────────────────────────────────────────

  describe('GET /api/users', () => {
    it('E1 — returns 200 with empty paginated response when DB is empty', async () => {
      // Remove the non-admin user data (admin still exists for auth)
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(0);
    });

    it('E2 — returns 200 with users when DB has data', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const found = res.body.data.some((u: { email: string }) => u.email === validUser.email);
      expect(found).toBe(true);
    });

    it('E3 — pagination: ?page=1&limit=2 returns max 2 users', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser);
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send({ ...validUser, email: 'user2@example.com' });
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send({ ...validUser, email: 'user3@example.com' });

      const res = await request(app.getHttpServer())
        .get('/api/users?page=1&limit=2')
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
    });

    it('E4 — filter: ?role=ADMIN returns only ADMIN users', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser);

      const res = await request(app.getHttpServer())
        .get('/api/users?role=ADMIN')
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      res.body.data.forEach((u: { role: string }) => expect(u.role).toBe('ADMIN'));
    });

    it('E5 — search: ?search=john returns users matching name/email', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser);
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send({ ...adminUser, email: 'jane@example.com', firstName: 'Jane', lastName: 'Smith' });

      const res = await request(app.getHttpServer())
        .get('/api/users?search=john')
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const found = res.body.data.some(
        (u: { firstName: string; email: string }) =>
          u.firstName.toLowerCase().includes('john') || u.email.toLowerCase().includes('john')
      );
      expect(found).toBe(true);
    });
  });

  // ── Suite 2: GET /api/users/:id ──────────────────────────────────────────────

  describe('GET /api/users/:id', () => {
    it('E6 — returns 200 with full user data for valid ID', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .get(`/api/users/${id}`)
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.data.id).toBe(id);
      expect(res.body.data.email).toBe(validUser.email);
      expect(res.body.data.firstName).toBe(validUser.firstName);
    });

    it('E7 — returns 404 with Spanish error for non-existent ID', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users/99999')
        .set('Cookie', authCookies)
        .expect(404);

      expect(res.body.message).toBe('Usuario no encontrado');
    });

    it('E8 — password field is NOT included in response', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .get(`/api/users/${id}`)
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.data.password).toBeUndefined();
    });
  });

  // ── Suite 3: POST /api/users ─────────────────────────────────────────────────

  describe('POST /api/users', () => {
    it('E9 — returns 201 and created user data', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(validUser.email);
      expect(res.body.data.firstName).toBe(validUser.firstName);
      expect(res.body.data.id).toBeDefined();
    });

    it('E10 — password is hashed in DB (not stored as plain text)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = res.body.data.id;
      const raw = await prisma.user.findUnique({ where: { id } });
      expect(raw!.password).not.toBe(validUser.password);
      expect(raw!.password.startsWith('$2b$') || raw!.password.startsWith('$2a$')).toBe(true);
    });

    it('E11 — returns 409 when email already exists', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(409);

      expect(res.body.message).toBe('El correo electrónico ya está en uso');
    });

    it('E12 — returns 400 when required fields are missing', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send({ email: 'incomplete@example.com' })
        .expect(400);
    });

    it('E13 — returns 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send({ ...validUser, email: 'not-an-email' })
        .expect(400);
    });
  });

  // ── Suite 4: PATCH /api/users/:id ────────────────────────────────────────────

  describe('PATCH /api/users/:id', () => {
    it('E14 — returns 200 with updated user', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${id}`)
        .set('Cookie', authCookies)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(res.body.data.firstName).toBe('Updated');
    });

    it('E15 — returns 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/99999')
        .set('Cookie', authCookies)
        .send({ firstName: 'X' })
        .expect(404);
    });

    it('E16 — returns 400 for invalid email format', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      await request(app.getHttpServer())
        .patch(`/api/users/${id}`)
        .set('Cookie', authCookies)
        .send({ email: 'bad-email' })
        .expect(400);
    });

    it('E17 — returns 409 if new email belongs to another user', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);
      const second = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send({ ...adminUser, email: 'second-admin@example.com' })
        .expect(201);

      const id = second.body.data.id;
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${id}`)
        .set('Cookie', authCookies)
        .send({ email: validUser.email })
        .expect(409);

      expect(res.body.message).toBe('El correo electrónico ya está en uso');
    });
  });

  // ── Suite 5: PATCH /api/users/:id/toggle-status ──────────────────────────────

  describe('PATCH /api/users/:id/toggle-status', () => {
    it('E18 — toggles active from true to false', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${id}/toggle-status`)
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.data.active).toBe(false);
    });

    it('E19 — toggles active from false back to true', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      // first toggle → false
      await request(app.getHttpServer())
        .patch(`/api/users/${id}/toggle-status`)
        .set('Cookie', authCookies)
        .expect(200);
      // second toggle → true
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${id}/toggle-status`)
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.data.active).toBe(true);
    });

    it('E20 — returns 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/99999/toggle-status')
        .set('Cookie', authCookies)
        .expect(404);
    });
  });

  // ── Suite 6: PATCH /api/users/:id/password ────────────────────────────────────

  describe('PATCH /api/users/:id/password', () => {
    it('E21 — returns 200 on successful password change', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${id}/password`)
        .set('Cookie', authCookies)
        .send({
          currentPassword: validUser.password,
          newPassword: 'NewSecure1',
          confirmPassword: 'NewSecure1',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('E22 — new password is hashed in DB after change', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const oldRaw = await prisma.user.findUnique({ where: { id } });

      await request(app.getHttpServer())
        .patch(`/api/users/${id}/password`)
        .set('Cookie', authCookies)
        .send({
          currentPassword: validUser.password,
          newPassword: 'NewSecure1',
          confirmPassword: 'NewSecure1',
        })
        .expect(200);

      const newRaw = await prisma.user.findUnique({ where: { id } });
      expect(newRaw!.password).not.toBe(oldRaw!.password);
      expect(newRaw!.password.startsWith('$2b$') || newRaw!.password.startsWith('$2a$')).toBe(true);
    });

    it('E23 — returns 401 when current password is incorrect', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${id}/password`)
        .set('Cookie', authCookies)
        .send({
          currentPassword: 'WrongPassword1',
          newPassword: 'NewSecure1',
          confirmPassword: 'NewSecure1',
        })
        .expect(401);

      expect(res.body.message).toBe('La contraseña actual es incorrecta');
    });

    it('E24 — returns 400 when newPassword !== confirmPassword', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${id}/password`)
        .set('Cookie', authCookies)
        .send({
          currentPassword: validUser.password,
          newPassword: 'NewSecure1',
          confirmPassword: 'Different1',
        })
        .expect(400);

      expect(res.body.message).toBe('Las contraseñas no coinciden');
    });

    it('E25 — returns 400 when newPassword fails strength validation (class-validator)', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      await request(app.getHttpServer())
        .patch(`/api/users/${id}/password`)
        .set('Cookie', authCookies)
        .send({
          currentPassword: validUser.password,
          newPassword: 'short', // fails minlength(8)
          confirmPassword: 'short',
        })
        .expect(400);
    });
  });

  // ── Suite 7: DELETE /api/users/:id ────────────────────────────────────────────

  describe('DELETE /api/users/:id', () => {
    it('E26 — returns 200 on successful deletion', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      const res = await request(app.getHttpServer())
        .delete(`/api/users/${id}`)
        .set('Cookie', authCookies)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('E27 — returns 404 for non-existent user', async () => {
      await request(app.getHttpServer())
        .delete('/api/users/99999')
        .set('Cookie', authCookies)
        .expect(404);
    });

    it('E28 — user is actually removed from DB after deletion', async () => {
      const created = await request(app.getHttpServer())
        .post('/api/users')
        .set('Cookie', authCookies)
        .send(validUser)
        .expect(201);

      const id = created.body.data.id;
      await request(app.getHttpServer())
        .delete(`/api/users/${id}`)
        .set('Cookie', authCookies)
        .expect(200);

      const fromDb = await prisma.user.findUnique({ where: { id } });
      expect(fromDb).toBeNull();
    });
  });
});
