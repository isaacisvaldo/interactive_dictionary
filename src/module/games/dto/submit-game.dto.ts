// src/words/dto/submit-game.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitGameDto {
  @ApiProperty({
    description: 'Resposta do jogador',
    example: 'anagram',
  })
  @IsString({ message: 'A resposta deve ser uma string' })
  @IsNotEmpty({ message: 'A resposta é obrigatória' })
  answer: string;
}

export class SubmitGameResponseDto {
  @ApiProperty({ example: true })
  correct: boolean;

  @ApiProperty({ example: 'gameType not supported', nullable: true })
  error?: string;
}