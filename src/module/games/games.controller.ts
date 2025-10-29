import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('words/:id/games')
export class GamesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Param('id', ParseIntPipe) id: number) {
    const word = await this.prisma.word.findUnique({ where: { id }});
    if (!word) return { games: [] };
    // exemplo: retornamos que tipos de jogo estão disponíveis
    return { games: ['anagram', 'fill_blank', 'synonym_match'] };
  }

  @Post(':gameType/start')
  async start(@Param('id', ParseIntPipe) id: number, @Param('gameType') gameType: string) {
    const word = await this.prisma.word.findUnique({ where: { id }, include: { synonyms: true, antonyms: true, definitions: { include: { examples: true } } }});
    if (!word) return { error: 'word not found' };

    if (gameType === 'anagram') {
      const letters = word.term.split('').sort(() => Math.random() - 0.5);
      return { type: 'anagram', tiles: letters };
    }

    if (gameType === 'fill_blank') {
      const example = word.definitions?.[0]?.examples?.[0]?.sentence;
      if (!example) return { error: 'no example to build fill_blank' };
      const blank = example.replace(new RegExp(word.term, 'ig'), '____');
      return { type: 'fill_blank', prompt: blank, answerLength: word.term.length };
    }

    if (gameType === 'synonym_match') {
      const choices = (word.synonyms || []).map(s => s.term);
      return { type: 'synonym_match', choices };
    }

    return { error: 'gameType not supported' };
  }

  @Post(':gameType/submit')
  async submit(@Param('id', ParseIntPipe) id: number, @Param('gameType') gameType: string, @Body() body: { answer: string }) {
    const word = await this.prisma.word.findUnique({ where: { id }, include: { synonyms: true }});
    if (!word) return { error: 'word not found' };

    if (gameType === 'anagram') {
      const ok = body.answer?.toLowerCase() === word.term.toLowerCase();
      return { correct: ok };
    }

    if (gameType === 'fill_blank') {
      const ok = body.answer?.toLowerCase() === word.term.toLowerCase();
      return { correct: ok };
    }

    if (gameType === 'synonym_match') {
      const ok = (word.synonyms || []).some(s => s.term.toLowerCase() === body.answer?.toLowerCase());
      return { correct: ok };
    }

    return { error: 'gameType not supported' };
  }
}
