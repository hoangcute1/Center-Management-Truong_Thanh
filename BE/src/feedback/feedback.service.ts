import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UserDocument } from '../users/schemas/user.schema';
import { UserRole } from '../common/enums/role.enum';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private readonly model: Model<FeedbackDocument>,
  ) {}

  create(user: UserDocument, dto: CreateFeedbackDto) {
    const doc = new this.model({
      ...dto,
      teacherId: new Types.ObjectId(dto.teacherId),
      studentId: user._id,
    });
    if (user.role !== UserRole.Student) {
      // allow admin to submit on behalf? keep as-is
    }
    return doc.save();
  }

  listForTeacher(teacherId: string) {
    return this.model.find({ teacherId }).exec();
  }

  listAll() {
    return this.model.find().exec();
  }
}
