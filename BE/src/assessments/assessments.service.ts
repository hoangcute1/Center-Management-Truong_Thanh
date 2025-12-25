import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assessment, AssessmentDocument } from './schemas/assessment.schema';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectModel(Assessment.name)
    private readonly model: Model<AssessmentDocument>,
  ) {}

  async create(user: UserDocument, dto: CreateAssessmentDto) {
    const doc = new this.model({
      ...dto,
      classId: new Types.ObjectId(dto.classId),
      studentId: new Types.ObjectId(dto.studentId),
      teacherId: user._id,
    });
    return doc.save();
  }

  listByClass(classId: string) {
    return this.model.find({ classId }).exec();
  }

  listByStudent(studentId: string) {
    return this.model.find({ studentId }).exec();
  }

  async update(id: string, dto: UpdateAssessmentDto) {
    const updated = await this.model
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Assessment not found');
    return updated;
  }
}
