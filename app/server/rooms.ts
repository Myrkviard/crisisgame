import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import type { Deck } from '../shared/types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'rooms.json');

export const TEAMS = ['A', 'B'] as const;
export type TeamId = (typeof TEAMS)[number];

export type Phase = 'LOBBY' | 'ROLES' | 'PICK' | 'REVEAL' | 'CONCERT' | 'SPEAK' | 'ENDED';

export interface LogEntry {
  t: number;
  msg: string;
}

export interface Player {
  id: string;
  token: string;
  name: string;
  team: TeamId | null;
  roleId: string | null;
  lastSeen: number;
}

export interface Room {
  code: string;
  createdAt: number;
  status: Phase;
  solo: boolean;
  castRole: string | null;
  lastRoleSpoken: string | null;
  mjToken: string;
  lastTeamRound: TeamId;
  deck: Deck;
  deckSource: 'github' | 'fallback';
  players: Player[];
  crisisDeck: string[];
  roleDeck: string[];
  hands: Record<string, string[]>;
  round: number;
  teamScores: Record<TeamId, number>;
  crisisChoices: string[];
  currentCrisisId: string | null;
  deadline: number | null;
  pausedRemaining: number | null;
  drawOrder: string[];
  drawIndex: number;
  lastSpeakerId: string | null;
  blockedCeo: Record<TeamId, number>;
  cancelTurn: TeamId | null;
  log: LogEntry[];
  playedCrisis: string[];
}

const CHAR_POOL = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rooms = new Map<string, Room>();

function genCode(): string {
  for (let i = 0; i < 50; i++) {
    let code = '';
    for (let j = 0; j < 5; j++) code += CHAR_POOL[crypto.randomInt(CHAR_POOL.length)];
    if (!rooms.has(code)) return code;
  }
  throw new Error('impossible de générer un code');
}

function genToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export function logEntry(msg: string): LogEntry {
  return { t: Date.now(), msg };
}

export function newRoom(deck: Deck, deckSource: 'github' | 'fallback', mjName: string, solo = false): Room {
  const code = genCode();
  const room: Room = {
    code,
    createdAt: Date.now(),
    status: 'LOBBY',
    solo,
    castRole: null,
    lastRoleSpoken: null,
    mjToken: genToken(),
    lastTeamRound: 'A',
    deck,
    deckSource,
    players: [],
    crisisDeck: [],
    roleDeck: [],
    hands: {},
    round: 0,
    teamScores: { A: 0, B: 0 },
    crisisChoices: [],
    currentCrisisId: null,
    deadline: null,
    pausedRemaining: null,
    drawOrder: [],
    drawIndex: 0,
    lastSpeakerId: null,
    blockedCeo: { A: 0, B: 0 },
    cancelTurn: null,
    log: [logEntry(solo
      ? `Mode solo créé par ${mjName} • paquet ${deckSource === 'github' ? 'GitHub' : 'de secours'} (v${deck.version})`
      : `Partie créée par ${mjName} • paquet ${deckSource === 'github' ? 'GitHub' : 'de secours'} (v${deck.version})`)],
    playedCrisis: [],
  };
  rooms.set(code, room);
  persist();
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code.toUpperCase());
}

export function allRooms(): Room[] {
  return [...rooms.values()];
}

export function saveRoom(_room: Room): void {
  persist();
}

export function addLog(room: Room, msg: string): void {
  room.log.push(logEntry(msg));
  if (room.log.length > 200) room.log = room.log.slice(-100);
}

export function addPlayer(room: Room, name: string, teamPref: TeamId | null): Player {
  const token = genToken();
  const team = pickTeam(room, teamPref);
  const player: Player = {
    id: `p_${token.slice(0, 8)}`,
    token,
    name: uniqueName(room, name),
    team,
    roleId: null,
    lastSeen: Date.now(),
  };
  room.players.push(player);
  addLog(room, `${player.name} rejoint l'équipe ${team}`);
  persist();
  return player;
}

function uniqueName(room: Room, name: string): string {
  const base = name.trim().slice(0, 24) || 'Joueur';
  let candidate = base;
  let i = 2;
  const taken = new Set(room.players.map((p) => p.name.toLowerCase()));
  while (taken.has(candidate.toLowerCase())) candidate = `${base} ${i++}`;
  return candidate;
}

function pickTeam(room: Room, teamPref: TeamId | null): TeamId {
  const count = (t: TeamId) => room.players.filter((p) => p.team === t).length;
  if (teamPref && count(teamPref) < 4) return teamPref;
  const a = count('A');
  const b = count('B');
  if (a < 4 && a <= b) return 'A';
  if (b < 4) return 'B';
  throw new Error('Partie complète (8 joueurs maximum)');
}

export function findPlayer(room: Room, token: string): Player | undefined {
  return room.players.find((p) => p.token === token);
}

export function isMJ(room: Room, token: string): boolean {
  return token === room.mjToken;
}

function persist(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const data = [...rooms.values()].map(({ deck, ...rest }) => ({ ...rest, deckVersion: deck.version }));
  fs.writeFileSync(DATA_FILE, JSON.stringify(data));
}

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
