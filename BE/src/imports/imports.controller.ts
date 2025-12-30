import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ImportsService } from './imports.service';
import { ImportUsersDto } from './dto/import-users.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';

@ApiTags('imports')
@Controller('imports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post('users')
  @Roles(UserRole.Admin)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
          'application/vnd.ms-excel', // xls
          'text/csv',
          'application/csv',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Chỉ chấp nhận file Excel (.xlsx, .xls) hoặc CSV',
            ),
            false,
          );
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Import users từ file Excel/CSV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        role: { type: 'string', enum: ['student', 'teacher', 'parent'] },
        branchId: { type: 'string' },
        classId: { type: 'string' },
      },
      required: ['file', 'role', 'branchId'],
    },
  })
  async importUsers(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportUsersDto,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng upload file');
    }
    return this.importsService.importUsers(file.buffer, file.mimetype, dto);
  }

  @Get('template')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Tải template Excel theo role' })
  async downloadTemplate(@Query('role') role: UserRole, @Res() res: Response) {
    if (!role || !Object.values(UserRole).includes(role)) {
      throw new BadRequestException('Role không hợp lệ');
    }

    const buffer = await this.importsService.generateTemplate(role);
    const filename = `template_${role}_${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
