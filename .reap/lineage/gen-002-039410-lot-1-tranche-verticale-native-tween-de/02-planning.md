# Planning

> Génération `gen-002-039410` (embryo) — lot 1, tranche verticale `native-tween`.
> Clarté évaluée en `01-learning.md` : **moyenne** → options présentées, décisions prises
> par l'humain avant toute ligne de code.

## Décisions arbitrées par l'humain

Les trois questions ouvertes de `01-learning.md` sont tranchées.

### D1 — `native-tween` est une leçon réellement native, en WAAPI

La maquette 2b affiche du code GSAP sous une étiquette `NATIF.02`. **L'étiquette
l'emporte** : la leçon enseigne la Web Animations API, pas GSAP.

Conséquences immédiates :

- **GSAP sort entièrement du lot 1.** Ni `gsap`, ni `@gsap/react`, ni `useGSAP`. Le piège
  React n°1 (`StrictMode` monte deux fois) n'est plus couvert par la révocation
  automatique de `useGSAP` : il faut `animation.cancel()` explicite au démontage, et c'est
  précisément ce que le point 7 du « terminé » vérifie.
- **`T3H-146` a été renommée** de « TimeDriver interface and GSAP driver » en
  « TimeDriver interface and WAAPI driver ». Le premier driver du projet est WAAPI.
- Le concept rédigé dans la maquette 2e (« GSAP change une propriété de l'objet ») est
  **inutilisable** : `concept.fr.md` est écrit de zéro.
- Le budget gzip y gagne : GSAP ne pèse plus sur aucun chunk du lot 1.

**Le recouvrement avec la leçon `waapi` du lot 2 est assumé et se règle par le sujet, pas
par la technologie** : `NATIF.02` enseigne *ce qu'est un tween* (départ, arrivée, durée,
courbe) en se servant de la WAAPI comme véhicule ; `NATIF.06` enseignera *l'API elle-même*
(`playbackRate`, `commitStyles`, `getAnimations`, cycle de vie). Même technologie, sujets
disjoints.

### D2 — segments de route stables en anglais

`/fr/native/tween`, `/en/native/tween`. Seul le préfixe de locale varie.

La spec §7 donne `/fr/socle/tween` et le génome `application.md` reprend cet exemple. Les
deux sont à corriger — génération `embryo`, le génome est modifiable, mais la correction se
fait en phase `adapt`, pas maintenant. Consigné ici pour ne pas se perdre.

L'invariant « ne jamais servir une route sans préfixe de locale » reste tenu.

### D3 — `EaseControl` et le calque de fantômes sont dans le lot 1

Les quatre types de contrôle du contrat (`slider`, `choice`, `toggle`, `ease`) sont donc
tous éprouvés dès le lot 1, au lieu des deux prévus. C'est plus long, et c'est ce qui rend
le verdict du lot 2 solide : un contrat validé sur quatre types de contrôle laisse beaucoup
moins de surprises que sur deux.

Le calque de fantômes reste dans la leçon parce que le concept s'appuie dessus — leur
espacement matérialise la vitesse, c'est l'argument pédagogique du chapitre sur la courbe.

**Reste explicitement hors lot 1** : la bascule moteur `WebGL | CSS` (exige `CssCubeScene`,
lot 3), la sérialisation des paramètres dans l'URL (lot 7), la persistance `localStorage`
(lot 7), le mobile (lot 7), l'onglet `CSS` du panneau de code (voir Additional Findings).

## Additional Findings

### Une `Animation` WAAPI à cible nulle est un `TimeDriver` complet — mesuré, pas supposé

D1 pose un problème d'intégrité : la WAAPI anime des éléments DOM, la scène du lot 1 est
un `mesh` three.js. Afficher `element.animate(...)` au-dessus d'une scène WebGL violerait
la règle fondatrice du produit — *le code affiché est exactement celui qui produit ce qu'on
voit*.

Sonde exécutée dans Chromium (Playwright, `about:blank`) avant de planifier :

| Sonde | Résultat |
|---|---|
| `new KeyframeEffect(null, …)` puis `new Animation(effect)` | supporté |
| `getComputedTiming().progress` à 25 % du temps, easing `cubic-bezier(.25,1,.5,1)` | `0.6885899020168309` |
| Contre-épreuve : `getComputedStyle(el).opacity` sur un vrai élément, même easing, même instant | `0.68859` — **identique** |
| `playbackRate = 2`, `pause()`, seek par `currentTime`, `cancel()` sur cible nulle | tous fonctionnels |

`progress` est donc la **progression transformée** : l'easing est appliqué par le moteur du
navigateur, pas par nous. L'invariant « ne jamais écrire un moteur d'animation maison
par-dessus la WAAPI » est tenu — on ne calcule aucune courbe, on lit une valeur.

Le driver est donc :

```ts
const effect = new KeyframeEffect(null, [{ offset: 0 }, { offset: 1 }], {
  duration: 2000,
  easing: 'ease-out',
})
const animation = new Animation(effect)
// à chaque frame de rendu : mesh.position.x = from * (1 - effect.getComputedTiming().progress)
```

Horloge réelle, easing réel, transport réel, zéro coût DOM, et le code affiché dans le
panneau est celui-là — honnête ligne pour ligne.

### Un seul onglet de code au lot 1

La maquette montre des onglets `CSS | JS`. Un onglet `CSS` afficherait un équivalent
`@keyframes` qui **ne produit pas** la scène : ce serait un support pédagogique, pas le
code qui tourne. Le lot 1 livre donc un seul `CodeTemplate` (`JS`), ce qui préserve la
règle « le code affiché est exactement celui qui s'exécute ».

Contrepartie assumée : le caractère tableau de `Lesson.code: CodeTemplate[]` n'est pas
éprouvé au lot 1. Il le sera au lot 2, ce qui est conforme à l'invariant « ne jamais
généraliser avant le lot 2 ».

### `ParamValues` manque au contrat de la spec

`CodeTemplate.render(values: ParamValues)` référence un type que la spec §3 ne définit
nulle part. À poser dans `core/types.ts`.

### Le bloc MÉTHODE gagne au changement

Les quatre méthodes (`to`, `from`, `fromTo`, `set`) étaient l'API GSAP. En WAAPI elles
deviennent les règles de **keyframes implicites**, qui sont un vrai sujet d'enseignement :

| Méthode | Keyframes WAAPI |
|---|---|
| `to` | `[{}, { x: 0 }]` — départ implicite, pris sur l'état courant |
| `from` | `[{ x: 10 }, {}]` — arrivée implicite |
| `fromTo` | `[{ x: 10 }, { x: 0 }]` — les deux explicites |
| `set` | `duration: 0`, `fill: 'forwards'` — aucun trajet |

Le bloc survit intact et dit désormais quelque chose de plus profond que des noms de
méthodes de bibliothèque.

## Functional Requirements

| # | Exigence | Module |
|---|---|---|
| FR1 | Le contrat de données existe, en unions discriminées et `readonly`, `ParamValues` compris | `core/types.ts` |
| FR2 | Un registre associe route ↔ leçon et charge les descripteurs paresseusement par famille | `core/lessonRegistry.ts` |
| FR3 | Un store unique détient les valeurs, avec lecture re-rendante **et** abonnement transitoire sans re-rendu | `core/paramStore.ts` |
| FR4 | Le shell construit l'écran à partir du seul descripteur, sans aucune connaissance des leçons | `shell/LessonShell.tsx` |
| FR5 | Un unique `<Canvas>` r3f persistant héberge une scène `webgl` exposant `mount/play/pause/seek/setParams/dispose` | `scenes/` |
| FR6 | Un `TimeDriver` WAAPI pilote le temps ; la barre de transport `timeline` offre lecture/pause, boucle, scrub, temps, vitesse, au clavier | `transport/` |
| FR7 | Les quatre contrôles (`slider`, `choice`, `toggle`, `ease`) sont rendus génériquement depuis `params`, groupés par `group` | `controls/` |
| FR8 | Le panneau de code dérive `CodeLine[]` des valeurs courantes, surligne par `paramIds`, regénère en différé, et copie ce qui est affiché | `code/` |
| FR9 | Toute chaîne traduisible passe par un dictionnaire typé ; les routes sont préfixées par la locale et `lang` suit | `i18n/`, routage |
| FR10 | La leçon `native-tween` est complète : descripteur, animation WAAPI, fantômes, concept rédigé | `lessons/native/tween/` |

## Completion Criteria

Les huit points du « terminé » (spec §11) plus le critère de fin du lot 1 (goals.md),
condensés en sept vérifiables :

1. **Réglage effectif et code exact.** Déplacer `duration` déplace le cube, le panneau
   affiche la nouvelle valeur, et la ligne `duration` est surlignée. Idem pour chacun des
   paramètres déclarés. *(points 1, 2, 3)*
2. **Transport.** Le scrub pilote la progression normalisée ; `Espace` bascule
   lecture/pause et les flèches scrubbent. *(critère de fin du lot 1, spec §9)*
3. **Réglage pendant la lecture.** Modifier un paramètre en cours de lecture reconstruit
   l'animation et **reprend à la même progression normalisée**. *(point 5)*
4. **Aucun rendu parasite.** Un drag de curseur ne provoque aucun rendu React au-delà du
   composant qui affiche la valeur — prouvé par un test qui compte les rendus, et
   **vérifié par mutation** (retirer l'abonnement transitoire doit rendre le test rouge).
5. **Aucune fuite.** Quitter la leçon ne laisse ni `Animation` WAAPI vivante ni ressource
   WebGL non libérée — scénario Playwright assertant `document.getAnimations().length === 0`
   et les compteurs `renderer.info`. *(point 7)*
6. **Mouvement réduit.** Actif : pas de lecture automatique, scrub seul, la démo reste
   manipulable. *(point 6)*
7. **Livraison.** Aucune chaîne traduisible en dur *(point 8)* ; `concept.fr.md` rédigé et
   relu, 150 à 300 mots *(point 4)* ; `typecheck`, `check`, `test`, `test:e2e` verts ; et
   le chunk de la route initiale mesuré sous 200 ko gzip hors Three.js.

## Implementation Plan

Ordre par dépendance. Le contrat d'abord, la leçon en dernier — c'est l'inverse qui
produirait un composant sur mesure déguisé en descripteur.

### Socle — le contrat et l'état

- [ ] **T001** Installer les dépendances : `zustand`, `react-router`, `three`,
      `@react-three/fiber`, `@react-three/drei`. **Pas de GSAP** (D1).
      *Vérification : `npm run build` passe, `vite build` donne la taille du chunk initial.*
- [ ] **T002** `core/types.ts` — `SceneKind`, `TransportKind`, `Family`, `I18nKey`,
      `Param` (union discriminée sur `control.type`), `Lesson`, `CodeTemplate`, `CodeLine`,
      et `ParamValues` absent de la spec.
      *Test : tests de type (`expectTypeOf`) + `npm run typecheck`.*
- [ ] **T003** `core/paramStore.ts` — store Zustand : initialisation depuis les `default`
      du descripteur, écriture par `id`, lecture sélective re-rendante, `subscribe`
      transitoire.
      *Test : unitaire — écriture/lecture, réinitialisation au changement de leçon,
      l'abonné transitoire reçoit la valeur sans que le sélecteur re-rende.*
- [ ] **T004** Preuve « aucun rendu parasite » (`T3H-142`) — composant sonde qui compte ses
      rendus, 60 écritures successives dans le store.
      *Test : unitaire, **plus preuve par mutation** — remplacer l'abonnement transitoire
      par un sélecteur doit faire virer le test au rouge. Un vert d'emblée ne prouve rien
      (`longterm.md`).*
- [ ] **T005** `core/lessonRegistry.ts` — enregistrement par famille, résolution
      `family + slug → Lesson`, import dynamique du descripteur.
      *Test : unitaire — résolution, leçon inconnue, ordre au sein de la famille.*

### Ossature — i18n, routage, apparence

- [ ] **T006** `i18n/fr.ts` typé, `i18n/en.ts` vide, `i18n/useTranslation.ts`. La clé
      manquante doit être une erreur de typage, pas un `undefined` à l'écran.
      *Test : unitaire + typecheck (clé absente = erreur de compilation).*
- [ ] **T007** Routage `react-router` préfixé par la locale — `/:locale/:family/:lesson`,
      redirection de `/` vers `/fr/…`, `document.documentElement.lang` synchronisé.
      Segments **stables en anglais** (D2).
      *Test : unitaire sur la résolution + e2e sur `lang` et l'accès direct à une URL.*
- [ ] **T008** Tokens CSS depuis le handoff 2a — les 7 couleurs + 3 accents de famille,
      les deux polices Google, l'échelle `4 6 8 12 16 24`, les rayons `6 10 14 12 99`,
      les trois durées de mouvement d'interface.
      *Vérification : manuelle, comparaison à la maquette 2a.*
- [ ] **T009** `core/reducedMotion.ts` (trois états `système / forcé actif / forcé
      inactif`) + `shell/Nav.tsx` + `shell/ReducedMotionToggle.tsx` — navigation à deux
      niveaux, teinte de famille appliquée à l'écran, compteur `n / 25`.
      *Test : unitaire — les trois états avec `matchMedia` simulé, rendu de la nav depuis
      le registre, famille active, navigation au clavier.*

### Temps et scène

- [ ] **T010** `transport/TimeDriver.ts` (interface) + `transport/drivers/waapi.ts` —
      `KeyframeEffect` à cible nulle, `play/pause/seek(progress)/setRate/loop/dispose`,
      `progress` lu depuis `getComputedTiming()`.
      *Test : unitaire — la sonde de planification devient un test permanent : easing
      appliqué, seek, playbackRate, `cancel()` libère.*
- [ ] **T011** `transport/TransportBar.tsx` variante `timeline` — retour au début,
      lecture/pause, boucle, piste de scrub graduée, temps écoulé / durée, menu de vitesse
      `0.25×` à `4×` valeurs négatives incluses. `Espace` et flèches.
      *Test : unitaire + clavier ; le scrub agit sur le driver, jamais sur l'état React.*
- [ ] **T012** `scenes/CanvasHost.tsx` — **le** `<Canvas>` r3f, unique, persistant,
      chargé paresseusement pour tenir Three.js hors du chunk initial,
      `frameloop="demand"`.
      *Test : unitaire — le canvas survit à un changement de leçon (pas de remontage) ;
      vérifié aussi en e2e par les compteurs `renderer.info`.*
- [ ] **T013** `scenes/WebglScene.tsx` — cube isométrique, sol quadrillé, graduations de
      bord, encart de mesures `x · t · fps`, description textuelle pour lecteur d'écran,
      `dispose` sur géométries et matériaux.
      *Test : unitaire sur le cycle de vie + e2e sur la libération.*

### Contrôles et code

- [ ] **T014** `controls/SliderControl.tsx` + `controls/ChoiceControl.tsx` — non contrôlés
      au sens React, rôle `slider` avec valeur annoncée et réglage aux flèches.
      *Test : unitaire + accessibilité (rôle, `aria-valuenow`, flèches).*
- [ ] **T015** `controls/ToggleControl.tsx` + `controls/EaseControl.tsx` — vignettes de
      courbe en SVG tracées depuis les fonctions d'easing réelles, mini-grille de fond.
      *Test : unitaire ; le tracé SVG est dérivé de la fonction, pas d'un chemin en dur.*
- [ ] **T016** `code/generate.ts` — `CodeTemplate` + `ParamValues` → `CodeLine[]`.
      *Test : unitaire — c'est le cœur du « code exact », il se teste sans DOM.*
- [ ] **T017** `code/CodePanel.tsx` + `code/highlight.ts` — replié sur une ligne,
      dépliable, surbrillance par `paramIds` pendant le réglage, regénération différée
      (`requestIdleCallback` ou debounce court), bouton copier.
      *Test : unitaire — la surbrillance suit le paramètre manipulé, la copie rend le texte
      affiché.*

### Assemblage et leçon

- [ ] **T018** `shell/LessonShell.tsx` — assemble chrome, scène, contrôles groupés par
      `group`, transport, code. **Zéro `if (lesson.id === …)`**.
      *Test : unitaire — un descripteur factice de forme inattendue (autre ordre de
      groupes, autre jeu de contrôles) produit un écran cohérent sans modifier le shell.
      C'est la répétition générale du verdict du lot 2.*
- [ ] **T019** La leçon, ses trois fichiers : `lessons/native/tween/lesson.ts` (descripteur
      complet — méthode `to/from/fromTo/set`, `Départ`, `Durée`, `Fantômes`, `Courbe`),
      `animation.ts` (animation WAAPI, calque de fantômes, et **reconstruction à
      progression normalisée conservée** quand un paramètre change en cours de lecture),
      `concept.fr.md` (150 à 300 mots, rédigé et relu — le texte de la maquette est
      inutilisable, D1).
      *Test : unitaire sur la reconstruction (progression égale avant et après) — c'est le
      critère 3. Comptage de mots et relecture humaine pour le concept.*
- [ ] **T020** Scénario Playwright de la leçon — points 5 et 7 du « terminé » : réglage
      pendant la lecture, et sortie sans `Animation` vivante ni ressource WebGL retenue.
      Mesure du chunk initial en gzip.
      *Test : e2e, **avec preuve par mutation** — retirer le `cancel()` au démontage doit
      faire virer le scénario au rouge.*

### Reporté hors de cette génération

`CLAUDE.md` — conventions effectives, structure réelle, commandes, et **la procédure exacte
pour ajouter une leçon** (`T3H-159`, spec §0.3). Il se rédige une fois les 20 tâches faites,
en phase de complétion : écrit avant, il documenterait une structure encore hypothétique.

### Tests existants impactés

- `src/App.test.tsx` et `src/App.tsx` — squelettes du lot 0, remplacés par le shell réel
  (T008/T018). Le test disparaît avec le composant.
- `tests/e2e/smoke.spec.ts` — l'assertion sur le titre `Anima Lab` survit, celle sur
  `lang: fr` devient une assertion de routage (T007).
- `src/test/aliases.test.ts` — **inchangé**, il continue de protéger les alias.
- `vite.config.ts` — commentaire périmé désignant `src/core/paths.test.ts` au lieu de
  `src/test/aliases.test.ts`. Correction mineure au passage, sans transition d'étape.

## Risques

| Risque | Parade |
|---|---|
| Three.js entraîné dans le chunk initial par le canvas persistant | `CanvasHost` en `React.lazy`, monté sous les routes de leçon et non au-dessus de l'accueil (T012). Mesuré en T020, pas supposé |
| Le shell absorbe une particularité de `native-tween` sans qu'on le voie | T018 le teste sur un descripteur factice de forme différente, avant que la vraie leçon existe |
| Les tests « pas de rendu parasite » et « pas de fuite » passent au vert sans rien exécuter | Preuve par mutation obligatoire sur les deux (T004, T020) — c'est la leçon de `longterm.md` |
| Le lot déborde : 20 tâches, quatre types de contrôle | Le socle (T001→T005) est la part non négociable ; si le temps manque, c'est T015 et le calque de fantômes qui se reportent, et le concept se réécrit en conséquence |

## Autonomous Additions

Aucune. Les seuls écarts au plan initial du lot 1 sont les trois décisions arbitrées par
l'humain (D1, D2, D3) et le renommage de `T3H-146` qui en découle mécaniquement.

`[autonomous]` La sonde WAAPI exécutée en planification n'est pas un ajout de périmètre :
elle résout une inconnue technique créée par D1, et son résultat devient le test T010.
