import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto, ToBoolean } from '../../common/pagination';

export class LegalDocQueryDto extends PageQueryDto {
  /** Loại văn bản: Luật, Nghị định, Thông tư, Quyết định, Công văn… */
  @IsOptional()
  @IsString()
  type?: string;

  /** Cơ quan ban hành */
  @IsOptional()
  @IsString()
  issuer?: string;

  /** Năm ban hành */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  visible?: boolean;
}

export class CreateLegalDocDto {
  /** Số hiệu, vd 29/2024/TT-BGDĐT */
  @IsOptional()
  @IsString()
  @MaxLength(80)
  code?: string | null;

  /** Trích yếu */
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  issuer: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string | null;

  @IsOptional()
  @IsBoolean()
  effective?: boolean;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsString()
  fileUrl?: string | null;

  @IsOptional()
  @IsString()
  fileName?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fileSize?: number | null;
}

export class UpdateLegalDocDto extends PartialType(CreateLegalDocDto) {}
