import { useState } from 'react';
import { api, type Auth } from '../api';

export default function Join({ code, onJoined }: { code: string; onJoined: (a: Auth) => void }) {
  const [name, setName] = useState('');
  const [team, setTeam] = useState<'A' | 'B' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ token: string; team: 'A' | 'B' }>(`/rooms/${code}/join`, { name, team });
      const url = `/partie/${code}`;
      window.history.pushState({}, '', url);
      onJoined({ code, token: res.token, kind: 'player', name });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen center">
      <div className="logo small">
        <h1>PARTIE <span className="code">{code}</span></h1>
      </div>
      <div className="panel">
        <h2>Rejoindre l'équipe</h2>
        <input
          placeholder="Votre pseudo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && join()}
        />
        <div className="team-pick">
          <button className={team === 'A' ? 'team-a selected' : 'team-a'} onClick={() => setTeam(team === 'A' ? null : 'A')}>
            Équipe A
          </button>
          <button className={team === 'B' ? 'team-b selected' : 'team-b'} onClick={() => setTeam(team === 'B' ? null : 'B')}>
            Équipe B
          </button>
        </div>
        <p className="hint">L'équilibrage est automatique si les équipes sont pleines.</p>
        <button className="primary" disabled={busy || !name.trim()} onClick={join}>
          {busy ? 'Connexion…' : 'Rejoindre'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
