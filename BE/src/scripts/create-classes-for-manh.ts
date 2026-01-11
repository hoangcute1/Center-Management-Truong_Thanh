import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

/**
 * Script để tạo lớp demo cho giáo viên "mạnh"
 */
async function createClassesForManh() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const connection = app.get<Connection>(getConnectionToken());
  const UserModel = connection.collection('users');
  const ClassModel = connection.collection('classes');
  const BranchModel = connection.collection('branches');

  console.log('🔧 Creating demo classes for teacher "mạnh"...\n');

  // Tìm giáo viên mạnh
  const manh = await UserModel.findOne({ email: 'manh@gmail.com' });
  if (!manh) {
    console.log('❌ Teacher "mạnh" not found!');
    await app.close();
    return;
  }
  console.log(`✅ Found teacher: ${manh.name} (${manh._id})`);

  // Tìm branch đầu tiên
  const branch = await BranchModel.findOne({});
  if (!branch) {
    console.log('❌ No branch found!');
    await app.close();
    return;
  }
  console.log(`✅ Using branch: ${branch.name}`);

  const now = new Date();

  // Tạo 2 lớp cho mạnh
  const classesToCreate = [
    {
      name: 'Toán - Lớp 10',
      subject: 'Toán',
      grade: '10',
      description: 'Lớp Toán 10 do thầy Mạnh phụ trách',
      teacherId: new Types.ObjectId(manh._id),
      branchId: new Types.ObjectId(branch._id),
      maxStudents: 30,
      status: 'active',
      schedule: [
        { dayOfWeek: 1, startTime: '18:00', endTime: '20:00', room: 'P.201' },
        { dayOfWeek: 3, startTime: '18:00', endTime: '20:00', room: 'P.201' },
        { dayOfWeek: 5, startTime: '18:00', endTime: '20:00', room: 'P.201' },
      ],
      studentIds: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Toán - Lớp 11',
      subject: 'Toán',
      grade: '11',
      description: 'Lớp Toán 11 do thầy Mạnh phụ trách',
      teacherId: new Types.ObjectId(manh._id),
      branchId: new Types.ObjectId(branch._id),
      maxStudents: 30,
      status: 'active',
      schedule: [
        { dayOfWeek: 2, startTime: '18:00', endTime: '20:00', room: 'P.202' },
        { dayOfWeek: 4, startTime: '18:00', endTime: '20:00', room: 'P.202' },
        { dayOfWeek: 6, startTime: '08:00', endTime: '10:00', room: 'P.202' },
      ],
      studentIds: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const classData of classesToCreate) {
    // Check if class already exists
    const existing = await ClassModel.findOne({
      name: classData.name,
      teacherId: classData.teacherId,
    });

    if (existing) {
      console.log(
        `⏭️ Class "${classData.name}" already exists for teacher "mạnh"`,
      );
    } else {
      await ClassModel.insertOne(classData);
      console.log(`✅ Created class: ${classData.name}`);
    }
  }

  // Verify
  const manhClasses = await ClassModel.find({
    teacherId: new Types.ObjectId(manh._id),
  }).toArray();
  console.log(`\n📚 Teacher "mạnh" now has ${manhClasses.length} classes:`);
  for (const c of manhClasses) {
    console.log(`  - ${c.name}`);
  }

  await app.close();
}

createClassesForManh()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
  });
