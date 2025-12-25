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

// E2E happy-path for invite -> register pending -> admin approve -> login

describe('Auth invite flow (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;
  const adminEmail = 'admin@test.com';
  const adminPassword = 'Admin123!';

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

    // Seed an admin user directly into the DB
    const userModel = app.get<typeof mongoose.model<UserDocument>>(
      getModelToken(User.name),
    );
    await userModel.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: UserRole.Admin,
      status: UserStatus.Active,
    });
  });

  afterAll(async () => {
    if (app) await app.close();
    if (mongo) await mongo.stop();
  });

  it('should complete invite -> register pending -> approve -> login', async () => {
    // Admin login
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(201);

    const adminAccess = loginRes.body.accessToken as string;

    // Admin creates invite token for student role
    const inviteRes = await request(app.getHttpServer())
      .post('/invites/create')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ role: UserRole.Student })
      .expect(201);

    const token = inviteRes.body.token as string;

    // Public register by invite (user becomes pending)
    await request(app.getHttpServer())
      .post('/auth/register/by-invite')
      .send({
        token,
        name: 'Student A',
        email: 'student@test.com',
        password: 'Student123',
      })
      .expect(201);

    // Admin lists pending approvals
    const approvalsRes = await request(app.getHttpServer())
      .get('/admin/approvals')
      .set('Authorization', `Bearer ${adminAccess}`)
      .expect(200);

    const pending = approvalsRes.body.find((r: any) => r.type === 'register');
    expect(pending).toBeDefined();

    // Admin approves user
    await request(app.getHttpServer())
      .post('/admin/approve-user')
      .set('Authorization', `Bearer ${adminAccess}`)
      .send({ userId: pending.userId })
      .expect(201);

    // Now user can login
    const studentLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'student@test.com', password: 'Student123' })
      .expect(201);

    expect(studentLogin.body.accessToken).toBeDefined();
    expect(studentLogin.body.user.role).toBe(UserRole.Student);
  });
});
