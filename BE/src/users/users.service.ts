import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '../common/enums/role.enum';
import { SUBJECT_LIST } from '../common/enums/subject.enum';

interface FindAllFilters {
  role?: string;
  status?: string;
  branchId?: string;
  subject?: string; // Lọc giáo viên theo môn dạy
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<User> {
    const or: any[] = [{ email: dto.email }];
    if (dto.phone) {
      or.push({ phone: dto.phone });
    }
    const exists = await this.userModel.findOne({ $or: or }).lean();
    if (exists) {
      throw new ConflictException('User already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = new this.userModel({ ...dto, passwordHash });
    return created.save();
  }

  findAll(filters?: FindAllFilters): Promise<User[]> {
    const query: any = {};

    if (filters?.role) {
      query.role = filters.role;
    }
    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.branchId) {
      query.branchId = filters.branchId;
    }
    // Lọc giáo viên theo môn dạy
    if (filters?.subject) {
      query.subjects = { $in: [filters.subject] };
    }

    return this.userModel.find(query).select('-passwordHash').exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel
      .findById(id)
      .select('-passwordHash')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    if (dto.password) {
      const passwordHash = await bcrypt.hash(dto.password, 10);
      (dto as any).passwordHash = passwordHash;
      delete (dto as any).password;
    }
    const updated = await this.userModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-passwordHash')
      .exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('User not found');
  }

  // Lấy danh sách giáo viên theo môn học
  async findTeachersBySubject(subject: string): Promise<User[]> {
    return this.userModel
      .find({
        role: UserRole.Teacher,
        subjects: { $in: [subject] },
      })
      .select('-passwordHash')
      .exec();
  }

  // Lấy danh sách tất cả môn học có trong hệ thống
  getAvailableSubjects(): string[] {
    return SUBJECT_LIST;
  }

  // Lấy thống kê giáo viên theo môn học
  async getTeacherStatsBySubject(): Promise<
    Array<{ subject: string; count: number }>
  > {
    const stats = await this.userModel.aggregate([
      { $match: { role: UserRole.Teacher } },
      { $unwind: '$subjects' },
      {
        $group: {
          _id: '$subjects',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          subject: '$_id',
          count: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    return stats;
  }
}
