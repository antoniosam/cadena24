import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app/app.module';
import { PrismaService } from '../app/prisma/prisma.service';

describe('WMS Warehouses and Locations (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let createdWarehouseId: number;
  let createdLocationId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      })
    );

    await app.init();
    prisma = app.get(PrismaService);

    // Authenticate to get token
    const loginResponse = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'admin@cadena24.com',
      password: 'admin123',
    });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Clean up created test data
    if (createdLocationId) {
      await prisma.location.deleteMany({
        where: { id: createdLocationId },
      });
    }
    if (createdWarehouseId) {
      await prisma.warehouse.deleteMany({
        where: { id: createdWarehouseId },
      });
    }

    await app.close();
  });

  describe('Warehouses Workflow', () => {
    describe('POST /wms/warehouses', () => {
      it('should create a new warehouse', async () => {
        const response = await request(app.getHttpServer())
          .post('/wms/warehouses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            code: 'WH-E2E-001',
            name: 'E2E Test Warehouse',
            address: '123 Test Street',
            city: 'Test City',
            state: 'Test State',
            zipCode: '12345',
            isPrimary: false,
            isActive: true,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.code).toBe('WH-E2E-001');
        expect(response.body.name).toBe('E2E Test Warehouse');
        expect(response.body.isPrimary).toBe(false);

        createdWarehouseId = response.body.id;
      });

      it('should fail with duplicate code', async () => {
        await request(app.getHttpServer())
          .post('/wms/warehouses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            code: 'WH-E2E-001',
            name: 'Duplicate Warehouse',
          })
          .expect(400);
      });

      it('should fail without authentication', async () => {
        await request(app.getHttpServer())
          .post('/wms/warehouses')
          .send({
            code: 'WH-NO-AUTH',
            name: 'No Auth Warehouse',
          })
          .expect(401);
      });

      it('should fail with invalid data', async () => {
        await request(app.getHttpServer())
          .post('/wms/warehouses')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            code: '', // Empty code
            name: 'Invalid Warehouse',
          })
          .expect(400);
      });
    });

    describe('GET /wms/warehouses', () => {
      it('should return paginated warehouses', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/warehouses')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page: 1, limit: 20 })
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('total');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('limit');
        expect(Array.isArray(response.body.items)).toBe(true);
      });

      it('should filter by search', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/warehouses')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ search: 'E2E', page: 1, limit: 20 })
          .expect(200);

        expect(response.body.items.length).toBeGreaterThan(0);
        expect(response.body.items[0].code).toContain('E2E');
      });

      it('should filter by isActive', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/warehouses')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ isActive: true, page: 1, limit: 20 })
          .expect(200);

        expect(response.body.items.every((w: any) => w.isActive === true)).toBe(true);
      });
    });

    describe('GET /wms/warehouses/primary', () => {
      it('should return the primary warehouse', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/warehouses/primary')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body.isPrimary).toBe(true);
      });
    });

    describe('GET /wms/warehouses/:id', () => {
      it('should return a specific warehouse', async () => {
        const response = await request(app.getHttpServer())
          .get(`/wms/warehouses/${createdWarehouseId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(createdWarehouseId);
        expect(response.body.code).toBe('WH-E2E-001');
      });

      it('should return 404 for non-existent warehouse', async () => {
        await request(app.getHttpServer())
          .get('/wms/warehouses/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('PATCH /wms/warehouses/:id', () => {
      it('should update a warehouse', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/wms/warehouses/${createdWarehouseId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Updated E2E Warehouse',
            city: 'Updated City',
          })
          .expect(200);

        expect(response.body.name).toBe('Updated E2E Warehouse');
        expect(response.body.city).toBe('Updated City');
      });

      it('should fail with duplicate code', async () => {
        // Get another warehouse code
        const warehouses = await request(app.getHttpServer())
          .get('/wms/warehouses')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page: 1, limit: 1 });

        const anotherWarehouse = warehouses.body.items.find(
          (w: any) => w.id !== createdWarehouseId
        );

        if (anotherWarehouse) {
          await request(app.getHttpServer())
            .patch(`/wms/warehouses/${createdWarehouseId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              code: anotherWarehouse.code,
            })
            .expect(400);
        }
      });
    });
  });

  describe('Locations Workflow', () => {
    describe('POST /wms/locations', () => {
      it('should create a new location', async () => {
        const response = await request(app.getHttpServer())
          .post('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            warehouseId: createdWarehouseId,
            zone: 'A',
            row: '01',
            position: '01',
            level: '1',
            barcode: 'LOC-E2E-A-01-01-1',
            name: 'E2E Test Location A-01-01-1',
            type: 'storage',
            capacity: 100,
            maxWeight: 500,
            allowMixedProducts: false,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.barcode).toBe('LOC-E2E-A-01-01-1');
        expect(response.body.zone).toBe('A');
        expect(response.body.type).toBe('storage');
        expect(response.body.fullPath).toContain('WH-E2E-001/A/01/01/1');

        createdLocationId = response.body.id;
      });

      it('should fail with duplicate barcode', async () => {
        await request(app.getHttpServer())
          .post('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            warehouseId: createdWarehouseId,
            zone: 'A',
            row: '01',
            position: '01',
            level: '2',
            barcode: 'LOC-E2E-A-01-01-1', // Duplicate
            name: 'Duplicate Location',
            type: 'storage',
            capacity: 100,
          })
          .expect(400);
      });

      it('should fail with non-existent warehouse', async () => {
        await request(app.getHttpServer())
          .post('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            warehouseId: 999999,
            zone: 'A',
            row: '01',
            position: '01',
            level: '1',
            barcode: 'LOC-INVALID',
            name: 'Invalid Location',
            type: 'storage',
            capacity: 100,
          })
          .expect(404);
      });

      it('should fail with invalid capacity', async () => {
        await request(app.getHttpServer())
          .post('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            warehouseId: createdWarehouseId,
            zone: 'A',
            row: '01',
            position: '01',
            level: '1',
            barcode: 'LOC-INVALID-CAP',
            name: 'Invalid Capacity',
            type: 'storage',
            capacity: 0, // Invalid
          })
          .expect(400);
      });

      it('should fail with invalid type', async () => {
        await request(app.getHttpServer())
          .post('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            warehouseId: createdWarehouseId,
            zone: 'A',
            row: '01',
            position: '01',
            level: '1',
            barcode: 'LOC-INVALID-TYPE',
            name: 'Invalid Type',
            type: 'invalid_type', // Invalid
            capacity: 100,
          })
          .expect(400);
      });
    });

    describe('GET /wms/locations', () => {
      it('should return paginated locations', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ page: 1, limit: 20 })
          .expect(200);

        expect(response.body).toHaveProperty('items');
        expect(response.body).toHaveProperty('total');
        expect(Array.isArray(response.body.items)).toBe(true);
      });

      it('should filter by warehouse', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ warehouseId: createdWarehouseId, page: 1, limit: 20 })
          .expect(200);

        expect(response.body.items.length).toBeGreaterThan(0);
        expect(response.body.items.every((l: any) => l.warehouseId === createdWarehouseId)).toBe(
          true
        );
      });

      it('should filter by zone', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ zone: 'A', page: 1, limit: 20 })
          .expect(200);

        expect(response.body.items.every((l: any) => l.zone === 'A')).toBe(true);
      });

      it('should filter by availableOnly', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .query({ availableOnly: true, page: 1, limit: 20 })
          .expect(200);

        expect(response.body.items.every((l: any) => l.capacity > 0)).toBe(true);
      });
    });

    describe('GET /wms/locations/barcode/:barcode', () => {
      it('should return a location by barcode', async () => {
        const response = await request(app.getHttpServer())
          .get('/wms/locations/barcode/LOC-E2E-A-01-01-1')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.barcode).toBe('LOC-E2E-A-01-01-1');
        expect(response.body.id).toBe(createdLocationId);
      });

      it('should return 404 for non-existent barcode', async () => {
        await request(app.getHttpServer())
          .get('/wms/locations/barcode/INVALID-BARCODE')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('GET /wms/locations/warehouse/:warehouseId/tree', () => {
      it('should return hierarchical tree structure', async () => {
        const response = await request(app.getHttpServer())
          .get(`/wms/locations/warehouse/${createdWarehouseId}/tree`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        if (response.body.length > 0) {
          expect(response.body[0]).toHaveProperty('zone');
          expect(response.body[0]).toHaveProperty('rows');
          expect(Array.isArray(response.body[0].rows)).toBe(true);
        }
      });

      it('should return 404 for non-existent warehouse', async () => {
        await request(app.getHttpServer())
          .get('/wms/locations/warehouse/999999/tree')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('GET /wms/locations/:id', () => {
      it('should return a specific location', async () => {
        const response = await request(app.getHttpServer())
          .get(`/wms/locations/${createdLocationId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.id).toBe(createdLocationId);
        expect(response.body.barcode).toBe('LOC-E2E-A-01-01-1');
      });

      it('should return 404 for non-existent location', async () => {
        await request(app.getHttpServer())
          .get('/wms/locations/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('PATCH /wms/locations/:id', () => {
      it('should update a location', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/wms/locations/${createdLocationId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Updated E2E Location',
            capacity: 200,
          })
          .expect(200);

        expect(response.body.name).toBe('Updated E2E Location');
        expect(response.body.capacity).toBe(200);
      });

      it('should regenerate fullPath when zone changes', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/wms/locations/${createdLocationId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            zone: 'B',
          })
          .expect(200);

        expect(response.body.zone).toBe('B');
        expect(response.body.fullPath).toContain('/B/');
      });

      it('should fail with duplicate barcode', async () => {
        // Create another location first
        const location2 = await request(app.getHttpServer())
          .post('/wms/locations')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            warehouseId: createdWarehouseId,
            zone: 'A',
            row: '01',
            position: '01',
            level: '2',
            barcode: 'LOC-E2E-A-01-01-2',
            name: 'Second Location',
            type: 'storage',
            capacity: 100,
          });

        // Try to update with duplicate barcode
        await request(app.getHttpServer())
          .patch(`/wms/locations/${createdLocationId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            barcode: 'LOC-E2E-A-01-01-2',
          })
          .expect(400);

        // Clean up
        await prisma.location.delete({ where: { id: location2.body.id } });
      });
    });

    describe('DELETE /wms/locations/:id', () => {
      it('should soft delete a location', async () => {
        const response = await request(app.getHttpServer())
          .delete(`/wms/locations/${createdLocationId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.isActive).toBe(false);
      });

      it('should return 404 for non-existent location', async () => {
        await request(app.getHttpServer())
          .delete('/wms/locations/999999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });

  describe('DELETE /wms/warehouses/:id', () => {
    it('should fail to delete primary warehouse', async () => {
      const primary = await request(app.getHttpServer())
        .get('/wms/warehouses/primary')
        .set('Authorization', `Bearer ${authToken}`);

      await request(app.getHttpServer())
        .delete(`/wms/warehouses/${primary.body.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should soft delete a non-primary warehouse', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/wms/warehouses/${createdWarehouseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.isActive).toBe(false);
    });
  });
});
