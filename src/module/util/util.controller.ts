import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class UtilController {
  constructor(private prisma: PrismaService) {}

  @Get('suggestions')
  async suggestions(@Query('q') q: string, @Query('limit') limit = '10') {
    if (!q) return [];
    const results = await this.prisma.word.findMany({
      where: { term: { startsWith: q, mode: 'insensitive' } },
      take: Number(limit),
      orderBy: { term: 'asc' }
    });
    return results.map(r => ({ term: r.term, id: r.id }));
  }

  @Get('pronounce/:id')
  async pronounce(@Param('id', ParseIntPipe) id: number, @Query('voice') voice = 'pt-pt') {
    // Se word tem audioUrl armazenado, devolve; senão, retorna URL TTS (exemplo)
    const word = await this.prisma.word.findUnique({ where: { id }});
    if (!word) return { error: 'word not found' };

    if (word.audioUrl) return { url: word.audioUrl };

    // Exemplo: gerar URL de um TTS externo (neste exemplo apenas um placeholder)
    // Implementa integração com Google/AWS/Azure TTS e grava no S3 para retorno real
    const ttsPlaceholder = `https://example-tts.local/tts?text=${encodeURIComponent(word.term)}&voice=${encodeURIComponent(voice)}`;
    return { url: ttsPlaceholder };
  }
}
