import { Injectable } from '@nestjs/common';
import { CreateUtilDto } from './dto/create-util.dto';
import { UpdateUtilDto } from './dto/update-util.dto';

@Injectable()
export class UtilService {
  create(createUtilDto: CreateUtilDto) {
    return 'This action adds a new util';
  }

  findAll() {
    return `This action returns all util`;
  }

  findOne(id: number) {
    return `This action returns a #${id} util`;
  }

  update(id: number, updateUtilDto: UpdateUtilDto) {
    return `This action updates a #${id} util`;
  }

  remove(id: number) {
    return `This action removes a #${id} util`;
  }
}
