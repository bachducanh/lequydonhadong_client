import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTickerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  text: string;

  /** Đường dẫn khi bấm (vd /tin-tuc/lich-thi) */
  @IsOptional()
  @IsString()
  link?: string | null;

  @IsOptional()
  @IsDateString()
  startAt?: string | null;

  @IsOptional()
  @IsDateString()
  endAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  order?: number;
}

export class UpdateTickerDto extends PartialType(CreateTickerDto) {}
