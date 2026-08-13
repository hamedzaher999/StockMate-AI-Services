import { Module } from '@nestjs/common';
import { ChatController } from './dto/chat.controller';
import { ChatService } from './dto/chat.service';
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
