import { Controller, Get, Injectable, Module, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BannerPosition, LinkPosition, QuestionStatus } from '@prisma/client';
import { Public } from '../../common/decorators';
import { insensitive } from '../../common/pagination';
import { PrismaService } from '../../prisma/prisma.module';
import { CacheService } from '../../redis/cache.service';
import { AlbumsModule } from '../albums/albums.module';
import { AlbumsService } from '../albums/albums.service';
import { BannersModule, BannersService } from '../banners/banners.module';
import { CategoriesModule } from '../categories/categories.module';
import { CategoriesService } from '../categories/categories.service';
import { LinksModule, LinksService } from '../links/links.module';
import { PostsModule } from '../posts/posts.module';
import { postCardSelect, publishedWhere } from '../posts/posts.service';
import { SlidesModule, SlidesService } from '../slides/slides.module';
import { TickersModule } from '../tickers/tickers.module';
import { TickersService } from '../tickers/tickers.service';

/** Chuyên mục giới thiệu không xuất hiện trong luồng tin của trang chủ. */
const INTRO_CATEGORY = 'gioi-thieu';
const ANNOUNCEMENT_CATEGORY = 'thong-bao';

@Injectable()
export class HomeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly categories: CategoriesService,
    private readonly tickers: TickersService,
    private readonly slides: SlidesService,
    private readonly albums: AlbumsService,
    private readonly banners: BannersService,
    private readonly links: LinksService,
  ) {}

  home() {
    return this.cache.wrap('home', 60, async () => {
      const introIds = await this.categories.descendantIds(INTRO_CATEGORY);
      const annIds = await this.categories.descendantIds(ANNOUNCEMENT_CATEGORY);
      const newsWhere = { ...publishedWhere(), OR: [{ categoryId: null }, { categoryId: { notIn: introIds } }] };

      const featured = await this.prisma.post.findFirst({
        where: { ...newsWhere, featured: true },
        orderBy: { publishedAt: 'desc' },
        select: postCardSelect,
      });
      const [news, announcements, documents, tickers, slides, albums, banners, links] = await Promise.all([
        this.prisma.post.findMany({
          where: { ...newsWhere, ...(featured ? { id: { not: featured.id } } : {}) },
          orderBy: { publishedAt: 'desc' },
          take: 6,
          select: postCardSelect,
        }),
        this.prisma.post.findMany({
          where: { ...publishedWhere(), categoryId: { in: annIds } },
          orderBy: { publishedAt: 'desc' },
          take: 4,
          select: postCardSelect,
        }),
        this.prisma.legalDocument.findMany({
          where: { visible: true },
          orderBy: [{ issuedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
          take: 3,
        }),
        this.tickers.publicList(),
        this.slides.publicList(),
        this.albums.publicList({ limit: 3 }),
        this.banners.active(BannerPosition.HOME),
        this.links.publicList(LinkPosition.HOME),
      ]);
      return { tickers, slides, featured, news, announcements, documents, albums: albums.data, banner: banners[0] ?? null, links };
    });
  }

  search(q: string) {
    const term = q.trim();
    if (term.length < 2) return { query: term, posts: [], documents: [], downloads: [], questions: [] };
    return this.cache.wrap(`search:${term.toLowerCase()}`, 60, async () => {
      const [posts, documents, downloads, questions] = await Promise.all([
        this.prisma.post.findMany({
          where: { ...publishedWhere(), OR: [{ title: insensitive(term) }, { excerpt: insensitive(term) }, { content: insensitive(term) }] },
          orderBy: { publishedAt: 'desc' },
          take: 12,
          select: postCardSelect,
        }),
        this.prisma.legalDocument.findMany({
          where: { visible: true, OR: [{ title: insensitive(term) }, { code: insensitive(term) }] },
          take: 10,
          orderBy: { issuedAt: 'desc' },
        }),
        this.prisma.downloadFile.findMany({ where: { visible: true, name: insensitive(term) }, take: 10, orderBy: { createdAt: 'desc' } }),
        this.prisma.question.findMany({
          where: { status: QuestionStatus.ANSWERED, OR: [{ question: insensitive(term) }, { answer: insensitive(term) }] },
          take: 5,
          orderBy: { answeredAt: 'desc' },
          select: { id: true, question: true, askerName: true, answer: true, answeredBy: true, createdAt: true, topic: true, answeredAt: true },
        }),
      ]);
      return { query: term, posts, documents, downloads, questions };
    });
  }
}

@ApiTags('Trang chủ & tìm kiếm')
@Public()
@Controller()
export class HomeController {
  constructor(private readonly home: HomeService) {}

  /** Toàn bộ dữ liệu trang chủ trong một lần gọi (chữ chạy, slider, tin, thông báo, văn bản, banner, album, liên kết) */
  @Get('home')
  index() {
    return this.home.home();
  }

  /** Tìm kiếm chung: tin bài, văn bản, tài liệu, hỏi đáp */
  @Get('search')
  search(@Query('q') q = '') {
    return this.home.search(q);
  }
}

@Module({
  imports: [CategoriesModule, PostsModule, TickersModule, SlidesModule, AlbumsModule, BannersModule, LinksModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
