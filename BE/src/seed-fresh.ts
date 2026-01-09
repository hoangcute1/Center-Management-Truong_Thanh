import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';

/**
 * =====================================================
 * PHÂN QUYỀN HỆ THỐNG GIÁO DỤC TRƯỜNG THÀNH
 * =====================================================
 *
 * 1. ADMIN (Quản trị viên)
 *    - Quản lý toàn bộ hệ thống
 *    - CRUD tất cả người dùng (users)
 *    - CRUD chi nhánh (branches)
 *    - CRUD lớp học (classes)
 *    - CRUD buổi học (sessions)
 *    - Quản lý học phí (tuition)
 *    - Gửi thông báo (notifications)
 *    - Xem/duyệt báo cáo sự cố (incidents)
 *    - Mời người dùng mới (invites)
 *    - Import dữ liệu hàng loạt
 *    - Xem tất cả feedback
 *    - Quản lý mục tiêu học tập (goals)
 *
 * 2. TEACHER (Giáo viên)
 *    - Xem danh sách lớp mình dạy
 *    - Điểm danh học sinh (attendance)
 *    - Đánh giá học sinh (assessments)
 *    - Tạo/cập nhật mục tiêu học tập cho học sinh
 *    - Gửi thông báo cho học sinh/phụ huynh
 *    - Xem feedback của học sinh
 *    - Báo cáo sự cố
 *    - Chat với học sinh/phụ huynh
 *    - Tạo buổi học cho lớp mình
 *
 * 3. STUDENT (Học sinh)
 *    - Xem lớp học của mình
 *    - Xem lịch học (sessions)
 *    - Xem điểm danh của mình
 *    - Xem đánh giá của mình
 *    - Xem mục tiêu học tập
 *    - Gửi feedback cho giáo viên
 *    - Báo cáo sự cố
 *    - Chat với giáo viên/phụ huynh
 *    - Xem thông báo
 *
 * 4. PARENT (Phụ huynh)
 *    - Xem lớp học của con
 *    - Xem lịch học của con
 *    - Xem điểm danh của con
 *    - Xem đánh giá của con
 *    - Xem mục tiêu học tập của con
 *    - Xem học phí & thanh toán
 *    - Báo cáo sự cố
 *    - Chat với giáo viên
 *    - Xem thông báo
 */

// Định nghĩa chi tiết permissions cho từng role
export const ROLE_PERMISSIONS = {
  admin: {
    description: 'Quản trị viên - Toàn quyền hệ thống',
    permissions: [
      'users:create',
      'users:read',
      'users:update',
      'users:delete',
      'branches:create',
      'branches:read',
      'branches:update',
      'branches:delete',
      'classes:create',
      'classes:read',
      'classes:update',
      'classes:delete',
      'classes:manage-students',
      'sessions:create',
      'sessions:read',
      'sessions:update',
      'sessions:delete',
      'sessions:generate',
      'attendance:create',
      'attendance:read',
      'attendance:update',
      'assessments:create',
      'assessments:read',
      'assessments:update',
      'tuition:create',
      'tuition:read',
      'tuition:update',
      'notifications:create',
      'notifications:read',
      'incidents:create',
      'incidents:read',
      'incidents:update',
      'incidents:delete',
      'incidents:resolve',
      'feedback:read',
      'invites:create',
      'invites:read',
      'imports:users',
      'imports:students',
      'goals:create',
      'goals:read',
      'goals:update',
      'goals:delete',
      'chat:send',
      'chat:read',
      'approvals:read',
      'approvals:approve',
      'approvals:reject',
    ],
  },
  teacher: {
    description: 'Giáo viên - Quản lý lớp học và học sinh',
    permissions: [
      'users:read', // Chỉ xem học sinh trong lớp mình
      'classes:read', // Chỉ xem lớp mình dạy
      'sessions:create',
      'sessions:read',
      'sessions:update', // Quản lý buổi học lớp mình
      'attendance:create',
      'attendance:read',
      'attendance:update',
      'assessments:create',
      'assessments:read',
      'assessments:update',
      'notifications:create',
      'notifications:read',
      'incidents:create',
      'incidents:read',
      'feedback:read',
      'goals:create',
      'goals:read',
      'goals:update',
      'chat:send',
      'chat:read',
    ],
  },
  student: {
    description: 'Học sinh - Xem thông tin học tập cá nhân',
    permissions: [
      'classes:read', // Chỉ xem lớp mình học
      'sessions:read', // Xem lịch học
      'attendance:read', // Xem điểm danh của mình
      'assessments:read', // Xem đánh giá của mình
      'notifications:read',
      'incidents:create',
      'incidents:read',
      'feedback:create',
      'goals:read',
      'goals:update', // Cập nhật tiến độ mục tiêu
      'chat:send',
      'chat:read',
    ],
  },
  parent: {
    description: 'Phụ huynh - Theo dõi con học tập',
    permissions: [
      'classes:read', // Xem lớp của con
      'sessions:read', // Xem lịch học của con
      'attendance:read', // Xem điểm danh của con
      'assessments:read', // Xem đánh giá của con
      'tuition:read', // Xem học phí
      'notifications:read',
      'incidents:create',
      'incidents:read',
      'goals:read',
      'chat:send',
      'chat:read',
    ],
  },
};

async function seedFresh() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get MongoDB connection
  const connection = app.get<Connection>(getConnectionToken());

  // Get collections
  const UserModel = connection.collection('users');
  const BranchModel = connection.collection('branches');
  const ClassModel = connection.collection('classes');
  const SessionModel = connection.collection('sessions');

  console.log('🌱 Starting FRESH seed...');
  console.log('⚠️  This will clear ALL existing data!\n');

  // Clear all data
  console.log('🗑️ Clearing existing data...');
  await UserModel.deleteMany({});
  await BranchModel.deleteMany({});
  await ClassModel.deleteMany({});
  await SessionModel.deleteMany({});
  console.log('✅ All data cleared\n');

  // ===== 1. TẠO CHI NHÁNH =====
  console.log('📍 Creating branches...');
  await BranchModel.insertMany([
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
  const branches = await BranchModel.find({}).toArray();
  console.log(`✅ Created ${branches.length} branches\n`);

  const branchId = branches[0]._id.toString();
  const passwordHash = await bcrypt.hash('123456', 10);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000); // 5 năm

  // ===== 2. TẠO USERS THEO TỪNG ROLE =====
  console.log('👥 Creating users with role-based permissions...\n');

  // ----- ADMIN -----
  console.log('🔴 Creating ADMIN users...');
  const adminUsers = [
    {
      name: 'Admin Trường Thành',
      email: 'admin@truongthanh.edu.vn',
      phone: '0901000001',
      role: 'admin',
      status: 'active',
      branchId: null, // Admin có thể truy cập tất cả chi nhánh
      passwordHash,
      createdAt: now,
      updatedAt: now,
      // Không cần studentCode, teacherCode, parentCode
    },
  ];

  for (const user of adminUsers) {
    await UserModel.insertOne(user);
    console.log(`  ✅ ${user.name} (${user.email})`);
  }

  // ----- TEACHERS -----
  console.log('\n🟢 Creating TEACHER users...');
  const teacherUsers = [
    {
      name: 'Trần Thị Bình (GV Toán)',
      email: 'teacher.binh@truongthanh.edu.vn',
      phone: '0902000001',
      role: 'teacher',
      status: 'active',
      branchId,
      passwordHash,
      teacherCode: 'GV0001',
      subjects: ['math', 'physics'],
      qualification: 'Thạc sĩ Toán học',
      teacherNote: 'Giáo viên có 10 năm kinh nghiệm dạy luyện thi đại học',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
    {
      name: 'Nguyễn Văn Cường (GV Văn)',
      email: 'teacher.cuong@truongthanh.edu.vn',
      phone: '0902000002',
      role: 'teacher',
      status: 'active',
      branchId,
      passwordHash,
      teacherCode: 'GV0002',
      subjects: ['literature', 'history'],
      qualification: 'Cử nhân Ngữ văn',
      teacherNote: 'Chuyên gia nghị luận văn học',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
    {
      name: 'Lê Thị Dung (GV Anh)',
      email: 'teacher.dung@truongthanh.edu.vn',
      phone: '0902000003',
      role: 'teacher',
      status: 'active',
      branchId,
      passwordHash,
      teacherCode: 'GV0003',
      subjects: ['english'],
      qualification: 'Thạc sĩ Ngôn ngữ Anh',
      teacherNote: 'IELTS 8.0, có kinh nghiệm giảng dạy tại nước ngoài',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
  ];

  for (const user of teacherUsers) {
    await UserModel.insertOne(user);
    console.log(
      `  ✅ ${user.name} - ${user.teacherCode} (${user.subjects.join(', ')})`,
    );
  }

  // Get teacher IDs for classes
  const teachers = await UserModel.find({ role: 'teacher' }).toArray();

  // ----- STUDENTS -----
  console.log('\n🔵 Creating STUDENT users...');
  const studentUsers = [
    {
      name: 'Nguyễn Văn An',
      email: 'student.an@truongthanh.edu.vn',
      phone: '0903000001',
      role: 'student',
      status: 'active',
      branchId,
      passwordHash,
      studentCode: 'HS0001',
      dateOfBirth: new Date('2008-05-15'),
      gender: 'male',
      parentName: 'Nguyễn Văn Hùng',
      parentPhone: '0904000001',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
    {
      name: 'Trần Thị Bích',
      email: 'student.bich@truongthanh.edu.vn',
      phone: '0903000002',
      role: 'student',
      status: 'active',
      branchId,
      passwordHash,
      studentCode: 'HS0002',
      dateOfBirth: new Date('2008-08-20'),
      gender: 'female',
      parentName: 'Trần Văn Minh',
      parentPhone: '0904000002',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
    {
      name: 'Lê Hoàng Công',
      email: 'student.cong@truongthanh.edu.vn',
      phone: '0903000003',
      role: 'student',
      status: 'active',
      branchId,
      passwordHash,
      studentCode: 'HS0003',
      dateOfBirth: new Date('2009-01-10'),
      gender: 'male',
      parentName: 'Lê Văn Đức',
      parentPhone: '0904000003',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
    {
      name: 'Phạm Thị Duyên',
      email: 'student.duyen@truongthanh.edu.vn',
      phone: '0903000004',
      role: 'student',
      status: 'active',
      branchId,
      passwordHash,
      studentCode: 'HS0004',
      dateOfBirth: new Date('2008-12-25'),
      gender: 'female',
      parentName: 'Phạm Văn Hải',
      parentPhone: '0904000004',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
  ];

  for (const user of studentUsers) {
    await UserModel.insertOne(user);
    console.log(`  ✅ ${user.name} - ${user.studentCode}`);
  }

  // Get student IDs for classes
  const students = await UserModel.find({ role: 'student' }).toArray();

  // ----- PARENTS -----
  console.log('\n🟡 Creating PARENT users...');
  const parentUsers = [
    {
      name: 'Nguyễn Văn Hùng (PH)',
      email: 'parent.hung@truongthanh.edu.vn',
      phone: '0904000001',
      role: 'parent',
      status: 'active',
      branchId,
      passwordHash,
      parentCode: 'PH0001',
      childEmail: 'student.an@truongthanh.edu.vn', // Con của phụ huynh này
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
    {
      name: 'Trần Văn Minh (PH)',
      email: 'parent.minh@truongthanh.edu.vn',
      phone: '0904000002',
      role: 'parent',
      status: 'active',
      branchId,
      passwordHash,
      parentCode: 'PH0002',
      childEmail: 'student.bich@truongthanh.edu.vn',
      createdAt: now,
      updatedAt: now,
      expiresAt,
    },
  ];

  for (const user of parentUsers) {
    await UserModel.insertOne(user);
    console.log(
      `  ✅ ${user.name} - ${user.parentCode} (con: ${user.childEmail})`,
    );
  }

  // ===== 3. TẠO LỚP HỌC =====
  console.log('\n📚 Creating classes...');
  const classData = [
    {
      name: 'Toán 12 - Lớp A1',
      description: 'Lớp luyện thi đại học môn Toán',
      teacherId: teachers[0]._id.toString(),
      branchId,
      maxStudents: 30,
      status: 'active',
      fee: 2000000, // 2 triệu/tháng
      schedule: [
        { dayOfWeek: '1', startTime: '18:00', endTime: '20:00', room: 'P.101' },
        { dayOfWeek: '3', startTime: '18:00', endTime: '20:00', room: 'P.101' },
        { dayOfWeek: '5', startTime: '18:00', endTime: '20:00', room: 'P.101' },
      ],
      studentIds: students.slice(0, 3).map((s) => s._id.toString()),
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Văn 12 - Lớp B1',
      description: 'Lớp luyện thi đại học môn Văn',
      teacherId: teachers[1]._id.toString(),
      branchId,
      maxStudents: 25,
      status: 'active',
      fee: 1800000,
      schedule: [
        { dayOfWeek: '2', startTime: '18:00', endTime: '20:00', room: 'P.102' },
        { dayOfWeek: '4', startTime: '18:00', endTime: '20:00', room: 'P.102' },
        { dayOfWeek: '6', startTime: '08:00', endTime: '10:00', room: 'P.102' },
      ],
      studentIds: students.slice(1, 4).map((s) => s._id.toString()),
      createdAt: now,
      updatedAt: now,
    },
    {
      name: 'Anh Văn Giao Tiếp',
      description: 'Lớp tiếng Anh giao tiếp cơ bản',
      teacherId: teachers[2]._id.toString(),
      branchId,
      maxStudents: 20,
      status: 'active',
      fee: 2500000,
      schedule: [
        { dayOfWeek: '0', startTime: '09:00', endTime: '11:00', room: 'P.201' },
        { dayOfWeek: '6', startTime: '14:00', endTime: '16:00', room: 'P.201' },
      ],
      studentIds: students.map((s) => s._id.toString()),
      createdAt: now,
      updatedAt: now,
    },
  ];

  await ClassModel.insertMany(classData);
  const classes = await ClassModel.find({}).toArray();
  console.log(`✅ Created ${classes.length} classes\n`);

  // ===== 4. TẠO BUỔI HỌC =====
  console.log('📅 Creating sessions...');
  const sessions: any[] = [];
  const today = new Date();

  for (const cls of classes) {
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
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await SessionModel.insertMany(sessions);
  console.log(`✅ Created ${sessions.length} sessions\n`);

  // ===== SUMMARY =====
  console.log('═'.repeat(60));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('═'.repeat(60));

  console.log('\n📊 THỐNG KÊ:');
  console.log(`  - Chi nhánh: ${branches.length}`);
  console.log(`  - Giáo viên: ${teacherUsers.length}`);
  console.log(`  - Học sinh: ${studentUsers.length}`);
  console.log(`  - Phụ huynh: ${parentUsers.length}`);
  console.log(`  - Lớp học: ${classes.length}`);
  console.log(`  - Buổi học: ${sessions.length}`);

  console.log('\n📝 TÀI KHOẢN DEMO (mật khẩu: 123456):');
  console.log('─'.repeat(60));

  console.log('\n🔴 ADMIN:');
  console.log('   admin@truongthanh.edu.vn');
  console.log('   → Toàn quyền hệ thống');

  console.log('\n🟢 GIÁO VIÊN:');
  console.log('   teacher.binh@truongthanh.edu.vn (GV Toán)');
  console.log('   teacher.cuong@truongthanh.edu.vn (GV Văn)');
  console.log('   teacher.dung@truongthanh.edu.vn (GV Anh)');
  console.log('   → Điểm danh, đánh giá, quản lý lớp');

  console.log('\n🔵 HỌC SINH:');
  console.log('   student.an@truongthanh.edu.vn (HS0001)');
  console.log('   student.bich@truongthanh.edu.vn (HS0002)');
  console.log('   student.cong@truongthanh.edu.vn (HS0003)');
  console.log('   student.duyen@truongthanh.edu.vn (HS0004)');
  console.log('   → Xem lịch học, điểm danh, đánh giá');

  console.log('\n🟡 PHỤ HUYNH:');
  console.log('   parent.hung@truongthanh.edu.vn (PH An)');
  console.log('   parent.minh@truongthanh.edu.vn (PH Bích)');
  console.log('   → Theo dõi con, xem học phí');

  console.log('\n' + '═'.repeat(60));
  console.log('📌 PHÂN QUYỀN CHI TIẾT:');
  console.log('═'.repeat(60));

  for (const [role, info] of Object.entries(ROLE_PERMISSIONS)) {
    console.log(`\n${role.toUpperCase()}: ${info.description}`);
    console.log(`   Permissions: ${info.permissions.length} quyền`);
  }

  await app.close();
}

seedFresh().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
