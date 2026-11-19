export type Sev = 1 | 2 | 3 | 4;

export interface CrisisCard {
  id: string;
  num: number;
  sev: Sev;
  sevLabel: string;
  title: string;
  sub: string;
  company: string;
  impact: number;
  description: string;
  icon: string;
  image: string;
}

export interface RoleCard {
  id: string;
  num: number;
  title: string;
  image: string;
}

export type TrapEffect =
  | { type: 'penalty_if_perfect'; points: number }
  | { type: 'block_ceo'; turns: number }
  | { type: 'cancel_turn' }
  | { type: 'censure' }
  | { type: 'arbiter_debt_cancel'; points: number };

export interface TrapCard {
  id: string;
  num: number;
  title: string;
  rule: string;
  effect: TrapEffect;
  image: string;
}

export interface Deck {
  version: string;
  crisis: CrisisCard[];
  roles: RoleCard[];
  traps: TrapCard[];
}
