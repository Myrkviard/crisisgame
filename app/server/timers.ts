import { allRooms } from './rooms.js';
import { tickTimers } from './engine.js';

let timer: NodeJS.Timeout | null = null;

export function startTimers(): void {
  if (timer) return;
  timer = setInterval(() => {
    try {
      tickTimers(allRooms());
    } catch (err) {
      console.error('[timers]', err);
    }
  }, 500);
  timer.unref();
}

export function stopTimers(): void {
  if (timer) clearInterval(timer);
  timer = null;
}
