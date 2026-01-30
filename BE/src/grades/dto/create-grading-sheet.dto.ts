import { IsString, IsOptional, IsMongoId, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GradeCategory } from '../schemas/grade.schema';

export class CreateGradingSheetDto {
    @ApiProperty({ description: 'Tên bài kiểm tra' })
    @IsString()
    title: string;

    @ApiPropertyOptional({ description: 'Mô tả bài kiểm tra' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ description: 'ID lớp học' })
    @IsMongoId()
    classId: string;

    @ApiProperty({ description: 'Loại bài kiểm tra', enum: GradeCategory })
    @IsEnum(GradeCategory)
    category: GradeCategory;

    @ApiProperty({ description: 'Điểm tối đa', default: 10 })
    @IsNumber()
    @Min(0)
    @Max(100)
    maxScore: number;
}
