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
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
        },
      });

      console.log(`\n📄 [Dicio] HTML (2k chars):\n${html.substring(0, 2000)}${html.length > 2000 ? '\n...\n(HTML total: ' + html.length + ' chars)' : ''}`);

      const $ = cheerio.load(html);
      const title = $('h1').text().trim();
      console.log(`📌 [Dicio] Título: "${title}"`);

      if (!title || !title.toLowerCase().includes(cleanTerm)) {
        console.log(`❌ [Dicio] Palavra não encontrada → null`);
        return null;
      }

      const meanings: any[] = [];

      // === DETECÇÃO DE ESTRUTURA ===
      const hasNewStructure = $('.meaning, .meaning-section p, article.verb-article').length > 0;
      console.log(`🏗️ [Dicio] Nova estrutura? ${hasNewStructure ? 'SIM' : 'NÃO (antiga)'}`);

      if (hasNewStructure) {
        // === ESTRUTURA NOVA (ir, ser, aprender) ===
        console.log(`🚀 [Dicio] Parser NOVA estrutura`);
        const text = $('.meaning, .meaning-section p').first().text().trim();
        const parts = text.split(/verbo\s+/i).filter(Boolean);

        parts.forEach(part => {
          const clean = part.replace(/\[.*?\]/g, '').trim();
          if (!clean) return;

          const typeMatch = part.match(/^(intransitivo.*?|transitivo.*?|pronominal|predicativo)/i);
          const posRaw = typeMatch ? `verbo ${typeMatch[0]}` : 'verbo';

          const sentences = clean.split(';').map(s => s.trim()).filter(Boolean);
          const meaning = sentences[0].split(':')[0].trim(); // agora seguro
          const examples = sentences.slice(1).length ? sentences.slice(1).map(s => ({ sentence: s })) : undefined;

          meanings.push({
            meaning,
            partOfSpeech: this.normalizePartOfSpeech(posRaw),
            examples,
          });
        });
         } else {
        // === ESTRUTURA ANTIGA - PARSER PERFEITO 2025 (NUNCA MAIS COME LETRA!) ===
        console.log(`🛠️ [Dicio] Parser ANTIGA - VERSÃO FINAL (zero bugs!)`);

        const $p = $('p:contains("verbo"), p:contains("substantivo"), p:contains("adjetivo"), p:contains("advérbio")').first();
        const fullText = $p.text();

        // Regex com CAPTURE GROUP → pega a classe gramatical E o meaning ao mesmo tempo
        const grammarRegex = /(verbo\s+(?:transitivo\s*(?:direto\s*(?:e\s*indireto)?|indireto)?|intransitivo|pronominal|auxiliar|de\s+ligação)?\s*|substantivo\s+(?:masculino|feminino|comum\s+de\s+dois)?\s*|adjetivo\s*|advérbio\s*|locução\s*)/gi;

        // Split mantendo o delimitador (classe gramatical)
        const parts = fullText.split(grammarRegex).map(s => s.trim()).filter(Boolean);

        let currentPos = 'verbo';
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];

          // Se for classe gramatical (começa com verbo/substantivo/etc.)
          if (/^(verbo|substantivo|adjetivo|advérbio)/i.test(part)) {
            currentPos = part;
          } else {
            // É o meaning real
            const cleaned = part
              .replace(/\[.*?\]/g, '')  // remove [Figurado]
              .replace(/^\s*[\:\.\)]\s*/g, '')  // remove : . ) no início
              .trim();

            if (cleaned) {
              const sentences = cleaned.split(';').map(s => s.trim()).filter(Boolean);
              const meaning = sentences[0].split(':')[0].trim();
              const examples = sentences.length > 1 ? sentences.slice(1).map(s => ({ sentence: s })) : undefined;

              meanings.push({
                meaning,
                partOfSpeech: this.normalizePartOfSpeech(currentPos),
                examples,
              });
            }
          }
        }

        // Caso tenha sobrado algo no final (raro)
        if (meanings.length === 0 && fullText.trim()) {
          const cleaned = fullText.replace(/\[.*?\]/g, '').trim();
          meanings.push({
            meaning: cleaned.split(';')[0].split(':')[0].trim(),
            partOfSpeech: PartOfSpeech.PHRASE,
            examples: undefined,
          });
        }
      }

      console.log(`✅ [Dicio] Meanings extraídos: ${meanings.length}`);

      // === SINÔNIMOS + ANTÔNIMOS (100% FUNCIONAL 2025) ===
      const synonyms: string[] = [];
      const antonyms: string[] = [];

      $('a[href^="/"]').each((_, el) => {
        const $a = $(el);
        const text = $a.text().trim();
        if (!text || text.length < 2 || /dicio|sinônimo|antônimo|pensador/i.test(text)) return;

        const parentText = $a.parent().text().toLowerCase();
        const strongText = $a.closest('p').find('strong').text().toLowerCase();

        if (parentText.includes('sinônimo') || strongText.includes('sinônimo') || $a.closest('.sinonimos').length) {
          if (!synonyms.includes(text)) synonyms.push(text);
        }
        if (parentText.includes('antônimo') || strongText.includes('antônimo') || $a.closest('.antonimos').length) {
          if (!antonyms.includes(text)) antonyms.push(text);
        }
      });

      console.log(`🔄 [Dicio] SINÔNIMOS: ${synonyms.length} → ${synonyms.slice(0, 10).join(', ')}${synonyms.length > 10 ? '...' : ''}`);
      console.log(`⚡ [Dicio] ANTÔNIMOS: ${antonyms.length} → ${antonyms.slice(0, 10).join(', ')}${antonyms.length > 10 ? '...' : ''}`);

      // === FRASES FAMOSAS ===
      const famousPhrases: string[] = [];
      $('blockquote p, p:contains("Pensador") ~ p').each((_, el) => {
        const txt = $(el).text().trim();
        if (txt && txt.length > 25 && txt.includes(' ')) famousPhrases.push(txt);
      });

      // === ETIMOLOGIA ===
      const etymology = $('.etimologia, .etymology, p:contains("Etimologia")')
        .text()
        .replace(/Etimologia.*?:/, '')
        .replace(/\(origem.*?\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // === RESULTADO FINAL ===
      const result = {
        word: cleanTerm,
        meanings: meanings.length > 0 ? meanings : [],
        synonyms: synonyms.length > 0 ? synonyms : undefined,
        antonyms: antonyms.length > 0 ? antonyms : undefined,
        famousPhrases: famousPhrases.length > 0 ? famousPhrases : undefined,
        etymology: etymology || undefined,
      };

      console.log(`\n🎉 [Dicio] SUCESSO ÉPICO!`);
      console.log(`   Definições: ${result.meanings.length}`);
      console.log(`   Sinônimos: ${result.synonyms?.length || 0}`);
      console.log(`   ANTÔNIMOS: ${result.antonyms?.length || 0} ✅`);
      console.log(`   Frases: ${result.famousPhrases?.length || 0}`);
      console.log(`   Etimologia: ${etymology.substring(0, 60)}${etymology.length > 60 ? '...' : ''}\n`);

      return result;

    } catch (err: any) {
      console.error(`\n💥 [Dicio] ERRO CRÍTICO: ${err.message}`);
      return null;
    }
  }

  private parseOldBuffer(buffer: string, posRaw: string) {
    const clean = buffer
      .replace(/\[.*?\]/g, '')  // remove [Figurado], [Brasil], etc.
      .replace(/^[\.\)]\s*/, '') // remove ponto ou parêntese no início
      .replace(/^\s*:\s*/, '')   // remove dois pontos soltos
      .trim();

    if (!clean) return null;

    const sentences = clean.split(';').map(s => s.trim()).filter(Boolean);
    const meaning = sentences[0]?.split(':')[0].trim() || clean;
    const examples = sentences.length > 1 ? sentences.slice(1).map(s => ({ sentence: s })) : undefined;

    return {
      meaning,
      partOfSpeech: this.normalizePartOfSpeech(posRaw),
      examples: examples?.filter(e => e.sentence.length > 5), // filtra lixo
    };
  }

  private normalizePartOfSpeech(raw: string): PartOfSpeech | undefined {
    if (!raw) return undefined;
    const lower = raw.toLowerCase();
    if (lower.includes('verbo')) return PartOfSpeech.VERB;
    if (lower.includes('substantivo')) return PartOfSpeech.NOUN;
    if (lower.includes('adjetivo')) return PartOfSpeech.ADJECTIVE;
    if (lower.includes('advérbio')) return PartOfSpeech.ADVERB;
    if (lower.includes('pronome')) return PartOfSpeech.PRONOUN;
    if (lower.includes('preposição')) return PartOfSpeech.PREPOSITION;
    return PartOfSpeech.PHRASE;
  }
}