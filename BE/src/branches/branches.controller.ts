import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.Admin)
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }

  @Get()
  @Roles(UserRole.Admin)
  findAll() {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.Admin)
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
