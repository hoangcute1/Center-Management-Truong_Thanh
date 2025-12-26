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

describe('Classes API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;
  let classId: string;

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
        email: 'admin@classes-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher User',
        email: 'teacher@classes-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
      {
        name: 'Student User',
        email: 'student@classes-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Student,
        status: UserStatus.Active,
      },
    ]);

    teacherId = users[1]._id.toString();
    studentId = users[2]._id.toString();

    // Login and get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@classes-test.com', password: 'Test123!' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'teacher@classes-test.com', password: 'Test123!' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@classes-test.com', password: 'Test123!' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  describe('POST /classes', () => {
    it('should create a class as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Lớp Toán 10A',
          subject: 'Toán',
          description: 'Lớp Toán nâng cao cho học sinh lớp 10',
          teacherId: teacherId,
          studentIds: [studentId],
          schedule: [
            {
              dayOfWeek: 'Monday',
              startTime: '08:00',
              endTime: '09:30',
              room: 'A101',
            },
            {
              dayOfWeek: 'Wednesday',
              startTime: '08:00',
              endTime: '09:30',
              room: 'A101',
            },
          ],
        })
        .expect(201);

      expect(res.body.name).toBe('Lớp Toán 10A');
      expect(res.body.subject).toBe('Toán');
      expect(res.body.teacherId).toBe(teacherId);
      classId = res.body._id;
    });

    it('should reject class creation for teacher', async () => {
      await request(app.getHttpServer())
        .post('/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          name: 'Lớp Văn 11B',
          subject: 'Ngữ văn',
          teacherId: teacherId,
          studentIds: [],
        })
        .expect(403);
    });

    it('should reject class creation for students', async () => {
      await request(app.getHttpServer())
        .post('/classes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          name: 'Test Class',
          subject: 'Test',
        })
        .expect(403);
    });

    it('should create another class for listing tests', async () => {
      const res = await request(app.getHttpServer())
        .post('/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Lớp Lý 10B',
          subject: 'Vật lý',
          teacherId: teacherId,
          studentIds: [studentId],
        })
        .expect(201);

      expect(res.body.name).toBe('Lớp Lý 10B');
    });
  });

  describe('GET /classes', () => {
    it('admin should see all classes', async () => {
      const res = await request(app.getHttpServer())
        .get('/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('teacher should see classes', async () => {
      const res = await request(app.getHttpServer())
        .get('/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('student should see classes', async () => {
      const res = await request(app.getHttpServer())
        .get('/classes')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject request without auth', async () => {
      await request(app.getHttpServer()).get('/classes').expect(401);
    });
  });

  describe('GET /classes/:id', () => {
    it('should get class by id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/classes/${classId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body._id).toBe(classId);
      expect(res.body.name).toBe('Lớp Toán 10A');
    });

    it('should return 404 for non-existent class', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      await request(app.getHttpServer())
        .get(`/classes/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /classes/:id', () => {
    it('admin should update class', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/classes/${classId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Lớp Toán 10A - Cập nhật',
          description: 'Mô tả mới',
        })
        .expect(200);

      expect(res.body.name).toBe('Lớp Toán 10A - Cập nhật');
      expect(res.body.description).toBe('Mô tả mới');
    });

    it('teacher should not update class', async () => {
      await request(app.getHttpServer())
        .patch(`/classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);
    });

    it('student should not update class', async () => {
      await request(app.getHttpServer())
        .patch(`/classes/${classId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);
    });
  });

  describe('DELETE /classes/:id', () => {
    it('teacher should not delete class', async () => {
      await request(app.getHttpServer())
        .delete(`/classes/${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    it('student should not delete class', async () => {
      await request(app.getHttpServer())
        .delete(`/classes/${classId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('admin should delete class', async () => {
      // Create class to delete
      const createRes = await request(app.getHttpServer())
        .post('/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Lớp để xóa',
          subject: 'Test',
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/classes/${createRes.body._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/classes/${createRes.body._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
