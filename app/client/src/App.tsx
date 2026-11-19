import { useEffect, useState } from 'react';
import { loadAuth, saveAuth, type Auth } from './api';
import Home from './screens/Home';
import Join from './screens/Join';
import MjDashboard from './screens/MjDashboard';
import PlayerRoom from './screens/PlayerRoom';
import Projection from './screens/Projection';

interface Route {
  code: string | null;
  projection: boolean;
}

function parsePath(): Route {
  const m = window.location.pathname.match(/^\/partie\/([A-Za-z0-9]{3,10})(\/projection)?/);
  if (!m) return { code: null, projection: false };
  return { code: m[1].toUpperCase(), projection: m[2] === '/projection' };
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

  if (route.code && route.projection) return <Projection code={route.code} mode="public" />;

  if (auth && auth.code) {
    if (auth.kind === 'mj') return <MjDashboard auth={auth} onLogout={() => setAuthAndSave(null)} />;
    return <PlayerRoom auth={auth} onLogout={() => setAuthAndSave(null)} />;
  }

  if (route.code) return <Join code={route.code} onJoined={setAuthAndSave} />;

  return <Home onCreated={setAuthAndSave} />;
}
