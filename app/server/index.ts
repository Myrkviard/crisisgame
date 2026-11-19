import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { api } from './routes.js';
import { startTimers } from './timers.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.disable('x-powered-by');

app.use('/api', api);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route API introuvable' }));

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`[crisisgame] serveur prêt sur http://0.0.0.0:${PORT}`);
});

startTimers();

const shutdown = () => {
  console.log('[crisisgame] arrêt…');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 3000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
