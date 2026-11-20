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
      onCreated({ code: res.code, token: res.mjToken, kind: 'mj', name: name || 'Maître du Jeu' });
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
    <div className="screen home">
      <section className="hero">
        <div className="hero-text">
          <h1>⚠ CRISES<br />D'ENTREPRISE</h1>
          <p className="tagline">Communication • Réputation • Gestion de crise</p>
          <p className="hero-pitch">
            30 crises réelles — du Dieselgate au CrowdStrike de 2024. Deux équipes
            s'affrontent : tirage au sort des rôles, gestion sous le chrono de 2 minutes,
            conférences de presse acharnées… et cartes pièges sournoises.
          </p>
        </div>
        <img className="hero-card" src="/api/img?path=cartes%2Fdos.png" alt="Dos de carte Crises d'Entreprise" />
      </section>

      <div className="home-modes">
        <section className="panel mode-card">
          <h2>🍻 Soirée entre amis</h2>
          <p className="mode-desc">1 maître du jeu + 2 équipes de 4 joueurs, sur téléphone par QR code.</p>
          <input
            placeholder="Votre pseudo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
          />
          <button className="primary" disabled={busy || busySolo} onClick={create}>
            {busy ? 'Synchronisation du paquet…' : 'Créer la partie'}
          </button>
        </section>

        <section className="panel mode-card">
          <h2>🎮 Mode solo</h2>
          <p className="mode-desc">Vous incarnez les 8 rôles, à votre rythme. Idéal pour s'entraîner.</p>
          <button className="solo-btn" disabled={busy || busySolo} onClick={createSolo}>
            {busySolo ? 'Préparation…' : 'Jouer tout seul'}
          </button>
        </section>
      </div>

      {error && <p className="error center">{error}</p>}

      <section className="howto panel">
        <h2>Comment jouer ?</h2>
        <ol className="howto-steps">
          <li><b>Créez la partie</b> et projetez le QR code à l'écran (ou le lien de projection).</li>
          <li><b>À chaque tour, chacun reçoit un rôle secret</b> : l'équipe qui tire la crise défend (PDG, communicant, RH, ops), l'autre attaque (politique, journalistes, clients, salariés).</li>
          <li><b>À chaque tour</b>, une équipe tire une carte crise face cachée : révélation, chrono de 2 minutes, puis l'ordinateur enchaîne les tours de parole : un attaquant, puis un défenseur, etc., jusqu'à ce que tout le monde ait joué.</li>
          <li><b>Les adversaires jugent</b> la conférence de presse : convaincante, la perte est divisée par deux — sinon, points perdus. Les cartes piège ? Jouables à tout moment.</li>
        </ol>
      </section>

      <footer className="home-links">
        <a className="home-link" href="/cartes">👀 Voir toutes les cartes (30 crises, 8 rôles, 5 pièges)</a>
        <a className="home-link" href="/api/img?path=pdf%2FCrises_dEntreprise_30_cartes_A4.pdf">⬇️ PDF d'impression — les 30 cartes + dos (A4, fond perdu)</a>
        <a className="home-link" href="/api/img?path=pdf%2FCrises_dEntreprise_roles_et_pieges_A4.pdf">⬇️ PDF d'impression — rôles et pièges (A4)</a>
        <p className="footer-hint">Le paquet de cartes est chargé en direct depuis le dépôt GitHub.</p>
      </footer>
    </div>
  );
}
