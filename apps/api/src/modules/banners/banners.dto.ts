import { PartialType } from '@nestjs/swagger';
import { BannerPosition } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class BannerQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(BannerPosition)
  position?: BannerPosition;
}

export class CreateBannerDto {
  /** Tên quản lý nội bộ */
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string | null;
  @IsOptional() @IsString() @MaxLength(120) title?: string | null;
  @IsOptional() @IsString() @MaxLength(300) description?: string | null;
  @IsOptional() @IsString() ctaLabel?: string | null;
  @IsOptional() @IsString() link?: string | null;
  @IsOptional() @IsString() image?: string | null;
  /** Kích thước khuyến nghị, vd 1200×320 */
  @IsOptional() @IsString() size?: string | null;
  @IsOptional() @IsEnum(BannerPosition) position?: BannerPosition;
  @IsOptional() @IsDateString() startAt?: string | null;
  @IsOptional() @IsDateString() endAt?: string | null;
  @IsOptional() @IsBoolean() visible?: boolean;
}

export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
