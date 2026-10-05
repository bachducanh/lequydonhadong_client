import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';
import { countsBy, insensitive, pageArgs, paged } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.module';
import { publicUserSelect } from '../auth/auth.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: UserQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const base: Prisma.UserWhereInput = {};
    if (query.q) base.OR = [{ fullName: insensitive(query.q) }, { email: insensitive(query.q) }, { username: insensitive(query.q) }];
    if (query.department) base.department = query.department;
    const where = { ...base, ...(query.role ? { role: query.role } : {}) };
    const [data, total, groups, departments] = await this.prisma.$transaction([
      this.prisma.user.findMany({ where, skip, take, orderBy: [{ role: 'asc' }, { fullName: 'asc' }], select: publicUserSelect }),
      this.prisma.user.count({ where }),
      this.prisma.user.groupBy({ by: ['role'], where: base, _count: { _all: true }, orderBy: { role: 'asc' } }),
      this.prisma.user.findMany({ distinct: ['department'], select: { department: true }, where: { department: { not: null } } }),
    ]);
    return paged(data, total, page, limit, {
      counts: countsBy(groups, (g) => g.role),
      departments: departments.map((d) => d.department).filter(Boolean),
    });
  }

  get(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id }, select: publicUserSelect });
  }

  async create(dto: CreateUserDto) {
    const { password, ...data } = dto;
    try {
      return await this.prisma.user.create({
        data: {
          ...data,
          username: data.username.toLowerCase(),
          email: data.email.toLowerCase(),
          passwordHash: await hash(password, 10),
        },
        select: publicUserSelect,
      });
    } catch (e) {
      throw this.conflict(e);
    }
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const { password, ...data } = dto;
    if (id === actorId && (data.status === 'LOCKED' || (data.role && data.role !== 'ADMIN'))) {
      throw new BadRequestException('Không thể tự khoá hoặc hạ quyền tài khoản đang đăng nhập');
    }
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...data,
          username: data.username?.toLowerCase(),
          email: data.email?.toLowerCase(),
          ...(password ? { passwordHash: await hash(password, 10) } : {}),
        },
        select: publicUserSelect,
      });
    } catch (e) {
      throw this.conflict(e);
    }
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) throw new BadRequestException('Không thể xoá tài khoản đang đăng nhập');
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  private conflict(e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new ConflictException('Tên đăng nhập hoặc email đã tồn tại');
    }
    return e;
  }
}
