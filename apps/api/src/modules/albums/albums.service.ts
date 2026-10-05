import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { insensitive, pageArgs, paged } from '../../common/pagination';
import { toDate } from '../../common/text';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { AddPhotosDto, AlbumQueryDto, CreateAlbumDto, UpdateAlbumDto, UpdatePhotoDto } from './albums.dto';

const albumCard = {
  id: true,
  title: true,
  description: true,
  coverUrl: true,
  eventDate: true,
  schoolYear: true,
  visible: true,
  createdAt: true,
  _count: { select: { photos: true } },
  photos: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
} satisfies Prisma.AlbumSelect;

type AlbumCardRow = Prisma.AlbumGetPayload<{ select: typeof albumCard }>;

/** Ảnh bìa: ảnh đã chọn, nếu không có thì ảnh đầu tiên của album. */
function toCard({ photos, _count, ...album }: AlbumCardRow) {
  return { ...album, coverUrl: album.coverUrl ?? photos[0]?.url ?? null, photoCount: _count.photos };
}

@Injectable()
export class AlbumsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  private async list(query: AlbumQueryDto, base: Prisma.AlbumWhereInput, defaultLimit: number) {
    const { page, limit, skip, take } = pageArgs(query, defaultLimit);
    const where: Prisma.AlbumWhereInput = { ...base };
    if (query.year) where.schoolYear = query.year;
    if (query.q) where.title = insensitive(query.q);
    const [rows, total, years] = await this.prisma.$transaction([
      this.prisma.album.findMany({ where, skip, take, orderBy: [{ eventDate: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }], select: albumCard }),
      this.prisma.album.count({ where }),
      this.prisma.album.findMany({ distinct: ['schoolYear'], select: { schoolYear: true }, where: { ...base, schoolYear: { not: null } }, orderBy: { schoolYear: 'desc' } }),
    ]);
    return paged(rows.map(toCard), total, page, limit, { years: years.map((y) => y.schoolYear) });
  }

  publicList(query: AlbumQueryDto) {
    return this.cache.wrap(`albums:${JSON.stringify(query)}`, 120, () => this.list(query, { visible: true }, 9));
  }

  adminList(query: AlbumQueryDto) {
    return this.list(query, {}, 24);
  }

  async publicDetail(id: string) {
    const album = await this.cache.wrap(`album:${id}`, 120, () =>
      this.prisma.album.findFirst({ where: { id, visible: true }, include: { photos: { orderBy: { order: 'asc' } } } }),
    );
    if (!album) throw new NotFoundException('Không tìm thấy album');
    return album;
  }

  async adminGet(id: string) {
    const album = await this.prisma.album.findUnique({ where: { id }, include: { photos: { orderBy: { order: 'asc' } } } });
    if (!album) throw new NotFoundException('Không tìm thấy album');
    return album;
  }

  create(dto: CreateAlbumDto) {
    return this.prisma.album.create({ data: { ...dto, eventDate: toDate(dto.eventDate) } });
  }

  update(id: string, dto: UpdateAlbumDto) {
    return this.prisma.album.update({ where: { id }, data: { ...dto, eventDate: toDate(dto.eventDate) } });
  }

  async remove(id: string) {
    await this.prisma.album.delete({ where: { id } });
    return { ok: true };
  }

  async addPhotos(id: string, dto: AddPhotosDto) {
    const last = await this.prisma.albumPhoto.aggregate({ where: { albumId: id }, _max: { order: true } });
    let order = last._max.order ?? 0;
    await this.prisma.albumPhoto.createMany({
      data: dto.photos.map((p) => ({ albumId: id, url: p.url, caption: p.caption ?? null, order: ++order })),
    });
    return this.adminGet(id);
  }

  updatePhoto(albumId: string, photoId: string, dto: UpdatePhotoDto) {
    return this.prisma.albumPhoto.update({ where: { id: photoId, albumId }, data: dto });
  }

  async removePhoto(albumId: string, photoId: string) {
    await this.prisma.albumPhoto.delete({ where: { id: photoId, albumId } });
    return { ok: true };
  }
}
