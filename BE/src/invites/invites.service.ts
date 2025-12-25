import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import {
  InviteToken,
  InviteTokenDocument,
} from './schemas/invite-token.schema';
import { CreateInviteDto } from './dto/create-invite.dto';

@Injectable()
export class InvitesService {
  constructor(
    @InjectModel(InviteToken.name)
    private readonly inviteModel: Model<InviteTokenDocument>,
  ) {}

  private generateToken() {
    return crypto.randomBytes(24).toString('hex');
  }

  async create(dto: CreateInviteDto, adminId: string) {
    const expiredAt = dto.expiredAt
      ? new Date(dto.expiredAt)
      : new Date(Date.now() + 1000 * 60 * 60 * 72); // default 72h
    const token = this.generateToken();
    const created = await this.inviteModel.create({
      token,
      role: dto.role,
      classId: dto.classId,
      expiredAt,
      createdBy: adminId,
    });
    return {
      token: created.token,
      expiredAt: created.expiredAt,
      role: created.role,
      classId: created.classId,
    };
  }

  async useToken(token: string) {
    const doc = await this.inviteModel.findOne({ token }).exec();
    if (!doc) throw new BadRequestException('Invalid invite token');
    if (doc.usedAt) throw new ForbiddenException('Token already used');
    if (doc.expiredAt.getTime() < Date.now()) {
      throw new ForbiddenException('Token expired');
    }
    return doc;
  }

  async markUsed(id: string) {
    await this.inviteModel.findByIdAndUpdate(id, { usedAt: new Date() }).exec();
  }
}
