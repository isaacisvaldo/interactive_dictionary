import { Module } from '@nestjs/common';
import { WordsController } from './words.controller';
import { WordsService } from './words.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ExternalProvider } from './providers/external.provider';

@Module({
  controllers: [WordsController],
  providers: [WordsService, PrismaService, ExternalProvider],
})
export class WordsModule {}
