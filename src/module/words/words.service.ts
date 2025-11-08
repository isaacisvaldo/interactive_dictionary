// src/words/words.service.ts
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateWordDto, LanguageCode, PartOfSpeech } from './dto/create-word.dto';
import { ExternalProvider } from './providers/external.provider';
import { Prisma } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly external: ExternalProvider,
  ) {}

  // ========================================================================
  // CREATE
  // ========================================================================
  async create(dto: CreateWordDto) {
    const data: Prisma.WordCreateInput = {
      term: dto.term.toLowerCase().trim(),
      language: dto.language ?? LanguageCode.PT,
      phonetic: dto.phonetic?.trim(),
      definitions: dto.definitions
        ? {
            create: dto.definitions.map((d) => ({
              meaning: d.meaning.trim(),
              partOfSpeech: d.partOfSpeech,
              examples: d.examples
                ? {
                    create: d.examples.map((e) => ({
                      sentence: e.sentence.trim(),
                      translation: e.translation?.trim(),
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
      synonyms: dto.synonyms
        ? { create: dto.synonyms.map((t) => ({ term: t.toLowerCase().trim() })) }
        : undefined,
      antonyms: dto.antonyms
        ? { create: dto.antonyms.map((t) => ({ term: t.toLowerCase().trim() })) }
        : undefined,
    };

    return this.prisma.word.upsert({
      where: { term: data.term },
      update: {}, // não atualiza se já existe (podes mudar)
      create: data,
      include: {
        definitions: { include: { examples: true } },
        synonyms: true,
        antonyms: true,
      },
    });
  }

  // ========================================================================
  // READ
  // ========================================================================
  async findById(id: number) {
    const word = await this.prisma.word.findUnique({
      where: { id },
      include: {
        definitions: { include: { examples: true } },
        synonyms: true,
        antonyms: true,
        media: true,
      },
    });

    if (!word) throw new NotFoundException(`Palavra com ID ${id} não encontrada`);
    return word;
  }

  async findByTerm(term: string) {
    return this.prisma.word.findUnique({
      where: { term: term.toLowerCase().trim() },
      include: {
        definitions: { include: { examples: true } },
        synonyms: true,
        antonyms: true,
        media: true,
      },
    });
  }

  // ========================================================================
  // UPDATE / DELETE
  // ========================================================================
  async update(id: number, dto: Partial<CreateWordDto>) {
    return this.prisma.word.update({
      where: { id },
      data: dto as Prisma.WordUpdateInput,
      include: { definitions: true, synonyms: true, antonyms: true },
    });
  }

  async delete(id: number) {
    return this.prisma.word.delete({ where: { id } });
  }

  // ========================================================================
  // SEARCH COM FALLBACK INTELIGENTE (o que pediste!)
  // ========================================================================
  async search(query: string, limit = 10, page = 1) {
    const skip = (page - 1) * limit;
    const cleanQuery = query.trim();

    const whereClause = {
      OR: [
        { term: { contains: cleanQuery, mode: 'insensitive' as const } },
        { definitions: { some: { meaning: { contains: cleanQuery, mode: 'insensitive' as const } } } },
      ],
    };

    const [results, total] = await Promise.all([
      this.prisma.word.findMany({
        where: whereClause,
        include: { definitions: {include:{examples:true}},synonyms:true,antonyms:true},
        take: limit,
        skip,
        orderBy: { term: 'asc' },
      }),
      this.prisma.word.count({ where: whereClause }),
    ]);

    // Se já tem resultados ou é paginação → retorna
    if (total > 0 || page > 1) {
      this.logger.log(`Encontrados ${total} resultados locais para "${cleanQuery}"`);
      return { results, total };
    }

    this.logger.warn(`Zero resultados locais para "${cleanQuery}" → ativando fallback WEB`);

    const savedWord = await this.tryWebFallback(cleanQuery);

    if (savedWord) {
      this.logger.log(`Fallback sucesso! Palavra salva: "${savedWord.term}"`);
      return {
        results: [savedWord],
        total: 1,
      };
    }

    this.logger.error(`Nada encontrado em lugar nenhum para "${cleanQuery}"`);
    return { results: [], total: 0 };
  }

  // ========================================================================
  // FALLBACK WEB (Dicio → Variações → Google)
  // ========================================================================
  private async tryWebFallback(originalQuery: string): Promise<any | null> {
    // 1. Tenta direto
    let data = await this.external.fetch(originalQuery);
    if (data?.word) return this.fetchAndSaveExternal(data.word);

    // 2. Variações inteligentes
    const variations = this.generateVariations(originalQuery);
    for (const variant of variations) {
      if (variant === originalQuery) continue;
      data = await this.external.fetch(variant);
      if (data?.word) {
        this.logger.log(`Variação encontrada: "${originalQuery}" → "${data.word}"`);
        return this.fetchAndSaveExternal(data.word);
      }
    }

    // 3. Google + Dicio
    return this.googleDicioFallback(originalQuery);
  }

  private generateVariations(term: string): string[] {
    const lower = term.toLowerCase();
    return [
      lower.replace(/o$/, 'er'),
      lower.replace(/a$/, 'ar'),
      lower.replace(/s$/, ''),
      lower.replace(/es$/, ''),
      lower.replace(/ção$/, 'ar'),
      lower + 'r',
      lower + 'ar',
      lower + 'er',
      lower + 'ir',
      lower.slice(0, -1),
      lower.slice(0, -2),
    ].filter((v, i, arr) => v.length >= 3 && arr.indexOf(v) === i);
  }

  private async googleDicioFallback(query: string): Promise<any | null> {
    try {
      this.logger.log(`Buscando no Google: "significado de ${query} site:dicio.com.br"`);
      const { data: html } = await axios.get('https://www.google.com/search', {
        params: { q: `significado de ${query} site:dicio.com.br` },
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000,
      });

      const $ = cheerio.load(html);
      const link = $('a[href*="dicio.com.br"]').first().attr('href');

      if (!link) return null;

      const match = link.match(/url\?q=(https:\/\/www\.dicio\.com\.br\/[^&/]+\/)/);
      if (!match?.[1]) return null;

      const realUrl = decodeURIComponent(match[1]);
      const term = realUrl.split('/').slice(-2)[0];

      this.logger.log(`Google → Dicio: "${term}"`);
      return this.fetchAndSaveExternal(term);
    } catch (err: any) {
      this.logger.error(`Google fallback falhou: ${err.message}`);
      return null;
    }
  }

  // ========================================================================
  // FETCH + SAVE (centralizado, evita duplicação)
  // ========================================================================
  async fetchAndSaveExternal(term: string) {
    const cleanTerm = term.toLowerCase().trim();

    // Evita duplicação
    const existing = await this.findByTerm(cleanTerm);
    if (existing) {
      this.logger.verbose(`Já existe no banco: "${cleanTerm}"`);
      return existing;
    }

    const data = await this.external.fetch(cleanTerm);
    if (!data || !data.word || !data.meanings?.length) {
      throw new NotFoundException(`"${cleanTerm}" não encontrada no Dicio`);
    }

    this.logger.log(`Scraping sucesso: "${data.word}" → ${data.meanings.length} definições`);

    const dto: CreateWordDto = {
      term: data.word,
      language: LanguageCode.PT,
      phonetic: data.phonetic,
      definitions: data.meanings.map((m: any) => ({
        meaning: m.meaning.trim(),
        partOfSpeech: m.partOfSpeech as PartOfSpeech,
        examples: m.examples,
      })),
      synonyms: data.synonyms,
      antonyms: data.antonyms,
    };

    return this.create(dto);
  }

  // ========================================================================
  // GARANTIR PALAVRA (usado no getByTerm)
  // ========================================================================
  async ensureWord(term: string) {
    const local = await this.findByTerm(term);
    if (local) return local;

    return this.fetchAndSaveExternal(term);
  }
}