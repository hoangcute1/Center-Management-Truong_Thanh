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

describe('Goals API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let studentId: string;
  let goalId: string;

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
        email: 'admin@goals-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher User',
        email: 'teacher@goals-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
      {
        name: 'Student User',
        email: 'student@goals-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Student,
        status: UserStatus.Active,
      },
    ]);

    studentId = users[2]._id.toString();

    // Login and get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@goals-test.com', password: 'Test123!' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'teacher@goals-test.com', password: 'Test123!' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@goals-test.com', password: 'Test123!' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  describe('POST /goals', () => {
    it('should create goal as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentId,
          title: 'Đạt điểm 9 môn Toán',
          description: 'Cải thiện điểm số môn Toán trong học kỳ này',
          dueDate: new Date(
            Date.now() + 90 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        })
        .expect(201);

      expect(res.body.title).toBe('Đạt điểm 9 môn Toán');
      expect(res.body.studentId).toBe(studentId);
      expect(res.body.status).toBe('open');
      goalId = res.body._id;
    });

    it('should create goal as teacher', async () => {
      const res = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          studentId: studentId,
          title: 'Hoàn thành bài tập đầy đủ',
          description: 'Nộp bài tập đúng hạn trong 1 tháng',
        })
        .expect(201);

      expect(res.body.title).toBe('Hoàn thành bài tập đầy đủ');
    });

    it('should create goal as student for self', async () => {
      const res = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentId: studentId,
          title: 'Tự học thêm mỗi ngày',
          description: 'Học thêm 1 tiếng mỗi ngày',
        })
        .expect(201);

      expect(res.body.title).toBe('Tự học thêm mỗi ngày');
    });
  });

  describe('GET /goals', () => {
    it('admin should see all goals', async () => {
      const res = await request(app.getHttpServer())
        .get('/goals')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('student should see their goals', async () => {
      const res = await request(app.getHttpServer())
        .get('/goals')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by studentId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/goals?studentId=${studentId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((g: any) => {
        expect(g.studentId).toBe(studentId);
      });
    });
  });

  // Note: GET /goals/:id and DELETE /goals/:id endpoints don't exist in the controller
  describe('PATCH /goals/:id', () => {
    it('should update goal progress', async () => {
      // First create a goal
      const createRes = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentId,
          title: 'Goal to update',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/goals/${createRes.body._id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          progress: 50,
        })
        .expect(200);

      expect(res.body.progress).toBe(50);
    });

    it('should update goal status to completed', async () => {
      // First create a goal
      const createRes = await request(app.getHttpServer())
        .post('/goals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: studentId,
          title: 'Goal to complete',
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/goals/${createRes.body._id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          progress: 100,
          status: 'completed',
        })
        .expect(200);

      expect(res.body.status).toBe('completed');
      expect(res.body.progress).toBe(100);
    });
  });
});
