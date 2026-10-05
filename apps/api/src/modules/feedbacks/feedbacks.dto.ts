import { FeedbackStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class CreateFeedbackDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @MaxLength(80)
  name: string;

  /** Phụ huynh, Học sinh, Cựu học sinh, Khác */
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsOptional()
  @Matches(/^[0-9 +().-]{8,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tiêu đề' })
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập nội dung' })
  @MaxLength(5000)
  content: string;
}

export class FeedbackQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @IsOptional()
  @IsString()
  role?: string;
}

export class UpdateFeedbackDto {
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  /** Ghi chú xử lý nội bộ */
  @IsOptional()
  @IsString()
  note?: string | null;
}
