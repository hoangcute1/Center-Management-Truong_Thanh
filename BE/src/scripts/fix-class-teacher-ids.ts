import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

/**
 * Script để fix teacherId trong collection classes
 * Chuyển đổi từ string sang ObjectId
 */
async function fixTeacherIds() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const connection = app.get<Connection>(getConnectionToken());
  const ClassModel = connection.collection('classes');

  console.log('🔧 Starting teacherId fix migration...\n');

  // Tìm tất cả classes có teacherId là string
  const classes = await ClassModel.find({}).toArray();
  let fixedCount = 0;

  for (const classDoc of classes) {
    const updates: any = {};
    let needsUpdate = false;

    // Fix teacherId
    if (classDoc.teacherId && typeof classDoc.teacherId === 'string') {
      try {
        updates.teacherId = new Types.ObjectId(classDoc.teacherId);
        needsUpdate = true;
        console.log(
          `  📝 Class "${classDoc.name}": Converting teacherId from string to ObjectId`,
        );
      } catch (e) {
        console.log(
          `  ⚠️ Class "${classDoc.name}": Invalid teacherId string "${classDoc.teacherId}"`,
        );
      }
    }

    // Fix branchId
    if (classDoc.branchId && typeof classDoc.branchId === 'string') {
      try {
        updates.branchId = new Types.ObjectId(classDoc.branchId);
        needsUpdate = true;
        console.log(
          `  📝 Class "${classDoc.name}": Converting branchId from string to ObjectId`,
        );
      } catch (e) {
        console.log(
          `  ⚠️ Class "${classDoc.name}": Invalid branchId string "${classDoc.branchId}"`,
        );
      }
    }

    // Fix studentIds array
    if (classDoc.studentIds && Array.isArray(classDoc.studentIds)) {
      const fixedStudentIds = classDoc.studentIds.map((sid: any) => {
        if (typeof sid === 'string') {
          try {
            return new Types.ObjectId(sid);
          } catch (e) {
            return sid;
          }
        }
        return sid;
      });

      const hasStringIds = classDoc.studentIds.some(
        (sid: any) => typeof sid === 'string',
      );
      if (hasStringIds) {
        updates.studentIds = fixedStudentIds;
        needsUpdate = true;
        console.log(
          `  📝 Class "${classDoc.name}": Converting studentIds from strings to ObjectIds`,
        );
      }
    }

    if (needsUpdate) {
      await ClassModel.updateOne({ _id: classDoc._id }, { $set: updates });
      fixedCount++;
    }
  }

  console.log(
    `\n✅ Migration complete! Fixed ${fixedCount}/${classes.length} classes`,
  );

  await app.close();
}

fixTeacherIds()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
