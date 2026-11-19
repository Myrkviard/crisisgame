import { useState } from 'react';
import { api, type Auth } from '../api';

export default function Home({ onCreated }: { onCreated: (a: Auth) => void }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [busySolo, setBusySolo] = useState(false);
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

  const createSolo = async () => {
    setBusySolo(true);
    setError(null);
    try {
      const res = await api<{ code: string; mjToken: string; playerToken: string; deckSource: string }>(
        '/rooms', { name: name || 'Joueur Solo', mode: 'solo' },
      );
      const url = `/partie/${res.code}`;
      window.history.pushState({}, '', url);
      onCreated({ code: res.code, token: res.playerToken, mjToken: res.mjToken, kind: 'solo', name: name || 'Joueur Solo' });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusySolo(false);
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
        <p className="hint">Vous serez le Maître du Jeu. Les 8 joueurs rejoignent par QR code.</p>
        <input
          placeholder="Votre pseudo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
        />
        <button className="primary" disabled={busy || busySolo} onClick={create}>
          {busy ? 'Synchronisation du paquet…' : 'Créer la partie (1 MJ + 8 joueurs)'}
        </button>
        <div className="home-sep">ou</div>
        <button className="solo-btn" disabled={busy || busySolo} onClick={createSolo}>
          {busySolo ? 'Préparation du mode solo…' : '🎮 Mode solo — je joue tous les rôles'}
        </button>
        {error && <p className="error">{error}</p>}
      </div>
      <a className="gallery-link" href="/cartes">👀 Voir les cartes, les rôles et les pièges</a>
      <p className="footer-hint">10 places : 1 Maître du Jeu + 2 équipes de 4 joueurs.</p>
    </div>
  );
}
