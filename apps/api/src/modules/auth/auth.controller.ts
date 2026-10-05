import { Body, Controller, Get, HttpCode, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthUser, CurrentUser, Public, RateLimit } from '../../common/decorators';
import { ChangePasswordDto, LoginDto, RefreshDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Xác thực')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Đăng nhập bằng tên đăng nhập/email + mật khẩu, trả về cặp access/refresh token. */
  @Public()
  @RateLimit(10, 60)
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Đổi refresh token lấy cặp token mới (refresh token cũ bị thu hồi). */
  @Public()
  @RateLimit(30, 60)
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshDto) {
    await this.auth.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @ApiBearerAuth()
  @Patch('me/password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto);
  }
}
