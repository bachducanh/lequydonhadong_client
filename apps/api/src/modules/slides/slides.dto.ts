import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSlideDto {
  @IsOptional() @IsString() @MaxLength(60) eyebrow?: string | null;
  @IsString() @IsNotEmpty() @MaxLength(120) title: string;
  @IsOptional() @IsString() @MaxLength(300) lead?: string | null;
  @IsOptional() @IsString() ctaLabel?: string | null;
  @IsOptional() @IsString() ctaHref?: string | null;
  @IsOptional() @IsString() secondaryLabel?: string | null;
  @IsOptional() @IsString() secondaryHref?: string | null;
  @IsOptional() @IsString() image?: string | null;
  @IsOptional() @IsString() imageAlt?: string | null;
  @IsOptional() @IsString() caption?: string | null;
  @IsOptional() @Type(() => Number) @IsInt() order?: number;
  @IsOptional() @IsBoolean() visible?: boolean;
}

export class UpdateSlideDto extends PartialType(CreateSlideDto) {}
