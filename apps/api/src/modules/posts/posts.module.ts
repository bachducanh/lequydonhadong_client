import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { AdminPostsController, PostsController } from './posts.controller';
import { PostsService } from './posts.service';

@Module({
  imports: [CategoriesModule],
  controllers: [PostsController, AdminPostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
