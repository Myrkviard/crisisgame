import { useEffect, useRef, useState, useCallback } from 'react';
import type { PrivateState, PublicState } from '../../shared/view';

export type AnyState = (PublicState | PrivateState) & { at?: number };

const AUTH_KEY = 'cg_auth';

export interface Auth {
  code: string;
  token: string | null;
  kind: 'mj' | 'player' | 'solo';
  name: string;
  mjToken?: string;
}

export function loadAuth(): Auth | null {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export function saveAuth(auth: Auth | null): void {
  if (auth) localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  else localStorage.removeItem(AUTH_KEY);
}

export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`);
  return data as T;
}

export function useRoomState(code: string, token: string | null): {
  state: AnyState | null;
  error: string | null;
  reconnecting: boolean;
} {
  const [state, setState] = useState<AnyState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      const qs = token ? `?token=${encodeURIComponent(token)}` : '';
      const s = await api<AnyState>(`/rooms/${code}/state${qs}`);
      setState(s);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      refreshing.current = false;
    }
  }, [code, token]);

  useEffect(() => {
    void refresh();
    const es = new EventSource(`/api/rooms/${code}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`);
    es.addEventListener('state', () => void refresh());
    es.onerror = () => setReconnecting(true);
    es.onopen = () => setReconnecting(false);
    const poll = setInterval(() => void refresh(), 4000);
    return () => {
      es.close();
      clearInterval(poll);
    };
  }, [code, token, refresh]);

  return { state, error, reconnecting };
}
