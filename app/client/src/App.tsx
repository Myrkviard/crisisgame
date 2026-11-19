import { useEffect, useState } from 'react';
import { loadAuth, saveAuth, type Auth } from './api';
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
}

function parsePath(): Route {
  if (window.location.pathname === '/cartes') return { code: null, projection: false, gallery: true };
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

  if (auth && auth.code) {
    if (auth.kind === 'mj') return <MjDashboard auth={auth} onLogout={() => setAuthAndSave(null)} />;
    if (auth.kind === 'solo') return <SoloRoom auth={auth} onLogout={() => setAuthAndSave(null)} />;
    return <PlayerRoom auth={auth} onLogout={() => setAuthAndSave(null)} />;
  }

  if (route.code) return <Join code={route.code} onJoined={setAuthAndSave} />;

  return <Home onCreated={setAuthAndSave} />;
}
