import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ExampleDto {
  @IsString()
  sentence: string;

  @IsOptional()
  @IsString()
  translation?: string;
}

class DefinitionDto {
  @IsString()
  meaning: string;

  @IsOptional()
  @IsString()
  partOfSpeech?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExampleDto)
  examples?: ExampleDto[];
}

export class CreateWordDto {
  @IsString()
  term: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  phonetic?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DefinitionDto)
  definitions?: DefinitionDto[];

  @IsOptional()
  @IsArray()
  synonyms?: string[];

  @IsOptional()
  @IsArray()
  antonyms?: string[];
}
