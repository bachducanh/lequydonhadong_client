import { PartialType } from '@nestjs/swagger';
import { LinkPosition } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class LinkQueryDto {
  @IsOptional()
  @IsEnum(LinkPosition)
  position?: LinkPosition;

  @IsOptional()
  @IsString()
  q?: string;
}

export class CreateLinkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsOptional() @IsString() url?: string | null;
  /** Dòng phụ, vd "moet.gov.vn" */
  @IsOptional() @IsString() sub?: string | null;
  /** Tên icon (globe, scale, search, book…) */
  @IsOptional() @IsString() icon?: string | null;
  @IsOptional() @IsEnum(LinkPosition) position?: LinkPosition;
  @IsOptional() @IsBoolean() openNewTab?: boolean;
  @IsOptional() @IsBoolean() visible?: boolean;
  @IsOptional() @Type(() => Number) @IsInt() order?: number;
}

export class UpdateLinkDto extends PartialType(CreateLinkDto) {}
