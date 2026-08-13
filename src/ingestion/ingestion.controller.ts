import { Controller, Post, Query, UseGuards } from '@nestjs/common';
import { InternalServiceGuard } from '../core/guards/internal-service.guard';
import { IngestionService } from 'src/rag/ingestion/ingestion.service';

@Controller('internal/ingestion')
@UseGuards(InternalServiceGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('run')
  async run(@Query('path') path: string) {
    const root = path || './knowledge-base';
    await this.ingestionService.ingestAll(root);
    return { message: 'Ingestion complete.' };
  }
}
