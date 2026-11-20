import { useState } from 'react';
import { api, useRoomState, type AnyState, type Auth } from '../api';
import type { PrivateState, PublicState } from '../../../shared/view';
import Timer from '../components/Timer';
import GonePanel from '../components/GonePanel';

type PState = PublicState & Partial<PrivateState>;

export default function PlayerRoom({ auth, onLogout }: { auth: Auth; onLogout: () => void }) {
  const { state, error } = useRoomState(auth.code, auth.token);
  const [actionErr, setActionErr] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const act = async (path: string, body: Record<string, unknown>, okMsg?: string) => {
    setActionErr(null);
    try {
      const res = await api<Record<string, unknown>>(`/rooms/${auth.code}/${path}`, { token: auth.token, ...body });
      if (okMsg) setFlash(okMsg);
      const st = (res.state ?? res) as AnyState | undefined;
      if (st && (st as PrivateState).you?.hand !== undefined) {
        const hand = (st as PrivateState).you!.hand;
        if (hand.length === 0 && path === 'play-trap') setFlash('Carte piège jouée !');
      }
      setTimeout(() => setFlash(null), 4000);
    } catch (e) {
      setActionErr((e as Error).message);
      setTimeout(() => setActionErr(null), 4000);
    }
  };

  if (!state) {
    if (/introuvable/i.test(error ?? '')) return <GonePanel onLogout={onLogout} />;
    return <div className="screen center"><p>Chargement… {error ?? ''}</p></div>;
  }
  const s = state as PState;
  const you = s.you;

  return (
    <div className="screen player">
      <header className="bar">
        <span className="brand">⚠ CRISES D'ENTREPRISE</span>
        <span className="code-chip">{s.code}</span>
        <button className="ghost" onClick={onLogout}>Quitter</button>
      </header>

      {flash && <div className="flash">{flash}</div>}
      {s.status === 'CONCERT' && s.status && (
        <div className="concert-banner">🎵 Temps de concertation — les cartes piège sont jouables à tout moment !</div>
      )}

      {!you?.role && s.status === 'ROLES' && (
        <section className="panel center-panel">
          <h2>Distribution des rôles</h2>
          {you?.canDrawRole ? (
            <>
              <p>C'est votre tour de piocher votre rôle secret.</p>
              <button className="primary big" onClick={() => act('draw-role', {}, 'Rôle reçu ! (détail ci-dessous)')}>
                🎴 Piocher mon rôle
              </button>
            </>
          ) : (
            <p className="muted">Au tour de <b>{s.nowDrawingName}</b>… Patientez.</p>
          )}
          {actionErr && <p className="error">{actionErr}</p>}
        </section>
      )}

      {you?.role && (
        <section className="panel center-panel role-card">
          <h2>Votre rôle secret — {you.roleSide === 'attaque' ? '⚔️ Attaque' : '🛡️ Défense'}</h2>
          {you.role.image
            ? <img className="card-img card-img-role" src={you.role.image} alt={you.role.title} />
            : <p className="speaker-role">{you.role.title}</p>}
          <p className="muted">Les rôles sont redistribués à chaque tour : attaque ou défense selon l'équipe qui tire la crise.</p>
        </section>
      )}

      {s.status === 'PICK' && (
        <section className="panel center-panel">
          <h2>Choix de la crise</h2>
          {you?.canPick ? (
            <>
              <p>Votre équipe choisit une carte face cachée :</p>
              <div className="choices">
                {Array.from({ length: s.crisisChoicesCount }).map((_, i) => (
                  <button key={i} className="facedown" onClick={() => act('pick-crisis', { index: i })}>
                    <span>?</span>
                    <span className="facedown-label">Carte {i + 1}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">L'équipe <b>{s.teamToPlay}</b> tire la crise et défend. Vous pouvez jouer un piège à tout moment.</p>
          )}
        </section>
      )}

      {s.status !== 'LOBBY' && s.status !== 'ROLES' && !(s.status === 'PICK' && !you?.canPick) && s.currentCrisis && (
        <section className="panel">
          <h2>Crise en cours — {s.currentCrisis.sevLabel}</h2>
          <div className="crisis-mini">
            {s.currentCrisis.image && <img src={s.currentCrisis.image} alt={s.currentCrisis.title} />}
            <div>
              <p className="crisis-title">{s.currentCrisis.title} — {s.currentCrisis.sub}</p>
              <p className="crisis-desc">{s.currentCrisis.description}</p>
              <p className="crisis-impact">{s.currentCrisis.impact} points de Réputation</p>
            </div>
          </div>
        </section>
      )}

      {(s.status === 'REVEAL' || s.status === 'CONCERT') && (
        <div className="timer-wrap center">
          <Timer deadline={s.deadline} pausedRemaining={s.pausedRemaining} />
        </div>
      )}

      {s.status === 'SPEAK' && s.speaker && (
        <section className="panel speak-banner">
          <h2>À la tribune ({s.speakIndex + 1}/{s.speakOrder.length})</h2>
          <p className="speaker-role">{s.speaker.roleTitle}</p>
          <p className="speaker-name">{s.speaker.name}</p>
        </section>
      )}

      <section className="panel">
        <h2>Votre main — cartes piège</h2>
        {!you?.hand?.length && <p className="muted">Aucune carte piège en main.</p>}
        <div className="hand">
          {you?.hand?.map((t) => (
            <div key={t.id} className="trap">
              {t.image && <img src={t.image} alt={t.title} />}
              <b>{t.title}</b>
              <p>{t.rule}</p>
              <button
                className="danger"
                onClick={() => act('play-trap', { trapId: t.id }, `Piège lancé : ${t.title} !`)}
              >
                🎯 Lancer le piège
              </button>
            </div>
          ))}
        </div>
        {actionErr && <p className="error">{actionErr}</p>}
      </section>

      <section className="panel scores-mini">
        <h2>Équipes</h2>
        <p>Équipe A : <b>{s.teamScores.A}</b> • Équipe B : <b>{s.teamScores.B}</b></p>
      </section>
    </div>
  );
}
