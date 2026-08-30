# Planning

> Génération `gen-001-76ea93` (embryo) — lot 0, amorçage de la chaîne d'outils.

## Goal

Faire passer le dépôt de « connaissance seule » à « dépôt qui construit et se vérifie ».

À la fin de cette génération, sept commandes existent et passent : `dev`, `build`,
`preview`, `typecheck`, `check`, `test`, `test:e2e`. **Aucun code produit n'est écrit** —
ni contrat, ni store, ni shell, ni scène, ni leçon. C'est le préalable strict à la tranche
verticale du lot 1.

## Background

Le dépôt ne contient aujourd'hui que la spécification, les maquettes et le génome REAP.
Sans chaîne d'outils, le lot 1 devrait à la fois échafauder et concevoir — deux natures de
travail différentes, dont le mélange rend la revue impossible et masque les erreurs de
configuration derrière des erreurs de conception.

Le génome impose par ailleurs le TDD strict. Une chaîne de test non prouvée rendrait cette
règle décorative dès la première leçon.

## Approach

### La preuve d'abord, y compris pour un échafaudage

Le génome exige « le test qui échoue d'abord ». Un échafaudage n'a presque rien à tester,
mais la question qu'il pose est réelle : **la chaîne de test fonctionne-t-elle vraiment ?**

La réponse honnête passe par le rouge. Pour Vitest comme pour Playwright, le test est écrit
et exécuté **avant** que la cible n'existe, puis rendu vert. Un harnais de test qu'on n'a
jamais vu échouer ne prouve rien : il peut ne rien exécuter du tout.

### TypeScript 7 contre 6 — tranché par l'essai

`typescript@latest` est **7.0.2**, le compilateur natif réécrit en Go : nettement plus
rapide, mais écosystème moins mûr que la lignée 5.x. `6.0.3` reste disponible en repli.

Décision retenue : **installer 7.0.2 et le juger sur pièce** (T003). Critère de bascule
explicite — si `tsc --noEmit` sur le squelette échoue pour une raison imputable au
compilateur natif, ou si Vite, Biome ou Vitest refusent de fonctionner avec, on retombe
sur `6.0.3` et on l'écrit dans l'artefact. Le repli coûte une ligne de `package.json` à ce
stade du projet ; il coûterait beaucoup plus tard.

Ce point est le seul de la génération où je m'autorise à décider sur résultat plutôt que
sur plan. C'est assumé et borné.

### Dossiers vides, alias configurés

Les alias de chemins reflétant la structure §12 sont posés maintenant, avec des dossiers
vides. Les remplir est le travail du lot 1. Ce n'est pas de l'anticipation interdite : un
alias est une convention de résolution, pas une abstraction — et l'invariant vise les
abstractions prématurées.

## Requirements

| # | Exigence | Vérification |
|---|---|---|
| FR1 | `npm run dev` sert l'application en développement | lancement manuel |
| FR2 | `npm run build` produit un build de production dans `dist/` | sortie de commande |
| FR3 | `npm run preview` sert le build | lancement manuel + Playwright |
| FR4 | `npm run typecheck` passe en mode strict, zéro erreur | sortie de commande |
| FR5 | `npm run check` passe, et ne reformate rien au second passage | double exécution |
| FR6 | `npm run test` exécute Vitest en jsdom avec Testing Library | sortie de commande |
| FR7 | `npm run test:e2e` exécute Playwright contre le build de prévisualisation | sortie de commande |
| FR8 | Les alias de chemins de la structure §12 résolvent dans Vite, TypeScript et Vitest | test unitaire d'import par alias |
| FR9 | `.gitignore` couvre `.env*`, `node_modules/`, `dist/`, couverture et artefacts Playwright | `git status` après build et tests |
| FR10 | Aucun code produit : ni contrat, ni store, ni shell, ni scène, ni leçon | revue du contenu de `src/` |

## Completion Criteria

1. Les sept scripts npm existent et sortent en code 0 depuis un `npm ci` propre.
2. `tsc --noEmit` passe avec `strict`, `noUncheckedIndexedAccess` et `noImplicitOverride`.
3. Au moins un test unitaire Vitest et un test de composant Testing Library passent — **et
   la sortie de leur échec initial est montrée** dans l'artefact d'implémentation.
4. Au moins un scénario Playwright passe contre le build de prévisualisation — **et sa
   sortie d'échec initiale est montrée**.
5. `npm run check` ne produit aucune modification au second passage.
6. `git status` est propre après un build complet et une exécution de tous les tests.
7. `src/` ne contient que le point d'entrée du squelette et les dossiers de la structure
   §12, vides. Aucun module produit.

## Risk Assessment

| Risque | Probabilité | Impact | Traitement |
|---|---|---|---|
| TypeScript 7 (compilateur natif) incompatible avec un maillon de la chaîne | moyenne | moyen | T003 le teste explicitement ; repli documenté sur `6.0.3` |
| `@vitejs/plugin-react@6` traîne des pairs lourds (`oxc-transform-react`, babel plugins) et alourdit l'installation | moyenne | faible | constaté au moment de l'installation ; sans effet sur le bundle de production |
| Playwright télécharge des navigateurs — installation longue, réseau requis | élevée | faible | attendu ; `npx playwright install chromium` seul suffit au scénario de fumée |
| Les alias divergent entre `tsconfig`, `vite.config` et la config Vitest | moyenne | **élevé** | FR8 est vérifiée par un test d'import par alias, pas par relecture |
| Débordement sur le lot 1 | moyenne | élevé | FR10 et le critère 7 le rendent constatable ; l'invariant « ne jamais généraliser avant le lot 2 » s'applique |

## Scope

**Créé :** `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`,
`tsconfig.json`, `tsconfig.node.json`, `biome.json`, `playwright.config.ts`,
`src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/test/setup.ts`,
`src/{shell,scenes,transport,controls,code,i18n,lessons,core}/.gitkeep`,
`tests/e2e/smoke.spec.ts`, `src/core/paths.test.ts`.

**Modifié :** `.gitignore`, `.reap/environment/summary.md`.

**Hors périmètre, explicitement :** `core/types.ts` et tout contrat de données ; le store
de paramètres ; le shell ; les scènes ; les pilotes de transport ; les contrôles ; le
panneau de code ; les dictionnaires i18n ; toute leçon ; le `Dockerfile` et `nginx.conf`
(EPIC#10) ; le `CLAUDE.md` complet avec procédure d'ajout de leçon (lot 1, `T3H-159`).

## Tasks

- [x] T001 `.gitignore` — ajouter `.env*`, `node_modules/`, `dist/`, `coverage/`, `playwright-report/`, `test-results/`
- [x] T002 `package.json` — initialiser, installer React 19.2.8, react-dom, vite 8.2.2, @vitejs/plugin-react 6.1.1
- [x] T003 `package.json` — installer TypeScript 7.0.2, vérifier `tsc --noEmit` sur le squelette ; **repli 6.0.3 si échec imputable au compilateur natif**
- [x] T004 `index.html`, `src/main.tsx`, `src/App.tsx` — squelette minimal, `StrictMode` actif
- [x] T005 `vite.config.ts` — plugin React et alias de chemins de la structure §12
- [x] T006 `tsconfig.json` — `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, mêmes alias que Vite
- [x] T007 `src/{shell,scenes,transport,controls,code,i18n,lessons,core}/.gitkeep` — dossiers vides de la structure §12
- [x] T008 `package.json` — scripts `dev`, `build`, `preview`, `typecheck` ; vérifier les quatre
- [x] T009 `biome.json` — installer et configurer Biome 2.5.11, script `check`
- [x] T010 `src/**` — passer Biome, corriger, vérifier l'idempotence au second passage
- [x] T011 `vite.config.ts`, `src/test/setup.ts` — installer Vitest 4.1.11, jsdom, Testing Library ; environnement jsdom et fichier de préparation
- [x] T012 `src/core/paths.test.ts` — **écrire le test qui échoue d'abord** : import par alias, preuve que les alias résolvent identiquement dans Vite, TS et Vitest (FR8)
- [x] T013 `src/App.test.tsx` — **écrire le test qui échoue d'abord** : Testing Library rend `App`, preuve que le harnais jsdom fonctionne
- [x] T014 `playwright.config.ts` — installer Playwright 1.62.1 et chromium, configurer contre `npm run preview`
- [x] T015 `tests/e2e/smoke.spec.ts` — **écrire le scénario qui échoue d'abord**, puis le rendre vert
- [x] T016 `package.json` — scripts `test` et `test:e2e` ; exécuter les sept commandes depuis un état propre et capturer les sorties
- [~] T017 `.reap/environment/summary.md` — remplacer « commandes à créer » par les commandes réelles, consigner les versions installées
- [x] T018 Linear — passer `T3H-133` à `T3H-138` en `Done`, commenter l'EPIC `T3H-110`

## Dependencies

```
T001 ─┐
T002 ─┴→ T003 → T004 → T005 ─┬→ T006 → T007 → T008 ─┐
                              │                      │
                              └──────────────────────┴→ T009 → T010
                                                              ↓
                                        T011 → T012 → T013 ────┤
                                                              ↓
                                        T014 → T015 ───────────┤
                                                              ↓
                                                      T016 → T017 → T018
```

- T003 précède tout : le choix du compilateur conditionne `tsconfig`.
- T005 et T006 doivent être faits ensemble — c'est leur divergence qui est risquée (FR8).
- T012 valide T005 + T006 : le test d'alias est la vérification, pas la relecture.
- T016 est la porte : les sept commandes exécutées d'affilée depuis un état propre.
- T017 et T018 ne sont que de la mise à jour d'état, après vérification.

## Additional Findings

Relevé pendant la planification, hors du chemin critique :

- `@vitejs/plugin-react@6.1.1` déclare en pairs `oxc-transform-react`,
  `@rolldown/plugin-babel` et `babel-plugin-react-compiler`. Vite 8 repose sur Rolldown ;
  l'installation sera plus lourde que sur Vite 5. Sans conséquence sur le bundle final,
  mais à ne pas confondre avec une dérive de dépendances au moment de la revue.
- `.gitignore` contient déjà `.reap/.index/` (écrit par `reap init`) et `.DS_Store`
  (ajouté pendant l'init). T001 complète, ne remplace pas.
- Le budget des 200 ko hors Three.js ne se mesure pas dans cette génération : il n'y a rien
  à mesurer. La configuration de découpage par route relève du lot 1, avec le registre de
  leçons.

## Autonomous Additions

Aucune addition autonome hors périmètre. Deux points relèvent d'une lecture du but plutôt
que d'un ajout, et sont signalés comme tels :

- **[autonomous]** T007 — création des dossiers vides de la structure §12. Justification :
  les alias de T005/T006 doivent pointer quelque part pour que T012 puisse les prouver.
  Sans cela, FR8 n'est pas vérifiable dans cette génération.
- **[autonomous]** T017 — mise à jour de `environment/summary.md`. Justification : le
  fichier affirme aujourd'hui « rien n'est échafaudé » et « commandes à créer ». Le laisser
  faux ferait mentir le contexte chargé à chaque session suivante.

Aucun élément « nice to have » n'a été ajouté. Les candidats écartés — couverture de code,
hook de pré-commit, CI GitHub Actions — relèvent respectivement du lot 7 et de l'EPIC#10
et n'ont pas été portés au backlog : ils sont déjà couverts par des issues Linear.
