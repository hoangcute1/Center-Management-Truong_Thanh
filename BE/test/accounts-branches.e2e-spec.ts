import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../src/users/schemas/user.schema';
import { Branch, BranchDocument } from '../src/branches/schemas/branch.schema';
import { UserRole } from '../src/common/enums/role.enum';
import { UserStatus } from '../src/common/enums/user-status.enum';

/**
 * Test toàn diện chức năng Quản lý Tài khoản và Cơ sở
 * Bao gồm:
 * - CRUD Branches (Cơ sở)
 * - CRUD Users (Tài khoản)
 * - User assignment to Branch
 * - Import users functionality
 */
describe('Accounts & Branches Integration (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let branchId: string;
  let createdUserId: string;

  const testPassword = 'Test123!';

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
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Seed test users
    const userModel = app.get<typeof mongoose.Model<UserDocument>>(
      getModelToken(User.name),
    );

    await userModel.create([
      {
        name: 'Admin Test',
        email: 'admin@accounts-test.com',
        passwordHash: await bcrypt.hash(testPassword, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher Test',
        email: 'teacher@accounts-test.com',
        passwordHash: await bcrypt.hash(testPassword, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
      {
        name: 'Student Test',
        email: 'student@accounts-test.com',
        passwordHash: await bcrypt.hash(testPassword, 10),
        role: UserRole.Student,
        status: UserStatus.Active,
      },
    ]);

    // Login and get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@accounts-test.com', password: testPassword });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'teacher@accounts-test.com', password: testPassword });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@accounts-test.com', password: testPassword });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  // ==================== BRANCHES TESTS ====================
  describe('Branch Management (Quản lý Cơ sở)', () => {
    describe('GET /branches - List all branches (Public)', () => {
      it('should return empty array initially', async () => {
        const res = await request(app.getHttpServer())
          .get('/branches')
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
      });

      it('should be accessible without authentication', async () => {
        await request(app.getHttpServer()).get('/branches').expect(200);
      });
    });

    describe('POST /branches - Create branch (Admin only)', () => {
      it('should create branch with full data', async () => {
        const branchData = {
          name: 'Cơ sở Quận 1',
          address: '123 Nguyễn Huệ, Quận 1, TPHCM',
          phone: '0901234567',
          email: 'q1@truongthanh.edu.vn',
        };

        const res = await request(app.getHttpServer())
          .post('/branches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(branchData)
          .expect(201);

        expect(res.body.name).toBe(branchData.name);
        expect(res.body.address).toBe(branchData.address);
        expect(res.body.phone).toBe(branchData.phone);
        expect(res.body._id).toBeDefined();
        branchId = res.body._id;
      });

      it('should create branch with minimal data', async () => {
        const res = await request(app.getHttpServer())
          .post('/branches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Cơ sở Quận 3',
            address: '456 Võ Văn Tần, Quận 3',
          })
          .expect(201);

        expect(res.body.name).toBe('Cơ sở Quận 3');
      });

      it('should reject branch creation without name', async () => {
        await request(app.getHttpServer())
          .post('/branches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ address: '789 Test Street' })
          .expect(400);
      });

      it('should reject branch creation by teacher', async () => {
        await request(app.getHttpServer())
          .post('/branches')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({ name: 'Test Branch', address: 'Test Address' })
          .expect(403);
      });

      it('should reject branch creation by student', async () => {
        await request(app.getHttpServer())
          .post('/branches')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ name: 'Test Branch', address: 'Test Address' })
          .expect(403);
      });

      it('should reject branch creation without auth', async () => {
        await request(app.getHttpServer())
          .post('/branches')
          .send({ name: 'Test Branch', address: 'Test Address' })
          .expect(401);
      });
    });

    describe('GET /branches/:id - Get branch detail', () => {
      it('should get branch by id', async () => {
        const res = await request(app.getHttpServer())
          .get(`/branches/${branchId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body._id).toBe(branchId);
        expect(res.body.name).toBe('Cơ sở Quận 1');
      });

      it('should return 404 for invalid branch id', async () => {
        await request(app.getHttpServer())
          .get('/branches/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('PATCH /branches/:id - Update branch', () => {
      it('should update branch name', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/branches/${branchId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Cơ sở Quận 1 - Trung Tâm' })
          .expect(200);

        expect(res.body.name).toBe('Cơ sở Quận 1 - Trung Tâm');
      });

      it('should update branch phone', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/branches/${branchId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ phone: '0909999888' })
          .expect(200);

        expect(res.body.phone).toBe('0909999888');
      });

      it('should update branch status', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/branches/${branchId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: 'inactive' })
          .expect(200);

        expect(res.body.status).toBe('inactive');
      });

      it('should reject update by non-admin', async () => {
        await request(app.getHttpServer())
          .patch(`/branches/${branchId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({ name: 'Hacked Name' })
          .expect(403);
      });
    });

    describe('DELETE /branches/:id - Delete branch', () => {
      let deleteBranchId: string;

      beforeAll(async () => {
        const res = await request(app.getHttpServer())
          .post('/branches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Cơ sở Sẽ Xóa', address: 'To Delete' });
        deleteBranchId = res.body._id;
      });

      it('should delete branch as admin', async () => {
        await request(app.getHttpServer())
          .delete(`/branches/${deleteBranchId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });

      it('should reject delete by non-admin', async () => {
        await request(app.getHttpServer())
          .delete(`/branches/${branchId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(403);
      });
    });

    describe('GET /branches - List after operations', () => {
      it('should return all created branches', async () => {
        const res = await request(app.getHttpServer())
          .get('/branches')
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  // ==================== USERS TESTS ====================
  describe('User Management (Quản lý Tài khoản)', () => {
    describe('POST /users - Create user', () => {
      it('should create student with branch', async () => {
        const res = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Nguyễn Văn Học Sinh',
            email: 'hocsinh1@test.com',
            password: 'HocSinh123!',
            role: UserRole.Student,
            phone: '0901111111',
            branchId: branchId,
          })
          .expect(201);

        expect(res.body.name).toBe('Nguyễn Văn Học Sinh');
        expect(res.body.role).toBe(UserRole.Student);
        expect(res.body.branchId).toBe(branchId);
        createdUserId = res.body._id;
      });

      it('should create teacher with specialization', async () => {
        const res = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Trần Thị Giáo Viên',
            email: 'giaovien1@test.com',
            password: 'GiaoVien123!',
            role: UserRole.Teacher,
            phone: '0902222222',
            branchId: branchId,
          })
          .expect(201);

        expect(res.body.role).toBe(UserRole.Teacher);
      });

      it('should create parent account', async () => {
        const res = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Lê Văn Phụ Huynh',
            email: 'phuhuynh1@test.com',
            password: 'PhuHuynh123!',
            role: UserRole.Parent,
            phone: '0903333333',
          })
          .expect(201);

        expect(res.body.role).toBe(UserRole.Parent);
      });

      it('should reject weak password', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test User',
            email: 'weakpw@test.com',
            password: '123',
            role: UserRole.Student,
          })
          .expect(400);
      });

      it('should reject invalid email format', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Test User',
            email: 'invalid-email',
            password: 'ValidPass123!',
            role: UserRole.Student,
          })
          .expect(400);
      });

      it('should reject duplicate email', async () => {
        await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Duplicate User',
            email: 'hocsinh1@test.com',
            password: 'Duplicate123!',
            role: UserRole.Student,
          })
          .expect(409);
      });
    });

    describe('GET /users - List users', () => {
      it('admin should list all users', async () => {
        const res = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(3);
      });

      it('teacher should not list users', async () => {
        await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(403);
      });
    });

    describe('GET /users/:id - Get user detail', () => {
      it('admin should get user by id', async () => {
        const res = await request(app.getHttpServer())
          .get(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(res.body._id).toBe(createdUserId);
        expect(res.body.name).toBe('Nguyễn Văn Học Sinh');
      });

      it('should return 404 for non-existent user', async () => {
        await request(app.getHttpServer())
          .get('/users/507f1f77bcf86cd799439011')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(404);
      });
    });

    describe('PATCH /users/:id - Update user', () => {
      it('should update user name', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Nguyễn Văn Học Sinh (Đã Sửa)' })
          .expect(200);

        expect(res.body.name).toBe('Nguyễn Văn Học Sinh (Đã Sửa)');
      });

      it('should update user status to locked', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: UserStatus.Locked })
          .expect(200);

        expect(res.body.status).toBe(UserStatus.Locked);
      });

      it('should unlock user', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status: UserStatus.Active })
          .expect(200);

        expect(res.body.status).toBe(UserStatus.Active);
      });

      it('should update user branch', async () => {
        // Create another branch
        const branchRes = await request(app.getHttpServer())
          .post('/branches')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Cơ sở Mới', address: 'New Address' });

        const newBranchId = branchRes.body._id;

        const res = await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ branchId: newBranchId })
          .expect(200);

        expect(res.body.branchId).toBe(newBranchId);
      });

      it('should reject update by non-admin', async () => {
        await request(app.getHttpServer())
          .patch(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({ name: 'Hacked Name' })
          .expect(403);
      });
    });

    describe('DELETE /users/:id - Delete user', () => {
      let deleteUserId: string;

      beforeAll(async () => {
        const res = await request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'User Sẽ Xóa',
            email: 'willdelete@test.com',
            password: 'WillDelete123!',
            role: UserRole.Student,
          });
        deleteUserId = res.body._id;
      });

      it('should delete user as admin', async () => {
        await request(app.getHttpServer())
          .delete(`/users/${deleteUserId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });

      it('should reject delete by non-admin', async () => {
        await request(app.getHttpServer())
          .delete(`/users/${createdUserId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(403);
      });
    });
  });

  // ==================== WORKFLOW TESTS ====================
  describe('Account Workflow Tests', () => {
    it('newly created user should be able to login', async () => {
      // Create a new user
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Login Test User',
          email: 'logintest@test.com',
          password: 'LoginTest123!',
          role: UserRole.Student,
        })
        .expect(201);

      // Try to login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logintest@test.com',
          password: 'LoginTest123!',
        })
        .expect(201);

      expect(loginRes.body.accessToken).toBeDefined();
      expect(loginRes.body.refreshToken).toBeDefined();
    });

    it('locked user should not be able to login', async () => {
      // Create a new user
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Locked Test User',
          email: 'lockedtest@test.com',
          password: 'LockedTest123!',
          role: UserRole.Student,
        });

      // Lock the user
      await request(app.getHttpServer())
        .patch(`/users/${createRes.body._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: UserStatus.Locked })
        .expect(200);

      // Try to login
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'lockedtest@test.com',
          password: 'LockedTest123!',
        })
        .expect(401);
    });

    it('should list users by role', async () => {
      const res = await request(app.getHttpServer())
        .get('/users?role=student')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // All returned users should be students
      res.body.forEach((user: any) => {
        expect(user.role).toBe(UserRole.Student);
      });
    });
  });
});
