import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../src/users/schemas/user.schema';
import { UserRole } from '../src/common/enums/role.enum';
import { UserStatus } from '../src/common/enums/user-status.enum';

describe('Tuition (Invoices) API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let studentId: string;
  let invoiceId: string;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-secret';
    process.env.REFRESH_JWT_SECRET = 'test-refresh';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.REFRESH_EXPIRES_IN = '7d';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Seed test users
    const userModel = app.get<typeof mongoose.Model<UserDocument>>(
      getModelToken(User.name),
    );

    const password = 'Test123!';
    const users = await userModel.create([
      {
        name: 'Admin User',
        email: 'admin@tuition-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher User',
        email: 'teacher@tuition-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
      {
        name: 'Student User',
        email: 'student@tuition-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Student,
        status: UserStatus.Active,
      },
    ]);

    studentId = users[2]._id.toString();

    // Login and get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@tuition-test.com', password: 'Test123!' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'teacher@tuition-test.com', password: 'Test123!' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@tuition-test.com', password: 'Test123!' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  describe('POST /tuition', () => {
    it('should create invoice as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/tuition')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentId,
          amount: 2500000,
          currency: 'VND',
          items: [
            { label: 'Học phí tháng 1', amount: 2000000 },
            { label: 'Phí tài liệu', amount: 500000 },
          ],
          dueDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .expect(201);

      expect(res.body.amount).toBe(2500000);
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.status).toBe('unpaid');
      invoiceId = res.body._id;
    });

    it('should create invoice with items', async () => {
      const res = await request(app.getHttpServer())
        .post('/tuition')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentId,
          amount: 500000,
          items: [{ label: 'Phí tài liệu học tập', amount: 500000 }],
        })
        .expect(201);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].label).toBe('Phí tài liệu học tập');
    });

    it('should deny invoice creation for teachers', async () => {
      await request(app.getHttpServer())
        .post('/tuition')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studentId: studentId,
          amount: 1000000,
        })
        .expect(403);
    });

    it('should deny invoice creation for students', async () => {
      await request(app.getHttpServer())
        .post('/tuition')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: studentId,
          amount: 1000000,
        })
        .expect(403);
    });
  });

  describe('GET /tuition', () => {
    it('admin should see all invoices', async () => {
      const res = await request(app.getHttpServer())
        .get('/tuition')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('student should see their invoices', async () => {
      const res = await request(app.getHttpServer())
        .get('/tuition')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((inv: any) => {
        expect(inv.studentId).toBe(studentId);
      });
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get('/tuition?status=unpaid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((inv: any) => {
        expect(inv.status).toBe('unpaid');
      });
    });
  });

  // Note: GET /tuition/:id endpoint does not exist in the controller

  describe('PATCH /tuition/:id', () => {
    it('admin should update payment status to paid', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tuition/${invoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'paid',
          paymentMethod: 'bank_transfer',
        })
        .expect(200);

      expect(res.body.status).toBe('paid');
      expect(res.body.paymentMethod).toBe('bank_transfer');
    });

    it('admin should update to partial payment', async () => {
      // Create new invoice
      const createRes = await request(app.getHttpServer())
        .post('/tuition')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentId,
          amount: 3000000,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/tuition/${createRes.body._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'partial',
        })
        .expect(200);

      expect(res.body.status).toBe('partial');
    });

    it('student should not update invoice', async () => {
      await request(app.getHttpServer())
        .patch(`/tuition/${invoiceId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'paid' })
        .expect(403);
    });
  });

  // Note: DELETE /tuition/:id endpoint does not exist in the controller
});
