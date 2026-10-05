import { PartialType } from '@nestjs/swagger';
import { PostStatus, Tone } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto, ToBoolean } from '../../common/pagination';

export class PostQueryDto extends PageQueryDto {
  /** Slug chuyên mục (bao gồm chuyên mục con) */
  @IsOptional()
  @IsString()
  category?: string;

  /** Slug chuyên mục cần loại trừ (bao gồm chuyên mục con) */
  @IsOptional()
  @IsString()
  exclude?: string;

  @IsOptional()
  @IsIn(['latest', 'popular'])
  sort?: 'latest' | 'popular';

  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  featured?: boolean;
}

export class AdminPostQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  authorId?: string;
}

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  excerpt?: string | null;

  /** HTML từ trình soạn thảo (được làm sạch khi lưu) */
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  thumbnail?: string | null;

  @IsOptional()
  @IsString()
  imageCaption?: string | null;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  authorName?: string | null;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @IsOptional()
  @IsDateString()
  publishedAt?: string | null;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  badge?: string | null;

  @IsOptional()
  @IsEnum(Tone)
  badgeTone?: Tone | null;

  /** Tạo dòng chữ chạy trỏ tới bài viết (14 ngày) */
  @IsOptional()
  @IsBoolean()
  pushToTicker?: boolean;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}
