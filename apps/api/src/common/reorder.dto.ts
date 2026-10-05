import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/** Danh sách id theo thứ tự mới (kéo thả) */
export class ReorderDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}
