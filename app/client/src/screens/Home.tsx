import { useState } from 'react';
import { api, type Auth } from '../api';

export default function Home({ onCreated }: { onCreated: (a: Auth) => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ code: string; mjToken: string; deckSource: string }>('/rooms', { name });
      const url = `/partie/${res.code}`;
      window.history.pushState({}, '', url);
      onCreated({ code: res.code, token: res.mjToken, kind: 'mj', name });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen center">
      <div className="logo">
        <span className="logo-alert">⚠</span>
        <h1>CRISES<br />D'ENTREPRISE</h1>
        <p className="tagline">Communication • Réputation • Gestion de crise</p>
      </div>
      <div className="panel">
        <h2>Créer une partie</h2>
        <p className="hint">Vous serez le Maître du Jeu. Les joueurs rejoignent par QR code.</p>
        <input
          placeholder="Votre pseudo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
        />
        <button className="primary" disabled={busy} onClick={create}>
          {busy ? 'Synchronisation du paquet…' : 'Créer la partie'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
      <a className="gallery-link" href="/cartes">👀 Voir les cartes, les rôles et les pièges</a>
      <p className="footer-hint">10 places : 1 Maître du Jeu + 2 équipes de 4 joueurs.</p>
    </div>
  );
}
