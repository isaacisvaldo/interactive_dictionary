import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CreateMediaDto, MediaType } from './dto/create-media.dto';
import { MediaResponseDto } from './dto/media-response.dto';

@ApiTags('MIDIA')
@ApiBearerAuth('JWT-auth')
@Controller('words/:id/media')
export class MediaController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Adicionar mídia (imagem, áudio, vídeo ou GIF)' })
  @ApiParam({ name: 'id', example: 42 })
  @ApiBody({ type: CreateMediaDto })
  @ApiCreatedResponse({ description: 'Mídia criada!', type: MediaResponseDto })
  @ApiResponse({ status: 404, description: 'Palavra não encontrada' })
  async addMedia(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: CreateMediaDto,
  ): Promise<MediaResponseDto> {
    try {
      await this.prisma.word.findUniqueOrThrow({ where: { id } });
    } catch (error) {
      throw new NotFoundException('Palavra não encontrada');
    }

    const media = await this.prisma.media.create({
      data: {
        wordId: id,
        type: body.type as any, // Prisma aceita string, enum vira string
        url: body.url,
        caption: body.caption || null,
      },
    });

    // Casting seguro: sabemos que o valor veio do enum
    return {
      ...media,
      type: media.type as MediaType,
    };
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar todas as mídias da palavra' })
  @ApiParam({ name: 'id', example: 42 })
  @ApiOkResponse({ type: [MediaResponseDto] })
  async list(@Param('id', ParseIntPipe) id: number): Promise<MediaResponseDto[]> {
    const medias = await this.prisma.media.findMany({
      where: { wordId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Transforma todos os types para o enum (zero custo, máxima segurança)
    return medias.map((media) => ({
      ...media,
      type: media.type as MediaType,
    }));
  }
}