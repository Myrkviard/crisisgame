import { useEffect } from 'react';
import { useRoomState } from '../api';
import Timer from '../components/Timer';
import GonePanel from '../components/GonePanel';

export default function Projection({ code }: { code: string; mode?: string }) {
  const { state, error } = useRoomState(code, null);
  useEffect(() => {
    document.title = `Projection — Partie ${code}`;
  }, [code]);

  if (!state) {
    if (/introuvable/i.test(error ?? '')) return <GonePanel />;
    return <div className="screen center projection"><p>Connexion à la partie {code}…</p></div>;
  }
  const s = state;

  return (
    <div className="screen projection">
      <header className="bar">
        <span className="brand">⚠ CRISES D'ENTREPRISE</span>
        <span className="code-chip">PARTIE {s.code}</span>
        <span className="round-chip">Tour {s.round}</span>
        <span className="chip">Équipe {s.teamToPlay} en jeu</span>
      </header>

      <div className="proj-scores">
        <div className="proj-score t-a">ÉQUIPE A<b>{s.teamScores.A}</b></div>
        <div className="proj-score t-b">ÉQUIPE B<b>{s.teamScores.B}</b></div>
      </div>

      {(s.status === 'REVEAL' || s.status === 'CONCERT') && (
        <div className="proj-timer">
          <Timer deadline={s.deadline} pausedRemaining={s.pausedRemaining} />
          <p className="proj-label">{s.status === 'REVEAL' ? 'RÉVÉLATION DE LA CRISE…' : 'CONCERTATION EN COURS'}</p>
        </div>
      )}

      {s.status === 'PICK' && (
        <div className="proj-center">
          <p className="proj-label">CHOIX DE LA CRISE</p>
          <p className="proj-team">Équipe {s.teamToPlay}</p>
          <div className="proj-faces">
            {Array.from({ length: s.crisisChoicesCount || 3 }).map((_, i) => (
              <div key={i} className="proj-facedown">?<span className="facedown-label">Carte {i + 1}</span></div>
            ))}
          </div>
        </div>
      )}

      {s.currentCrisis && s.status !== 'PICK' && (
        <div className="proj-crisis">
          {s.currentCrisis.image && <img src={s.currentCrisis.image} alt={s.currentCrisis.title} />}
          <div className="proj-crisis-info">
            <span className={`sev sev-${s.currentCrisis.sev}`}>{s.currentCrisis.sevLabel}</span>
            <h1>{s.currentCrisis.title} — {s.currentCrisis.sub}</h1>
            <p className="proj-company">{s.currentCrisis.company}</p>
            <p className="proj-desc">{s.currentCrisis.description}</p>
            <p className="proj-impact">{s.currentCrisis.impact} points de Réputation</p>
          </div>
        </div>
      )}

      {s.status === 'SPEAK' && s.speaker && (
        <div className="proj-speak">
          <p className="proj-label">À LA TRIBUNE</p>
          <p className="proj-speaker-role">{s.speaker.roleTitle}</p>
          <p className="proj-speaker-name">{s.speaker.name}</p>
        </div>
      )}

      {s.status === 'ROLES' && (
        <div className="proj-center">
          <p className="proj-label">DISTRIBUTION DES RÔLES</p>
          <p className="proj-team">Au tour de {s.nowDrawingName}</p>
        </div>
      )}

      <footer className="proj-log">
        {s.log.slice(-3).map((l, i) => <span key={i}>• {l.msg}</span>)}
      </footer>
    </div>
  );
}
