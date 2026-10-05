import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class AlbumQueryDto extends PageQueryDto {
  /** Năm học, vd 2026–2027 */
  @IsOptional()
  @IsString()
  year?: string;
}

export class CreateAlbumDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  coverUrl?: string | null;

  @IsOptional()
  @IsDateString()
  eventDate?: string | null;

  @IsOptional()
  @IsString()
  schoolYear?: string | null;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;
}

export class UpdateAlbumDto extends PartialType(CreateAlbumDto) {}

export class PhotoInputDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsOptional()
  @IsString()
  caption?: string | null;
}

export class AddPhotosDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PhotoInputDto)
  photos: PhotoInputDto[];
}

export class UpdatePhotoDto {
  @IsOptional()
  @IsString()
  caption?: string | null;
}
