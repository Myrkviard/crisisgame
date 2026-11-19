import { useEffect, useState } from 'react';

export default function Timer({ deadline, pausedRemaining }: {
  deadline: number | null;
  pausedRemaining: number | null;
}) {
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(id);
  }, []);
  if (pausedRemaining !== null && pausedRemaining !== undefined) {
    return <div className="timer paused">⏸ {fmt(pausedRemaining)}</div>;
  }
  if (deadline == null) return null;
  const remain = Math.max(0, deadline - Date.now());
  const danger = remain < 30_000;
  return <div className={`timer ${danger ? 'danger' : ''}`}>{fmt(remain)}</div>;
}

function fmt(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
