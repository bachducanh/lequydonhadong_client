import { PartialType } from '@nestjs/swagger';
import { ClubStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class RegisterClubDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập họ tên' })
  @MaxLength(80)
  fullName: string;

  /** Lớp, vd 10A2 */
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lớp' })
  @MaxLength(20)
  className: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  hobbies?: string;

  /** Ngôn ngữ giao lưu: Tiếng Anh, Tiếng Pháp… */
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  introduction?: string;
}

export class CreateClubMemberDto extends RegisterClubDto {
  @IsOptional()
  @IsEnum(ClubStatus)
  status?: ClubStatus;
}

export class UpdateClubMemberDto extends PartialType(CreateClubMemberDto) {}

export class ClubQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(ClubStatus)
  status?: ClubStatus;

  /** Khối: 10, 11, 12 */
  @IsOptional()
  @IsString()
  grade?: string;
}
