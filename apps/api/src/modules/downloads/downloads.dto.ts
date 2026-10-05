import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class DownloadQueryDto extends PageQueryDto {
  /** Chuyên mục: Biểu mẫu, Tuyển sinh, Ôn tập… */
  @IsOptional()
  @IsString()
  category?: string;

  /** Đuôi tệp: PDF, DOCX, XLSX… */
  @IsOptional()
  @IsString()
  ext?: string;
}

export class CreateDownloadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

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

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateDownloadDto extends PartialType(CreateDownloadDto) {}
