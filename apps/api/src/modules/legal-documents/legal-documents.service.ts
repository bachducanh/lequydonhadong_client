import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { countsBy, insensitive, pageArgs, paged } from '../../common/pagination';
import { toDate } from '../../common/text';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { CreateLegalDocDto, LegalDocQueryDto, UpdateLegalDocDto } from './legal-documents.dto';

@Injectable()
export class LegalDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private where(query: LegalDocQueryDto): Prisma.LegalDocumentWhereInput {
    const where: Prisma.LegalDocumentWhereInput = {};
    if (query.issuer) where.issuer = query.issuer;
    if (query.visible !== undefined) where.visible = query.visible;
    if (query.year) where.issuedAt = { gte: new Date(`${query.year}-01-01`), lt: new Date(`${query.year + 1}-01-01`) };
    if (query.q) where.OR = [{ title: insensitive(query.q) }, { code: insensitive(query.q) }];
    return where;
  }

  private async query(query: LegalDocQueryDto, base: Prisma.LegalDocumentWhereInput) {
    const { page, limit, skip, take } = pageArgs(query);
    const where = { ...base, ...(query.type ? { type: query.type } : {}) };
    const [data, total, groups, issuers] = await this.prisma.$transaction([
      this.prisma.legalDocument.findMany({ where, skip, take, orderBy: [{ issuedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }] }),
      this.prisma.legalDocument.count({ where }),
      this.prisma.legalDocument.groupBy({ by: ['type'], where: base, _count: { _all: true }, orderBy: { type: 'asc' } }),
      this.prisma.legalDocument.findMany({ distinct: ['issuer'], select: { issuer: true }, orderBy: { issuer: 'asc' } }),
    ]);
    return paged(data, total, page, limit, { counts: countsBy(groups, (g) => g.type), issuers: issuers.map((i) => i.issuer) });
  }

  publicList(query: LegalDocQueryDto) {
    return this.cache.wrap(`legal:${JSON.stringify(query)}`, 120, () =>
      this.query(query, { ...this.where(query), visible: true }),
    );
  }

  adminList(query: LegalDocQueryDto) {
    return this.query(query, this.where(query));
  }

  get(id: string) {
    return this.prisma.legalDocument.findUniqueOrThrow({ where: { id } });
  }

  create(dto: CreateLegalDocDto) {
    return this.prisma.legalDocument.create({ data: { ...dto, issuedAt: toDate(dto.issuedAt) } });
  }

  update(id: string, dto: UpdateLegalDocDto) {
    return this.prisma.legalDocument.update({ where: { id }, data: { ...dto, issuedAt: toDate(dto.issuedAt) } });
  }

  async remove(id: string) {
    await this.prisma.legalDocument.delete({ where: { id } });
    return { ok: true };
  }
}
