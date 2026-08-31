# Learning

> Génération `gen-002-039410` (embryo) — lot 1, tranche verticale `native-tween`.

## Project Overview

**Anima Lab** enseigne l'animation web en la faisant manipuler : 25 leçons en trois
familles (socle natif 10, GSAP 10, shaders 5). Chaque leçon est une scène animée, des
contrôles qui règlent ses paramètres, et le code source correspondant qui se met à jour
en direct avec la ligne du paramètre manipulé surlignée.

**État de départ.** Le lot 0 (`gen-001-76ea93`) a posé la chaîne d'outils et rien d'autre.
Sept commandes passent, les neuf dossiers de la structure §12 existent vides avec leurs
alias vérifiés par test, et le seul code est un `App` squelette qui affiche un titre.
`origin/dev` porte `7eca4b6`. Aucune dépendance produit n'est installée : ni Zustand, ni
React Router, ni GSAP, ni Three.js.

**Ce que le lot 1 doit prouver.** Pas « une leçon marche » mais « le contrat de données
tient » : le shell lit un descripteur `Lesson` et construit l'écran sans rien savoir de la
leçon. Le lot 2 est le juge (deux leçons de plus, descripteurs seulement) ; le lot 1 est ce
qu'il jugera. C'est la piste ouverte n°1 de `midterm.md`.

## Key Findings

### Le contrat est déjà écrit dans la spec, à la lettre

`design/spec-technique-anima-lab.md` §3 donne `SceneKind`, `TransportKind`, `Family`,
`I18nKey`, `Param`, `Lesson`, `CodeTemplate`, `CodeLine` en TypeScript complet. Il n'y a
rien à concevoir sur ce point — il y a à le transcrire dans `src/core/types.ts`, à le
durcir (unions discriminées, `readonly`, `ParamValues` qui manque dans la spec) et à
l'éprouver sur un cas réel.

Un manque : `ParamValues` est référencé par `CodeTemplate.render` mais jamais défini.
C'est à nous de le poser — probablement `Record<string, number | string | boolean>`, ou
mieux, un type dérivé des `params` de la leçon.

### La maquette 2b est l'écran du lot 1, au pixel près

`design/handoff_anima_lab/` contient un `README.md` de handoff très détaillé (tokens,
7 écrans, interactions, états) et deux maquettes HTML. **L'écran 2b est exactement la
cible du lot 1** : `NATIF.02 · ANATOMIE D'UN TWEEN`, pilule propriété `position.x`,
scène WebGL graduée, transport temporel, rail de trois blocs.

Contenu exact du rail dans la maquette :

| Bloc | Contrôles |
|---|---|
| `MÉTHODE` | grille 2×2 — `to` (va vers), `from` (arrive de), `fromTo` (de … à …), `set` (sans trajet) |
| `VALEURS` | `Départ · x initial` = 10 · `Durée · seconds` = 2.0 · `Fantômes · trace du trajet` (bascule) |
| `COURBE` | `linear`, `power1.out`, `power2.out`, `power3.out`, `power4.out`, `sine.out` |

Et le code affiché, onglets `CSS | JS` :

```
gsap.from(mesh.position, { x: 10, duration: 2, ease: "power1.out" })
```

Tokens arrêtés : `braise-950 #14100D`, `braise-900 #1C1815`, `braise-800 #26211C`,
`ligne rgba(242,233,220,.08)`, `encre #F2E9DC`, `encre-sourde #A2907C`, accent famille
`ambre #F09D5A` (natif), `coral #EE6C4D` (GSAP), `rose #D96A8F` (shaders). Deux polices
Google : Instrument Sans (interface) et IBM Plex Mono (**uniquement le code réel**).
Échelle d'espacement `4 6 8 12 16 24`, rayons `6 10 14 12 99`.

### Trois pièges React, et ce qu'ils imposent concrètement

Spec §2 et génome les nomment ; leur traduction en code est la vraie difficulté du lot :

1. **`StrictMode` monte deux fois** → toute animation idempotente et nettoyée. `useGSAP`
   (`@gsap/react`) plutôt que `useEffect` + `gsap.to`.
2. **Un curseur produit 60 changements par seconde** → le store Zustand alimente trois
   consommateurs à trois régimes différents : contrôles (re-rendu), moteur d'animation
   (`store.subscribe` transitoire, zéro re-rendu), panneau de code (différé). Le curseur
   est **non contrôlé au sens React** : l'`input` n'est pas repiloté par un état parent.
3. **Le canvas est unique et persistant**, monté haut dans l'arbre ; seul son contenu
   change selon la route.

Le point 2 est ce que la TASK `T3H-142` demande de prouver — « aucun rendu au-delà du
composant qui affiche la valeur ». Le profileur React n'est pas automatisable ; il faudra
un test qui compte les rendus (compteur incrémenté dans le corps du composant) plutôt que
de s'en remettre à une vérification manuelle.

### Le point 5 du « terminé » est un comportement, pas un test de sortie

« Modifier un paramètre pendant la lecture ne casse rien » a une définition précise en
spec §3 : *l'animation est reconstruite et reprend à la même progression normalisée*.
C'est le seul endroit du lot où le comportement attendu est subtil, et la spec dit
explicitement « à traiter, pas à découvrir en test ».

### Ce que le lot 0 laisse en dette

- `vite.config.ts` porte un commentaire qui désigne `src/core/paths.test.ts` alors que le
  test vit en `src/test/aliases.test.ts`. Correction mineure, à faire au passage.
- `src/App.tsx`, `src/App.test.tsx` et `tests/e2e/smoke.spec.ts` sont des squelettes de
  lot 0 explicitement destinés à être remplacés au lot 1.

## Previous Generation Reference

`gen-001-76ea93`, verdict `pass`, retour humain positif sans correction demandée.

Deux leçons portées :

- **La preuve par mutation** (promue en `longterm.md`) : quand le TDD est structurellement
  impossible — un test qui ne peut pas être rouge par antériorité —, on retire volontairement
  ce que le test doit protéger et on constate le rouge. Applicable directement au lot 1 :
  le test « pas de rendu parasite » et le test « pas de fuite de ressource » sont tous deux
  du type qui passe au vert sans rien exécuter.
- **TypeScript 7 a supprimé `baseUrl`** : les `paths` doivent être relatifs et commencer par
  `./`. Déjà consigné dans `environment/summary.md`.

Deux points laissés ouverts par l'humain au lot 0, désormais tranchés : le budget est en
**gzip** (200 ko sur le chunk de la route initiale, hors Three.js ; React en consomme
60,02 ko, il reste ~140 ko) ; et le push a eu lieu — `origin/dev` porte le lot 0.

## Backlog Review

`.reap/life/backlog/` est vide, `pendingBacklog: []` au démarrage de la génération, et
`shortterm.md` confirme qu'aucun backlog n'attend pour le lot 1. Les deux éléments du lot 0
(unité du budget, mise à jour de l'environnement) sont consommés.

Génération démarrée avec `--no-backlog` implicite : aucun élément en attente à arbitrer.

## Technical Deep-Dive

### Dépendances à installer, et leur effet sur le budget

Aucune n'est présente. Il faut : `zustand`, `react-router`, `gsap` + `@gsap/react`,
`three` + `@react-three/fiber` + `@react-three/drei`.

Le budget de 200 ko gzip porte sur **le chunk de la route initiale, hors Three.js**. Donc
la route d'accueil ne doit embarquer ni Three, ni GSAP : les deux sont chargés par famille
via `React.lazy`. Zustand (~1 ko gzip) et React Router (~15 ko gzip) sont, eux, dans le
chunk initial. Marge confortable, mais elle se mesure — `vite build` la donne.

Le point délicat : **le canvas est persistant et monté haut dans l'arbre**, ce qui pousse
naturellement Three.js vers le chunk initial. Il faudra que `CanvasHost` soit lui-même
chargé paresseusement, monté au-dessus des routes de leçon mais pas au-dessus de l'accueil.

### Ce que le lot 1 doit livrer de la maquette, et ce qu'il doit laisser

Le lot 1 est déjà large (9 FEAT, 21 TASK). Trois éléments de la maquette 2b relèvent
d'autres lots et sont à écarter explicitement plutôt qu'à absorber en silence :

| Élément de 2b | Verdict | Motif |
|---|---|---|
| Bascule moteur `WebGL \| CSS` | **hors lot 1** | `engineToggle` est du lot 3 (spec §10), il exige `CssCubeScene` |
| Contrôle `COURBE` (vignettes SVG) | **à arbitrer** | `EaseControl` est un rendu spécialisé ; le lot 1 ne liste que `slider` et `choice` |
| Bascule `Fantômes` | **à arbitrer** | c'est un contrôle `toggle`, non listé au lot 1, et un calque de scène supplémentaire |

Le calque de fantômes n'est pas décoratif — le concept rédigé de la maquette s'appuie
dessus (« leur espacement, c'est la vitesse »). L'écarter oblige à écrire un concept qui ne
s'y réfère pas.

### Une tension à trancher : `native-tween` affiche du code GSAP

La maquette 2b place la leçon dans **`NATIF.02`** — famille socle natif, accent ambre — et
le code qu'elle affiche est **GSAP** : `gsap.from(mesh.position, …)`, avec un bloc
`MÉTHODE` dont les quatre entrées (`to`, `from`, `fromTo`, `set`) sont l'API GSAP, et un
bloc `COURBE` en nomenclature GSAP (`power1.out`). Le concept rédigé de la maquette 2e
commence par « GSAP change une propriété de l'objet ».

Or `Lesson.family` vaut `native` et le plan de livraison place GSAP au lot 5. Le lot 1
prévoit malgré tout le **driver GSAP** (`T3H-146`), ce qui est cohérent avec la maquette.

C'est la seule vraie ambiguïté du lot, et elle touche le contenu, pas la plomberie.

### Routes : `/fr/socle/tween` mélange locale et segment traduit

Spec §7 donne l'exemple `/fr/socle/tween`. `socle` est le nom français de la famille
`native`. Deux lectures possibles, avec des conséquences opposées au lot 8 :

- segments **traduits** (`/fr/socle/tween`, `/en/native/tween`) — fidèle à l'exemple,
  demande une table de correspondance par locale et un `<link rel="alternate">` ;
- segments **stables** (`/fr/native/tween`) — trivial, mais s'écarte de l'exemple écrit.

L'invariant « ne jamais servir une route sans préfixe de locale » est respecté dans les
deux cas. À trancher au lot 1 parce que l'invariant dit aussi qu'ajouter le préfixe après
coup casse les URL partagées — le même raisonnement vaut pour le segment.

## Context for This Generation

### Niveau de clarté : **moyen**

| Indicateur | Lecture |
|---|---|
| `vision/goals.md` a des objectifs spécifiques et actionnables | → haut |
| Le backlog est vide, mais l'EPIC `T3H-111` découpe 9 FEAT et 21 TASK | → haut |
| La spec §3 donne le contrat en TypeScript littéral, la maquette 2b donne l'écran | → haut |
| Génération `embryo`, génome encore corrigeable, contrat jamais éprouvé | → bas |
| Lignée courte : une seule génération, qui n'a produit aucun code produit | → bas |

Verdict **moyen** : la direction et la cible sont sans ambiguïté, mais trois décisions de
périmètre et de contenu restent ouvertes. Comportement attendu du génome à ce niveau :
présenter des options avec leurs contreparties, pas décider seul.

### Questions ouvertes à porter en planification

1. **`native-tween` en GSAP ou en natif ?** Suivre la maquette à la lettre (code GSAP,
   méthodes `to/from/fromTo/set`, driver GSAP) ou faire une leçon réellement native
   (CSS/WAAPI) au risque d'écraser la leçon `waapi` du lot 2.
2. **Segments de route traduits ou stables ?**
3. **Périmètre visuel du lot 1** : `EaseControl` et le calque de fantômes dedans ou dehors.
   Dehors, la leçon reste conforme aux huit points du « terminé » mais l'écran s'écarte de
   la maquette et le concept doit être réécrit.

### Hypothèses posées

- Le lot 1 ne livre **que** la famille `native` dans la navigation ; les deux autres
  familles apparaissent inactives ou absentes. Le compteur `n / 25` reste sobre.
- Le lot 1 n'implémente pas la sérialisation des paramètres dans l'URL (lot 7), ni la
  persistance `localStorage` (lot 7), ni le mobile (lot 7). `core/storage.ts` peut rester
  non écrit tant qu'aucun consommateur n'existe.
- La bascule mouvement réduit est dans le chrome dès le lot 1 (point 6 du « terminé »
  l'exige pour la leçon), mais sa persistance attend le lot 7.
- Le concept `concept.fr.md` est rédigé dans cette génération, 150 à 300 mots, relu.
