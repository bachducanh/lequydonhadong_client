import { Module } from '@nestjs/common';
import { AdminLegalDocumentsController, LegalDocumentsController } from './legal-documents.controller';
import { LegalDocumentsService } from './legal-documents.service';

@Module({
  controllers: [LegalDocumentsController, AdminLegalDocumentsController],
  providers: [LegalDocumentsService],
  exports: [LegalDocumentsService],
})
export class LegalDocumentsModule {}
