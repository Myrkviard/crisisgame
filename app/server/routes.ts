import { Router, json } from 'express';
import type { Request, Response } from 'express';
import { addPlayer, findPlayer, isMJ, newRoom, type Room } from './rooms.js';
import type { PublicState, PrivateState, TeamId } from '../shared/view.js';
import {
  addPointsToPlayerTeam, adjustScore, ATTACK_ROLE_IDS, drawRole, endSpeech, forceSpeaker,
  GameError, pauseTimer, pickCrisis, playTrap, requirePlayer, requireRoom,
  restartTimer, resumeTimer, selfEvaluate, skipConcert, startGame, nextRound, beginRound,
} from './engine.js';
import { imageUrl, loadDeck } from './deck.js';
import { imgProxy } from './imgproxy.js';
import { addClient, broadcast } from './sse.js';

export const api = Router();
api.use(json());

function fail(res: Response, err: unknown): void {
  const status = err instanceof GameError ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Erreur inattendue';
  res.status(status).json({ error: message });
}

function roleSide(roleId: string): 'attaque' | 'défense' {
  return ATTACK_ROLE_IDS.includes(roleId) ? 'attaque' : 'défense';
}

function publicState(room: Room): PublicState {
  const crisis = room.currentCrisisId
    ? room.deck.crisis.find((c) => c.id === room.currentCrisisId)
    : undefined;
  const speaker = room.status === 'SPEAK'
    ? room.players.find((p) => p.id === room.lastSpeakerId)
    : undefined;
  const speakerRole = speaker?.roleId
    ? room.deck.roles.find((r) => r.id === speaker.roleId)
    : undefined;
  return {
    code: room.code,
    status: room.status,
    deckSource: room.deckSource,
    deckVersion: room.deck.version,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      connected: Date.now() - p.lastSeen < 60_000,
      hasRole: !!p.roleId,
      handCount: (room.hands[p.id] ?? []).length,
    })),
    teamScores: room.teamScores,
    round: room.round,
    teamToPlay: room.solo ? 'A' : room.lastTeamRound,
    crisisChoicesCount: room.status === 'PICK' ? room.crisisChoices.length : 0,
    currentCrisis: crisis
      ? {
          id: crisis.id, title: crisis.title, sub: crisis.sub, company: crisis.company,
          impact: crisis.impact, description: crisis.description,
          sevLabel: crisis.sevLabel, sev: crisis.sev, image: imageUrl(crisis.image),
        }
      : null,
    deadline: room.deadline,
    pausedRemaining: room.pausedRemaining,
    drawOrderNames: room.drawOrder
      .map((id) => room.players.find((p) => p.id === id)?.name ?? '?'),
    drawIndex: room.drawIndex,
    nowDrawingName:
      room.status === 'ROLES'
        ? room.players.find((p) => p.id === room.drawOrder[room.drawIndex])?.name ?? null
        : null,
    speaker: speaker
      ? { name: speaker.name, roleTitle: speakerRole?.title ?? '—' }
      : null,
    defenseTeam: room.solo ? 'A' : room.lastTeamRound,
    speakOrder: (!room.solo ? room.speakQueue : [])
      .map((id) => {
        const p = room.players.find((x) => x.id === id);
        const role = p?.roleId ? room.deck.roles.find((r) => r.id === p.roleId) : null;
        return {
          name: p?.name ?? '?',
          team: p?.team ?? 'A',
          roleTitle: role?.title ?? '—',
          side: role ? roleSide(role.id) : 'attaque' as const,
        };
      }),
    speakIndex: room.solo ? 0 : room.speakIndex,
    solo: room.solo,
    soloRole: (() => {
      if (!room.solo || room.status !== 'SPEAK') return null;
      const role = room.deck.roles.find((r) => r.id === room.castRole);
      return role ? { id: role.id, title: role.title, image: imageUrl(role.image) } : null;
    })(),
    crisisRemaining: room.crisisDeck.length - (room.currentCrisisId ? 1 : 0),
    canceledTeam: room.cancelTurn,
    blockedCeo: room.blockedCeo,
    log: room.log.slice(-40),
  };
}

export function stateFor(room: Room, token: string | null): PublicState | PrivateState {
  const base = publicState(room);
  const player = token ? findPlayer(room, token) : undefined;
  const mj = token ? isMJ(room, token) : false;
  if (!player && !mj) return base;
  const role = player?.roleId ? room.deck.roles.find((r) => r.id === player.roleId) : undefined;
  const hand = (player ? room.hands[player.id] ?? [] : []).map((id) => {
    const t = room.deck.traps.find((x) => x.id === id)!;
    return { id: t.id, title: t.title, rule: t.rule, effect: t.effect, image: imageUrl(t.image) };
  });
  return {
    ...base,
    you: {
      id: player?.id ?? '',
      name: player?.name ?? 'Maître du Jeu',
      team: player?.team ?? null,
      isMJ: mj,
      role: role ? { id: role.id, title: role.title, image: imageUrl(role.image) } : null,
      roleSide: role ? roleSide(role.id) : null,
      hand,
      canDrawRole:
        !!player && room.status === 'ROLES' && !player.roleId
        && room.drawOrder[room.drawIndex] === player.id,
      canPick:
        !!player && room.status === 'PICK' && player.team !== null
        && player.team === (room.solo ? 'A' : room.lastTeamRound),
    },
  };
}

function notify(room: Room): void {
  broadcast(room.code, 'state', { at: Date.now() });
}

function teamOf(req: Request): TeamId {
  return req.body?.team === 'A' ? 'A' : 'B';
}

api.post('/rooms', async (req, res) => {
  try {
    const { deck, source } = await loadDeck();
    const name = String(req.body?.name ?? 'Maître du Jeu').trim().slice(0, 32) || 'Maître du Jeu';
    if (req.body?.mode === 'solo') {
      const room = newRoom(deck, source, name, true);
      const player = addPlayer(room, name, 'A');
      res.json({ code: room.code, mjToken: room.mjToken, playerToken: player.token, solo: true, deckSource: source });
      return;
    }
    const room = newRoom(deck, source, name);
    res.json({ code: room.code, mjToken: room.mjToken, deckSource: source });
  } catch (err) {
    fail(res, err);
  }
});

api.post('/rooms/:code/join', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    if (room.solo) throw new GameError('Partie en mode solo : aucun joueur supplémentaire');
    if (room.status !== 'LOBBY') throw new GameError('La partie a déjà démarré');
    const name = String(req.body?.name ?? '').trim();
    if (!name) throw new GameError('Pseudo requis');
    const teamPref = req.body?.team === 'A' || req.body?.team === 'B' ? (req.body.team as TeamId) : null;
    const player = addPlayer(room, name, teamPref);
    notify(room);
    res.json({ token: player.token, playerId: player.id, team: player.team });
  } catch (err) {
    fail(res, err);
  }
});

api.get('/img', imgProxy);

api.get('/health/live', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

api.get('/deck', async (_req, res) => {
  try {
    const { deck } = await loadDeck();
    res.json({
      version: deck.version,
      crisis: deck.crisis.map((c) => ({
        id: c.id, num: c.num, title: c.title, sub: c.sub, company: c.company,
        sev: c.sev, sevLabel: c.sevLabel, impact: c.impact, description: c.description,
        image: imageUrl(c.image),
      })),
      roles: deck.roles.map((r) => ({ id: r.id, title: r.title, image: imageUrl(r.image) })),
      traps: deck.traps.map((t) => ({ id: t.id, title: t.title, rule: t.rule, image: imageUrl(t.image) })),
    });
  } catch (err) {
    fail(res, err);
  }
});

api.get('/rooms/:code/state', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    res.json(stateFor(room, (req.query.token as string) ?? null));
  } catch (err) {
    fail(res, err);
  }
});

api.get('/rooms/:code/stream', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.write('retry: 2000\n\n');
    const token = (req.query.token as string) ?? null;
    const remove = addClient(room.code, token, res);
    const ping = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { /* client parti */ }
    }, 15_000);
    req.on('close', () => {
      clearInterval(ping);
      remove();
    });
  } catch (err) {
    fail(res, err);
  }
});

api.post('/rooms/:code/start', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    if (!isMJ(room, req.body?.token)) throw new GameError('Réservé au Maître du Jeu', 403);
    startGame(room);
    notify(room);
    res.json(stateFor(room, req.body?.token));
  } catch (err) {
    fail(res, err);
  }
});

api.post('/rooms/:code/draw-role', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    const player = requirePlayer(room, req.body?.token);
    drawRole(room, player);
    notify(room);
    res.json(stateFor(room, req.body?.token));
  } catch (err) {
    fail(res, err);
  }
});

api.post('/rooms/:code/pick-crisis', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    const player = requirePlayer(room, req.body?.token);
    pickCrisis(room, player, Number(req.body?.index));
    notify(room);
    res.json(stateFor(room, req.body?.token));
  } catch (err) {
    fail(res, err);
  }
});

api.post('/rooms/:code/skip-concert', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    const player = requirePlayer(room, req.body?.token);
    if (!room.solo) throw new GameError('Réservé au mode solo');
    skipConcert(room);
    notify(room);
    res.json(stateFor(room, player.token));
  } catch (err) {
    fail(res, err);
  }
});

api.post('/rooms/:code/evaluate', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    const player = requirePlayer(room, req.body?.token);
    if (!room.solo) throw new GameError('Réservé au mode solo');
    selfEvaluate(room, req.body?.success === true);
    notify(room);
    res.json(stateFor(room, player.token));
  } catch (err) {
    fail(res, err);
  }
});

api.post('/rooms/:code/play-trap', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    const player = requirePlayer(room, req.body?.token);
    const trap = playTrap(room, player, String(req.body?.trapId));
    notify(room);
    res.json({ played: trap.id, state: stateFor(room, req.body?.token) });
  } catch (err) {
    fail(res, err);
  }
});

api.post('/rooms/:code/mj', (req, res) => {
  try {
    const room = requireRoom(req.params.code);
    const token = req.body?.token;
    if (!isMJ(room, token)) throw new GameError('Réservé au Maître du Jeu', 403);
    const action = String(req.body?.action ?? '');
    switch (action) {
      case 'start': startGame(room); break;
      case 'pause': pauseTimer(room); break;
      case 'resume': resumeTimer(room); break;
      case 'restart-timer': restartTimer(room); break;
      case 'return-to-pick': room.status = 'PICK'; room.deadline = null; beginRound(room); break;
      case 'next-round': nextRound(room); break;
      case 'next-speaker': endSpeech(room); break;
      case 'force-speaker': forceSpeaker(room, String(req.body?.playerId)); break;
      case 'end': room.status = 'ENDED'; room.deadline = null; break;
      case 'adjust': adjustScore(room, teamOf(req), Number(req.body?.delta ?? 0)); break;
      case 'covid-add': addPointsToPlayerTeam(room, teamOf(req), Number(req.body?.points ?? 15)); break;
      default: throw new GameError(`Action MJ inconnue : ${action}`);
    }
    notify(room);
    res.json(stateFor(room, token));
  } catch (err) {
    fail(res, err);
  }
});
