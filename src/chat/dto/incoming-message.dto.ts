import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

enum ChatRole {
  user = 'user',
  assistant = 'assistant',
}

class HistoryMessageDto {
  @IsEnum(ChatRole)
  role!: ChatRole;

  @IsString()
  @MaxLength(4000)
  content!: string;
}

export class IncomingMessageDto {
  @IsString()
  @MaxLength(2000)
  message!: string;

  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => HistoryMessageDto)
  history!: HistoryMessageDto[];

  @IsUUID()
  userId!: string;
}
