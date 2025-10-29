import { Controller, Post, Body, Param, Get, ParseIntPipe } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('words/:id/media')
export class MediaController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async addMedia(@Param('id', ParseIntPipe) id: number, @Body() body: { type: string; url: string; caption?: string }) {
    // validate word exists
    await this.prisma.word.findUniqueOrThrow({ where: { id }});
    return this.prisma.media.create({ data: { wordId: id, type: body.type, url: body.url, caption: body.caption }});
  }

  @Get()
  async list(@Param('id', ParseIntPipe) id: number) {
    return this.prisma.media.findMany({ where: { wordId: id }});
  }
}
