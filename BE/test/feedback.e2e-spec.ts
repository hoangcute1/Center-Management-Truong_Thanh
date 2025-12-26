import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserDocument } from '../src/users/schemas/user.schema';
import {
  ClassEntity,
  ClassDocument,
} from '../src/classes/schemas/class.schema';
import { UserRole } from '../src/common/enums/role.enum';
import { UserStatus } from '../src/common/enums/user-status.enum';

describe('Feedback API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;
  let classId: string;
  let feedbackId: string;

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
    const classModel = app.get<typeof mongoose.Model<ClassDocument>>(
      getModelToken(ClassEntity.name),
    );

    const password = 'Test123!';
    const users = await userModel.create([
      {
        name: 'Admin User',
        email: 'admin@feedback-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher User',
        email: 'teacher@feedback-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
      {
        name: 'Student User',
        email: 'student@feedback-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Student,
        status: UserStatus.Active,
      },
    ]);

    teacherId = users[1]._id.toString();
    studentId = users[2]._id.toString();

    // Create a class
    const classDoc = await classModel.create({
      name: 'Test Class',
      subject: 'Math',
      teacherId: users[1]._id,
      studentIds: [users[2]._id],
    });
    classId = classDoc._id.toString();

    // Login and get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@feedback-test.com', password: 'Test123!' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'teacher@feedback-test.com', password: 'Test123!' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@feedback-test.com', password: 'Test123!' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  describe('POST /feedback', () => {
    it('student should submit feedback for teacher', async () => {
      const res = await request(app.getHttpServer())
        .post('/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          teacherId: teacherId,
          rating: 5,
          comment: 'Giáo viên giảng dạy rất tốt, dễ hiểu!',
        })
        .expect(201);

      expect(res.body.rating).toBe(5);
      expect(res.body.teacherId).toBe(teacherId);
      feedbackId = res.body._id;
    });

    it('student should submit feedback with different ratings', async () => {
      const res = await request(app.getHttpServer())
        .post('/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          teacherId: teacherId,
          rating: 4,
          comment: 'Nội dung bài học hay',
        })
        .expect(201);

      expect(res.body.rating).toBe(4);
    });

    it('student should submit feedback without comment', async () => {
      const res = await request(app.getHttpServer())
        .post('/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          teacherId: teacherId,
          rating: 3,
        })
        .expect(201);

      expect(res.body.rating).toBe(3);
    });

    it('should submit anonymous feedback', async () => {
      const res = await request(app.getHttpServer())
        .post('/feedback')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          teacherId: teacherId,
          rating: 4,
          anonymous: true,
        })
        .expect(201);

      expect(res.body.anonymous).toBe(true);
    });
  });

  describe('GET /feedback', () => {
    it('admin should see all feedback', async () => {
      const res = await request(app.getHttpServer())
        .get('/feedback')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('teacher should see feedback', async () => {
      const res = await request(app.getHttpServer())
        .get('/feedback')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by teacherId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/feedback?teacherId=${teacherId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      res.body.forEach((f: any) => {
        expect(f.teacherId).toBe(teacherId);
      });
    });
  });
  // Note: GET /feedback/:id, PATCH /feedback/:id, and DELETE /feedback/:id endpoints don't exist
});
