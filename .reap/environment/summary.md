# Environnement — anima

Résumé chargé à chaque session. Le détail de la structure des modules vit dans
`environment/source-map.md`, chargé à la demande.

## État actuel du dépôt

**Rien n'est encore échafaudé.** Le dépôt contient la spécification, les maquettes et la
structure REAP. Aucun `package.json`, aucun `src/`, aucune dépendance installée. Le
premier lot crée tout cela.

```
.
├── CLAUDE.md                       instructions projet (section REAP gérée par reap)
├── .reap/                          génome, environnement, vision, mémoire
└── design/
    ├── spec-technique-anima-lab.md spécification fonctionnelle et technique
    └── handoff_anima_lab/          maquettes (.dc.html) + README de remise
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
| Doppler | **non installé** — à installer avant tout besoin de secret |

Le projet est un front statique sans serveur applicatif : au MVP, aucun secret n'est requis
au développement. Doppler devient nécessaire au moment du déploiement (registre ghcr.io,
configuration Dokploy), pas avant.

## Commandes (à créer au lot 1)

Aucune n'existe encore. Le lot 1 doit établir, au minimum :

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement Vite |
| `npm run build` | build de production dans `dist/` |
| `npm run preview` | prévisualisation du build |
| `npm run check` | Biome — formatage et lint |
| `npm run test` | Vitest |
| `npm run test:e2e` | Playwright |
| `npm run typecheck` | `tsc --noEmit`, TypeScript strict |

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
