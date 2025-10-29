import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWordDto } from './dto/create-word.dto';
import { ExternalProvider } from './providers/external.provider';
import { Prisma } from '@prisma/client';

@Injectable()
export class WordsService {
  constructor(private prisma: PrismaService, private external: ExternalProvider) {}

  async create(dto: CreateWordDto) {
  
    const data: Prisma.WordCreateInput = {
      term: dto.term,
      language: dto.language ?? 'pt',
      phonetic: dto.phonetic,
      definitions: dto.definitions
        ? {
            create: dto.definitions.map(d => ({
              meaning: d.meaning,
              partOfSpeech: d.partOfSpeech,
              examples: d.examples ? { create: d.examples.map(e => ({ sentence: e.sentence, translation: e.translation })) } : undefined,
            })),
          }
        : undefined,
      synonyms: dto.synonyms ? { create: dto.synonyms.map(t => ({ term: t })) } : undefined,
      antonyms: dto.antonyms ? { create: dto.antonyms.map(t => ({ term: t })) } : undefined,
    };
    return this.prisma.word.create({ data, include: { definitions: { include: { examples: true } }, synonyms: true, antonyms: true }});
  }

  async findById(id: number) {
    const w = await this.prisma.word.findUnique({ where: { id }, include: { definitions: { include: { examples: true } }, synonyms: true, antonyms: true, media: true }});
    if (!w) throw new NotFoundException('Word not found');
    return w;
  }

  async findByTerm(term: string) {
    const w = await this.prisma.word.findUnique({ where: { term }, include: { definitions: { include: { examples: true } }, synonyms: true, antonyms: true, media: true }});
    if (!w) return null;
    return w;
  }

  async update(id: number, dto: any) {
    // simplified update (you can expand to handle nested updates)
    return this.prisma.word.update({ where: { id }, data: { ...dto }});
  }

  async delete(id: number) {
    return this.prisma.word.delete({ where: { id }});
  }

  async search(query: string, limit = 10, page = 1) {
    const skip = (page - 1) * limit;
    const results = await this.prisma.word.findMany({
      where: {
        OR: [
          { term: { contains: query, mode: 'insensitive' } },
          { definitions: { some: { meaning: { contains: query, mode: 'insensitive' } } } }
        ]
      },
      include: { definitions: true },
      take: limit,
      skip,
      orderBy: { term: 'asc' },
    });
    return results;
  }

  async fetchAndSaveExternal(term: string) {
    const external = await this.external.fetch(term);
    if (!external) return null;
    const mapped = this.mapExternal(external[0]);
    return this.create(mapped);
  }

  private mapExternal(data: any): CreateWordDto {
    const defs = (data.meanings || []).map(m => ({
      meaning: m.definitions?.[0]?.definition || '',
      partOfSpeech: m.partOfSpeech,
      examples: (m.definitions?.[0]?.example ? [{ sentence: m.definitions[0].example }] : []),
    }));
    const synonyms = (data.meanings || []).flatMap(m => m.synonyms || []);
    const antonyms = (data.meanings || []).flatMap(m => m.antonyms || []);
    return {
      term: data.word,
      phonetic: data.phonetic,
      definitions: defs,
      synonyms,
      antonyms,
    };
  }

  async ensureWord(term: string) {
    const local = await this.findByTerm(term);
    if (local) return local;
    const saved = await this.fetchAndSaveExternal(term);
    if (!saved) throw new NotFoundException('Word not found anywhere');
    return saved;
  }
}
