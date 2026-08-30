# Validation

> Génération `gen-001-76ea93` (embryo) — lot 0.
> Toutes les commandes ci-dessous ont été **réexécutées à neuf** pour cette validation,
> après `rm -rf dist`. Aucun résultat n'est repris de l'implémentation.

## Verdict

**pass.**

Les sept commandes sortent en code 0. Les sept critères de fin sont satisfaits, dont les
deux qui exigeaient une preuve d'échec avant vert.

## Commandes exécutées

| Commande | Exit | Sortie |
|---|---|---|
| `npm run typecheck` | **0** | `tsc --noEmit`, aucune sortie |
| `npm run build` | **0** | `✓ 15 modules transformed` — `dist/index.html` 0,32 ko, `dist/assets/index-DSb_Smf7.js` 190,55 ko (gzip 60,02 ko), bâti en 59 ms |
| `npm run check` | **0** | `Checked 13 files in 4ms. No fixes applied.` |
| `npm run test` | **0** | `Test Files 2 passed (2)` / `Tests 4 passed (4)` |
| `npm run test:e2e` | **0** | `2 passed (2.1s)` — les deux scénarios chromium |
| `npm run dev` | — | HTTP 200 sur `:5173`, Vite prêt en 138 ms |
| `npm run preview` | — | HTTP 200 sur `:4173` |

## Critères de fin, un par un

### 1. Les sept scripts existent et sortent en 0 depuis un `npm ci` propre — ✅

Vérifié pendant l'implémentation après `rm -rf node_modules dist` suivi de `npm ci`, puis
reconfirmé ici sur les cinq commandes non interactives. `dev` et `preview` sont des
serveurs : vérifiés par requête HTTP, code 200 dans les deux cas.

### 2. `tsc --noEmit` passe en strict — ✅

Exit 0. Options actives dans `tsconfig.json` : `strict`, `noUncheckedIndexedAccess`,
`noImplicitOverride`, et au-delà de l'exigence `exactOptionalPropertyTypes`,
`verbatimModuleSyntax`, `noUnusedLocals`, `noUnusedParameters`,
`noFallthroughCasesInSwitch`.

### 3. Un test unitaire et un test de composant passent, échec initial montré — ✅ avec réserve

4 tests passent sur 2 fichiers.

L'échec initial du test de composant est montré dans `03-implementation.md` :
`ReferenceError: document is not defined`, franc et attendu.

**Réserve, documentée et assumée** : le test d'alias (`src/test/aliases.test.ts`) est passé
au vert dès sa première exécution, parce que Vitest lit `vite.config.ts` et héritait donc
déjà des alias. Il n'y avait pas de rouge à obtenir par antériorité. La preuve a été faite
par mutation — retrait volontaire de l'alias `@transport` de `vite.config.ts` seul, deux
tests sur trois passent au rouge avec l'assertion attendue, restauration, retour au vert.

Le critère est satisfait dans son intention — aucun test n'est déclaré valide sans avoir
été vu échouer — mais pas dans sa lettre. C'est signalé plutôt que masqué.

### 4. Un scénario Playwright passe contre le build de prévisualisation, échec initial montré — ✅

`2 passed (2.1s)`. Les deux scénarios tournent contre `vite preview`, donc contre le build
de production réel, pas contre le serveur de développement.

Échec initial montré dans `03-implementation.md` : sans `playwright.config.ts`, Playwright
ramassait les fichiers de test Vitest de `src/` et échouait à l'initialisation.

### 5. `npm run check` ne modifie rien au second passage — ✅

Deux passages consécutifs, exit 0 puis exit 0, `No fixes applied` les deux fois.

### 6. `git status` propre après build complet et exécution de tous les tests — ✅

Aucun `node_modules/`, aucun `dist/`, aucun `test-results/`, aucun `playwright-report/`,
aucun `.DS_Store` ne remonte. Seuls apparaissent les fichiers voulus de la génération :
`.gitignore` modifié, et les nouveaux `biome.json`, `index.html`, `package.json`,
`package-lock.json`, `playwright.config.ts`, `tsconfig.json`, `vite.config.ts`, `src/`,
`tests/`, plus les artefacts REAP `.reap/life/`.

### 7. `src/` ne contient que le squelette et les dossiers §12 vides — ✅

```
src/App.test.tsx        test de composant
src/App.tsx             squelette
src/main.tsx            point d'entrée, StrictMode
src/vite-env.d.ts       types Vite
src/test/setup.ts       préparation jsdom
src/test/aliases.test.ts test d'alias
src/{shell,scenes,transport,transport/drivers,controls,code,i18n,lessons,core}/.gitkeep
```

Recherche de tout fichier non-`.gitkeep` dans les neuf dossiers de la structure §12 :
**aucun résultat**. Aucun contrat, aucun store, aucun shell, aucune scène, aucun pilote,
aucun contrôle, aucun panneau de code, aucun dictionnaire, aucune leçon.

## Exigences fonctionnelles

| # | Exigence | État |
|---|---|---|
| FR1 | `npm run dev` sert l'application | ✅ HTTP 200 sur :5173 |
| FR2 | `npm run build` produit `dist/` | ✅ exit 0 |
| FR3 | `npm run preview` sert le build | ✅ HTTP 200 sur :4173 |
| FR4 | `npm run typecheck` passe en strict | ✅ exit 0 |
| FR5 | `npm run check` passe et est idempotent | ✅ exit 0 deux fois |
| FR6 | `npm run test` exécute Vitest en jsdom | ✅ 4 tests |
| FR7 | `npm run test:e2e` exécute Playwright | ✅ 2 scénarios |
| FR8 | Alias identiques dans Vite, TypeScript, Vitest | ✅ vérifié par test, preuve par mutation |
| FR9 | `.gitignore` couvre secrets et artefacts | ✅ `git status` propre |
| FR10 | Aucun code produit | ✅ critère 7 |

## Réserves et points ouverts

Aucun correctif mineur n'a été nécessaire pendant cette validation.

Deux points restent ouverts, tous deux au backlog, aucun bloquant pour cette génération :

1. **Budget des 200 ko non tranché.** Le build produit 190,55 ko bruts / 60,02 ko gzip
   pour React seul. Lu en brut, le budget de la spec §6 est déjà consommé à 95 % avant
   toute ligne de code produit. À trancher avant que le lot 7 ne l'applique.
2. **`environment/summary.md` est faux depuis cette génération.** Il affirme « rien n'est
   échafaudé » et « commandes à créer ». Il est chargé à chaque session : à corriger en
   phase adapt.

Un troisième point mérite d'être porté à la génération suivante sans être un défaut :
**TypeScript 7 a supprimé `baseUrl`**, les mappings `paths` doivent être relatifs. Consigné
dans le backlog d'environnement et dans le commentaire Linear de l'EPIC `T3H-110`.
