# Learning

> Génération `gen-001-76ea93` (embryo) — amorçage de la chaîne d'outils.

## Project Overview

**Anima Lab** — site pédagogique sur l'animation web : 25 leçons manipulables réparties en
trois familles (socle natif 10, GSAP 10, shaders 5). Chaque leçon est une scène animée,
des contrôles qui règlent ses paramètres, et le code source correspondant qui se met à
jour en temps réel.

Le projet est **entièrement neuf** : aucun code produit n'existe. Le dépôt contient
uniquement la connaissance — spécification, maquettes, génome REAP — committée en
`6ffe094` sur `dev`.

La présente génération ne produit **aucun code produit**. Son unique objet est un dépôt
capable de builder, typechecker, linter, tester unitairement et tester en bout en bout.
C'est le lot 0 du plan de livraison, préalable à la tranche verticale du lot 1.

Branche de travail : `chore/bootstrap-toolchain`, tirée de `dev`.

## Key Findings

### État réel du dépôt

```
.
├── .gitignore              .reap/.index/ et .DS_Store
├── CLAUDE.md               sources de vérité + section REAP gérée par reap
├── .reap/                  génome, environnement, vision, mémoire, life/
└── design/
    ├── spec-technique-anima-lab.md   344 lignes, 14 sections
    └── handoff_anima_lab/            maquettes .dc.html + README
```

Aucun `package.json`, aucun `src/`, aucun `node_modules/`. Tout est à créer.

### Ce que le génome impose à cette génération

Lu dans `genome/application.md` et `genome/invariants.md` :

- **Stack non rediscutable** : React 19 + TypeScript strict + Vite. Pas de Next.js.
- **Outillage arrêté** : Biome (format + lint), Vitest + Testing Library (unitaire),
  Playwright (bout en bout).
- **TDD strict**, dans l'ordre : test qui échoue → code minimal → revue. Aucune tâche
  annoncée terminée sans sortie de tests montrée.
- **Structure de dossiers** arrêtée en spec §12 : `shell/ scenes/ transport/ controls/
  code/ i18n/ lessons/ core/`. Les alias de chemins doivent la refléter.
- **Budget** : chargement initial sous 200 ko de JS hors Three.js. Rien à mesurer
  aujourd'hui, mais la configuration de découpage se pose maintenant.
- **Interdits pertinents ici** : aucune bibliothèque d'animation hors GSAP et API natives,
  aucune librairie de composants UI, aucun `.env` commité.

### Versions disponibles au registre (constatées, 2026-08-30)

| Paquet | Version | Contrainte moteur |
|---|---|---|
| `vite` | 8.2.2 | node `^20.19.0 \|\| >=22.12.0` |
| `react` | 19.2.8 | — |
| `@vitejs/plugin-react` | 6.1.1 | peer `vite ^8.0.0` |
| `typescript` | 7.0.2 | — |
| `@biomejs/biome` | 2.5.11 | node `>=14.21.3` |
| `vitest` | 4.1.11 | node `^20 \|\| ^22 \|\| >=24` |
| `@testing-library/react` | 16.3.3 | peer `react ^18 \|\| ^19` |
| `@playwright/test` | 1.62.1 | node `>=20` |
| `jsdom` | 30.0.1 | — |

Node local : **v22.23.2**, npm 10.9.8 — satisfait toutes les contraintes moteur.
Toutes les versions majeures courantes sont mutuellement compatibles :
`@vitejs/plugin-react@6` exige `vite@^8`, et Testing Library 16 accepte React 19.

## Technical Deep-Dive

### Point de décision : TypeScript 7

`typescript@latest` est **7.0.2** — le compilateur natif réécrit en Go. C'est le stable
courant, très nettement plus rapide, mais c'est aussi une bascule majeure : la
compatibilité de l'écosystème (plugins de types, résolution, outils tiers) n'a pas la
maturité de la lignée 5.x. TypeScript 6.0.3 reste disponible comme repli.

Le mode `strict` exigé par le génome existe dans les deux. La décision se prend en
planification ; elle se vérifie empiriquement à l'implémentation — on installe, on lance
`tsc --noEmit` sur le squelette, et on tranche sur le résultat plutôt que sur la réputation.

Point à surveiller : Biome et Vitest ne consomment pas `tsc`, ils ont leur propre
analyse ; le risque se concentre donc sur le typecheck et sur l'éditeur, pas sur la
chaîne de test.

### Tension à résoudre : TDD sur un échafaudage

Le génome impose « le test qui échoue d'abord ». Un échafaudage n'a presque rien à
tester : il n'y a pas de logique métier au lot 0.

Lecture retenue : la preuve qui échoue, ici, **c'est la commande elle-même**. Avant
installation, `npm run test` n'existe pas — c'est le rouge. La génération est verte quand
chaque commande existe et passe sur un cas trivial mais réel. Concrètement, il faut au
moins un test unitaire Vitest et un scénario Playwright qui échouent d'abord pour de
bonnes raisons (module absent), puis passent.

Ce n'est pas du TDD de façade : la question posée est « la chaîne de test fonctionne-t-elle
vraiment ? », et le seul moyen honnête d'y répondre est de la voir passer du rouge au vert.

### Ce que cette génération ne doit pas faire

Le risque principal du lot 0 est de déborder sur le lot 1. Les invariants sont explicites :
« ne jamais généraliser avant le lot 2 ». Donc **aucun** `core/types.ts`, aucun store,
aucun shell, aucune scène. Les alias de chemins peuvent pointer vers des dossiers vides ;
les remplir est le travail du lot 1.

## Backlog Review

Aucun backlog : c'est la première génération. `--no-backlog` déclaré au démarrage.

Le suivi vit dans Linear, projet `Anima` (`bb6500d8-eea7-436f-99ea-e4fb23c28664`).
Cette génération couvre l'EPIC `T3H-110` et ses tâches `T3H-133` à `T3H-138` :

| Clé | Tâche | Note |
|---|---|---|
| `T3H-132` | branche `dev` + remote `origin` | déjà **Done** |
| `T3H-133` | `.gitignore` — `.env`, `node_modules`, `dist` | partiellement fait (`.reap/.index/`, `.DS_Store`) |
| `T3H-134` | échafaudage Vite + React 19 | |
| `T3H-135` | TypeScript strict + alias de chemins | |
| `T3H-136` | Biome | |
| `T3H-137` | Vitest + Testing Library | |
| `T3H-138` | Playwright + scénario de fumée | |

## Previous Generation Reference

Aucune — première génération de la lignée. Pas de retour de fitness antérieur.

## Context for This Generation

**Niveau de clarté : élevé.**

Justification, contre les indicateurs du génome : `vision/goals.md` porte dix jalons
actionnables ; la spec tranche la stack et interdit explicitement les alternatives ; les
tâches Linear sont énumérées et bornées. Le seul facteur abaissant la clarté est le
caractère embryonnaire de la lignée — aucune génération antérieure, donc aucun retour
d'expérience. Il ne suffit pas à faire descendre l'évaluation : le périmètre du lot 0 est
mécanique, pas exploratoire.

Conséquence sur la conduite : confirmer brièvement, puis exécuter. Peu de questions.
La seule question ouverte digne d'être posée à l'humain est celle de TypeScript 7 contre 6,
et encore — elle se tranche mieux par l'essai que par la discussion.

**Hypothèses posées :**

1. Aucun secret n'est nécessaire à cette génération. Doppler n'est pas installé et ne le
   sera qu'au moment du déploiement — non bloquant ici.
2. Le dépôt distant reste vide : rien n'est poussé sans demande explicite de l'humain.
3. Les dossiers de la structure §12 peuvent être créés vides, avec leurs alias configurés,
   sans que cela constitue une anticipation du lot 1.
