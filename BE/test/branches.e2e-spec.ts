import { INestApplication } from '@nestjs/common';
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

describe('Branches API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;

  const adminEmail = 'admin@branches-test.com';
  const teacherEmail = 'teacher@branches-test.com';
  const password = 'Test123!';

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-secret';
    process.env.REFRESH_JWT_SECRET = 'test-refresh';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Create admin and teacher users
    const userModel = app.get<typeof mongoose.Model<UserDocument>>(
      getModelToken(User.name),
    );

    await userModel.create([
      {
        name: 'Admin',
        email: adminEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher',
        email: teacherEmail,
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
    ]);

    // Login to get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: teacherEmail, password });
    teacherToken = teacherLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  describe('GET /branches (Public)', () => {
    it('should return empty array when no branches exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/branches')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /branches (Admin only)', () => {
    it('should create a branch as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chi nhánh Quận 1',
          address: '123 Nguyễn Huệ, Q1, TP.HCM',
          phone: '0901234567',
          email: 'q1@truongthanh.edu.vn',
        })
        .expect(201);

      expect(res.body.name).toBe('Chi nhánh Quận 1');
      expect(res.body._id).toBeDefined();
    });

    it('should deny branch creation for non-admin', async () => {
      await request(app.getHttpServer())
        .post('/branches')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Chi nhánh Test',
          address: '456 Test Street',
        })
        .expect(403);
    });

    it('should deny branch creation without auth', async () => {
      await request(app.getHttpServer())
        .post('/branches')
        .send({
          name: 'Chi nhánh No Auth',
          address: '789 No Auth Street',
        })
        .expect(401);
    });
  });

  describe('GET /branches/:id', () => {
    let branchId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chi nhánh Quận 3',
          address: '321 Võ Văn Tần, Q3, TP.HCM',
        });
      branchId = res.body._id;
    });

    it('should get branch by id with admin auth', async () => {
      const res = await request(app.getHttpServer())
        .get(`/branches/${branchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.name).toBe('Chi nhánh Quận 3');
    });

    it('should return 404 for non-existent branch', async () => {
      await request(app.getHttpServer())
        .get('/branches/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /branches/:id', () => {
    let branchId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chi nhánh cần update',
          address: 'Địa chỉ cũ',
        });
      branchId = res.body._id;
    });

    it('should update branch as admin', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/branches/${branchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chi nhánh đã update',
          address: 'Địa chỉ mới',
        })
        .expect(200);

      expect(res.body.name).toBe('Chi nhánh đã update');
      expect(res.body.address).toBe('Địa chỉ mới');
    });

    it('should deny update for non-admin', async () => {
      await request(app.getHttpServer())
        .patch(`/branches/${branchId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'Unauthorized update' })
        .expect(403);
    });
  });

  describe('DELETE /branches/:id', () => {
    it('should delete branch as admin', async () => {
      // Create a branch to delete
      const createRes = await request(app.getHttpServer())
        .post('/branches')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Chi nhánh sẽ xóa',
          address: 'Địa chỉ tạm',
        });

      const branchId = createRes.body._id;

      await request(app.getHttpServer())
        .delete(`/branches/${branchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/branches/${branchId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
