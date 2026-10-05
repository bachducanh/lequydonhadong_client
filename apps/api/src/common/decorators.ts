import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';
import type { Request } from 'express';

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
}

export type AuthedRequest = Request & { user?: AuthUser };

export const IS_PUBLIC = 'isPublic';
/** Route không cần đăng nhập (nếu có token hợp lệ vẫn gắn req.user). */
export const Public = () => SetMetadata(IS_PUBLIC, true);

export const ROLES = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES, roles);

/** Quản trị + biên tập: mặc định cho mọi màn hình nội dung. */
export const Staff = () => Roles(Role.ADMIN, Role.EDITOR);

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<AuthedRequest>().user as AuthUser,
);

export const ClientIp = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<Request>().ip ?? 'unknown',
);

export const RATE_LIMIT = 'rateLimit';
export interface RateLimitOptions {
  limit: number;
  windowSec: number;
}
/** Giới hạn số lần gọi theo IP trong một cửa sổ thời gian (đếm bằng Redis). */
export const RateLimit = (limit: number, windowSec: number) =>
  SetMetadata(RATE_LIMIT, { limit, windowSec } satisfies RateLimitOptions);
