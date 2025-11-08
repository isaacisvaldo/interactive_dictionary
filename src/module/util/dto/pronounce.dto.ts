// src/util/dto/pronounce.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsIn, IsOptional } from 'class-validator';

export const VOICES = [
  'pt-pt-x-miguel',   // Português Europeu (masculino)
  'pt-br-x-ana',      // Português Brasileiro (feminino neural) - PADRÃO
  'pt-br-x-ricardo',  // Português Brasileiro (masculino)
  'en-us-x-john',     // Inglês EUA (masculino)
  'en-gb-x-sarah',    // Inglês UK (feminino)
] as const;

export type VoiceType = (typeof VOICES)[number];

/**
 * DTO para rota por ID: /pronounce/id/42?voice=pt-br-x-ana
 */
export class PronounceParamsDto {
  @ApiProperty({
    description: 'ID da palavra no banco',
    example: 123,
  })
  @IsInt({ message: 'ID deve ser um número inteiro' })
  id: number;
}

/**
 * DTO para query string: ?voice=pt-br-x-ana
 */
export class PronounceQueryDto {
  @ApiProperty({
    description: '🔊 Voz neural de alta qualidade (TTS)',
    enum: VOICES,
    default: 'pt-br-x-ana',
    example: 'pt-br-x-ana',
  })
  @IsOptional() // permite omitir → usa default
  @IsIn(VOICES, {
    message: `Voz inválida! Use exatamente uma destas (com hífens e minúsculas):\n${VOICES.map(v => `  - ${v}`).join('\n')}`,
  })
  voice?: VoiceType = 'pt-br-x-ana'; // DEFAULT AQUI (nunca mais undefined)
}

/**
 * Resposta da API (Swagger mostra bonitinho)
 */
export class PronounceResponseDto {
  @ApiProperty({
    description: 'URL direta do áudio MP3 (clique para ouvir ou use em <audio src="...">)',
    example: 'https://tts.example.com/audio/cachorro-pt-br-x-ana-123.mp3',
    format: 'uri',
  })
  url: string;

  @ApiProperty({
    description: 'Duração aproximada em segundos',
    example: 3.45,
    type: 'number',
    nullable: true,
  })
  duration?: number;

  @ApiProperty({
    description: 'Voz usada',
    enum: VOICES,
    example: 'pt-br-x-ana',
  })
  voice: VoiceType;

  @ApiProperty({
    description: 'Texto falado',
    example: 'cachorro',
  })
  text: string;
}