export type TeamId = 'A' | 'B';

export interface PublicPlayer {
  id: string;
  name: string;
  team: TeamId | null;
  connected: boolean;
  hasRole: boolean;
  handCount: number;
}

export interface PublicState {
  code: string;
  status: string;
  solo: boolean;
  soloRole: { id: string; title: string; image: string | null } | null;
  crisisRemaining: number;
  deckSource: string;
  deckVersion: string;
  players: PublicPlayer[];
  teamScores: Record<TeamId, number>;
  round: number;
  teamToPlay: TeamId;
  crisisChoicesCount: number;
  currentCrisis: {
    id: string; title: string; sub: string; company: string; impact: number;
    description: string; sevLabel: string; sev: number; image: string | null;
  } | null;
  deadline: number | null;
  pausedRemaining: number | null;
  drawOrderNames: string[];
  drawIndex: number;
  nowDrawingName: string | null;
  speaker: { name: string; roleTitle: string } | null;
  canceledTeam: TeamId | null;
  blockedCeo: Record<TeamId, number>;
  log: { t: number; msg: string }[];
}

export interface HandTrap {
  id: string;
  title: string;
  rule: string;
  effect: unknown;
  image: string | null;
}

export interface PrivateState extends PublicState {
  you: {
    id: string; name: string; team: TeamId | null; isMJ: boolean;
    role: { id: string; title: string; image: string | null } | null;
    hand: HandTrap[];
    canDrawRole: boolean;
    canPick: boolean;
  } | null;
}
