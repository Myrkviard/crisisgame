import { useState } from 'react';
import { api, useRoomState, type AnyState, type Auth } from '../api';
import type { PrivateState, PublicState } from '../../../shared/view';
import Timer from '../components/Timer';

type PState = PublicState & Partial<PrivateState>;

export default function SoloRoom({ auth, onLogout }: { auth: Auth; onLogout: () => void }) {
  const { state, error, reconnecting } = useRoomState(auth.code, auth.token);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const mj = async (action: string) => {
    setActionErr(null);
    try {
      await api(`/rooms/${auth.code}/mj`, { token: auth.mjToken, action });
    } catch (e) {
      setActionErr((e as Error).message);
    }
  };

  const act = async (path: string, body: Record<string, unknown> = {}) => {
    setActionErr(null);
    try {
      await api(`/rooms/${auth.code}/${path}`, { token: auth.token, ...body });
    } catch (e) {
      setActionErr((e as Error).message);
      setTimeout(() => setActionErr(null), 4000);
    }
  };

  const evalute = async (success: boolean, msg: string) => {
    await act('evaluate', { success });
    setFlash(msg);
    setTimeout(() => setFlash(null), 4000);
  };

  if (!state) return <div className="screen center"><p>Chargement… {error ?? ''}</p></div>;
  const s = state as PState;

  return (
    <div className="screen player">
      <header className="bar">
        <span className="brand">⚠ CRISES D'ENTREPRISE</span>
        <span className="chip solo-chip">MODE SOLO</span>
        <span className="code-chip">{s.code}</span>
        {reconnecting && <span className="chip warn">reconnexion…</span>}
        <button className="ghost" onClick={onLogout}>Quitter</button>
      </header>

      {flash && <div className="flash">{flash}</div>}

      <section className="panel solo-scorebar">
        <div>
          <h2>🏆 Réputation</h2>
          <p className={`solo-score ${s.teamScores.A < 0 ? 'neg' : 'pos'}`}>{s.teamScores.A} pts</p>
        </div>
        <div className="solo-meta">
          <p>Tour : <b>{s.round}</b></p>
          <p>Crises restantes : <b>{s.crisisRemaining}</b></p>
          <p className="solo-links">
            <a href={`/partie/${auth.code}/projection`} target="_blank" rel="noreferrer">📺 Projection</a>
          </p>
        </div>
      </section>

      {s.status === 'LOBBY' && (
        <section className="panel center-panel">
          <h2>Mode solo</h2>
          <p>Vous incarnerez les 8 rôles : après chaque concertation, le jeu désigne aléatoirement le rôle qui doit parler (le PDG trois fois plus souvent, jamais deux fois de suite).</p>
          <button className="primary big" onClick={() => mj('start')}>▶ Démarrer la partie</button>
          {actionErr && <p className="error">{actionErr}</p>}
        </section>
      )}

      {s.status === 'PICK' && (
        <section className="panel center-panel">
          <h2>Tirez une carte crise</h2>
          <p>Choisissez une carte face cachée :</p>
          <div className="choices">
            {Array.from({ length: s.crisisChoicesCount }).map((_, i) => (
              <button key={i} className="facedown" onClick={() => act('pick-crisis', { index: i })}>
                <span>?</span>
                <span className="facedown-label">Carte {i + 1}</span>
              </button>
            ))}
          </div>
          {actionErr && <p className="error">{actionErr}</p>}
        </section>
      )}

      {s.currentCrisis && s.status !== 'LOBBY' && (
        <section className="panel">
          <h2>Crise en cours — {s.currentCrisis.sevLabel}</h2>
          <div className="crisis-mini">
            {s.currentCrisis.image && <img src={s.currentCrisis.image} alt={s.currentCrisis.title} />}
            <div>
              <p className="crisis-title">{s.currentCrisis.title} — {s.currentCrisis.sub}</p>
              <p className="crisis-company">{s.currentCrisis.company}</p>
              <p className="crisis-desc">{s.currentCrisis.description}</p>
              <p className="crisis-impact">{s.currentCrisis.impact} points de Réputation</p>
            </div>
          </div>
        </section>
      )}

      {s.status === 'REVEAL' && (
        <div className="timer-wrap center"><p className="solo-reveal-text">Révélation…</p></div>
      )}

      {s.status === 'CONCERT' && (
        <section className="panel center-panel">
          <h2>⏱ Préparez votre conférence de presse</h2>
          <Timer deadline={s.deadline} pausedRemaining={s.pausedRemaining} />
          <p className="muted">Le chrono de 2 minutes tourne. Prenez des notes, préparez votre argumentaire.</p>
          <div className="mj-timer-btns">
            <button onClick={() => mj('pause')}>Pause</button>
            <button onClick={() => mj('restart-timer')}>Relancer 2 min</button>
            <button className="primary" onClick={() => act('skip-concert')}>Je suis prêt → tour de parole</button>
          </div>
          {actionErr && <p className="error">{actionErr}</p>}
        </section>
      )}

      {s.status === 'CONCERT' && s.pausedRemaining !== null && (
        <div className="mj-timer-btns center">
          <button className="primary" onClick={() => mj('resume')}>▶ Reprendre le chrono</button>
        </div>
      )}

      {s.status === 'SPEAK' && (
        <section className="panel center-panel speak-banner">
          <h2>🎙 À la tribune</h2>
          {s.soloRole?.image && <img className="card-img card-img-role" src={s.soloRole.image} alt={s.soloRole.title} />}
          <p className="speaker-role">{s.soloRole?.title ?? '—'}</p>
          <p className="speaker-name">{s.speaker?.name ?? 'Vous'}</p>
          <p className="solo-eval-hint">
            Faites votre conférence de presse à voix haute. Puis jugez-vous honnêtement :
          </p>
          <div className="solo-eval">
            <button className="primary" onClick={() => evalute(true, 'Bien joué ! 50 % de la perte récupérée.')}>
              ✅ Communication convaincante
            </button>
            <button className="danger" onClick={() => evalute(false, "Aïe — perte complète encaissée.")}>
              ❌ La communication a échoué
            </button>
          </div>
          {actionErr && <p className="error">{actionErr}</p>}
        </section>
      )}

      {s.status === 'ENDED' && (
        <section className="panel center-panel">
          <h2>🎬 Partie terminée</h2>
          <p className={`solo-score ${s.teamScores.A < 0 ? 'neg' : 'pos'}`}>{s.teamScores.A} pts</p>
          <p>{s.round} crises gérées. Rendez-vous dans la projection ou le journal pour le détail.</p>
          <a className="primary big solo-again" href="/">Nouvelle partie</a>
        </section>
      )}

      <section className="panel">
        <h2>Journal</h2>
        <div className="mj-log">
          {[...(s.log ?? [])].reverse().map((l) => (
            <p key={l.t + l.msg} className="log-line">{l.msg}</p>
          ))}
        </div>
      </section>
    </div>
  );
}
