import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get MongoDB connection
  const connection = app.get<Connection>(getConnectionToken());

  // Get collections directly from connection
  const UserModel = connection.collection('users');
  const BranchModel = connection.collection('branches');
  const ClassModel = connection.collection('classes');
  const SessionModel = connection.collection('sessions');

  console.log('🌱 Starting seed...');

  // Clear existing data (optional - comment out in production)
  // await UserModel.deleteMany({});
  // await BranchModel.deleteMany({});
  // await ClassModel.deleteMany({});
  // await SessionModel.deleteMany({});

  // Create branches
  const existingBranches = await BranchModel.find({}).toArray();
  let branches: any[] = existingBranches;

  if (existingBranches.length === 0) {
    console.log('📍 Creating branches...');
    const result = await BranchModel.insertMany([
      {
        name: 'Cơ sở 1 - Quận 1',
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        phone: '028-1234-5678',
        email: 'cs1@truongthanh.edu.vn',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Cơ sở 2 - Quận 3',
        address: '456 Võ Văn Tần, Quận 3, TP.HCM',
        phone: '028-2345-6789',
        email: 'cs2@truongthanh.edu.vn',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Cơ sở 3 - Thủ Đức',
        address: '789 Võ Văn Ngân, Thủ Đức, TP.HCM',
        phone: '028-3456-7890',
        email: 'cs3@truongthanh.edu.vn',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    branches = await BranchModel.find({}).toArray();
    console.log(`✅ Created ${branches.length} branches`);
  } else {
    console.log(`📍 Found ${existingBranches.length} existing branches`);
  }

  const branchId = branches[0]._id.toString();

  // Create demo users
  const passwordHash = await bcrypt.hash('123456', 10);

  const demoUsers = [
    {
      name: 'Admin Trường Thành',
      email: 'admin@example.com',
      phone: '0901234567',
      role: 'admin',
      status: 'active',
      branchId,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Nguyễn Văn A (Học sinh)',
      email: 'student@example.com',
      phone: '0901234568',
      role: 'student',
      status: 'active',
      branchId,
      passwordHash,
      studentCode: 'HS0001',
      parentName: 'Lê Văn C (Phụ huynh)',
      parentPhone: '0901234570',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Trần Thị B (Giáo viên)',
      email: 'teacher@example.com',
      phone: '0901234569',
      role: 'teacher',
      status: 'active',
      branchId,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: 'Lê Văn C (Phụ huynh)',
      email: 'parent@example.com',
      phone: '0901234570',
      role: 'parent',
      status: 'active',
      branchId,
      passwordHash,
      parentCode: 'PH0001',
      childEmail: 'student@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  console.log('👥 Creating demo users...');
  for (const user of demoUsers) {
    const exists = await UserModel.findOne({ email: user.email });
    if (!exists) {
      await UserModel.insertOne(user);
      console.log(`  ✅ Created user: ${user.email}`);
    } else {
      console.log(`  ⏭️ User exists: ${user.email}`);
    }
  }

  // Get created users for reference
  const teacher = await UserModel.findOne({ email: 'teacher@example.com' });
  const student = await UserModel.findOne({ email: 'student@example.com' });

  // Create classes
  const existingClasses = await ClassModel.find({}).toArray();
  let classes: any[] = existingClasses;

  if (existingClasses.length === 0 && teacher) {
    console.log('📚 Creating classes...');
    await ClassModel.insertMany([
      {
        name: 'Toán 12 - Lớp A1',
        description: 'Lớp luyện thi đại học môn Toán',
        teacherId: teacher._id.toString(),
        branchId,
        maxStudents: 30,
        status: 'active',
        schedule: [
          {
            dayOfWeek: '1',
            startTime: '18:00',
            endTime: '20:00',
            room: 'P.101',
          },
          {
            dayOfWeek: '3',
            startTime: '18:00',
            endTime: '20:00',
            room: 'P.101',
          },
          {
            dayOfWeek: '5',
            startTime: '18:00',
            endTime: '20:00',
            room: 'P.101',
          },
        ],
        studentIds: student ? [student._id.toString()] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Văn 12 - Lớp B1',
        description: 'Lớp luyện thi đại học môn Văn',
        teacherId: teacher._id.toString(),
        branchId,
        maxStudents: 25,
        status: 'active',
        schedule: [
          {
            dayOfWeek: '2',
            startTime: '18:00',
            endTime: '20:00',
            room: 'P.102',
          },
          {
            dayOfWeek: '4',
            startTime: '18:00',
            endTime: '20:00',
            room: 'P.102',
          },
          {
            dayOfWeek: '6',
            startTime: '08:00',
            endTime: '10:00',
            room: 'P.102',
          },
        ],
        studentIds: student ? [student._id.toString()] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        name: 'Anh Văn Giao Tiếp',
        description: 'Lớp tiếng Anh giao tiếp cơ bản',
        teacherId: teacher._id.toString(),
        branchId,
        maxStudents: 20,
        status: 'active',
        schedule: [
          {
            dayOfWeek: '0',
            startTime: '09:00',
            endTime: '11:00',
            room: 'P.201',
          },
          {
            dayOfWeek: '6',
            startTime: '14:00',
            endTime: '16:00',
            room: 'P.201',
          },
        ],
        studentIds: student ? [student._id.toString()] : [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    classes = await ClassModel.find({}).toArray();
    console.log(`✅ Created ${classes.length} classes`);
  } else {
    console.log(`📚 Found ${existingClasses.length} existing classes`);
  }

  // Create sessions for today and upcoming days
  const existingSessions = await SessionModel.find({}).toArray();

  if (existingSessions.length === 0 && classes.length > 0) {
    console.log('📅 Creating sessions...');
    const today = new Date();
    const sessions: any[] = [];

    for (const cls of classes) {
      // Create sessions for the next 7 days
      for (let i = 0; i < 7; i++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(today.getDate() + i);

        sessions.push({
          classId: (cls as any)._id.toString(),
          date: sessionDate,
          startTime: (cls as any).schedule?.[0]?.startTime || '18:00',
          endTime: (cls as any).schedule?.[0]?.endTime || '20:00',
          topic: `Buổi học ngày ${sessionDate.toLocaleDateString('vi-VN')}`,
          status: i === 0 ? 'completed' : 'scheduled',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await SessionModel.insertMany(sessions);
    console.log(`✅ Created ${sessions.length} sessions`);
  } else {
    console.log(`📅 Found ${existingSessions.length} existing sessions`);
  }

  console.log('\n🎉 Seed completed!');
  console.log('\n📝 Demo accounts (password: 123456):');
  console.log('  - admin@example.com');
  console.log('  - student@example.com');
  console.log('  - teacher@example.com');
  console.log('  - parent@example.com');

  await app.close();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
