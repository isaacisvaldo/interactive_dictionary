// src/words/dto/media-response.dto.ts  (CORRIGIDO!)
import { ApiProperty } from '@nestjs/swagger';
import { MediaType } from './create-media.dto';

export class MediaResponseDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ enum: MediaType, example: MediaType.IMAGE })
  type: MediaType;  // Agora aceita string do Prisma via casting abaixo

  @ApiProperty({ example: 'https://example.com/cat.jpg' })
  url: string;

  @ApiProperty({ example: 'Gato fofo', nullable: true })
  caption: string | null;

  @ApiProperty({ example: 42 })
  wordId: number;

  @ApiProperty({ example: '2025-11-08T12:00:00.000Z' })
  createdAt: Date;
}