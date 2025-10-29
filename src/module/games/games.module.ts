import { Module } from '@nestjs/common';
import { GamesController } from './games.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [GamesController],
  providers: [PrismaService],
})
export class GamesModule {}
