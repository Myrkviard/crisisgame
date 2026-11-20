import { useEffect, useState } from 'react';
import { api, loadAuth, saveAuth, type Auth } from './api';
import Home from './screens/Home';
import Join from './screens/Join';
import MjDashboard from './screens/MjDashboard';
import PlayerRoom from './screens/PlayerRoom';
import Projection from './screens/Projection';
import Gallery from './screens/Gallery';
import SoloRoom from './screens/SoloRoom';

interface Route {
  code: string | null;
  projection: boolean;
  gallery?: boolean;
  demo?: boolean;
}

function parsePath(): Route {
  if (window.location.pathname === '/cartes') return { code: null, projection: false, gallery: true };
  if (window.location.pathname === '/demo') return { code: null, projection: false, gallery: false, demo: true };
  const m = window.location.pathname.match(/^\/partie\/([A-Za-z0-9]{3,10})(\/projection)?/);
  if (!m) return { code: null, projection: false, gallery: false };
  return { code: m[1].toUpperCase(), projection: m[2] === '/projection', gallery: false };
}

export default function App() {
  const [auth, setAuth] = useState<Auth | null>(() => loadAuth());
  const [route, setRoute] = useState<Route>(() => parsePath());

  useEffect(() => {
    const onPop = () => setRoute(parsePath());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    if (!auth) return;
    if (route.code && route.code !== auth.code) {
      saveAuth(null);
      setAuth(null);
    }
  }, [auth, route.code]);

  const setAuthAndSave = (a: Auth | null) => {
    saveAuth(a);
    setAuth(a);
  };

  if (route.projection && route.code) return <Projection code={route.code} mode="public" />;

  if (route.gallery) return <Gallery />;

  if (route.demo) return <DemoGate auth={auth} setAuth={setAuthAndSave} />;

  if (auth && auth.code) {
    if (auth.kind === 'mj') return <MjDashboard auth={auth} onLogout={() => setAuthAndSave(null)} />;
    if (auth.kind === 'solo') return <SoloRoom auth={auth} onLogout={() => setAuthAndSave(null)} />;
    return <PlayerRoom auth={auth} onLogout={() => setAuthAndSave(null)} />;
  }

  if (route.code) return <Join code={route.code} onJoined={setAuthAndSave} />;

  return <Home onCreated={setAuthAndSave} />;
}

function DemoGate({ auth, setAuth }: { auth: Auth | null; setAuth: (a: Auth | null) => void }) {
  const [attempt, setAttempt] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (auth?.demo) return;
    let cancelled = false;
    setErr(null);
    (async () => {
      for (let i = 0; i < 6 && !cancelled; i++) {
        try {
          const res = await api<{ code: string; mjToken: string; deckSource: string }>('/demo', {});
          if (cancelled) return;
          setAuth({ code: res.code, token: res.mjToken, kind: 'mj', name: 'Démo', demo: true });
          return;
        } catch {
          if (cancelled) return;
          setErr('Le serveur se réveille… quelques secondes ⏳');
          await new Promise((r) => setTimeout(r, 4000));
        }
      }
      if (!cancelled) setErr('Impossible de créer la démo pour le moment.');
    })();
    return () => { cancelled = true; };
  }, [auth?.demo, attempt, setAuth]);

  if (auth?.demo) return <MjDashboard auth={auth} onLogout={() => { setAuth(null); window.location.href = '/'; }} />;
  return (
    <div className="screen center">
      <p>{err ?? 'Préparation de la démo…'}</p>
      {err && (
        <button className="primary" onClick={() => { setErr(null); setAttempt((a) => a + 1); }}>
          🔄 Réessayer
        </button>
      )}
      <p style={{ marginTop: 16 }}><a href="/" style={{ color: 'inherit' }}>← Menu principal</a></p>
    </div>
  );
}
