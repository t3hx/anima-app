# Environnement — anima

Résumé chargé à chaque session. Le détail de la structure des modules vit dans
`environment/source-map.md`, chargé à la demande.

## État actuel du dépôt

**Le lot 1 est livré** : le contrat de données, le shell générique et une leçon complète —
`native-tween`. 186 tests unitaires, 64 scénarios Playwright.

```
.
├── CLAUDE.md               conventions, commandes, **procédure d'ajout d'une leçon**
├── index.html              polices Google (Instrument Sans, IBM Plex Mono)
├── vite.config.ts          9 alias, config Vitest, entrée conditionnelle du harnais e2e
├── src/
│   ├── core/               contrat, store, registre, courbes, mouvement réduit,
│   │                       redessin, diagnostics
│   ├── shell/              routes, Nav, LessonShell, LessonRoute, FamilyRoute, Home,
│   │                       useLessonDriver
│   ├── scenes/             CanvasLayer, CanvasHost, WebglScene, PerspectiveRig,
│   │                       SceneOverlay, floorTexture, projection, sceneStore
│   ├── transport/          TimeDriver, TransportBar, drivers/waapi
│   ├── controls/           ControlPanel + slider, choice, toggle, ease, ValueReadout
│   ├── code/               generate, CodePanel, useDeferredValues
│   ├── i18n/               fr, en, translate, localeStore
│   ├── lessons/native/tween/  lesson.ts, animation.ts, concept.fr.md
│   └── styles/             tokens.css, base.css
├── tests/e2e/              12 fichiers, dont harness/ (banc d'essai du driver)
└── design/                 spécification et maquettes
```

## Ce qu'il faut savoir pour toucher au code

**Le contrat a cinq champs absents de la spec §3**, chacun imposé par un cas réel :
`ParamValues`, `Lesson.slug`, `Lesson.animate`, `Lesson.timing`, `Param.visibleWhen`.

**Trois environnements, trois limites :**

| | Ce qui n'y marche pas |
|---|---|
| jsdom | aucune API Web Animations, aucun WebGL, un `input[type=range]` ne bouge pas aux flèches |
| Playwright | Chromium seul est installé |
| `frameloop="demand"` | rien ne se redessine sans un appel à `requestRedraw` (`@core/redraw`) |

**Les diagnostics sont exposés sur `window.__anima`** : `liveDrivers()`, `webgl()`,
`subject()`. Le point 7 du « terminé » n'est pas observable autrement —
`document.getAnimations()` est aveugle aux animations à cible nulle, ce qui est mesuré et
figé par un test.

**Le harnais e2e** (`tests/e2e/harness/`) n'entre dans le build que sous `E2E_HARNESS`,
posé par le `webServer` de Playwright. Il exerce le driver WAAPI dans un vrai navigateur.

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
| `three` / `@react-three/fiber` / `@react-three/drei` | 0.185.1 / 9.7.0 / 10.7.8 |
| `zustand` | 5.0.15 |
| `react-router` | 8.3.1 |
| `pngjs` | lecture des pixels dans les scénarios Playwright |
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

Remote `origin` : `git@github.com:t3hx/anima-app.git` — dépôt **privé**. `dev` porte le
lot 0 ; le lot 1 arrive par `feat/native-tween-vertical-slice`.

Branches : `main`, `dev` (créée depuis `main`).
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
