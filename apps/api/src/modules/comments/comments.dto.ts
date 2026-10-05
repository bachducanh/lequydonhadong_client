import { CommentStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung' })
  @MaxLength(2000)
  content: string;
}

export class CommentQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(CommentStatus)
  status?: CommentStatus;

  @IsOptional()
  @IsString()
  postId?: string;
}

export class UpdateCommentDto {
  @IsEnum(CommentStatus)
  status: CommentStatus;
}
