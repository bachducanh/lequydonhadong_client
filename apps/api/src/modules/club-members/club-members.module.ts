import { Body, Controller, Delete, Get, Injectable, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClubStatus, Prisma } from '@prisma/client';
import { Public, RateLimit, Staff } from '../../common/decorators';
import { countsBy, insensitive, pageArgs, paged } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.module';
import { ClubQueryDto, CreateClubMemberDto, RegisterClubDto, UpdateClubMemberDto } from './club-members.dto';

@Injectable()
export class ClubMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterClubDto) {
    await this.prisma.clubMember.create({ data: { ...dto, className: dto.className.toUpperCase() } });
    return { ok: true, message: 'Đăng ký thành công. Ban chủ nhiệm câu lạc bộ sẽ liên hệ với bạn.' };
  }

  async adminList(query: ClubQueryDto) {
    const { page, limit, skip, take } = pageArgs(query);
    const base: Prisma.ClubMemberWhereInput = {};
    if (query.grade) base.className = { startsWith: query.grade };
    if (query.q) base.OR = [{ fullName: insensitive(query.q) }, { className: insensitive(query.q) }];
    const where = { ...base, ...(query.status ? { status: query.status } : {}) };
    const [data, total, groups] = await this.prisma.$transaction([
      this.prisma.clubMember.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.prisma.clubMember.count({ where }),
      this.prisma.clubMember.groupBy({ by: ['status'], where: base, _count: { _all: true }, orderBy: { status: 'asc' } }),
    ]);
    return paged(data, total, page, limit, { counts: countsBy(groups, (g) => g.status) });
  }

  get(id: string) {
    return this.prisma.clubMember.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateClubMemberDto) {
    return this.prisma.clubMember.create({ data: { status: ClubStatus.APPROVED, ...dto } });
  }

  update(id: string, dto: UpdateClubMemberDto) {
    return this.prisma.clubMember.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.clubMember.delete({ where: { id } });
    return { ok: true };
  }
}

@ApiTags('Câu lạc bộ kết bạn')
@Public()
@Controller('club-members')
export class ClubMembersController {
  constructor(private readonly club: ClubMembersService) {}

  /** Học sinh đăng ký tham gia (chờ duyệt) */
  @RateLimit(3, 600)
  @Post()
  register(@Body() dto: RegisterClubDto) {
    return this.club.register(dto);
  }
}

@ApiTags('Quản trị · Câu lạc bộ kết bạn')
@ApiBearerAuth()
@Staff()
@Controller('admin/club-members')
export class AdminClubMembersController {
  constructor(private readonly club: ClubMembersService) {}

  @Get()
  list(@Query() query: ClubQueryDto) {
    return this.club.adminList(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.club.get(id);
  }

  @Post()
  create(@Body() dto: CreateClubMemberDto) {
    return this.club.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClubMemberDto) {
    return this.club.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.club.remove(id);
  }
}

@Module({
  controllers: [ClubMembersController, AdminClubMembersController],
  providers: [ClubMembersService],
})
export class ClubMembersModule {}
