// src/util/util.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { SuggestionResponseDto, SuggestionsQueryDto } from './dto/suggestions.dto';
import { PronounceQueryDto, PronounceResponseDto, VOICES } from './dto/pronounce.dto';

@ApiTags('UTIL')
@Controller('util')
export class UtilController {
  private readonly logger = new Logger(UtilController.name);

  constructor(private readonly prisma: PrismaService) {}

  // ==================== SUGGESTIONS ====================
  @Get('suggestions')
  @Public()
  @ApiOperation({
    summary: '🔍 Autocomplete de palavras (prefixo)',
    description: 'Usado no input de busca. Máximo 50 resultados. Case-insensitive.',
  })
  @ApiOkResponse({
    description: 'Array de sugestões (term + id)',
    type: [SuggestionResponseDto],
  })
  async suggestions(@Query() query: SuggestionsQueryDto): Promise<SuggestionResponseDto[]> {
    if (!query.q?.trim()) {
      return [];
    }

    const limit = Math.min(query.limit || 10, 50);
    const results = await this.prisma.word.findMany({
      where: {
        term: {
          startsWith: query.q.trim(),
          mode: 'insensitive',
        },
      },
      take: limit,
      orderBy: { term: 'asc' },
      select: { term: true, id: true },
    });

    return results.map((r) => ({ term: r.term, id: r.id }));
  }

  // ==================== PRONOUNCE ====================
  @Get('pronounce/:id')
  @Public()
  @ApiOperation({
    summary: '🔊 Pronúncia neural (TTS) de uma palavra',
    description: `Vozes disponíveis: ${VOICES.join(', ')}\n\n` +
      '1. Usa áudio salvo (se existir)\n' +
      '2. Gera com Google Cloud TTS (grátis até 1M chars/mês)\n' +
      '3. Fallback ElevenLabs (se Google falhar)\n' +
      '4. Salva no banco + Cloudinary (cache eterno)',
  })
  @ApiParam({ name: 'id', description: 'ID da palavra', example: 123 })
  @ApiOkResponse({
    description: 'URL do áudio MP3 (clique + autoplay no Swagger!)',
    type: PronounceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Palavra não encontrada' })
  @ApiResponse({ status: 400, description: 'Voz inválida' })
async pronounce(
  @Param('id', ParseIntPipe) id: number,
  @Query() query: PronounceQueryDto,
): Promise<PronounceResponseDto> {
  const voice = query.voice ?? 'pt-br-x-ana';

  const word = await this.prisma.word.findUnique({
    where: { id },
    select: { term: true, audioUrl: true },
  });

  if (!word) {
    throw new NotFoundException('Palavra não encontrada');
  }

  // 1. Áudio já salvo → usa ele
  if (word.audioUrl) {
    return {
      url: word.audioUrl,
      voice,
      text: word.term,
      duration: undefined,
    };
  }

  // 2. Gera TTS (AQUI DECLARAMOS ttsUrl)
  let ttsUrl: any;

  try {
    ttsUrl = await this.generateGoogleTts(word.term, voice);
    if (!ttsUrl) throw new Error('Google falhou');
  } catch {
    this.logger.warn('Google TTS falhou → ElevenLabs fallback');
    //ttsUrl = await this.generateElevenLabsTts(word.term, voice);
  }

  if (!ttsUrl) {
    throw new BadRequestException('Erro ao gerar áudio TTS');
  }

  // 3. Salva no banco
  await this.prisma.word.update({
    where: { id },
    data: { audioUrl: ttsUrl },
  });

  // 4. Retorna completo (agora ttsUrl existe!)
  return {
    url: ttsUrl,
    voice,
    text: word.term,
    duration: undefined, // ou calcula com ffmpeg se quiseres
  };
}

  // ==================== TTS PROVIDERS ====================
  private async generateGoogleTts(term: string, voice: string): Promise<string | null> {
    try {
      const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=TUA_CHAVE_AQUI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text: term },
          voice: { languageCode: this.mapVoiceToGoogle(voice), name: this.mapVoiceToGoogleName(voice) },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      const audioBase64 = data.audioContent;
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

      // OPCIONAL: upload pra Cloudinary e retorna URL pública
      // const uploaded = await this.uploadToCloudinary(audioBase64);
      // return uploaded.secure_url;

      return audioUrl; // funciona direto no <audio>
    } catch (err) {
      this.logger.error(`Google TTS error: ${err.message}`);
      return null;
    }
  }
/*
  private async generateElevenLabsTts(term: string, voice: string): Promise<string | null> {
    try {
      const voiceId = this.mapVoiceToElevenLabs(voice);
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: term,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.75, similarity_boost: 0.85 },
        }),
      });

      if (!res.ok) return null;

      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:audio/mp3;base64,${base64}`;
    } catch (err) {
      this.logger.error(`ElevenLabs error: ${err.message}`);
      return null;
    }
  }
*/
  // ==================== MAPPERS ====================
  private mapVoiceToGoogle(voice: string): string {
    const map: Record<string, string> = {
      'pt-pt-x-miguel': 'pt-PT',
      'pt-br-x-ana': 'pt-BR',
      'pt-br-x-ricardo': 'pt-BR',
      'en-us-x-john': 'en-US',
      'en-gb-x-sarah': 'en-GB',
    };
    return map[voice] || 'pt-BR';
  }

  private mapVoiceToGoogleName(voice: string): string {
    const map: Record<string, string> = {
      'pt-pt-x-miguel': 'pt-PT-Standard-A',
      'pt-br-x-ana': 'pt-BR-Neural2-B',
      'pt-br-x-ricardo': 'pt-BR-Neural2-C',
      'en-us-x-john': 'en-US-Neural2-F',
      'en-gb-x-sarah': 'en-GB-Neural2-B',
    };
    return map[voice] || 'pt-BR-Neural2-B';
  }

  private mapVoiceToElevenLabs(voice: string): string {
    const map: Record<string, string> = {
      'pt-br-x-ana': 'EXAVITQu4vr4xnSDxMaL', // Bella (BR)
      'pt-br-x-ricardo': '21m00Tcm4TlvDq8ikWAM', // Antoni (EN, mas bom em PT)
      'en-us-x-john': '21m00Tcm4TlvDq8ikWAM',
      'en-gb-x-sarah': 'EXAVITQu4vr4xnSDxMaL',
      'pt-pt-x-miguel': 'EXAVITQu4vr4xnSDxMaL',
    };
    return map[voice] || '21m00Tcm4TlvDq8ikWAM';
  }
}