import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==================== ENUMS BONITINHOS ====================
export enum PartOfSpeech {
  NOUN = 'substantivo',
  VERB = 'verbo',
  ADJECTIVE = 'adjetivo',
  ADVERB = 'advérbio',
  PRONOUN = 'pronome',
  PREPOSITION = 'preposição',
  CONJUNCTION = 'conjunção',
  INTERJECTION = 'interjeição',
  PHRASE = 'expressão',
}

export enum LanguageCode {
  PT = 'pt',
  EN = 'en',
  ES = 'es',
  FR = 'fr',
}

// ==================== DTOs ANINHADOS ====================
class ExampleDto {
  @ApiProperty({
    description: 'Frase de exemplo usando a palavra',
    example: 'O cachorro late muito alto.',
    minLength: 5,
    maxLength: 500,
  })
  @IsString({ message: 'A frase de exemplo deve ser uma string' })
  @MinLength(5)
  @MaxLength(500)
  sentence: string;

  @ApiProperty({
    description: 'Tradução da frase (opcional)',
    example: 'The dog barks very loudly.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  translation?: string;
}

class DefinitionDto {
  @ApiProperty({
    description: 'Significado da palavra',
    example: 'Animal mamífero doméstico da família dos canídeos.',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString({ message: 'O significado é obrigatório' })
  @MinLength(3)
  @MaxLength(1000)
  meaning: string;

  @ApiProperty({
    description: 'Classe gramatical',
    enum: PartOfSpeech,
    example: PartOfSpeech.NOUN,
    required: false,
  })
  @IsOptional()
  @IsEnum(PartOfSpeech, { message: 'Classe gramatical inválida. Use: substantivo, verbo, etc.' })
  partOfSpeech?: PartOfSpeech;

  @ApiProperty({
    type: [ExampleDto],
    description: 'Exemplos de uso (máximo 10)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  examples?: ExampleDto[];
}

// ==================== DTO PRINCIPAL ====================
export class CreateWordDto {
  @ApiProperty({
    description: 'Palavra principal (única no idioma)',
    example: 'cachorro',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'A palavra deve ser uma string' })
  @MinLength(1)
  @MaxLength(100)
  term: string;

  @ApiProperty({
    description: 'Idioma da palavra (ISO 639-1)',
    enum: LanguageCode,
    example: LanguageCode.PT,
    default: LanguageCode.PT,
    required: false,
  })
  @IsOptional()
  @IsEnum(LanguageCode, { message: 'Idioma inválido. Use: pt, en, es, fr' })
  language?: LanguageCode;

  @ApiProperty({
    description: 'Transcrição fonética (IPA ou simplificada)',
    example: '/kɐˈʃoʁu/',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  phonetic?: string;

  @ApiProperty({
    type: [DefinitionDto],
    description: 'Definições da palavra (mínimo 1 recomendado)',
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefinitionDto)
  definitions?: DefinitionDto[];

  @ApiProperty({
    type: [String],
    description: 'Sinônimos',
    example: ['cão', 'totó', 'canino'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  synonyms?: string[];

  @ApiProperty({
    type: [String],
    description: 'Antônimos',
    example: ['gato', 'felino'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  antonyms?: string[];
}