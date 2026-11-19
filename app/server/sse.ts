import type { Response } from 'express';

interface Client {
  id: string;
  code: string;
  token: string | null;
  res: Response;
  send: (event: string, data: unknown) => void;
}

const clients = new Set<Client>();
let seq = 0;

export function addClient(code: string, token: string | null, res: Response): () => void {
  const id = `c_${++seq}`;
  const client: Client = {
    id,
    code,
    token,
    res,
    send: (event, data) => {
      try {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch {
        clients.delete(client);
      }
    },
  };
  clients.add(client);
  return () => clients.delete(client);
}

export function broadcast(code: string, event: string, data: unknown): void {
  for (const c of clients) {
    if (c.code === code) c.send(event, data);
  }
}
