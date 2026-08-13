import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from '../rag/ingestion/ingestion.service';
import { EmbeddingService } from '../rag/embedding/embedding.service';

@Module({
  controllers: [IngestionController],
  providers: [IngestionService, EmbeddingService],
})
export class IngestionModule {}
