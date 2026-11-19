import type { Request, Response } from 'express';
import { GITHUB_RAW_BASE } from './deck.js';

const SAFE_PREFIXES = ['cartes/', 'deck/'];

export async function imgProxy(req: Request, res: Response): Promise<void> {
  const rel = String(req.query.path ?? '');
  if (!rel || rel.includes('..') || !SAFE_PREFIXES.some((p) => rel.startsWith(p))) {
    res.status(400).json({ error: 'Chemin invalide' });
    return;
  }
  const url = new URL(rel, GITHUB_RAW_BASE).href;
  const headers: Record<string, string> = { 'User-Agent': 'crisisgame-app' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  try {
    const upstream = await fetch(url, { headers, signal: AbortSignal.timeout(10_000) });
    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `Image indisponible (${upstream.status})` });
      return;
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).end(buf);
  } catch {
    res.status(502).json({ error: 'Image inaccessible' });
  }
}
