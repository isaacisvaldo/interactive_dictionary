// src/words/dto/search-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Texto para busca (case-insensitive, contém)',
    example: 'cachorro',
    minLength: 1,
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Resultados por página',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Página (começa em 1)',
    example: 1,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;
}