import { Module } from '@nestjs/common';
import { AdminCommentsController, CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  controllers: [CommentsController, AdminCommentsController],
  providers: [CommentsService],
})
export class CommentsModule {}
