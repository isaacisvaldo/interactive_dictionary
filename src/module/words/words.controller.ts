import { Controller, Get, Query, Param, Post, Body, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { WordsService } from './words.service';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';

@Controller('words')
export class WordsController {
  constructor(private service: WordsService) {}

  @Get()
  async search(@Query('query') q: string, @Query('limit') limit = '10', @Query('page') page = '1') {
    if (!q) return { results: [], total: 0 };
    const results = await this.service.search(q, Number(limit), Number(page));
    return { results };
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.service.findById(id);
  }

  @Get('word/:term')
  async getByTerm(@Param('term') term: string) {
    const w = await this.service.findByTerm(term);
    if (w) return w;
    // fallback to external + save:
    return this.service.fetchAndSaveExternal(term);
  }

  @Post()
  async create(@Body() dto: CreateWordDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWordDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.delete(id);
  }
}
