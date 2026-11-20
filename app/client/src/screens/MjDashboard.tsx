import { useMemo, useState } from 'react';
import { api, useRoomState, type AnyState, type Auth } from '../api';
import type { PrivateState, PublicState } from '../../../shared/view';
import QRCode from '../components/QRCode';
import Timer from '../components/Timer';
import GonePanel from '../components/GonePanel';

type PState = PublicState & Partial<PrivateState>;

export default function MjDashboard({ auth, onLogout }: { auth: Auth; onLogout: () => void }) {
  const { state, error, reconnecting } = useRoomState(auth.code, auth.token);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const mj = async (action: string, extra: Record<string, unknown> = {}) => {
    setActionErr(null);
    try {
      await api(`/rooms/${auth.code}/mj`, { token: auth.token, action, ...extra });
    } catch (e) {
      setActionErr((e as Error).message);
    }
  };

  const joinUrl = useMemo(
    () => `${window.location.origin}/partie/${auth.code}`,
    [auth.code],
  );

  if (!state) {
    if (/introuvable/i.test(error ?? '')) return <GonePanel onLogout={onLogout} />;
    return <div className="screen center"><p>Chargement… {error ?? ''}</p></div>;
  }
  const s = state as PState;
  const projUrl = `${joinUrl}/projection`;

  return (
    <div className="screen dashboard">
      <header className="bar">
        <span className="brand">⚠ CRISES D'ENTREPRISE</span>
        <span className="code-chip">PARTIE {s.code}</span>
        <span className={`chip ${s.deckSource === 'github' ? 'ok' : 'warn'}`}>
          paquet {s.deckSource === 'github' ? 'GitHub' : 'de secours'}
        </span>
        {reconnecting && <span className="chip warn">reconnexion…</span>}
        <button className="ghost" onClick={onLogout}>Quitter</button>
      </header>

      {s.status === 'LOBBY' && (
        <section className="panel lobby-panel">
          <h2>Lobby — — {s.players.length}/8 joueurs</h2>
          <QRCode value={joinUrl} />
          <p className="join-link">{joinUrl}</p>
          <ul className="lobby-list">
            {s.players.map((p) => (
              <li key={p.id}>
                <b>{p.name}</b> — équipe {p.team} {p.connected ? '' : '(déconnecté)'}
              </li>
            ))}
            {s.players.length === 0 && <li className="muted">En attente des joueurs…</li>}
          </ul>
          <button
            className="primary"
            disabled={s.players.length < 8}
            onClick={() => mj('start')}
          >
            Lancer la partie (8 joueurs requis)
          </button>
          {actionErr && <p className="error">{actionErr}</p>}
        </section>
      )}

      {s.status !== 'LOBBY' && (
        <>
          <section className="grid2">
            <div className="panel">
              <h2>Phases</h2>
              <PhaseLine s={s} />
              {s.status === 'CONCERT' && (
                <div className="timer-wrap">
                  <Timer deadline={s.deadline} pausedRemaining={s.pausedRemaining} />
                  <div className="mj-timer-btns">
                    <button onClick={() => mj('pause')}>Pause</button>
                    <button onClick={() => mj('resume')}>Reprendre</button>
                    <button onClick={() => mj('restart-timer')}>Relancer 2 min</button>
                  </div>
                </div>
              )}
              {s.status === 'PICK' && <p>L'équipe <b>{s.teamToPlay}</b> choisit une carte crise face cachée.</p>}
              <div className="mj-timer-btns">
                <button onClick={() => mj('next-speaker')} disabled={s.status !== 'SPEAK'}>Rôle suivant →</button>
                <button onClick={() => mj('next-round')} disabled={s.status !== 'SPEAK' && s.status !== 'CONCERT'}>Passer au tour suivant</button>
                <button onClick={() => mj('end')} className="ghost">Terminer la partie</button>
              </div>
            </div>
            <div className="panel">
              <h2>Scores</h2>
              <ScoreRow team="A" score={s.teamScores.A} onAdj={(d) => mj('adjust', { team: 'A', delta: d })} />
              <ScoreRow team="B" score={s.teamScores.B} onAdj={(d) => mj('adjust', { team: 'B', delta: d })} />
              {s.blockedCeo.A + s.blockedCeo.B > 0 && (
                <p className="hint">
                  PDG bloqué — équipe A : {s.blockedCeo.A} tour(s), équipe B : {s.blockedCeo.B} tour(s).
                </p>
              )}
              {s.canceledTeam && <p className="hint warn-text">Tour annulé (BHL) en attente pour l'équipe {s.canceledTeam}.</p>}
            </div>
          </section>

          <section className="panel">
            <h2>Joueurs &amp; mains</h2>
            <table className="players-table">
              <thead><tr><th>Nom</th><th>Équipe</th><th>Rôle</th><th>Cartes piège</th><th>Ordre de parole (concertation)</th></tr></thead>
              <tbody>
                {s.players.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}{p.connected ? '' : ' ⚠'}</td>
                    <td className={`team-lbl ${p.team === 'A' ? 't-a' : 't-b'}`}>{p.team}</td>
                    <td>{p.hasRole ? '✓ secret' : '—'}</td>
                    <td>{p.handCount}</td>
                    <td>
                      {(s.status === 'CONCERT' || s.status === 'SPEAK') && !s.solo && (
                        <button onClick={() => mj('force-speaker', { playerId: p.id })}>Faire parler</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {s.status === 'ROLES' && (
        <section className="panel">
          <h2>Distribution des rôles</h2>
          <p>Au tour de : <b>{s.nowDrawingName}</b> — le joueur pioche sur son téléphone.</p>
          <ol>{s.drawOrderNames.map((n, i) => <li key={i}>{i < s.drawIndex ? `✓ ${n}` : n}</li>)}</ol>
        </section>
      )}

      {s.status === 'SPEAK' && s.speaker && (
        <section className="panel speak-banner">
          <h2>À la tribune ({s.speakIndex + 1}/{s.speakOrder.length})</h2>
          <p className="speaker-role">{s.speaker.roleTitle}</p>
          <p className="speaker-name">{s.speaker.name}</p>
        </section>
      )}

      {!s.solo && (s.status === 'CONCERT' || s.status === 'SPEAK') && s.speakOrder.length > 0 && (
        <section className="panel">
          <h2>Ordre de cette tour • défense = équipe {s.defenseTeam}</h2>
          <ol className="speak-order">
            {s.speakOrder.map((o, i) => (
              <li key={i} className={i === s.speakIndex && s.status === 'SPEAK' ? 'speak-now' : i < s.speakIndex ? 'speak-done' : ''}>
                {o.side === 'attaque' ? '⚔️ ' : '🛡️ '}
                <b>{o.roleTitle}</b> — {o.name} (équipe {o.team})
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="panel">
        <h2>Journal</h2>
        <ul className="log">
          {s.log.map((l, i) => <li key={i}>{new Date(l.t).toLocaleTimeString('fr-FR')} — {l.msg}</li>)}
        </ul>
      </section>

      <section className="panel">
        <h2>Projection</h2>
        <p className="hint">Ouvrez sur le vidéoprojecteur / grand écran : {projUrl}</p>
      </section>
    </div>
  );
}

function PhaseLine({ s }: { s: PState }) {
  const phases: [string, string][] = [
    ['LOBBY', 'Lobby'], ['ROLES', 'Rôles'], ['PICK', 'Choix crise'],
    ['REVEAL', 'Révélation'], ['CONCERT', 'Concertation'], ['SPEAK', 'Tribune'],
  ];
  const idx = phases.findIndex(([k]) => k === s.status);
  return (
    <div className="phases">
      {phases.map(([k, label], i) => (
        <span key={k} className={i === idx ? 'phase active' : i < idx ? 'phase done' : 'phase'}>{label}</span>
      ))}
      <span className="round-chip">Tour {s.round}</span>
    </div>
  );
}

function ScoreRow({ team, score, onAdj }: { team: 'A' | 'B'; score: number; onAdj: (d: number) => void }) {
  return (
    <div className="score-row">
      <span className={`team-lbl ${team === 'A' ? 't-a' : 't-b'}`}>Équipe {team}</span>
      <b className="score">{score}</b>
      <button onClick={() => onAdj(-5)}>−5</button>
      <button onClick={() => onAdj(5)}>+5</button>
    </div>
  );
}
