import { useEffect, useState } from 'react';
import RolesPanel from './RolesPanel';

const STORE_KEY = 'cg_scoreboard';

interface TeamState {
  name: string;
  score: number;
}

const DOWN = [-1, -5, -10, -15, -20, -30] as const;
const UP = [1, 5, 10, 15, 20] as const;

const TRAPS = [
  { id: 'enquete', label: 'Complément d\u2019enquête' },
  { id: 'jensen', label: 'Jensen Huang' },
  { id: 'bhl', label: 'BHL' },
  { id: 'epstein', label: 'Epstein Files' },
  { id: 'covid', label: 'Covid' },
];

export function ScoreboardPanel({ compact = false }: { compact?: boolean }) {
  const [a, setA] = useState<TeamState>({ name: 'Équipe A', score: 100 });
  const [b, setB] = useState<TeamState>({ name: 'Équipe B', score: 100 });
  const [trapsA, setTrapsA] = useState<string[]>([]);
  const [trapsB, setTrapsB] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as {
        a?: TeamState; b?: TeamState; trapsA?: unknown; trapsB?: unknown;
      } | null;
      if (saved?.a && typeof saved.a.score === 'number') setA(saved.a);
      if (saved?.b && typeof saved.b.score === 'number') setB(saved.b);
      if (Array.isArray(saved?.trapsA)) setTrapsA(saved.trapsA as string[]);
      if (Array.isArray(saved?.trapsB)) setTrapsB(saved.trapsB as string[]);
    } catch {
      /* données corrompues : on repart de 100/100 */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ a, b, trapsA, trapsB }));
  }, [a, b, trapsA, trapsB]);

  const reset = () => {
    setA((t) => ({ ...t, score: 100 }));
    setB((t) => ({ ...t, score: 100 }));
    setTrapsA([]);
    setTrapsB([]);
  };

  const toggleTrap = (side: 'A' | 'B', id: string) => {
    if (side === 'A') setTrapsA((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
    else setTrapsB((h) => (h.includes(id) ? h.filter((x) => x !== id) : [...h, id]));
  };

  const teamPanel = (
    team: TeamState,
    setTeam: (f: (t: TeamState) => TeamState) => void,
    side: 'A' | 'B',
    traps: string[],
  ) => (
    <section className={`panel sb-team sb-${side.toLowerCase()}`}>
      <input
        className="sb-name"
        value={team.name}
        maxLength={24}
        onChange={(e) => setTeam((t) => ({ ...t, name: e.target.value }))}
        aria-label={`Nom de l'équipe ${side}`}
      />
      <div className={`sb-score ${team.score < 0 ? 'sb-negative' : ''}`}>{team.score}</div>
      <p className="sb-unit">points de Réputation ({side})</p>
      <div className="sb-traps" aria-label={`Cartes pièges de l'équipe ${side}`}>
        {TRAPS.map((t) => (
          <button
            key={t.id}
            className={`sb-trap${traps.includes(t.id) ? ' used' : ''}`}
            onClick={() => toggleTrap(side, t.id)}
            title={`Piège « ${t.label} » de l'équipe ${side} — clique pour l'effacer / le faire revenir`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="sb-btns">
        {DOWN.map((d) => (
          <button key={d} className="sb-down" onClick={() => setTeam((t) => ({ ...t, score: t.score + d }))}>
            {d}
          </button>
        ))}
      </div>
      <div className="sb-btns">
        {UP.map((d) => (
          <button key={d} className="sb-up" onClick={() => setTeam((t) => ({ ...t, score: t.score + d }))}>
            +{d}
          </button>
        ))}
      </div>
      <button className="ghost" onClick={() => setTeam((t) => ({ ...t, score: 100 }))}>
        Remettre à 100
      </button>
    </section>
  );

  return (
    <div className={compact ? 'sb-compact' : 'sb-grid'}>
      {teamPanel(a, setA, 'A', trapsA)}
      {teamPanel(b, setB, 'B', trapsB)}
      <button className="ghost sb-reset" onClick={reset}>🔄 Réinitialiser les deux équipes (100 / 100)</button>
    </div>
  );
}

export default function Scoreboard() {
  useEffect(() => {
    document.title = 'Tableau des points — Crises d\'Entreprise';
  }, []);

  return (
    <div className="screen gallery-screen">
      <div className="gallery-head">
        <div>
          <h1>📋 TABLEAU DES POINTS</h1>
          <p className="gallery-sub">
            Deux équipes, 100 points de Réputation de départ — suivez les pertes de la partie (cartes physiques, démo ou vraie partie).
            Les scores sont gardés en mémoire sur cet appareil. Clique sur un piège pour l'effacer une fois joué.
          </p>
        </div>
        <div className="sb-nav">
          <a className="home-back-btn" href="/cartes">🃏 Les cartes</a>
          <a className="home-back-btn" href="/">🏠 Menu principal</a>
        </div>
      </div>

      <div className="sb-page-grid">
        <ScoreboardPanel />
        <RolesPanel />
      </div>
    </div>
  );
}
