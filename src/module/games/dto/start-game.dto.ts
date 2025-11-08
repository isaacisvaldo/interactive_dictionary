// src/words/dto/start-game.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class StartGameResponseDto {
  @ApiProperty({ example: 'anagram' })
  type: string;

  @ApiProperty({ example: ['a', 'n', 'g', 'r', 'a', 'm'], description: 'Letras embaralhadas' })
  tiles?: string[];

  @ApiProperty({ example: 'Um ____ é um rearranjo de letras.', description: 'Frase com lacuna' })
  prompt?: string;

  @ApiProperty({ example: 7, description: 'Tamanho da resposta' })
  answerLength?: number;

  @ApiProperty({ example: ['sinônimo1', 'sinônimo2', 'sinônimo3'] })
  choices?: string[];

  @ApiProperty({ example: 'word not found', nullable: true })
  error?: string;
}