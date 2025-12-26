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

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let userId: string;

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
    await userModel.create([
      {
        name: 'Admin User',
        email: 'admin@users-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher User',
        email: 'teacher@users-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
      {
        name: 'Student User',
        email: 'student@users-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Student,
        status: UserStatus.Active,
      },
    ]);

    // Login and get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@users-test.com', password: 'Test123!' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'teacher@users-test.com', password: 'Test123!' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@users-test.com', password: 'Test123!' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  describe('POST /users', () => {
    it('admin should create new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Student',
          email: 'newstudent@test.com',
          password: 'NewStudent123!',
          role: UserRole.Student,
          phone: '0901234567',
        })
        .expect(201);

      expect(res.body.name).toBe('New Student');
      expect(res.body.email).toBe('newstudent@test.com');
      expect(res.body.role).toBe(UserRole.Student);
      userId = res.body._id;
    });

    it('admin should create teacher', async () => {
      const res = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Teacher',
          email: 'newteacher@test.com',
          password: 'NewTeacher123!',
          role: UserRole.Teacher,
        })
        .expect(201);

      expect(res.body.role).toBe(UserRole.Teacher);
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate User',
          email: 'admin@users-test.com',
          password: 'Duplicate123!',
          role: UserRole.Student,
        })
        .expect(409);
    });

    it('teacher should not create users', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Test User',
          email: 'test@test.com',
          password: 'Test123!',
          role: UserRole.Student,
        })
        .expect(403);
    });

    it('student should not create users', async () => {
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Test User',
          email: 'test2@test.com',
          password: 'Test123!',
          role: UserRole.Student,
        })
        .expect(403);
    });
  });

  describe('GET /users', () => {
    it('admin should see all users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(5);

      // Verify passwordHash is not exposed
      res.body.forEach((u: any) => {
        expect(u.passwordHash).toBeUndefined();
      });
    });

    it('teacher should not list users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('student should not list users', async () => {
      await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });

  describe('GET /users/:id', () => {
    it('admin should get user by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body._id).toBe(userId);
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app.getHttpServer())
        .get(`/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /users/:id', () => {
    it('admin should update user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          phone: '0909999999',
        })
        .expect(200);

      expect(res.body.name).toBe('Updated Name');
      expect(res.body.phone).toBe('0909999999');
    });

    it('admin should update user role', async () => {
      // Create test user first
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Role Test User',
          email: 'roletest@test.com',
          password: 'RoleTest123!',
          role: UserRole.Student,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/users/${createRes.body._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: UserRole.Teacher,
        })
        .expect(200);

      expect(res.body.role).toBe(UserRole.Teacher);
    });

    it('admin should update user status', async () => {
      // First get current status
      const getRes = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Update to opposite status
      const newStatus =
        getRes.body.status === UserStatus.Active
          ? UserStatus.Inactive
          : UserStatus.Active;

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: newStatus,
        })
        .expect(200);

      expect(res.body.status).toBe(newStatus);
    });

    it('teacher should not update users', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);
    });

    it('student should not update users', async () => {
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);
    });
  });

  describe('DELETE /users/:id', () => {
    it('admin should delete user', async () => {
      // Create user to delete
      const createRes = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'To Delete',
          email: 'todelete@test.com',
          password: 'ToDelete123!',
          role: UserRole.Student,
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/users/${createRes.body._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/users/${createRes.body._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('teacher should not delete users', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('student should not delete users', async () => {
      await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });
  });
});
