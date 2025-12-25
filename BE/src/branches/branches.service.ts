import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Branch, BranchDocument } from './schemas/branch.schema';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectModel(Branch.name)
    private readonly branchModel: Model<BranchDocument>,
  ) {}

  create(dto: CreateBranchDto) {
    return this.branchModel.create(dto);
  }

  findAll() {
    return this.branchModel.find().exec();
  }

  async findOne(id: string) {
    const branch = await this.branchModel.findById(id).exec();
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async update(id: string, dto: UpdateBranchDto) {
    const updated = await this.branchModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Branch not found');
    return updated;
  }

  async remove(id: string) {
    const res = await this.branchModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Branch not found');
  }
}
