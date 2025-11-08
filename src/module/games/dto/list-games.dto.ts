// src/words/dto/list-games.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ListGamesResponseDto {
  @ApiProperty({
    example: ['anagram', 'fill_blank', 'synonym_match'],
    enum: ['anagram', 'fill_blank', 'synonym_match'],
  })
  games: string[];
}