# Crises d'Entreprise — Application web

Application web multijoueur de **Crises d'Entreprise** : le Maître du Jeu crée une partie, affiche un QR code, les 8 joueurs rejoignent par téléphone (1 MJ + 2 équipes de 4). Les cartes sont synchronisées depuis ce dépôt GitHub à chaque création de partie.

## Stack

- **Serveur** : Node + Express (TypeScript), API REST + Server-Sent Events pour le temps réel
- **Client** : React + Vite (TypeScript), mobile-first, thème sombre « gestion de crise »
- **Stockage** : JSON sur disque (`app/data/rooms.json`)
- **QR code** : bibliothèque `qrcode` (contactless join)

## Démarrage (développement)

```bash
cd app
npm install
npm run dev:server      # serveur sur :3000
npm run dev:client      # Vite sur :5173 (proxy /api → :3000)
```

## Production

```bash
npm run build           # compile le serveur (dist-server/) + le client (client/dist/)
npm start               # sert l'API + la SPA sur $PORT (défaut 3000)
```

Le QR code de lobby pointe vers l'origine du serveur : exposez l'app en HTTPS pour que les
téléphones puissent scanner (caméras impossibles en HTTP).

## Paquet de cartes (synchronisation GitHub)

À la **création de chaque partie**, le serveur charge `deck/crisisgame.deck.json` depuis :

- `GITHUB_RAW_BASE` (défaut `https://raw.githubusercontent.com/Myrkviard/crisisgame/main/`) + `deck/crisisgame.deck.json`, ou
- `DECK_URL` (URL complète en override)

En cas d'échec (repo privé, réseau coupé), un **paquet de secours local** est utilisé
(`app/server/default-deck.json`) et l'état du paquet est affiché sur le dashboard MJ.

## Modèle de données des cartes

```jsonc
{
  "version": "ISO-8601",
  "crisis": [{ "id", "num", "sev": 1-4, "sevLabel", "title", "sub", "company",
               "impact": -10|-15|-20|-30, "description", "icon", "image" }],
  "roles":  [{ "id", "num", "title", "image" }],
  "traps":  [{ "id", "num", "title", "rule", "image",
               "effect": { "type": "penalty_if_perfect"|"block_ceo"|"cancel_turn"
                          |"censure"|"arbiter_debt_cancel", ... } }]
}
```

Effets de pièges (appliqués côté serveur, journalisés pour le MJ) :

| type | effet |
|---|---|
| `penalty_if_perfect` | retire `points` à l'équipe adverse |
| `block_ceo` | PDG de l'équipe interdit de parler pendant `turns` tour(s) |
| `cancel_turn` | annule le prochain tour de l'équipe qui pioche |
| `censure` | réponse censurée (marquée hors argumentaire) |
| `arbiter_debt_cancel` | l'arbitre ajoute `points` à une équipe |

## Boucle de jeu

1. **Lobby** — le créateur devient MJ, QR code affiché, max 4 joueurs/équipe, équilibrage auto.
2. **Distribution des rôles** — pioche tour par tour (un joueur à la fois), rôle secret visible du seul joueur + MJ.
3. **Boucle** — l'équipe en jeu pioche une carte crise parmi 3 face cachée → révélation animée → **minuteur 2 min** serveur (pause/relance MJ) → à l'échéance, choix **aléatoire pondéré sans répétition immédiate** du rôle qui prend la parole (PDG ×3).
4. **Pièges** — jouables uniquement pendant la concertation (bouton actif), effet appliqué et annoncé.
5. **Écran projection** — `/partie/{code}/projection` : carte crise, chrono géant, scores, tribune.

## Configuration

| Variable | Défaut | Rôle |
|---|---|---|
| `PORT` | `3000` | port d'écoute |
| `GITHUB_RAW_BASE` | raw de ce repo | base des images + deck |
| `DECK_URL` | `{GITHUB_RAW_BASE}deck/crisisgame.deck.json` | source du paquet |
