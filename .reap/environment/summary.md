# Environnement — anima

Résumé chargé à chaque session. Le détail de la structure des modules vit dans
`environment/source-map.md`, chargé à la demande.

## État actuel du dépôt

La chaîne d'outils est en place ; **aucun code produit n'est encore écrit**. Les dossiers
de la structure §12 existent, vides, avec leurs alias configurés et vérifiés par test.

```
.
├── index.html
├── package.json            sept scripts, tous vérifiés
├── tsconfig.json           strict + noUncheckedIndexedAccess, noImplicitOverride,
│                           exactOptionalPropertyTypes, verbatimModuleSyntax
├── vite.config.ts          plugin React, 9 alias, et la config Vitest (jsdom)
├── biome.json              2 espaces, guillemets simples, points-virgules au besoin, largeur 100
├── playwright.config.ts    testDir tests/e2e, webServer sur vite preview :4173
├── src/
│   ├── main.tsx App.tsx App.test.tsx vite-env.d.ts
│   ├── test/               setup.ts, aliases.test.ts
│   └── shell/ scenes/ transport/drivers/ controls/ code/ i18n/ lessons/ core/
│                           vides (.gitkeep) — remplis au lot 1
├── tests/e2e/smoke.spec.ts
├── design/                 spécification et maquettes
└── .reap/
```

`design/spec-technique-anima-lab.md` est la source de vérité comportementale : 14 sections
couvrant le produit, la stack, l'architecture, les briques, la performance, l'i18n, le
déploiement, l'accessibilité, le plan de livraison en 8 lots, et la définition du
« terminé ». Les maquettes décrivent l'apparence, la spec décrit le comportement.

## Environnement de développement

| | |
|---|---|
| Plateforme | macOS (darwin), shell zsh |
| Node | v22.23.2 |
| npm | 10.9.8 |
| Doppler | **non installé** — nécessaire seulement au déploiement (ghcr.io, Dokploy) |

Versions installées :

| Paquet | Version |
|---|---|
| `vite` | 8.2.2 |
| `react` / `react-dom` | 19.2.8 |
| `typescript` | 7.0.2 |
| `@vitejs/plugin-react` | 6.1.1 |
| `@biomejs/biome` | 2.5.11 |
| `vitest` | 4.1.11 |
| `@testing-library/react` | 16.3.3 |
| `@playwright/test` | 1.62.1 (chromium seul installé) |
| `jsdom` | 30.0.1 |

**Piège à connaître : TypeScript 7 a supprimé `baseUrl`.** Les mappings de `paths` doivent
être relatifs et commencer par `./`, sinon `TS5102` et `TS5090`. C'est le compilateur natif
écrit en Go ; il fonctionne avec Vite, Biome, Vitest et Playwright.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement Vite, `:5173` |
| `npm run build` | `tsc --noEmit && vite build` vers `dist/` |
| `npm run preview` | sert le build sur `:4173` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` | Biome — formatage et lint (`check:fix` pour écrire) |
| `npm run test` | Vitest (`test:watch` en mode veille) |
| `npm run test:e2e` | Playwright contre le build de prévisualisation |

Les tests unitaires vivent à côté du code (`src/**/*.test.{ts,tsx}`), le bout en bout dans
`tests/e2e/`. Playwright construit et sert lui-même l'application via son `webServer`.

## Dépôt et branches

Remote `origin` : `git@github.com:t3hx/anima-app.git` — dépôt **privé**, créé et vide
(aucun push effectué à ce jour).

Branches : `main`, `dev` (créée depuis `main`), `init` (worktree courant).
Modèle à deux branches permanentes : `dev` est la branche de travail, `main` reflète ce
qui est déployé — un push sur `main` est un déploiement.

Un worktree par agent, un worktree = une branche = une tâche.
Nomenclature : `<type>/<nom-en-kebab-case>` avec `feat`, `fix`, `chore`, `docs`,
`refactor`, `test`, `perf`, `style`, `ci`, `build`.
`feature/*` → `dev` en squash merge ; `dev` → `main` en merge classique.
Commits en Conventional Commits, en anglais.

## Déploiement

Chaîne cible, non encore implémentée :

```
push sur main → CI GitHub Actions → build image Docker → ghcr.io → Dokploy → VPS
```

Image multi-étapes `node:22-alpine` (build) → `nginx:alpine` (service du statique),
utilisateur non-root, image finale minimale.

Points à ne pas manquer dans `nginx.conf` :

- `try_files $uri $uri/ /index.html;` — sans cette ligne, un accès direct à
  `/fr/socle/tween` renvoie une 404, ce qui casse précisément le partage d'URL ;
- cache long et immuable sur les fichiers hachés de `assets/`, aucun cache sur
  `index.html` ;
- compression brotli ou gzip — les bundles Three.js et GSAP en dépendent fortement ;
- types MIME corrects pour `.wasm` si une dépendance en introduit.

## Suivi du travail

**Projet Linear `Anima`**, équipe `T3H`, workspace t3hx —
`bb6500d8-eea7-436f-99ea-e4fb23c28664`.

Titres au format strict : `anima - EPIC#(n) - (titre)`, `anima - FEAT#(n) - (titre)`,
`anima - TASK#(n) - (titre)`. Branches et PR référencent l'issue correspondante.

Structure créée : 10 EPIC (`T3H-110` → `T3H-119`, un par lot, chaînés en relations
`blocks`), 12 FEAT (`T3H-120` → `T3H-131`) et 28 TASK (`T3H-132` → `T3H-159`).
Le découpage FEAT/TASK ne couvre que les lots 0 et 1 — les lots suivants restent au
niveau EPIC et seront découpés au lancement de leur génération.

Un autre projet Linear, **`Anima Lab grok`** (36 issues), correspond à une tentative
antérieure de périmètre différent — 6 ateliers GSAP, pas les 25 leçons en trois familles.
Il est conservé comme archive et **ne doit pas être alimenté**.

Commandes utiles : `orca linear list-issues --project <id>`, `orca linear create`,
`orca linear status set <clé> --to <état>`, `orca linear attach --current --url <pr>`.
