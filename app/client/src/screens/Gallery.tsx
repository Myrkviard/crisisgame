import { useEffect, useState } from 'react';
import { api } from '../api';
import { ScoreboardPanel } from './Scoreboard';
import RolesPanel from './RolesPanel';

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
  const [slide, setSlide] = useState<number | null>(null);
  const [drawn, setDrawn] = useState<GalleryCrisis | null>(null);
  const [drawnHistory, setDrawnHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Bibliothèque — Crises d\'Entreprise';
    api<GalleryDeck>('/deck')
      .then(setDeck)
      .catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (slide === null || !deck) return;
    const n = deck.crisis.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setSlide((s) => (s === null ? s : (s + 1) % n));
      else if (e.key === 'ArrowLeft') setSlide((s) => (s === null ? s : (s - 1 + n) % n));
      else if (e.key === 'Escape') setSlide(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slide, deck]);

  const drawCrisis = (history: string[]): GalleryCrisis | null => {
    if (!deck) return null;
    const pool = deck.crisis.filter((c) => !history.includes(c.id));
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const deckTotal = deck ? deck.crisis.length : 0;
  const deckLeft = deck ? Math.max(0, deckTotal - drawnHistory.length) : 0;

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
        <div className="sb-nav gallery-nav-links">
          <a className="home-back-btn sb-link" href="/points">📋 Tableau des points</a>
          <a className="home-back-btn" href="/">🏠 Menu principal</a>
        </div>
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
        <button
          className="primary slide-open"
          onClick={() => { setSlide(0); setZoomCrisis(null); setZoomImage(null); }}
        >
          🖥️ Voir les 30 crises une par une (grand écran)
        </button>
      )}

      {deck && tab === 'crisis' && (
        <button
          className="primary slide-open draw-open"
          onClick={() => {
            const c = drawCrisis(drawnHistory);
            if (c) {
              setDrawn(c);
              setDrawnHistory((h) => [...h, c.id]);
            }
          }}
        >
          🎲 Tirer une carte crise au hasard
        </button>
      )}

      {deck && tab === 'crisis' && deckLeft === 0 && (
        <button className="gallery-zoom-close draw-reset" onClick={() => setDrawnHistory([])}>
          ♻️ Nouveau tirage (remettre tout le paquet)
        </button>
      )}

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

      {deck && (
        <a className="gallery-bottom-home" href="/">🏠 Menu principal</a>
      )}

      {(zoomCrisis || zoomImage) && (
        <div className="gallery-zoom" onClick={() => { setZoomCrisis(null); setZoomImage(null); }}>
          <div className="gallery-zoom-inner" onClick={(e) => e.stopPropagation()}>
            <button className="gallery-zoom-close" onClick={() => { setZoomCrisis(null); setZoomImage(null); }}>✕ Fermer</button>
            {zoomCrisis && (
              <button
                className="primary slide-open"
                onClick={() => {
                  const i = deck.crisis.findIndex((c) => c.id === zoomCrisis.id);
                  setZoomCrisis(null);
                  setSlide(i === -1 ? 0 : i);
                }}
              >
                🖥️ Plein écran — une par une
              </button>
            )}
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

      {drawn && deck && (() => {
        const thumbs = drawnHistory.slice(-8).map((id) => deck.crisis.find((c) => c.id === id)).filter(Boolean) as GalleryCrisis[];
        return (
          <div className="slide-overlay draw-overlay">
            <div className="slide-top">
              <span className="slide-counter">Tirage n°{drawnHistory.length} / {deckTotal}</span>
              <button className="gallery-zoom-close" onClick={() => setDrawn(null)}>✕ Fermer</button>
            </div>
            <div className="draw-split">
              <div className="draw-left">
                <div className="slide-stage">
                  {drawn.image
                    ? <img className="slide-img" src={drawn.image} alt={`${drawn.title} — ${drawn.sub}`} />
                    : <div className="slide-empty">Illustration indisponible</div>}
                </div>
                <div className="slide-caption">
              {thumbs.length > 0 && (
                <div className="draw-thumbs">
                  {thumbs.map((t, i) => (
                    <img
                      key={`${t.id}-${i}`}
                      className={`draw-thumb${i === thumbs.length - 1 ? ' draw-now' : ''}`}
                      src={t.image ?? ''}
                      alt={t.title}
                    />
                  ))}
                </div>
              )}
              <div className="draw-actions">
                {deckLeft > 0 ? (
                  <button
                    className="primary"
                    onClick={() => {
                      const c = drawCrisis(drawnHistory);
                      if (c) {
                        setDrawn(c);
                        setDrawnHistory((h) => [...h, c.id]);
                      }
                    }}
                  >
                    🎲 Retirer une autre
                  </button>
                ) : (
                  <span className="draw-empty-note">Paquet épuisé : remets tout le paquet pour retirer à nouveau 👇</span>
                )}
                <button
                  className="gallery-zoom-close"
                  onClick={() => { setDrawnHistory([]); setDrawn(null); }}
                >
                  ♻️ Nouveau tirage (remettre tout le paquet)
                </button>
                </div>
              </div>
              </div>
              <aside className="draw-score">
                <h2 className="draw-score-title">TABLEAU DES POINTS</h2>
                <ScoreboardPanel compact />
              </aside>
              <aside className="draw-score draw-roles">
                <RolesPanel compact />
              </aside>
            </div>
          </div>
        );
      })()}

      {slide !== null && deck && (() => {
        const n = deck.crisis.length;
        const c = deck.crisis[slide];
        if (!c) return null;
        return (
          <div className="slide-overlay" onClick={() => setSlide(null)}>
            <div className="slide-top" onClick={(e) => e.stopPropagation()}>
              <span className="slide-counter">{slide + 1} / {n}</span>
              <button className="gallery-zoom-close" onClick={() => setSlide(null)}>✕ Fermer</button>
            </div>
            <div className="slide-stage" onClick={(e) => e.stopPropagation()}>
              <button className="slide-arrow" onClick={() => setSlide((s) => (s === null ? s : (s - 1 + n) % n))} aria-label="Précédente">‹</button>
              {c.image
                ? <img className="slide-img" src={c.image} alt={`${c.title} — ${c.sub}`} />
                : <div className="slide-empty">Illustration indisponible</div>}
              <button className="slide-arrow" onClick={() => setSlide((s) => (s === null ? s : (s + 1) % n))} aria-label="Suivante">›</button>
            </div>
            <div className="slide-caption" onClick={(e) => e.stopPropagation()}>
              <span className={`sev sev-${c.sev}`}>{c.sevLabel}</span>
              <b>{c.title} — {c.sub}</b>
              <span className="slide-hint">flèches ← → du clavier, ou tapez sur les bords de l'écran</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
