import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ListGamesResponseDto } from './dto/list-games.dto';
import { Public } from '../auth/decorators/public.decorator';
import { StartGameResponseDto } from './dto/start-game.dto';
import { SubmitGameDto, SubmitGameResponseDto } from './dto/submit-game.dto';

const GAME_TYPES = ['anagram', 'fill_blank', 'synonym_match'] as const;
type GameType = (typeof GAME_TYPES)[number];

@ApiTags('GAMES')
@ApiBearerAuth('JWT-auth')
@Controller('words/:id/games')
export class GamesController {
  constructor(private prisma: PrismaService) {}

  // ==================== LIST GAMES ====================
  @Get()
  @Public()
  @ApiOperation({ summary: 'Lista jogos disponíveis para uma palavra' })
  @ApiParam({ name: 'id', description: 'ID da palavra no banco', example: 42 })
  @ApiResponse({ status: 200, type: ListGamesResponseDto })
  async list(@Param('id', ParseIntPipe) id: number): Promise<ListGamesResponseDto> {
    const word = await this.prisma.word.findUnique({ where: { id } });
    if (!word) return { games: [] };

    return { games: ['anagram', 'fill_blank', 'synonym_match'] };
  }

  // ==================== START GAME ====================
  @Post(':gameType/start')
  @Public()
  @ApiOperation({ summary: 'Inicia um jogo para a palavra' })
  @ApiParam({ name: 'id', example: 42 })
  @ApiParam({
    name: 'gameType',
    enum: GAME_TYPES,
    description: 'Tipo de jogo',
    example: 'anagram',
  })
  @ApiResponse({ status: 200, type: StartGameResponseDto })
  @ApiResponse({ status: 400, description: 'gameType inválido ou sem dados' })
  async start(
    @Param('id', ParseIntPipe) id: number,
    @Param('gameType') gameType: string,
  ): Promise<StartGameResponseDto> {
    if (!GAME_TYPES.includes(gameType as GameType)) {
      throw new BadRequestException('gameType not supported');
    }

    const word = await this.prisma.word.findUnique({
      where: { id },
      include: { synonyms: true, antonyms: true, definitions: { include: { examples: true } } },
    });

    if (!word) return { type: gameType, error: 'word not found' };

    if (gameType === 'anagram') {
      const tiles = word.term.split('').sort(() => Math.random() - 0.5);
      return { type: 'anagram', tiles };
    }

    if (gameType === 'fill_blank') {
      const example = word.definitions?.[0]?.examples?.[0]?.sentence;
      if (!example) return { type: 'fill_blank', error: 'no example to build fill_blank' };
      const prompt = example.replace(new RegExp('\\b' + word.term + '\\b', 'gi'), '____');
      return { type: 'fill_blank', prompt, answerLength: word.term.length };
    }

    if (gameType === 'synonym_match') {
      const choices = (word.synonyms || []).map(s => s.term);
      if (choices.length === 0) return { type: 'synonym_match', error: 'no synonyms available' };
      return { type: 'synonym_match', choices };
    }

    return { type: gameType, error: 'gameType not supported' };
  }

  // ==================== SUBMIT ANSWER ====================
  @Post(':gameType/submit')
  @Public()
  @ApiOperation({ summary: 'Envia resposta do jogador' })
  @ApiParam({ name: 'id', example: 42 })
  @ApiParam({ name: 'gameType', enum: GAME_TYPES })
  @ApiBody({ type: SubmitGameDto })
  @ApiResponse({ status: 200, type: SubmitGameResponseDto })
  async submit(
    @Param('id', ParseIntPipe) id: number,
    @Param('gameType') gameType: string,
    @Body() body: SubmitGameDto,
  ): Promise<SubmitGameResponseDto> {
    if (!GAME_TYPES.includes(gameType as GameType)) {
      return { correct: false, error: 'gameType not supported' };
    }

    const word = await this.prisma.word.findUnique({
      where: { id },
      include: { synonyms: true },
    });

    if (!word) return { correct: false, error: 'word not found' };

    let correct = false;

    if (gameType === 'anagram' || gameType === 'fill_blank') {
      correct = body.answer?.trim().toLowerCase() === word.term.toLowerCase();
    }

    if (gameType === 'synonym_match') {
      correct = (word.synonyms || []).some(
        s => s.term.toLowerCase() === body.answer?.trim().toLowerCase(),
      );
    }

    return { correct };
  }
}