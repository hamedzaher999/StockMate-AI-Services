import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RetrievalService } from 'src/rag/retrieval/retrieval.service';
import { EmbeddingService } from 'src/rag/embedding/embedding.service';
import { GenerationService } from 'src/rag/generation/generation.service';

@Module({
  controllers: [ChatController],
  providers: [
    ChatService,
    RetrievalService,
    GenerationService,
    EmbeddingService,
  ],
})
export class ChatModule {}
