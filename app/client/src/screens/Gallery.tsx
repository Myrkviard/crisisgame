import { useEffect, useState } from 'react';
import { api } from '../api';

interface GalleryCrisis {
  id: string;
  num: number;
  title: string;
  sub: string;
  company: string;
  sev: number;
  sevLabel: string;
  impact: number;
  description: string;
  image: string | null;
}

interface GalleryRole {
  id: string;
  title: string;
  image: string | null;
}

interface GalleryTrap {
  id: string;
  title: string;
  rule: string;
  image: string | null;
}

interface GalleryDeck {
  version: string;
  crisis: GalleryCrisis[];
  roles: GalleryRole[];
  traps: GalleryTrap[];
}

type Tab = 'crisis' | 'roles' | 'traps';

const TABS: { key: Tab; label: string }[] = [
  { key: 'crisis', label: 'Crises (30)' },
  { key: 'roles', label: 'Rôles (8)' },
  { key: 'traps', label: 'Pièges (5)' },
];

export default function Gallery() {
  const [deck, setDeck] = useState<GalleryDeck | null>(null);
  const [tab, setTab] = useState<Tab>('crisis');
  const [zoomCrisis, setZoomCrisis] = useState<GalleryCrisis | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Bibliothèque — Crises d\'Entreprise';
    api<GalleryDeck>('/deck')
      .then(setDeck)
      .catch((e) => setError((e as Error).message));
  }, []);

  const openCard = (id: string) => {
    if (!deck) return;
    if (tab === 'crisis') {
      const c = deck.crisis.find((x) => x.id === id);
      if (c) setZoomCrisis(c);
      return;
    }
    if (tab === 'roles') {
      const r = deck.roles.find((x) => x.id === id);
      if (r) setZoomImage(r.image);
      return;
    }
    const t = deck.traps.find((x) => x.id === id);
    if (t) setZoomImage(t.image);
  };

  return (
    <div className="screen gallery-screen">
      <div className="gallery-head">
        <div>
          <h1>⚠️ BIBLIOTHÈQUE</h1>
          <p className="gallery-sub">
            Les 43 cartes du jeu — cliquez sur une carte pour l'agrandir.
            {deck && <span className="gallery-version"> Paquet v{deck.version.slice(0, 10)}</span>}
          </p>
        </div>
        <a className="button-ghost-link" href="/">← Retour</a>
      </div>

      <div className="gallery-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`gallery-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => { setTab(t.key); setZoomCrisis(null); setZoomImage(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="error">Impossible de charger le paquet : {error}</p>}
      {!deck && !error && <p className="gallery-loading">Chargement du paquet de cartes…</p>}

      {deck && tab === 'crisis' && (
        <div className="gallery-grid">
          {deck.crisis.map((c) => (
            <button key={c.id} className="gallery-card" onClick={() => openCard(c.id)}>
              {c.image && <img src={c.image} alt={`${c.title} — ${c.sub}`} loading="lazy" />}
              <span className="gallery-card-label">
                <strong>{c.title}</strong>
                <em>{c.sub}</em>
              </span>
              <span className={`gallery-card-badge sev-${c.sev}`}>{c.impact} pts • {c.sevLabel}</span>
            </button>
          ))}
        </div>
      )}

      {deck && (tab === 'roles' || tab === 'traps') && (
        <div className="gallery-grid gallery-grid-roles">
          {(tab === 'roles'
            ? deck.roles.map((r) => ({ ...r, rule: undefined }))
            : deck.traps.map((t) => ({ ...t }))
          ).map((card) => (
            <button
              key={card.id}
              className="gallery-card"
              onClick={() => openCard(card.id)}
              title={card.rule ?? card.title}
            >
              {card.image && <img src={card.image} alt={card.title} loading="lazy" />}
              <span className="gallery-card-label"><strong>{card.title}</strong></span>
            </button>
          ))}
        </div>
      )}

      {(zoomCrisis || zoomImage) && (
        <div className="gallery-zoom" onClick={() => { setZoomCrisis(null); setZoomImage(null); }}>
          <div className="gallery-zoom-inner" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-zoom-close" onClick={() => { setZoomCrisis(null); setZoomImage(null); }}>✕ Fermer</button>
            {zoomCrisis && (
              <div className="zoom-crisis">
                <div className="zoom-crisis-cols">
                  {zoomCrisis.image && <img src={zoomCrisis.image} alt={`${zoomCrisis.title} — ${zoomCrisis.sub}`} />}
                  <div className="zoom-crisis-info">
                    <span className={`sev sev-${zoomCrisis.sev}`}>{zoomCrisis.sevLabel}</span>
                    <h2>{zoomCrisis.title}</h2>
                    <p className="zoom-sub">{zoomCrisis.sub}</p>
                    <p className="zoom-company">{zoomCrisis.company}</p>
                    <p className="zoom-desc">{zoomCrisis.description}</p>
                    <p className="zoom-impact">Impact : {zoomCrisis.impact} points de Réputation</p>
                    <p className="zoom-rule">Le joueur dispose de 1 minute pour réaliser une conférence de presse. Si les autres joueurs jugent la communication convaincante, la perte est réduite de moitié.</p>
                  </div>
                </div>
              </div>
            )}
            {!zoomCrisis && zoomImage && <img className="zoom-img" src={zoomImage} alt="Carte" />}
          </div>
        </div>
      )}
    </div>
  );
}
