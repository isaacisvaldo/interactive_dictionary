import { Injectable } from '@nestjs/common';

@Injectable()
export class ExternalProvider {
  async fetch(term: string) {
    // Usamos dictionaryapi.dev como fallback (exemplo)
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${term}`);
    if (!res.ok) return null;
    return res.json();
  }
}
