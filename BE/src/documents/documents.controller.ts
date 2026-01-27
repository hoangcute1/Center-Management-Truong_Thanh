import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../users/schemas/user.schema';

// Ensure uploads directory exists
const uploadsDir = join(process.cwd(), 'uploads', 'documents');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Post('upload')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsDir,
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `doc-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
      fileFilter: (req, file, cb) => {
        // Allow common document types
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'video/mp4',
          'video/webm',
          'audio/mpeg',
          'audio/wav',
          'text/plain',
          'application/zip',
          'application/x-rar-compressed',
        ];
        console.log('Checking file upload:', file.originalname, file.mimetype);
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          console.error('File rejected (MIME):', file.mimetype);
          cb(new BadRequestException('Loại file không được hỗ trợ: ' + file.mimetype), false);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload file tài liệu (Giáo viên/Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
        classIds: { type: 'array', items: { type: 'string' } },
        visibility: { type: 'string', enum: ['class', 'community'] },
      },
      required: ['file', 'title'],
    },
  })
  async uploadDocument(
    @CurrentUser() user: UserDocument,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn file để upload');
    }

    // Parse classIds if it comes as JSON string from FormData
    let classIds: string[] | undefined = undefined;

    if (dto.classIds) {
      if (typeof dto.classIds === 'string') {
        try {
          const parsed = JSON.parse(dto.classIds);
          classIds = Array.isArray(parsed) ? parsed : undefined;
        } catch (e) {
          console.warn('Failed to parse classIds JSON:', dto.classIds);
          // If parsing fails, treat as undefined (will use teacher's classes)
        }
      } else if (Array.isArray(dto.classIds)) {
        classIds = dto.classIds;
      }
    }

    console.log('Upload document request:', {
      fileName: file.originalname,
      size: file.size,
      classIds,
      visibility: dto.visibility,
    });

    // Generate file URL
    const fileUrl = `/uploads/documents/${file.filename}`;

    return this.documentsService.create(user, {
      ...dto,
      classIds,
      fileUrl,
      originalFileName: file.originalname,
    });
  }

  @Post()
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Tạo tài liệu mới với URL (Giáo viên/Admin)' })
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateDocumentDto) {
    if (!dto.fileUrl) {
      throw new BadRequestException('Vui lòng cung cấp URL file');
    }
    return this.documentsService.create(user, dto);
  }

  @Get('my')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Lấy tài liệu của giáo viên đang đăng nhập' })
  findMyDocuments(@CurrentUser() user: UserDocument) {
    return this.documentsService.findByTeacher(user._id.toString());
  }

  @Get('for-student')
  @Roles(UserRole.Student)
  @ApiOperation({
    summary: 'Lấy tài liệu cho học sinh (community + class của học sinh)',
  })
  findForStudent(@CurrentUser() user: UserDocument) {
    return this.documentsService.findForStudent(user._id.toString());
  }

  @Get('community')
  @ApiOperation({ summary: 'Lấy tất cả tài liệu cộng đồng (public)' })
  findCommunity() {
    return this.documentsService.findCommunity();
  }

  @Get('class/:classId')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Lấy tài liệu theo lớp' })
  @ApiParam({ name: 'classId', description: 'ID của lớp học' })
  findByClass(@Param('classId') classId: string) {
    return this.documentsService.findByClass(classId);
  }

  @Get('teacher/:teacherId')
  @Roles(UserRole.Admin)
  @ApiOperation({ summary: 'Lấy tài liệu theo giáo viên (Admin only)' })
  @ApiParam({ name: 'teacherId', description: 'ID của giáo viên' })
  findByTeacher(@Param('teacherId') teacherId: string) {
    return this.documentsService.findByTeacher(teacherId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết tài liệu' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Cập nhật tài liệu' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.documentsService.update(id, dto, user);
  }

  @Patch(':id/share-community')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Chia sẻ tài liệu ra cộng đồng' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  shareToCommunity(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.documentsService.shareToCommuity(id, user);
  }

  @Patch(':id/restrict-class')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Giới hạn tài liệu chỉ cho lớp học' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  restrictToClass(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.documentsService.restrictToClass(id, user);
  }

  @Patch(':id/download')
  @ApiOperation({ summary: 'Tăng số lượt tải xuống' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  incrementDownload(@Param('id') id: string) {
    return this.documentsService.incrementDownload(id);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Tải xuống file tài liệu' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const document = await this.documentsService.findOne(id);

    // Increment download count
    await this.documentsService.incrementDownload(id);

    const filename = document.fileUrl?.split('/').pop() || '';
    const filePath = join(process.cwd(), 'uploads', 'documents', filename);

    // Check if file exists
    if (!existsSync(filePath)) {
      throw new NotFoundException('File không tồn tại trên hệ thống');
    }

    // Server file with attachment disposition to force download
    res.download(filePath, document.originalFileName || 'document', (err) => {
      if (err) {
        console.error('Download error:', err);
      }
    });
  }

  @Delete(':id')
  @Roles(UserRole.Admin, UserRole.Teacher)
  @ApiOperation({ summary: 'Xóa tài liệu' })
  @ApiParam({ name: 'id', description: 'ID của tài liệu' })
  remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.documentsService.remove(id, user);
  }
}
