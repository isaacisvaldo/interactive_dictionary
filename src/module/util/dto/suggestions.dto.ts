// src/util/dto/suggestions.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class SuggestionsQueryDto {
  @ApiProperty({
    description: 'Texto para busca (case-insensitive, inicia com)',
    example: 'cachorr',
    minLength: 1,
  })
  @IsString({ message: 'q deve ser uma string' })
  q: string;

  @ApiProperty({
    description: 'Quantidade máxima de resultados',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt({ message: 'limit deve ser um número inteiro' })
  @Min(1)
  @Max(50)
  limit?: number;
}

export class SuggestionResponseDto {
  @ApiProperty({ example: 'cachorro' })
  term: string;

  @ApiProperty({ example: 42 })
  id: number;
}