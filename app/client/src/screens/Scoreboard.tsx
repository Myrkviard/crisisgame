import { useEffect, useState } from 'react';

const STORE_KEY = 'cg_scoreboard';

interface TeamState {
  name: string;
  score: number;
}

const DOWN = [-1, -5, -10, -15, -20, -30] as const;
const UP = [1, 5, 10, 15, 20] as const;

export function ScoreboardPanel({ compact = false }: { compact?: boolean }) {
  const [a, setA] = useState<TeamState>({ name: 'Équipe A', score: 100 });
  const [b, setB] = useState<TeamState>({ name: 'Équipe B', score: 100 });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) ?? 'null') as { a?: TeamState; b?: TeamState } | null;
      if (saved?.a && typeof saved.a.score === 'number') setA(saved.a);
      if (saved?.b && typeof saved.b.score === 'number') setB(saved.b);
    } catch {
      /* données corrompues : on repart de 100/100 */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ a, b }));
  }, [a, b]);

  const reset = () => {
    setA((t) => ({ ...t, score: 100 }));
    setB((t) => ({ ...t, score: 100 }));
  };

  const teamPanel = (team: TeamState, setTeam: (f: (t: TeamState) => TeamState) => void, side: 'A' | 'B') => (
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
      {teamPanel(a, setA, 'A')}
      {teamPanel(b, setB, 'B')}
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
            Les scores sont gardés en mémoire sur cet appareil.
          </p>
        </div>
        <div className="sb-nav">
          <a className="home-back-btn" href="/cartes">🃏 Les cartes</a>
          <a className="home-back-btn" href="/">🏠 Menu principal</a>
        </div>
      </div>

      <ScoreboardPanel />
    </div>
  );
}
