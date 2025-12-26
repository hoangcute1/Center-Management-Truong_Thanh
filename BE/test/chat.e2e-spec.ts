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

describe('Chat API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let adminId: string;
  let teacherId: string;
  let studentId: string;
  let messageId: string;

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
        email: 'admin@chat-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher User',
        email: 'teacher@chat-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
      {
        name: 'Student User',
        email: 'student@chat-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Student,
        status: UserStatus.Active,
      },
    ]);

    adminId = users[0]._id.toString();
    teacherId = users[1]._id.toString();
    studentId = users[2]._id.toString();

    // Login and get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@chat-test.com', password: 'Test123!' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'teacher@chat-test.com', password: 'Test123!' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@chat-test.com', password: 'Test123!' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  describe('POST /chat/messages', () => {
    it('student should send message to teacher', async () => {
      const res = await request(app.getHttpServer())
        .post('/chat/messages')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          receiverId: teacherId,
          content: 'Xin chào thầy/cô!',
        })
        .expect(201);

      expect(res.body.content).toBe('Xin chào thầy/cô!');
      expect(res.body.senderId).toBe(studentId);
      expect(res.body.receiverId).toBe(teacherId);
      messageId = res.body._id;
    });

    it('teacher should reply to student', async () => {
      const res = await request(app.getHttpServer())
        .post('/chat/messages')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          receiverId: studentId,
          content: 'Chào em, em cần hỗ trợ gì?',
        })
        .expect(201);

      expect(res.body.content).toBe('Chào em, em cần hỗ trợ gì?');
      expect(res.body.senderId).toBe(teacherId);
    });

    it('admin should send message', async () => {
      const res = await request(app.getHttpServer())
        .post('/chat/messages')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          receiverId: studentId,
          content: 'Thông báo từ admin',
        })
        .expect(201);

      expect(res.body.senderId).toBe(adminId);
    });
  });

  describe('GET /chat/messages', () => {
    it('should get messages for user', async () => {
      const res = await request(app.getHttpServer())
        .get('/chat/messages')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should get conversation between two users', async () => {
      const res = await request(app.getHttpServer())
        .get(`/chat/messages?with=${teacherId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Note: GET /chat/:id and DELETE /chat/:id endpoints don't exist in the controller
});
