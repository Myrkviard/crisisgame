# Crises d'Entreprise — Jeu de cartes

Jeu de 30 crises d'entreprise réelles + 8 cartes de rôles + 5 cartes pièges, avec épreuve de communication de crise.
2 à 8 joueurs • 30 cartes + 8 rôles + 5 pièges • ~20 minutes.

## Contenu du dépôt

```
pdf/
  Crises_dEntreprise_30_cartes_A4.pdf         ← version imprimeur, 300 dpi (22 Mo, 10 pages)
  Crises_dEntreprise_30_cartes_A4_light.pdf   ← version allégée 200 dpi (7 Mo, 10 pages)
  Crises_dEntreprise_roles_et_pieges_A4.pdf   ← les 8 rôles (version simple) + 5 pièges, 300 dpi (6 Mo, 4 pages)
cartes/
  card_01_perrier.png … card_30_azf.png       ← les 30 cartes en fichiers individuels (300 dpi)
  dos.png                                     ← dos unique du jeu
  roles/
    role_01_pdg.png … role_08_ops.png         ← les 8 cartes de rôle — nom + illustration (300 dpi)
  pieges/
    piege_01_enquete.png … piege_05_covid.png ← les 5 cartes piège (300 dpi)
```

## Application web (jouer en ligne)

Voir [app/README.md](app/README.md) — jeu multijoueur : QR code, 1 Maître du Jeu + 2 équipes de 4, cartes crises/rôles/pièges, minuteur 2 min, écran projection. Le paquet de cartes (`deck/crisisgame.deck.json`) est chargé depuis ce dépôt à chaque partie.

## Impression

1. **Papier** : A4 250-300 g/m² (papier photo brillant pour un rendu premium).
2. **Impression** : recto-verso, **sans** mise à l'échelle (« Taille réelle / 100 % »), qualité maximale.
   - Deck crises : recto pages 1 à 5, verso pages 6 à 10 (retournement **bord long**).
   - Rôles & pièges : recto pages 1 à 3, verso page 4 (dos commun).
3. **Découpe** : chaque carte fait **63 × 88 mm** (format carte à jouer) avec **3 mm de fond perdu**.
   Coupez en suivant les traits de coupe gris imprimés dans les marges ; en cas de léger écart, le fond perdu évite les liserés blancs.
4. Optionnel : couche de plastification mat ou brillant pour un toucher « carte premium ».

## Règle express (avec rôles)

1. Attribuez les 8 rôles. **PDG** (aidé du **Directeur de la com.**) joue les tours ; les 6 autres rôles jugent.
2. Le PDG pioche une carte crise, la lit à voix haute et dispose d'**1 minute** de conférence de presse.
3. Pendant le discours, chaque juge applique son pouvoir (question piège des journalistes, audition politique, etc.).
4. À la fin, chaque juge vote **OUI / NON** à voix haute (vote des journalistes compte double).
5. **Majorité de OUI** : la perte de Réputation est **divisée par deux** (ex. −20 → −10).
6. Première « entreprise » à franchir le seuil convenu (ex. −60 points perdus) est éliminée.

### Cartes piège (5)

À utiliser selon les règles maison : jouées à tout moment d'un tour.

| Carte | Effet |
|---|---|
| **Complément d'enquête** | Enlève automatiquement 15 points à l'équipe adverse si l'entreprise gère parfaitement sa communication |
| **Jensen Huang** | Interdit au PDG de l'entreprise de communiquer pendant 1 tour |
| **Bernard Henri Lévy** | Permet d'annuler un tour si l'entreprise prend l'eau |
| **Epstein Files** | Permet de censurer une réponse directement après qu'elle a été donnée : elle ne compte plus dans l'argumentaire |
| **Covid** | Permet à l'arbitre d'annuler des dettes sans explication et de rajouter 15 points à une entreprise |

### Rôles et pouvoirs

| Rôle | Camp | Pouvoir |
|---|---|---|
| PDG | Défense | Anime la conférence ; objectif : limiter l'impact |
| Directeur de la com. | Défense | Souffre 3 mots-clés au PDG avant la minute fatale |
| Journalistes | Juges | Question piège à la 30e seconde • vote double |
| Politique | Juges | Audition : réponse floue = +5 points de perte |
| Clients | Juges | Boycott : aucun geste concret = +10 points de perte |
| Salariés | Juges | Grève : plan qui sacrifie les équipes = +10 points |
| RH | Juges | Plan humain crédible = −5 points de perte |
| Responsable des ops | Juges | Rapport technique : corrige publiquement le PDG |

### Échelle de gravité des crises

| Couleur | Gravité | Impact |
|---|---|---|
| Jaune | Grave | −10 Réputation |
| Orange | Très grave | −15 Réputation |
| Rouge | Critique | −20 Réputation |
| Noir | Catastrophique | −30 Réputation |

## Les 30 crises

Perrier, Ryanair, Amazon, United Airlines, Tylenol, Carrefour ·
Volkswagen, Samsung, Sony Pictures, Findus, Tesla, Uber, SNCF, Boeing, TikTok ·
Cambridge Analytica/Facebook, Equifax, Credit Suisse, Yahoo, Colonial Pipeline, Lactalis, Wirecard, Casino ·
BP, Enron, Lehman Brothers, FTX, CrowdStrike, Exxon Valdez, AZF Toulouse.
