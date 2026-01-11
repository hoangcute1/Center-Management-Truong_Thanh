import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

/**
 * Script để debug và kiểm tra classes và users trong database
 */
async function debugData() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const connection = app.get<Connection>(getConnectionToken());
  const UserModel = connection.collection('users');
  const ClassModel = connection.collection('classes');

  console.log('🔍 Debug: Checking database data...\n');

  // Tìm tất cả teachers
  const teachers = await UserModel.find({ role: 'teacher' }).toArray();
  console.log('📚 TEACHERS in database:');
  for (const t of teachers) {
    console.log(`  - ${t.name} (${t.email})`);
    console.log(`    _id: ${t._id} (type: ${typeof t._id})`);
  }

  console.log('\n📚 CLASSES in database:');
  const classes = await ClassModel.find({}).toArray();
  for (const c of classes) {
    console.log(`  - ${c.name}`);
    console.log(
      `    teacherId: ${c.teacherId} (type: ${typeof c.teacherId}, isObjectId: ${c.teacherId instanceof Types.ObjectId})`,
    );

    // Tìm teacher matching
    const teacherMatched = teachers.find((t) => {
      if (c.teacherId instanceof Types.ObjectId) {
        return t._id.toString() === c.teacherId.toString();
      }
      return t._id.toString() === c.teacherId;
    });
    console.log(
      `    teacherMatched: ${teacherMatched ? teacherMatched.name : 'NOT FOUND'}`,
    );
  }

  // Test query như service
  console.log('\n🧪 Testing query for each teacher:');
  for (const teacher of teachers) {
    const userIdString = teacher._id.toString();
    const userIdObjectId = new Types.ObjectId(teacher._id);

    const matchingClasses = await ClassModel.find({
      $or: [{ teacherId: userIdObjectId }, { teacherId: userIdString }],
    }).toArray();

    console.log(`  Teacher "${teacher.name}" (${userIdString}):`);
    console.log(
      `    Found ${matchingClasses.length} classes: [${matchingClasses.map((c) => c.name).join(', ')}]`,
    );
  }

  await app.close();
}

debugData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Debug failed:', err);
    process.exit(1);
  });
