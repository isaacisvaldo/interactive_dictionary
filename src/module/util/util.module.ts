import { Module } from '@nestjs/common';
import { UtilController } from './util.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UtilController],
  providers: [PrismaService],
})
export class UtilModule {}
