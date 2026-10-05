import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { CacheService } from '../redis/cache.service';
import { AuthedRequest, IS_PUBLIC, RATE_LIMIT, RateLimitOptions, ROLES } from './decorators';

interface AccessPayload {
  sub: string;
  role: Role;
  name: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [ctx.getHandler(), ctx.getClass()]);
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (token) {
      try {
        const payload = await this.jwt.verifyAsync<AccessPayload>(token, {
          secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
        req.user = { id: payload.sub, role: payload.role, name: payload.name };
      } catch {
        if (!isPublic) throw new UnauthorizedException('Phiên đăng nhập đã hết hạn');
      }
    }

    if (isPublic) return true;
    if (!req.user) throw new UnauthorizedException('Vui lòng đăng nhập');
    return true;
  }
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES, [ctx.getHandler(), ctx.getClass()]);
    if (!roles?.length) return true;
    const user = ctx.switchToHttp().getRequest<AuthedRequest>().user;
    if (user && roles.includes(user.role)) return true;
    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cache: CacheService,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const opts = this.reflector.get<RateLimitOptions | undefined>(RATE_LIMIT, ctx.getHandler());
    if (!opts) return true;
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const key = `rl:${ctx.getClass().name}.${ctx.getHandler().name}:${req.ip}`;
    const count = await this.cache.hit(key, opts.windowSec);
    if (count > opts.limit) {
      throw new HttpException('Bạn gửi quá nhiều yêu cầu, vui lòng thử lại sau ít phút.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
