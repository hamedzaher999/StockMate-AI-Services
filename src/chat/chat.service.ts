import { Injectable, Logger } from '@nestjs/common';
import {
  ChatMessage,
  GenerationService,
} from 'src/rag/generation/generation.service';
import { RetrievalService } from 'src/rag/retrieval/retrieval.service';
import { IncomingMessageDto } from './dto/incoming-message.dto';
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

    const standaloneQuestion = dto.message;

    let chunks;
    try {
      chunks = await this.retrievalService.search(
        standaloneQuestion,
        {},
        { limit: 5, minSimilarity: 0.3 },
      );
    } catch (err) {
      this.logger.error(
        `[STAGE:retrieval] failed for user=${dto.userId} question="${standaloneQuestion}": ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }

    this.logger.debug(
      `user=${dto.userId} question="${dto.message}" -> ${chunks.length} chunk(s) retrieved`,
    );

    let result;
    try {
      result = await this.generationService.generateAnswer(
        standaloneQuestion,
        chunks,
        history,
      );
    } catch (err) {
      this.logger.error(
        `[STAGE:generation] failed for user=${dto.userId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }

    return { answer: result.answer, hadContext: result.hadContext };
  }
}
