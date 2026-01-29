import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { DocumentVisibility } from '../schemas/document.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Tiêu đề tài liệu' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Mô tả tài liệu' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL của file đã upload (nếu không dùng upload file)',
  })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID lớp học được chia sẻ',
    type: [String],
  })
  @IsOptional()
  classIds?: any; // Relax validation to debug 400 error

  @ApiPropertyOptional({
    enum: DocumentVisibility,
    description: 'Phạm vi chia sẻ: class (chỉ lớp) hoặc community (cộng đồng)',
    default: DocumentVisibility.Class,
  })
  @IsEnum(DocumentVisibility)
  @IsOptional()
  visibility?: DocumentVisibility;

  @ApiPropertyOptional({ description: 'ID chi nhánh' })
  @IsMongoId()
  @IsOptional()
  branchId?: string;
}
