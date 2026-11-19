import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Deck, TrapCard } from '../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const GITHUB_RAW_BASE =
  process.env.GITHUB_RAW_BASE ?? 'https://raw.githubusercontent.com/Myrkviard/crisisgame/main/';
const DECK_URL = process.env.DECK_URL ?? new URL('deck/crisisgame.deck.json', GITHUB_RAW_BASE).href;
const FALLBACK_PATH = path.join(__dirname, 'default-deck.json');

let cache: { deck: Deck; source: 'github' | 'fallback'; at: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export const imageUrl = (rel: string | undefined): string | null =>
  rel ? `/api/img?path=${encodeURIComponent(rel)}` : null;

export async function loadDeck(): Promise<{ deck: Deck; source: 'github' | 'fallback' }> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return { deck: cache.deck, source: cache.source };
  }
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
    cache = { deck, source: 'github', at: Date.now() };
    return { deck, source: 'github' };
  } catch (err) {
    console.warn(`[deck] échec GitHub (${(err as Error).message}), paquet de secours local`);
    const deck = JSON.parse(fs.readFileSync(FALLBACK_PATH, 'utf8')) as Deck;
    cache = { deck, source: 'fallback', at: Date.now() };
    return { deck, source: 'fallback' };
  }
}

export { DECK_URL };
