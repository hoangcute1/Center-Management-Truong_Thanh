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
import { AssessmentType } from '../src/assessments/dto/create-assessment.dto';

describe('Assessments API (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let teacherId: string;
  let studentId: string;
  let classId: string;
  let assessmentId: string;

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
        email: 'admin@assess-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Admin,
        status: UserStatus.Active,
      },
      {
        name: 'Teacher User',
        email: 'teacher@assess-test.com',
        passwordHash: await bcrypt.hash(password, 10),
        role: UserRole.Teacher,
        status: UserStatus.Active,
      },
      {
        name: 'Student User',
        email: 'student@assess-test.com',
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
      .send({ email: 'admin@assess-test.com', password: 'Test123!' });
    adminToken = adminLogin.body.accessToken;

    const teacherLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'teacher@assess-test.com', password: 'Test123!' });
    teacherToken = teacherLogin.body.accessToken;

    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@assess-test.com', password: 'Test123!' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  describe('POST /assessments', () => {
    it('should create assignment assessment as teacher', async () => {
      const res = await request(app.getHttpServer())
        .post('/assessments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: classId,
          studentId: studentId,
          title: 'Bài tập về nhà Chương 1',
          type: AssessmentType.Assignment,
          score: 9,
          maxScore: 10,
          feedback: 'Làm bài tốt, cần chú ý phần trình bày',
        })
        .expect(201);

      expect(res.body.score).toBe(9);
      expect(res.body.maxScore).toBe(10);
      expect(res.body.type).toBe('assignment');
      assessmentId = res.body._id;
    });

    it('should create test assessment', async () => {
      const res = await request(app.getHttpServer())
        .post('/assessments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: classId,
          studentId: studentId,
          title: 'Kiểm tra 15 phút',
          type: AssessmentType.Test,
          score: 8.5,
          maxScore: 10,
          feedback: 'Kết quả khá tốt',
        })
        .expect(201);

      expect(res.body.type).toBe('test');
      expect(res.body.score).toBe(8.5);
    });

    it('should create assessment as admin', async () => {
      const res = await request(app.getHttpServer())
        .post('/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          classId: classId,
          studentId: studentId,
          title: 'Bài kiểm tra giữa kỳ',
          type: AssessmentType.Test,
          maxScore: 100,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(res.body.title).toBe('Bài kiểm tra giữa kỳ');
    });

    it('should reject assessment creation for students', async () => {
      await request(app.getHttpServer())
        .post('/assessments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId: classId,
          studentId: studentId,
          title: 'Unauthorized Assessment',
          type: AssessmentType.Assignment,
        })
        .expect(403);
    });
  });

  describe('GET /assessments', () => {
    it('should list assessments by class', async () => {
      const res = await request(app.getHttpServer())
        .get(`/assessments?classId=${classId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should list assessments by student', async () => {
      const res = await request(app.getHttpServer())
        .get(`/assessments?studentId=${studentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return empty array without filters', async () => {
      const res = await request(app.getHttpServer())
        .get('/assessments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Controller returns [] when no filter provided
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Note: GET /assessments/:id and DELETE /assessments/:id endpoints don't exist in the controller
  describe('PATCH /assessments/:id', () => {
    it('should update assessment score as teacher', async () => {
      // First create an assessment
      const createRes = await request(app.getHttpServer())
        .post('/assessments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: classId,
          studentId: studentId,
          title: 'Assessment to update',
          type: AssessmentType.Assignment,
          score: 7,
          maxScore: 10,
        })
        .expect(201);

      const res = await request(app.getHttpServer())
        .patch(`/assessments/${createRes.body._id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          score: 8,
          feedback: 'Đã chấm lại',
        })
        .expect(200);

      expect(res.body.score).toBe(8);
      expect(res.body.feedback).toBe('Đã chấm lại');
    });

    it('should reject update by students', async () => {
      // First create an assessment
      const createRes = await request(app.getHttpServer())
        .post('/assessments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: classId,
          studentId: studentId,
          title: 'Assessment for student test',
          type: AssessmentType.Assignment,
        })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/assessments/${createRes.body._id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ score: 10 })
        .expect(403);
    });
  });
});
