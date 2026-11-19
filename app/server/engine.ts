import crypto from 'node:crypto';
import { addLog, getRoom, saveRoom, shuffle, TEAMS, type Player, type Room, type TeamId } from './rooms.js';
import type { CrisisCard, TrapCard } from '../shared/types.js';

export const CONCERT_MS = 2 * 60 * 1000;
export const CHOICES_COUNT = 3;

const rnd = (n: number) => crypto.randomInt(n);
const pickOne = <T>(arr: T[]): T => arr[rnd(arr.length)];

export class GameError extends Error {
  status = 400;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function requireRoom(code: string): Room {
  const room = getRoom(code);
  if (!room) throw new GameError('Partie introuvable', 404);
  return room;
}

export function requirePlayer(room: Room, token: string): Player {
  const p = room.players.find((x) => x.token === token);
  if (!p) throw new GameError('Joueur inconnu dans cette partie', 403);
  p.lastSeen = Date.now();
  return p;
}

function teamPlayers(room: Room, team: TeamId): Player[] {
  return room.players.filter((p) => p.team === team);
}

export function full(room: Room): boolean {
  return room.players.length >= 8 && room.players.every((p) => p.team !== null);
}

/* ---------------------------------------------------------------- phases */

export function startGame(room: Room): void {
  if (room.status !== 'LOBBY') throw new GameError('La partie a déjà commencé');
  if (!room.solo && !full(room)) {
    throw new GameError(`Il faut 8 joueurs en équipes pour démarrer (${room.players.length}/8)`);
  }

  room.crisisDeck = shuffle(room.deck.crisis.map((c) => c.id));
  room.round = 0;
  for (const t of TEAMS) room.teamScores[t] = 0;
  if (room.solo) {
    room.roleDeck = [];
    room.drawOrder = [];
    room.drawIndex = 0;
    room.hands = {};
    room.status = 'PICK';
    addLog(room, 'Mode solo • vous jouez les 8 rôles à tour de rôle');
    beginRound(room);
    saveRoom(room);
    return;
  }
  room.roleDeck = shuffle(room.deck.roles.map((r) => r.id));
  room.drawOrder = shuffle(room.players.map((p) => p.id));
  room.drawIndex = 0;
  room.hands = distributeTraps(room.players, room.deck.traps);
  room.status = 'ROLES';
  addLog(room, 'La partie démarre • distribution des rôles tour par tour');
  saveRoom(room);
}

function distributeTraps(players: Player[], traps: { id: string }[]): Record<string, string[]> {
  const hands: Record<string, string[]> = {};
  const trapIds = shuffle(traps.map((t) => t.id));
  const receivers = shuffle(players).slice(0, trapIds.length);
  receivers.forEach((p, i) => {
    hands[p.id] = [trapIds[i]];
  });
  return hands;
}

export function roleDeckRemaining(room: Room): number {
  return room.roleDeck.length;
}

export function drawRole(room: Room, player: Player): string {
  if (room.status !== 'ROLES') throw new GameError('Distribution terminée ou non commencée');
  if (player.roleId) throw new GameError('Vous avez déjà votre rôle');
  const expected = room.drawOrder[room.drawIndex];
  if (expected !== player.id) throw new GameError("Ce n'est pas votre tour de piocher");
  const roleId = room.roleDeck.shift();
  if (!roleId) throw new GameError('Plus de rôles à distribuer');
  player.roleId = roleId;
  room.drawIndex += 1;
  addLog(room, `${player.name} (équipe ${player.team}) a pioché son rôle secret`);
  if (room.drawIndex >= room.drawOrder.length) {
    room.status = 'PICK';
    addLog(room, 'Rôles distribués • début de la boucle de jeu');
    beginRound(room);
  }
  saveRoom(room);
  return roleId;
}

export function beginRound(room: Room): void {
  if (room.status !== 'PICK') return;
  room.round += 1;
  let team: TeamId = room.round % 2 === 1 ? 'A' : 'B';

  if (room.cancelTurn === team) {
    room.cancelTurn = null;
    addLog(room, `Le tour de l'équipe ${team} est annulé (carte BHL) → au tour de l'autre équipe`);
    room.round += 1;
    team = team === 'A' ? 'B' : 'A';
  }
  room.crisisChoices = room.crisisDeck.slice(0, Math.min(CHOICES_COUNT, room.crisisDeck.length));
  room.currentCrisisId = null;
  room.castRole = null;
  room.lastTeamRound = team;
  if (room.solo) {
    room.lastTeamRound = 'A';
    addLog(room, `TOUR ${room.round} • à vous de tirer une carte crise`);
    return;
  }
  addLog(room, `TOUR ${room.round} • l'équipe ${team} choisit une carte crise`);
}

export function currentTeam(room: Room): TeamId {
  return room.lastTeamRound ?? 'A';
}

export function pickCrisis(room: Room, player: Player, index: number): CrisisCard {
  if (room.status !== 'PICK') throw new GameError('Choix de crise non ouvert');
  if (player.team !== currentTeam(room)) throw new GameError("Ce n'est pas le tour de votre équipe");
  if (index < 0 || index >= room.crisisChoices.length) throw new GameError('Choix invalide');
  const crisisId = room.crisisChoices[index];
  room.crisisChoices = [];
  room.crisisDeck = room.crisisDeck.filter((id) => id !== crisisId);
  room.currentCrisisId = crisisId;
  const crisis = crisisById(room, crisisId)!;
  room.teamScores[player.team] += crisis.impact;
  room.playedCrisis.push(crisisId);
  room.status = 'REVEAL';
  room.deadline = Date.now() + 2500;
  addLog(room, room.solo
    ? `Vous révélez ${crisis.title} (${crisis.impact} pts)`
    : `L'équipe ${player.team} révèle ${crisis.title} (${crisis.impact} pts)`);
  saveRoom(room);
  return crisis;
}

function crisisById(room: Room, id: string): CrisisCard | undefined {
  return room.deck.crisis.find((c) => c.id === id);
}

export function concertationDone(room: Room): void {
  if (room.status !== 'CONCERT') return;
  if (room.solo) {
    const role = pickSoloRole(room);
    room.castRole = role.id;
    room.lastRoleSpoken = role.id;
    room.status = 'SPEAK';
    room.deadline = null;
    addLog(room, `Temps écoulé • c'est au tour du rôle ${role.title} de prendre la parole`);
    saveRoom(room);
    return;
  }
  const speaker = chooseSpeaker(room);
  room.lastSpeakerId = speaker?.id ?? null;
  room.status = 'SPEAK';
  room.deadline = null;
  const role = speaker?.roleId ? room.deck.roles.find((r) => r.id === speaker.roleId) : null;
  addLog(room, `Fin de la concertation • ${role ? role.title : '—'} (${speaker?.name ?? '—'}) prend la parole`);
  saveRoom(room);
}

export function chooseSpeaker(room: Room): Player | null {
  const team = currentTeam(room);
  const pool = teamPlayers(room, team).filter((p) => p.id !== room.lastSpeakerId);
  if (!pool.length) return null;
  const blockedCeo = room.blockedCeo[team] > 0;
  const weighted: Player[] = [];
  for (const p of pool) {
    const isCeo = p.roleId === 'pdg';
    if (isCeo && blockedCeo) continue;
    const weight = isCeo ? 3 : 1;
    for (let i = 0; i < weight; i++) weighted.push(p);
  }
  if (!weighted.length) return pickOne(pool);
  const chosen = pickOne(weighted);
  if (blockedCeo) room.blockedCeo[team] -= 1;
  return chosen;
}

function pickSoloRole(room: Room): { id: string; title: string } {
  const pool = room.deck.roles.filter((r) => r.id !== room.lastRoleSpoken);
  const weighted: typeof pool = [];
  for (const r of pool) {
    const weight = r.id === 'pdg' ? 3 : 1;
    for (let i = 0; i < weight; i++) weighted.push(r);
  }
  return pickOne(weighted.length ? weighted : pool);
}

export function skipConcert(room: Room): void {
  if (room.status !== 'CONCERT') throw new GameError('Pas de concertation en cours');
  addLog(room, 'Concertation interrompue • tour de parole immédiat');
  concertationDone(room);
}

export function selfEvaluate(room: Room, success: boolean): void {
  if (room.status !== 'SPEAK') throw new GameError("Aucun tour de parole en cours");
  const crisis = room.currentCrisisId ? crisisById(room, room.currentCrisisId) : undefined;
  if (!crisis) throw new GameError('Aucune crise en cours');
  if (success) {
    const half = Math.abs(Math.round(crisis.impact / 2));
    room.teamScores.A += half;
    addLog(room, `Communication jugée convaincante • ${half} pts de perte récupérés`);
  } else {
    addLog(room, 'Communication jugée insuffisante • perte complète');
  }
  room.castRole = null;
  room.status = 'PICK';
  room.deadline = null;
  room.pausedRemaining = null;
  if (!room.crisisDeck.length) {
    room.status = 'ENDED';
    addLog(room, `Plus de cartes crise • partie terminée, score final : ${room.teamScores.A} points de Réputation`);
  } else {
    beginRound(room);
  }
  saveRoom(room);
}

export function playTrap(room: Room, player: Player, trapId: string): TrapCard {
  if (room.status !== 'CONCERT') {
    throw new GameError('Les cartes piège se jouent uniquement pendant les temps de concertation');
  }
  const hand = room.hands[player.id] ?? [];
  const idx = hand.indexOf(trapId);
  if (idx === -1) throw new GameError("Cette carte piège n'est pas dans votre main");
  if (player.team === null) throw new GameError("Vous n'avez pas d'équipe");
  const trap = room.deck.traps.find((t) => t.id === trapId);
  if (!trap) throw new GameError('Carte piège inconnue', 404);

  hand.splice(idx, 1);
  const team = player.team;
  applyTrapEffect(room, team, trap);
  addLog(room, `${player.name} (équipe ${player.team}) joue la carte piège ${trap.title}`);
  saveRoom(room);
  return trap;
}

function applyTrapEffect(room: Room, team: TeamId, trap: TrapCard): void {
  const effect = trap.effect;
  const opposing: TeamId = team === 'A' ? 'B' : 'A';
  switch (effect.type) {
    case 'penalty_if_perfect': {
      room.teamScores[opposing] += effect.points;
      addLog(room, `Effet : ${effect.points} points pour l'équipe ${opposing}`);
      break;
    }
    case 'block_ceo': {
      room.blockedCeo[team] += effect.turns;
      addLog(room, `Effet : PDG de l'équipe ${team} interdit de communiquer pendant ${effect.turns} tour(s)`);
      break;
    }
    case 'cancel_turn': {
      room.cancelTurn = currentTeam(room);
      addLog(room, `Effet : le tour de l'équipe ${currentTeam(room)} pourra être annulé`);
      break;
    }
    case 'censure': {
      addLog(room, 'Effet : une réponse est censurée et comptée hors argumentaire');
      break;
    }
    case 'arbiter_debt_cancel': {
      room.teamScores[team] += effect.points;
      addLog(room, `Effet : arbitre • dettes annulées, ${effect.points} points pour l'équipe ${team}`);
      break;
    }
  }
}

/* ------------------------------------------------------------- MJ tools */

export function forceSpeaker(room: Room, playerId: string): void {
  if (room.status !== 'CONCERT') throw new GameError('Forçage possible pendant la concertation');
  const p = room.players.find((x) => x.id === playerId);
  if (!p) throw new GameError('Joueur introuvable', 404);
  room.lastSpeakerId = p.id;
  room.status = 'SPEAK';
  room.deadline = null;
  addLog(room, `MJ • ordre forcé : ${p.name} prend la parole`);
  saveRoom(room);
}

export function nextRound(room: Room): void {
  room.status = 'PICK';
  room.deadline = null;
  room.pausedRemaining = null;
  room.currentCrisisId = null;
  addLog(room, 'MJ • tour suivant');
  saveRoom(room);
  beginRound(room);
}

export function adjustScore(room: Room, team: TeamId, delta: number): void {
  room.teamScores[team] += delta;
  addLog(room, `MJ • score équipe ${team} ajusté de ${delta}`);
  saveRoom(room);
}

export function addPointsToPlayerTeam(room: Room, team: TeamId, points: number): void {
  room.teamScores[team] += points;
  addLog(room, `MJ • ${points} points ajoutés à l'équipe ${team}`);
  saveRoom(room);
}

/* -------------------------------------------------------------- timers */

export function pauseTimer(room: Room): void {
  if (room.status !== 'CONCERT') throw new GameError('Pas de minuteur en cours');
  if (room.pausedRemaining !== null) throw new GameError('Minuteur déjà en pause');
  room.pausedRemaining = room.deadline ? Math.max(0, room.deadline - Date.now()) : 0;
  room.deadline = null;
  addLog(room, 'MJ • minuteur en pause');
  saveRoom(room);
}

export function resumeTimer(room: Room): void {
  if (room.status !== 'CONCERT') throw new GameError('Pas de minuteur en cours');
  if (room.pausedRemaining === null) throw new GameError('Minuteur non en pause');
  room.deadline = Date.now() + room.pausedRemaining;
  room.pausedRemaining = null;
  addLog(room, 'MJ • minuteur relancé');
  saveRoom(room);
}

export function restartTimer(room: Room): void {
  if (room.status !== 'CONCERT') throw new GameError('Pas de minuteur en cours');
  room.pausedRemaining = null;
  room.deadline = Date.now() + CONCERT_MS;
  addLog(room, 'MJ • minuteur relancé à 2 minutes');
  saveRoom(room);
}

export function tickTimers(rooms: Room[]): void {
  for (const room of rooms) {
    if (room.status === 'REVEAL' && room.deadline && Date.now() >= room.deadline) {
      room.deadline = Date.now() + CONCERT_MS;
      room.status = 'CONCERT';
      addLog(room, 'Temps de concertation lancé : 2 minutes');
      saveRoom(room);
    } else if (room.status === 'CONCERT' && room.deadline && room.pausedRemaining === null && Date.now() >= room.deadline) {
      concertationDone(room);
    }
  }
}
