import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Deck, TrapCard } from '../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GITHUB_RAW_BASE =
  process.env.GITHUB_RAW_BASE ?? 'https://raw.githubusercontent.com/Myrkviard/crisisgame/main/';
const DECK_URL = process.env.DECK_URL ?? new URL('deck/crisisgame.deck.json', GITHUB_RAW_BASE).href;
const FALLBACK_PATH = path.join(__dirname, 'default-deck.json');

export const imageUrl = (rel: string | undefined): string | null =>
  rel ? new URL(rel, GITHUB_RAW_BASE).href : null;

export async function loadDeck(): Promise<{ deck: Deck; source: 'github' | 'fallback' }> {
  try {
    const res = await fetch(DECK_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'crisisgame-app' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const deck = (await res.json()) as Deck;
    if (!deck?.crisis?.length || !deck?.roles?.length || !deck?.traps?.length) {
      throw new Error('deck incomplet');
    }
    return { deck, source: 'github' };
  } catch (err) {
    console.warn(`[deck] échec GitHub (${(err as Error).message}), paquet de secours local`);
    const deck = JSON.parse(fs.readFileSync(FALLBACK_PATH, 'utf8')) as Deck;
    return { deck, source: 'fallback' };
  }
}

export { DECK_URL };
