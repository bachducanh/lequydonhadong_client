import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class CreateLibraryTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  /** Ví dụ: "JPG, PNG, WEBP" */
  @IsOptional()
  @IsString()
  allowedFormats?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateLibraryTypeDto extends PartialType(CreateLibraryTypeDto) {}

export class LibraryItemQueryDto extends PageQueryDto {
  /** Slug kiểu thư viện (công khai) */
  @IsOptional()
  @IsString()
  type?: string;

  /** Id kiểu thư viện (quản trị) */
  @IsOptional()
  @IsString()
  typeId?: string;
}

export class CreateLibraryItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsString()
  @IsNotEmpty()
  typeId: string;

  @IsOptional()
  @IsString()
  fileUrl?: string | null;

  @IsOptional()
  @IsString()
  fileName?: string | null;

  @IsOptional()
  @IsString()
  mimeType?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  fileSize?: number | null;

  /** Link YouTube/Drive khi không tải tệp lên */
  @IsOptional()
  @IsString()
  externalUrl?: string | null;

  @IsOptional()
  @IsString()
  thumbnail?: string | null;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateLibraryItemDto extends PartialType(CreateLibraryItemDto) {}
