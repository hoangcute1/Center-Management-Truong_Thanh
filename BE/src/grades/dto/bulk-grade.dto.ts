import { IsMongoId, IsNumber, IsOptional, IsString, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StudentGradeDto {
    @ApiProperty({ description: 'ID học sinh' })
    @IsMongoId()
    studentId: string;

    @ApiProperty({ description: 'Điểm số' })
    @IsNumber()
    @Min(0)
    score: number;

    @ApiPropertyOptional({ description: 'Nhận xét' })
    @IsOptional()
    @IsString()
    feedback?: string;
}

export class BulkGradeDto {
    @ApiProperty({ description: 'Danh sách điểm học sinh', type: [StudentGradeDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StudentGradeDto)
    grades: StudentGradeDto[];
}
