import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  /** Để trống: tự tạo từ tên */
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  /** null: chuyên mục gốc */
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  showInMenu?: boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
