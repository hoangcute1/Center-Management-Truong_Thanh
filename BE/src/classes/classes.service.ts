import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ClassEntity, ClassDocument } from './schemas/class.schema';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { UserRole } from '../common/enums/role.enum';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class ClassesService {
  constructor(
    @InjectModel(ClassEntity.name)
    private readonly classModel: Model<ClassDocument>,
  ) {}

  async create(dto: CreateClassDto): Promise<ClassEntity> {
    const doc = new this.classModel({ ...dto });
    await doc.save();
    await doc.populate([
      { path: 'teacherId', select: 'name email' },
      { path: 'branchId', select: 'name' },
      { path: 'studentIds', select: 'name email role branchId' },
    ]);
    return doc;
  }

  async findAllForUser(user: UserDocument): Promise<ClassEntity[]> {
    if (user.role === UserRole.Admin)
      return this.classModel
        .find()
        .populate('teacherId', 'name email')
        .populate('branchId', 'name')
        .populate('studentIds', 'name email role branchId')
        .exec();
    if (user.role === UserRole.Teacher)
      return this.classModel
        .find({ teacherId: user._id })
        .populate('teacherId', 'name email')
        .populate('branchId', 'name')
        .populate('studentIds', 'name email role branchId')
        .exec();
    return this.classModel
      .find({ studentIds: { $in: [new Types.ObjectId(user._id)] } })
      .populate('teacherId', 'name email')
      .populate('branchId', 'name')
      .populate('studentIds', 'name email role branchId')
      .exec();
  }

  async findOne(id: string): Promise<ClassEntity> {
    const doc = await this.classModel
      .findById(id)
      .populate('teacherId', 'name email')
      .populate('branchId', 'name')
      .populate('studentIds', 'name email role branchId')
      .exec();
    if (!doc) throw new NotFoundException('Class not found');
    return doc;
  }

  async update(id: string, dto: UpdateClassDto): Promise<ClassEntity> {
    const updated = await this.classModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('teacherId', 'name email')
      .populate('branchId', 'name')
      .populate('studentIds', 'name email role branchId')
      .exec();
    if (!updated) throw new NotFoundException('Class not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.classModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Class not found');
  }

  // Thêm học sinh vào lớp
  async addStudentToClass(
    classId: string,
    studentId: string,
  ): Promise<ClassEntity> {
    const classDoc = await this.classModel.findById(classId).exec();
    if (!classDoc) throw new NotFoundException('Class not found');

    const studentObjectId = new Types.ObjectId(studentId);

    // Kiểm tra học sinh đã trong lớp chưa
    const isAlreadyInClass = classDoc.studentIds?.some(
      (id) => id.toString() === studentId,
    );

    if (!isAlreadyInClass) {
      await this.classModel
        .findByIdAndUpdate(
          classId,
          { $addToSet: { studentIds: studentObjectId } },
          { new: true },
        )
        .exec();
    }

    return this.findOne(classId);
  }

  // Xóa học sinh khỏi lớp
  async removeStudentFromClass(
    classId: string,
    studentId: string,
  ): Promise<ClassEntity> {
    const classDoc = await this.classModel.findById(classId).exec();
    if (!classDoc) throw new NotFoundException('Class not found');

    await this.classModel
      .findByIdAndUpdate(
        classId,
        { $pull: { studentIds: new Types.ObjectId(studentId) } },
        { new: true },
      )
      .exec();

    return this.findOne(classId);
  }

  // Thêm nhiều học sinh vào lớp
  async addStudentsToClass(
    classId: string,
    studentIds: string[],
  ): Promise<ClassEntity> {
    const classDoc = await this.classModel.findById(classId).exec();
    if (!classDoc) throw new NotFoundException('Class not found');

    const studentObjectIds = studentIds.map((id) => new Types.ObjectId(id));

    await this.classModel
      .findByIdAndUpdate(
        classId,
        { $addToSet: { studentIds: { $each: studentObjectIds } } },
        { new: true },
      )
      .exec();

    return this.findOne(classId);
  }
}
