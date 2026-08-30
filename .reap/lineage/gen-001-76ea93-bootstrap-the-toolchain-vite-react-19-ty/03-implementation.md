# Implementation

> Génération `gen-001-76ea93` (embryo) — lot 0, amorçage de la chaîne d'outils.
> Branche `chore/bootstrap-toolchain`, tirée de `dev` en `6ffe094`.

## Completed Tasks

| # | Tâche | État | Note |
|---|---|---|---|
| T001 | `.gitignore` | ✅ | `.env*` (avec exception `.env.example`), `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`, `blob-report/`, `*.tsbuildinfo` |
| T002 | `package.json` + React 19 + Vite 8 | ✅ | react 19.2.8, react-dom 19.2.8, vite 8.2.2, @vitejs/plugin-react 6.1.1 |
| T003 | TypeScript 7 | ✅ | **7.0.2 retenu, pas de repli** — voir « Décision tranchée » |
| T004 | Squelette `index.html` / `main.tsx` / `App.tsx` | ✅ | `StrictMode` actif, garde explicite sur `#root` absent |
| T005 | `vite.config.ts` + alias | ✅ | 9 alias reflétant la structure §12 |
| T006 | `tsconfig.json` strict | ✅ | + `noUncheckedIndexedAccess`, `noImplicitOverride`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax` |
| T007 | Dossiers §12 vides | ✅ | `.gitkeep` dans les 9 dossiers |
| T008 | Scripts `dev`/`build`/`preview`/`typecheck` | ✅ | `build` enchaîne `tsc --noEmit && vite build` |
| T009 | Biome | ✅ | 2 espaces, guillemets simples, points-virgules au besoin, largeur 100 |
| T010 | Passage Biome + idempotence | ✅ | 1 fichier reformaté, second passage sans modification |
| T011 | Vitest + jsdom + Testing Library | ✅ | config dans `vite.config.ts`, `globals: false`, `cleanup` après chaque test |
| T012 | Test d'alias | ✅ | **vert d'emblée — voir « Ce qui n'a pas suivi le TDD »** |
| T013 | Test de composant | ✅ | rouge franc puis vert |
| T014 | Playwright + chromium | ✅ | `testDir: tests/e2e`, `webServer` sur `vite preview` :4173 |
| T015 | Scénario de fumée | ✅ | rouge puis vert |
| T016 | Sept commandes depuis un état propre | ✅ | `rm -rf node_modules dist` puis `npm ci` — sorties ci-dessous |
| T017 | Mise à jour de `environment/summary.md` | ↪ | **converti en backlog** — l'implémentation ne peut pas modifier `environment/` |
| T018 | Linear | ✅ | `T3H-133` → `T3H-138` en `Done`, commentaire sur l'EPIC `T3H-110` |

## Décision tranchée : TypeScript 7.0.2

Le plan autorisait un repli sur `6.0.3` si le compilateur natif posait problème. **Il n'a
pas été nécessaire.** `tsc --noEmit` passe, et Vite, Biome, Vitest et Playwright
fonctionnent avec.

Une rupture réelle a été rencontrée et corrigée en configuration :

```
tsconfig.json(26,5): error TS5102: Option 'baseUrl' has been removed.
  Please remove it from your configuration. Use '"paths": {"*": ["./*"]}' instead.
tsconfig.json(28,15): error TS5090: Non-relative paths are not allowed.
  Did you forget a leading './'?
```

**TypeScript 7 a supprimé `baseUrl`** ; les mappings de `paths` doivent être relatifs et
commencer par `./`. C'est le genre de détail qui fait perdre une heure à la génération
suivante — il est consigné dans le backlog de mise à jour de l'environnement et dans le
commentaire Linear de l'EPIC.

Second ajustement : `@types/node` était requis pour `node:url` dans `vite.config.ts`,
avec `"types": ["vite/client", "node"]`.

## Preuves d'échec avant vert

Critères de fin 3 et 4. Les sorties d'échec, pas seulement les sorties de succès.

### Test de composant — rouge franc

Avant configuration de l'environnement jsdom :

```
 ❯ src/App.test.tsx (1 test | 1 failed) 3ms
     × renders into the DOM 2ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
ReferenceError: document is not defined
 Test Files  1 failed | 1 passed (2)
```

Après ajout de `environment: 'jsdom'` et du fichier de préparation : vert.

### Scénario Playwright — rouge

Sans `playwright.config.ts`, Playwright ramassait les fichiers Vitest de `src/` et
échouait à l'initialisation des suites. Après cadrage sur `testDir: './tests/e2e'` et
ajout du `webServer` : vert.

### Test d'alias — vert d'emblée, prouvé autrement

Voir la section suivante.

## Ce qui n'a pas suivi le TDD, et pourquoi

**T012 est passé au vert dès sa première exécution.** La raison est structurelle : Vitest
lit `vite.config.ts`, donc les alias définis pour Vite étaient déjà résolus côté test. Il
n'y avait pas de rouge à obtenir.

Un test qu'on n'a jamais vu échouer ne prouve rien. Plutôt que de le déclarer valide, la
divergence qu'il est censé détecter a été introduite volontairement — retrait du seul
alias `@transport` de `vite.config.ts`, `tsconfig.json` inchangé :

```
 ❯ src/test/aliases.test.ts (3 tests | 2 failed) 7ms
     × declares the same alias names in vite.config.ts and tsconfig.json 4ms
     × covers every directory of the spec section 12 layout 1ms
AssertionError: expected [ '@', '@code', '@controls', …(5) ]
  to deeply equal [ '@', '@code', '@controls', …(6) ]
```

`vite.config.ts` restauré, les trois tests repassent au vert. Le test attrape bien ce
pour quoi il existe.

C'est une entorse à la lettre de la règle TDD, assumée et documentée : la preuve par
mutation remplace ici la preuve par antériorité, parce que l'antériorité était
impossible.

Un troisième échec, non planifié, a été rencontré sur ce même test : sous jsdom,
`import.meta.url` ne résout pas comme sous Node, et la lecture des fichiers de config
échouait en `ENOENT: no such file or directory, open '/vite.config.ts'`. Corrigé en
lisant depuis `process.cwd()`.

## Verification

Après `rm -rf node_modules dist` et `npm ci` :

```
$ npm run typecheck
> tsc --noEmit
(aucune sortie, exit 0)

$ npm run check
> biome check .
Checked 13 files in 16ms. No fixes applied.

$ npm run test
 RUN  v4.1.11
 Test Files  2 passed (2)
      Tests  4 passed (4)

$ npm run build
> tsc --noEmit && vite build
✓ 15 modules transformed.
dist/index.html                  0.32 kB │ gzip:  0.23 kB
dist/assets/index-DSb_Smf7.js  190.55 kB │ gzip: 60.02 kB
✓ built in 61ms

$ npm run test:e2e
Running 2 tests using 2 workers
  ✓  2 [chromium] › tests/e2e/smoke.spec.ts:11:1 › sets the document language (150ms)
  ✓  1 [chromium] › tests/e2e/smoke.spec.ts:6:1 › serves the built application (157ms)
  2 passed (1.9s)

$ npm run dev      → http status 200 sur :5173
$ npm run preview  → http status 200 sur :4173
```

`git status` après build complet et exécution de tous les tests : aucun `node_modules/`,
aucun `dist/`, aucun `test-results/` ni `playwright-report/`. Seuls les fichiers voulus
apparaissent.

## Discovered Tasks

| Découverte | Traitement |
|---|---|
| `baseUrl` supprimé en TypeScript 7 | corrigé sur place (T006), consigné pour les générations suivantes |
| `@types/node` requis pour `node:url` dans `vite.config.ts` | installé, `types` complété |
| `import.meta.url` ne résout pas pareil sous jsdom | test corrigé pour lire depuis `process.cwd()` |
| Playwright sans config ramasse les tests Vitest | `testDir` explicite dans `playwright.config.ts` |
| **React 19 seul pèse 190,55 ko bruts contre un budget de 200 ko** | **backlog** — ambiguïté réelle de la spec |

## Backlog Created

| Fichier | Type | Priorité | Objet |
|---|---|---|---|
| `clarify-the-200-kb-initial-js-budget-compressed-or-raw.md` | task | medium | Le budget §6 ne précise pas l'unité. Lu en brut, il est consommé à 95 % par React seul, avant toute ligne de code produit — donc intenable. Lu en gzip (60 ko), il laisse 140 ko et devient un objectif réel. À trancher avant que le lot 7 ne l'applique. |
| `update-environment-summary-with-the-real-toolchain.md` | task | medium | `environment/summary.md` affirme « rien n'est échafaudé » et « commandes à créer ». Chargé à chaque session, il ferait planifier les générations suivantes contre un état disparu. |

## Out of Scope — respecté

Aucun code produit écrit. `src/` contient le point d'entrée du squelette, `App.tsx`,
`test/setup.ts`, et les neuf dossiers de la structure §12 vides (`.gitkeep`).

Aucun `core/types.ts`, aucun store, aucun shell, aucune scène, aucun pilote de transport,
aucun contrôle, aucun panneau de code, aucun dictionnaire i18n, aucune leçon, aucun
`Dockerfile`. Le `CLAUDE.md` complet avec procédure d'ajout de leçon reste au lot 1
(`T3H-159`).

Écart au plan à signaler : le test d'alias a été écrit dans `src/test/aliases.test.ts` et
non `src/core/paths.test.ts` comme planifié. Placer un test dans `core/` sous-entendait un
module `core/paths.ts` qui n'a pas lieu d'exister avant le lot 1.
