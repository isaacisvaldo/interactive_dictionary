// src/words/words.controller.ts
import {
  Controller,
  Get,
  Query,
  Param,
  Post,
  Body,
  Put,
  Delete,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('words')
@Controller('words')
export class WordsController {
  constructor(private service: WordsService) {}

  @Get()
  @ApiOperation({ summary: 'Busca paginada de palavras' })
  @ApiQuery({ name: 'query', required: true, type: String, description: 'Termo de busca' })
  @ApiQuery({ name: 'limit', required: false, type: String, example: '10' })
  @ApiQuery({ name: 'page', required: false, type: String, example: '1' })
  @ApiResponse({ status: 200, description: 'Resultados encontrados' })
  async search(
    @Query('query') q: string,
    @Query('limit') limit = '10',
    @Query('page') page = '1',
  ) {
    if (!q) {
      return { results: [], total: 0 }; // <== CORRIGIDO AQUI
    }

    const { results,total } = await this.service.search(q, Number(limit), Number(page));
    
    return { results, total }; // <== Agora retorna os dois campos (total é importante pro frontend!)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca palavra por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Palavra encontrada' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  async getById(@Param('id', ParseIntPipe) id: number) {
    const word = await this.service.findById(id);
    if (!word) throw new NotFoundException('Word not found');
    return word;
  }

  @Get('word/:term')
  @ApiOperation({ summary: 'Busca palavra exata por termo (com fallback externo)' })
  @ApiParam({ name: 'term', type: String, description: 'Termo exato' })
  @ApiResponse({ status: 200, description: 'Palavra retornada ou criada via API externa' })
  async getByTerm(@Param('term') term: string) {
    const w = await this.service.findByTerm(term);
    if (w) return w;
    // fallback to external + save:
    return this.service.fetchAndSaveExternal(term);
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova palavra' })
  @ApiBody({ type: CreateWordDto })
  @ApiResponse({ status: 201, description: 'Palavra criada' })
  async create(@Body() dto: CreateWordDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza palavra existente' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateWordDto })
  @ApiResponse({ status: 200, description: 'Palavra atualizada' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWordDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove palavra por ID' })
  @ApiParam({ name: 'id', type: Number })
  @ApiResponse({ status: 200, description: 'Palavra removida' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}