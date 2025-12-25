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

  findAll(): Promise<User[]> {
    return this.userModel.find().select('-passwordHash').exec();
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
}
