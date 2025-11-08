// src/words/external.provider.ts
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PartOfSpeech } from '../dto/create-word.dto';

@Injectable()
export class ExternalProvider {
  private readonly baseUrl = 'https://www.dicio.com.br';

  async fetch(term: string): Promise<any | null> {
    const cleanTerm = term.toLowerCase().trim();
    console.log(`\n🔍 [Dicio] BUSCANDO: "${cleanTerm}"`);

    try {
      const url = `${this.baseUrl}/${encodeURIComponent(cleanTerm)}/`;
      console.log(`🌐 [Dicio] URL: ${url}`);

      const { data: html } = await axios.get(url, {
        timeout: 12000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
        },
      });

      // === LOG DO HTML BRUTO (primeiros 2000 chars) ===
      console.log(`\n📄 [Dicio] HTML RECEBIDO (primeiros 2000 chars):\n${html.substring(0, 2000)}\n${html.length > 2000 ? '...\n(HTML completo tem ' + html.length + ' caracteres)' : ''}\n`);

      const $ = cheerio.load(html);

      const title = $('h1').text().trim();
      console.log(`📌 [Dicio] Título (h1): "${title}"`);

      if (!title || !title.toLowerCase().includes(cleanTerm)) {
        console.log(`❌ [Dicio] Palavra não encontrada → null`);
        return null;
      }

      const meanings: any[] = [];

      // === DETECÇÃO DE ESTRUTURA ===
      const isNewStructure = $('.meaning, .meaning-section p').length > 0 || $('article.verb-article').length > 0;
      console.log(`🏗️ [Dicio] Estrutura nova detectada? ${isNewStructure ? 'SIM (verb-article ou .meaning)' : 'NÃO (estrutura antiga única <p>'}` );

      if (isNewStructure) {
        // === ESTRUTURA NOVA (ir, ser, estar, etc.) ===
        console.log(`🚀 [Dicio] Usando parser para estrutura NOVA`);

        const $meaningP = $('.meaning, .meaning-section p').first();
        const fullMeaningText = $meaningP.text().trim();

        // Divide por "verbo " (sempre começa com classe gramatical)
        const verboParts = fullMeaningText.split(/verbo\s+/i).filter(Boolean);

        verboParts.forEach(part => {
          const cleanPart = part.replace(/\[.*?\]/g, '').trim();
          if (!cleanPart) return;

          // Pega tipo de verbo (ex: "intransitivo e pronominal")
          const typeMatch = part.match(/^(intransitivo.*?|transitivo.*?|pronominal|predicativo)/i);
          const partOfSpeechRaw = typeMatch ? `verbo ${typeMatch[0]}` : 'verbo';

          // Extrai exemplos (frases com ; ou depois de :)
          const sentences = cleanPart.split(';').map(s => s.trim()).filter(s => s.includes(' '));
          const examples = sentences.length > 1 ? sentences.map(s => ({ sentence: s })) : undefined;

          // Meaning principal (primeira frase)
          const mainMeaning = cleanPart.split(';')[0].split(':')[0].trim();

          meanings.push({
            meaning: mainMeaning,
            partOfSpeech: this.normalizePartOfSpeech(partOfSpeechRaw),
            examples,
          });
        });

        // Etimologia separada
        const etymology = $('.etymology, p.etymology strong').text().replace(/Etimologia.*?:/, '').trim();

        console.log(`✅ [Dicio] Extraídos ${meanings.length} significados na estrutura NOVA`);

      } else {
        // === ESTRUTURA ANTIGA (comer, cachorro, etc.) - TUDO NUM <p> ===
        console.log(`🛠️ [Dicio] Usando parser para estrutura ANTIGA (único <p> gigante)`);

        const $bigP = $('p:contains("verbo"), p:contains("substantivo"), p:contains("Etimologia")').first();
        const fullText = $bigP.text().trim();

        // Divide por mudanças de classe gramatical
        const parts = fullText.split(/(verbo\s+[^.]+?\s+verbo|substantivo\s+masc)/i).filter(Boolean);

        let currentPos = 'verbo';
        let buffer = '';

        for (let i = 0; i < fullText.length; i++) {
          const char = fullText[i];
          if (fullText.substr(i, 5) === 'verbo' || fullText.substr(i, 11) === 'substantivo') {
            if (buffer) {
              meanings.push(this.parseOldBuffer(buffer, currentPos));
              buffer = '';
            }
            currentPos = fullText.substr(i, 20).split(' ')[0] + ' ' + fullText.substr(i, 30).split(' ')[1];
            i += 5;
          } else {
            buffer += char;
          }
        }
        if (buffer) meanings.push(this.parseOldBuffer(buffer, currentPos));

        console.log(`✅ [Dicio] Extraídos ${meanings.length} significados na estrutura ANTIGA`);
      }

      // === SINÔNIMOS (funciona em ambas estruturas) ===
      const synonyms: string[] = [];
      $('.sinonimos a, p:contains("sinônimo") a').each((i, el) => {
        const syn = $(el).text().trim();
        if (syn && !syn.includes('sinônimo de')) synonyms.push(syn);
      });

      // === FRASES FAMOSAS ===
      const famousPhrases: string[] = [];
      $('blockquote p, p:contains("Pensador")').nextAll('p').each((i, el) => {
        const txt = $(el).text().trim();
        if (txt && txt.length > 20) famousPhrases.push(txt);
      });

      // === ETIMOLOGIA FINAL ===
      const etymology = $('.etimologia, .etymology, p:contains("Etimologia")').text()
        .replace(/Etimologia.*?\./, '')
        .replace(/\(origem.*?\)/, '')
        .trim();

      const result = {
        word: cleanTerm,
        meanings: meanings.length > 0 ? meanings : [],
        synonyms: synonyms.length > 0 ? synonyms : undefined,
        famousPhrases: famousPhrases.length > 0 ? famousPhrases : undefined,
        etymology: etymology || undefined,
      };

      console.log(`\n🎉 [Dicio] SUCESSO TOTAL! ${result.meanings.length} definições | ${result.synonyms?.length || 0} sinônimos`);
      console.log(`   Exemplo de meaning: "${result.meanings[0]?.meaning?.substring(0, 100)}..."`);

      return result;

    } catch (err: any) {
      console.error(`\n💥 [Dicio] ERRO: ${err.message}`);
      return null;
    }
  }

  private parseOldBuffer(buffer: string, posRaw: string) {
    const clean = buffer.replace(/\[.*?\]/g, '').trim();
    const sentences = clean.split(';').map(s => s.trim()).filter(Boolean);
    const meaning = sentences[0].split(':')[0].trim();
    const examples = sentences.slice(1).length ? sentences.slice(1).map(s => ({ sentence: s })) : undefined;

    return {
      meaning,
      partOfSpeech: this.normalizePartOfSpeech(posRaw),
      examples,
    };
  }

  private normalizePartOfSpeech(raw: string): PartOfSpeech | undefined {
    if (!raw) return undefined;
    const map: Record<string, PartOfSpeech> = {
      'verbo': PartOfSpeech.VERB,
      'substantivo': PartOfSpeech.NOUN,
      'adjetivo': PartOfSpeech.ADJECTIVE,
      'advérbio': PartOfSpeech.ADVERB,
    };
    const lower = raw.toLowerCase();
    for (const [k, v] of Object.entries(map)) {
      if (lower.includes(k)) return v;
    }
    return PartOfSpeech.PHRASE;
  }
}