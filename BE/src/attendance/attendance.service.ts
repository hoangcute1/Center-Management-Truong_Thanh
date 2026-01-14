import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { TimetableAttendanceDto } from './dto/timetable-attendance.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { Session, SessionDocument } from '../sessions/schemas/session.schema';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name)
    private readonly model: Model<AttendanceDocument>,
    @InjectModel(Session.name)
    private readonly sessionModel: Model<SessionDocument>,
  ) {}

  async mark(user: UserDocument, dto: CreateAttendanceDto) {
    const doc = new this.model({
      ...dto,
      sessionId: new Types.ObjectId(dto.sessionId),
      studentId: new Types.ObjectId(dto.studentId),
      markedBy: user._id,
    });
    return doc.save();
  }

  listBySession(sessionId: string) {
    return this.model.find({ sessionId }).exec();
  }

  listByStudent(studentId: string) {
    return this.model.find({ studentId }).exec();
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const updated = await this.model
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Attendance not found');
    return updated;
  }

  // Mark attendance from timetable (creates session if not exists)
  async markFromTimetable(user: UserDocument, dto: TimetableAttendanceDto) {
    const classId = new Types.ObjectId(dto.classId);
    const attendanceDate = new Date(dto.date);

    // Set time boundaries for the day
    const startOfDay = new Date(attendanceDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find or create session for this class on this date
    let session = await this.sessionModel
      .findOne({
        classId,
        startTime: { $gte: startOfDay, $lte: endOfDay },
      })
      .exec();

    if (!session) {
      // Create a new session for this timetable entry
      session = new this.sessionModel({
        classId,
        startTime: attendanceDate,
        endTime: new Date(attendanceDate.getTime() + 90 * 60 * 1000), // 90 minutes default
        status: 'approved',
        note: 'Buổi học theo thời khóa biểu',
      });
      await session.save();
    }

    const results: AttendanceDocument[] = [];

    // Mark attendance for each student
    for (const record of dto.records) {
      const studentId = new Types.ObjectId(record.studentId);

      // Check if attendance already exists
      const existing = await this.model
        .findOne({
          sessionId: session._id,
          studentId,
        })
        .exec();

      if (existing) {
        // Update existing record
        existing.status = record.status;
        if (dto.note) existing.note = dto.note;
        await existing.save();
        results.push(existing);
      } else {
        // Create new attendance record
        const attendance = new this.model({
          sessionId: session._id,
          studentId,
          status: record.status,
          note: dto.note,
          markedBy: user._id,
        });
        await attendance.save();
        results.push(attendance);
      }
    }

    return { session, attendanceRecords: results };
  }

  // Get statistics for a student
  async getStatistics(studentId: string) {
    const records = await this.model
      .find({ studentId: new Types.ObjectId(studentId) })
      .exec();

    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const total = records.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return { present, absent, late, total, rate };
  }
}
