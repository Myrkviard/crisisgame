import { saveAuth } from '../api';

export default function GonePanel({ onLogout }: { onLogout?: () => void }) {
  return (
    <div className="screen center">
      <section className="panel gone-panel">
        <h2>🎬 Partie introuvable</h2>
        <p className="muted">
          Cette partie n'existe plus : le serveur a été redémarré ou la partie est
          déjà terminée. Lancez-en une nouvelle depuis le menu !
        </p>
        <a
          className="primary gone-home"
          href="/"
          onClick={() => {
            if (onLogout) onLogout();
            else saveAuth(null);
          }}
        >
          🏠 Menu principal
        </a>
      </section>
    </div>
  );
}
