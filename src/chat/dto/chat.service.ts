import { Injectable, Logger } from '@nestjs/common';
import {
  ChatMessage,
  GenerationService,
} from 'src/rag/generation/generation.service';
import { RetrievalService } from 'src/rag/retrieval/retrieval.service';
import { IncomingMessageDto } from './incoming-message.dto';

export interface ChatReply {
  answer: string;
  hadContext: boolean;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly retrievalService: RetrievalService,
    private readonly generationService: GenerationService,
  ) {}

  async handleMessage(dto: IncomingMessageDto): Promise<ChatReply> {
    const history: ChatMessage[] = dto.history;

    const standaloneQuestion =
      await this.generationService.rewriteQueryWithHistory(
        dto.message,
        history,
      );

    const chunks = await this.retrievalService.search(
      standaloneQuestion,
      {},
      { limit: 5, minSimilarity: 0.3 },
    );

    this.logger.debug(
      `user=${dto.userId} question="${dto.message}" -> ${chunks.length} chunk(s) retrieved`,
    );

    const result = await this.generationService.generateAnswer(
      standaloneQuestion,
      chunks,
      history,
    );

    return { answer: result.answer, hadContext: result.hadContext };
  }
}
