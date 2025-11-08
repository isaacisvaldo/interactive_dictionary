// src/words/dto/create-media.dto.ts  (igual, só pra referência)
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUrl, IsString, IsOptional, MaxLength } from 'class-validator';

export enum MediaType {
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  GIF = 'gif',
}

export class CreateMediaDto {
  @ApiProperty({ enum: MediaType, example: MediaType.IMAGE })
  @IsEnum(MediaType, { message: 'Tipo inválido. Use: image, audio, video ou gif' })
  type: MediaType;

  @ApiProperty({ example: 'https://example.com/cat.jpg' })
  @IsUrl({}, { message: 'URL inválida' })
  url: string;

  @ApiProperty({ example: 'Gato fofo', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string;
}