import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { CacheBustInterceptor } from './common/cache-bust.interceptor';
import { JwtAuthGuard, RateLimitGuard, RolesGuard } from './common/guards';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AlbumsModule } from './modules/albums/albums.module';
import { AuthModule } from './modules/auth/auth.module';
import { BannersModule } from './modules/banners/banners.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ClubMembersModule } from './modules/club-members/club-members.module';
import { CommentsModule } from './modules/comments/comments.module';
import { DownloadsModule } from './modules/downloads/downloads.module';
import { FeedbacksModule } from './modules/feedbacks/feedbacks.module';
import { HealthModule } from './modules/health/health.module';
import { HomeModule } from './modules/home/home.module';
import { LegalDocumentsModule } from './modules/legal-documents/legal-documents.module';
import { LibraryModule } from './modules/library/library.module';
import { LinksModule } from './modules/links/links.module';
import { PostsModule } from './modules/posts/posts.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { SlidesModule } from './modules/slides/slides.module';
import { StatsModule } from './modules/stats/stats.module';
import { TickersModule } from './modules/tickers/tickers.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({ global: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    PostsModule,
    CommentsModule,
    LegalDocumentsModule,
    TickersModule,
    SlidesModule,
    AlbumsModule,
    LibraryModule,
    DownloadsModule,
    QuestionsModule,
    FeedbacksModule,
    ClubMembersModule,
    BannersModule,
    LinksModule,
    UploadsModule,
    HomeModule,
    StatsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: RateLimitGuard },
    { provide: APP_INTERCEPTOR, useClass: CacheBustInterceptor },
  ],
})
export class AppModule {}
