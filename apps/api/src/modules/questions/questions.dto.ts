import { QuestionStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class QuestionQueryDto extends PageQueryDto {
  /** Chủ đề: Học tập, Thủ tục, Tuyển sinh, Khác */
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;
}

export class AskQuestionDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @MaxLength(80)
  askerName: string;

  /** Phụ huynh, Học sinh, Cựu học sinh, Khác */
  @IsOptional()
  @IsString()
  askerRole?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  askerEmail?: string;

  @IsString()
  @IsNotEmpty()
  topic: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập câu hỏi' })
  @MaxLength(2000)
  question: string;
}

export class AnswerQuestionDto {
  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsString()
  answer?: string | null;

  @IsOptional()
  @IsString()
  answeredBy?: string | null;

  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;
}
