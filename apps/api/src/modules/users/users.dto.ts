import { OmitType, PartialType } from '@nestjs/swagger';
import { Role, UserStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { PageQueryDto } from '../../common/pagination';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'Tên đăng nhập chỉ gồm chữ không dấu, số, dấu chấm, gạch' })
  username: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  password: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  password?: string;
}

export class UserQueryDto extends PageQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  department?: string;
}
