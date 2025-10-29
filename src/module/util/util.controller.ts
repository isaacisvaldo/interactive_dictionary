import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UtilService } from './util.service';
import { CreateUtilDto } from './dto/create-util.dto';
import { UpdateUtilDto } from './dto/update-util.dto';

@Controller('util')
export class UtilController {
  constructor(private readonly utilService: UtilService) {}

  @Post()
  create(@Body() createUtilDto: CreateUtilDto) {
    return this.utilService.create(createUtilDto);
  }

  @Get()
  findAll() {
    return this.utilService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.utilService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUtilDto: UpdateUtilDto) {
    return this.utilService.update(+id, updateUtilDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.utilService.remove(+id);
  }
}
