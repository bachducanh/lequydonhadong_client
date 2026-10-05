import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '@prisma/client';
import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { ChangePasswordDto, LoginDto } from './auth.dto';

export const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  fullName: true,
  role: true,
  department: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

interface RefreshPayload {
  sub: string;
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {}

  private get accessTtl() {
    return Number(this.config.get('JWT_ACCESS_TTL', 900));
  }

  private get refreshTtl() {
    return Number(this.config.get('JWT_REFRESH_TTL', 60 * 60 * 24 * 30));
  }

  async login(dto: LoginDto) {
    const login = dto.username.trim().toLowerCase();
    const user = await this.prisma.user.findFirst({ where: { OR: [{ username: login }, { email: login }] } });
    if (!user || !(await compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }
    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('Tài khoản đã bị khoá');
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefresh(refreshToken);
    const stored = await this.cache.get(`rt:${payload.jti}`).catch(() => {
      throw new ServiceUnavailableException('Máy chủ phiên đăng nhập đang bận');
    });
    if (stored !== payload.sub) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    await this.cache.del(`rt:${payload.jti}`);
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('Tài khoản không còn hiệu lực');
    return this.issueTokens(user);
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        ignoreExpiration: true,
      });
      await this.cache.del(`rt:${payload.jti}`);
    } catch {
      // token hỏng: không có gì để thu hồi
    }
  }

  me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: publicUserSelect });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await compare(dto.currentPassword, user.passwordHash))) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await hash(dto.newPassword, 10) } });
    return { ok: true };
  }

  private async verifyRefresh(token: string) {
    try {
      return await this.jwt.verifyAsync<RefreshPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
    }
  }

  private async issueTokens(user: User) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, name: user.fullName },
      { secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'), expiresIn: this.accessTtl },
    );
    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti },
      { secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'), expiresIn: this.refreshTtl },
    );
    try {
      await this.cache.set(`rt:${jti}`, user.id, this.refreshTtl);
    } catch {
      throw new ServiceUnavailableException('Không lưu được phiên đăng nhập (Redis chưa sẵn sàng)');
    }
    const { passwordHash: _omit, ...profile } = user;
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTtl,
      refreshExpiresIn: this.refreshTtl,
      user: profile,
    };
  }
}
