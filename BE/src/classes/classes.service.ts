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
    return doc.save();
  }

  async findAllForUser(user: UserDocument): Promise<ClassEntity[]> {
    if (user.role === UserRole.Admin) return this.classModel.find().exec();
    if (user.role === UserRole.Teacher)
      return this.classModel.find({ teacherId: user._id }).exec();
    return this.classModel
      .find({ studentIds: { $in: [new Types.ObjectId(user._id)] } })
      .exec();
  }

  async findOne(id: string): Promise<ClassEntity> {
    const doc = await this.classModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Class not found');
    return doc;
  }

  async update(id: string, dto: UpdateClassDto): Promise<ClassEntity> {
    const updated = await this.classModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Class not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.classModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Class not found');
  }
}
