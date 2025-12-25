import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ApprovalRequest,
  ApprovalRequestDocument,
  ApprovalStatus,
  ApprovalType,
} from './schemas/approval-request.schema';
import { UsersService } from '../users/users.service';
import { UserStatus } from '../common/enums/user-status.enum';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectModel(ApprovalRequest.name)
    private readonly approvalModel: Model<ApprovalRequestDocument>,
    private readonly usersService: UsersService,
  ) {}

  async createRegisterRequest(userId: string) {
    return this.approvalModel.create({
      userId,
      type: ApprovalType.Register,
      status: ApprovalStatus.Pending,
    });
  }

  async listPending() {
    return this.approvalModel.find({ status: ApprovalStatus.Pending }).lean();
  }

  async approveRegister(userId: string, adminId: string) {
    const req = await this.approvalModel
      .findOne({
        userId,
        type: ApprovalType.Register,
        status: ApprovalStatus.Pending,
      })
      .exec();
    if (!req) throw new NotFoundException('Pending approval not found');
    await this.usersService.update(userId, {
      status: UserStatus.Active,
    } as any);
    await this.approvalModel
      .findByIdAndUpdate(req._id, {
        status: ApprovalStatus.Approved,
        approvedBy: adminId,
      })
      .exec();
    return { userId, status: ApprovalStatus.Approved };
  }
}
