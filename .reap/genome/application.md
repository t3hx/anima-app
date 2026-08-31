# Application

## Project Identity

**Anima Lab** — site pédagogique sur l'animation web.

**Le produit.** 25 leçons réparties en trois familles : socle natif (10), GSAP (10),
shaders (5). Chaque leçon est une démonstration manipulable — une scène animée, des
contrôles qui règlent ses paramètres, et le code source correspondant qui se met à jour
en temps réel avec les valeurs réglées.

**Le problème résolu.** Les ressources d'apprentissage de l'animation web montrent soit
du code figé, soit des démos qu'on ne peut pas disséquer. Ici on règle un paramètre, on
voit l'effet sur la scène et, dans le même écran, le code exact qui le produit — avec la
ligne concernée surlignée. Le réglage est partageable par URL.

**Utilisateur cible.** Développeurs front-end, niveau intermédiaire à avancé. Ils savent
coder ; ce qu'ils viennent chercher, c'est la maîtrise du mouvement (CSS, WAAPI, GSAP,
WebGL/GLSL) et la compréhension de son coût.

**Philosophie de conception : une leçon est une donnée, pas un composant.**
Chaque leçon déclare son type de scène, ses paramètres, sa variante de transport et son
gabarit de code. Le shell lit ce descripteur et construit l'écran. Le code spécifique à
une leçon se limite à sa fonction d'animation.

C'est le point structurant du projet : les 25 leçons partagent un seul gabarit d'écran
mais recouvrent des technologies d'animation incompatibles entre elles. L'architecture
doit absorber cette hétérogénéité sans que chaque leçon devienne un composant sur mesure.
Si à la leçon 12 on écrit encore du JSX sur mesure pour poser des curseurs,
l'architecture a échoué.

**Source de vérité produit.** `design/spec-technique-anima-lab.md` (spécification
fonctionnelle et technique) et `design/handoff_anima_lab/` (maquettes). La spec décrit le
comportement ; les maquettes décrivent l'apparence.

## Architecture Decisions

**Monolithe frontal statique**, sans serveur applicatif ni compte utilisateur. Organisé
en couches par responsabilité, pas en composants par leçon.

**Le pivot : un contrat de données.** `Lesson`, `Param`, `CodeTemplate`, `CodeLine` sont
écrits en premier, avant tout composant.

Le lot 1 lui a ajouté cinq champs que la spec §3 n'avait pas, chacun imposé par un cas réel
et aucun par anticipation : `ParamValues` (référencé sans être défini), `Lesson.slug` (le
segment d'URL, distinct de l'`id`), `Lesson.animate` (la fonction d'animation), `Lesson.timing`
(la durée et la courbe demandées au driver) et `Param.visibleWhen` (un paramètre qui n'a pas
de sens pour tous les réglages).

**`timing` mérite d'être compris avant d'être copié** : le gabarit de code et le driver
doivent lire la **même** fonction. Les séparer a produit un écran qui affichait `linear`
pendant que le navigateur appliquait `ease-out`. Sur ce site, le code affiché *est* le
produit : il ne peut pas mentir.

Un shell générique lit un `Lesson` et construit l'écran ; il n'a aucune connaissance des
leçons individuelles. Une leçon = un dossier = trois fichiers (`lesson.ts` descripteur,
`animation.ts`, `concept.fr.md`). Si une leçon en exige davantage, c'est un signal à
remonter.

**Flux de données — une seule source de vérité.** Le store Zustand des paramètres de la
leçon en cours alimente trois consommateurs :

- les contrôles — lecture et écriture, avec re-rendu ;
- le moteur d'animation — abonnement transitoire (`store.subscribe`), sans re-rendu ;
- le panneau de code — regénéré en différé (`requestIdleCallback` ou debounce court),
  avec surbrillance de la ligne du paramètre manipulé.

Deux règles en découlent : le code affiché est toujours dérivé des valeurs courantes,
jamais saisi en dur ; et modifier un paramètre pendant la lecture reconstruit l'animation
en reprenant à la même progression normalisée, sans casser la lecture.

**Abstractions de plateforme** — chacune existe pour absorber l'hétérogénéité des
technologies enseignées derrière une interface unique :

- **Hôte de scène** (`mount / play / pause / seek(progress) / setParams / dispose`) avec
  quatre implémentations : `webgl`, `css-cube`, `dom-grid`, `scroll-column`.
- **`TimeDriver`** avec quatre implémentations — timeline GSAP, `Animation` WAAPI,
  animation CSS, boucle de rendu WebGL. Le transport pilote le driver, jamais l'état
  React. Une interface, pas des conditions dispersées dans le composant.
- **`core/storage.ts`** — accès unique à `localStorage`, réimplémentable en appels réseau
  le jour où un compte utilisateur apparaît. Le but n'est pas de le préparer, seulement
  de ne pas disperser `localStorage` dans quinze composants.

**Trois pièges React traités dès le lot 1**, parce qu'une implémentation naïve casse ce
projet en particulier :

1. `StrictMode` monte deux fois en développement — toute animation doit être idempotente
   et nettoyée. `useGSAP` (contexte + révocation automatique) plutôt que `useEffect` +
   `gsap.to` à la main.
2. Un curseur déplacé produit 60 changements par seconde — s'ils re-rendent l'arbre
   React, la démonstration saccade. Sur un site qui enseigne la fluidité, rédhibitoire.
   D'où l'abonnement transitoire.
3. Le canvas react-three-fiber est **unique et persistant**, monté haut dans l'arbre ;
   seul son contenu change selon la route. Le remonter à chaque navigation provoque des
   à-coups et, à terme, l'épuisement des contextes WebGL disponibles.

**Chargement.** Three.js, GSAP et les plugins sont chargés à la demande, par famille de
leçons (`React.lazy` + découpage Vite par route). Le markdown des concepts est chargé à
la demande, jamais dans le bundle initial.

**Frontières d'erreur.** Une par leçon : une leçon cassée n'emporte pas le site. Une
erreur de compilation GLSL affiche le message brut dans le panneau de code.

### Décision ouverte — prérendu statique (échéance : avant le lot 7)

Un SPA pur ne produit aucun HTML par route, donc aucune indexation des 25 leçons.
**Direction privilégiée : adopter un prérendu au build** (`vite-react-ssg` ou équivalent),
qui reste entièrement statique et compatible avec l'image Docker — **à la condition qu'il
ne gêne rien d'autre**.

Critère de gêne, à évaluer concrètement : le prérendu exécute le rendu dans Node, donc
tout accès à `window`, `document`, WebGL ou `localStorage` doit être gardé. Si absorber
cela demande de tordre le shell, le canvas persistant ou le store, on renonce et on reste
en SPA pur. Sinon on prend.

## Tech Stack

**Décidé, non rediscutable** (spec §13) : React 19 + TypeScript + Vite. Pas de Next.js,
pas de Vue.

| Domaine | Choix |
|---|---|
| Langage | TypeScript, mode strict |
| Build | Vite — SPA statique |
| UI | React 19 |
| Routage | React Router, déclaratif, une route par leçon, préfixe de locale |
| 3D | react-three-fiber + @react-three/drei ; Three.js accessible directement au besoin |
| Animation | GSAP 3.13 — core + ScrollTrigger, SplitText, MorphSVG, DrawSVG, MotionPath, Flip (tous gratuits depuis la 3.13) + `@gsap/react` et son hook `useGSAP` |
| État global | Zustand — paramètres de leçon, mouvement réduit, progression, locale |
| Style | CSS écrit à la main depuis les tokens du design |
| Coloration syntaxique | Shiki en import dynamique, ou coloration minimale maison — jamais de dépendance lourde au démarrage |
| i18n | Dictionnaires typés `src/i18n/fr.ts` et `en.ts` ; pas de bibliothèque au MVP (si vraiment nécessaire : `react-i18next`, un seul namespace) |
| Persistance | `localStorage` seul, derrière `core/storage.ts` |
| Déploiement | Docker multi-étapes (node:22-alpine → nginx:alpine) servant le build statique |

**Interdits explicites.** Aucune bibliothèque d'animation supplémentaire — Motion,
anime.js, react-spring : le sujet du site est précisément de montrer ce que font les
technologies enseignées. Aucune librairie de composants UI.

## Conventions

**Langue.** Zéro français dans le code : noms de variables, fonctions, classes, fichiers,
chaînes techniques et logs en anglais. Seuls les commentaires peuvent être en français.
Commits, PR, issues : anglais. Les textes destinés à l'utilisateur passent par le
dictionnaire i18n, jamais en dur.

**Nommage.** Conventions React/TypeScript par défaut : `PascalCase` pour les composants et
les types, `camelCase` pour les variables et fonctions, `SCREAMING_SNAKE_CASE` pour les
constantes. Fichiers de composants en `PascalCase.tsx`, modules utilitaires en
`camelCase.ts`. Les `id` de leçon et de paramètre sont en kebab-case (`native-tween`) et
servent de clé partout — contrôle, animation, surbrillance du code.

**Outillage qualité.** Trois outils, chacun avec un périmètre distinct :

- **Biome** — formatage et lint. Un seul binaire, config minimale, remplace Prettier +
  ESLint.
- **Vitest** + Testing Library — tests unitaires et de composants. Vitest partage la
  configuration Vite. Périmètre : le contrat de données, le store de paramètres, la
  génération de code depuis un `CodeTemplate`, les réducteurs, le registre de leçons.
- **Playwright** — tests de bout en bout, sur navigateur réel. Il couvre ce que Vitest ne
  peut pas atteindre, et qui se dégrade silencieusement à mesure que les leçons
  s'accumulent :
  - point 5 du « terminé » — régler un paramètre pendant la lecture ne casse rien et
    reprend à la même progression normalisée ;
  - point 7 — quitter une leçon ne laisse ni timeline vivante, ni `ScrollTrigger` actif,
    ni ressource WebGL non libérée (assertion sur les compteurs `renderer.info` et sur
    `gsap.globalTimeline.getChildren()`) ;
  - la navigation clavier et le piège de focus du panneau Concept (spec §9) ;
  - la sérialisation des paramètres dans l'URL — un lien partagé restitue le réglage.

  Un scénario Playwright par leçon, généré depuis le descripteur plutôt qu'écrit à la
  main : c'est le corollaire de « une leçon est une donnée ».

**Ce qui reste vérifié à la main.** Les 55 images par seconde et l'absence de rendu
parasite au profileur React ne sont pas automatisables de façon fiable. Ils font partie de
la revue d'un lot, pas de la suite de tests.

**TDD strict**, dans cet ordre, sans sauter d'étape : (1) écrire le test qui échoue,
(2) le minimum de code pour le faire passer, (3) relire, simplifier, refactorer avec les
tests au vert. Aucune tâche n'est annoncée terminée sans avoir fait tourner les tests et
montré leur sortie.

**Principes.** DRY, KISS, SOLID. Pas de duplication, pas d'abstraction prématurée,
responsabilités séparées. Le code simple et évident bat le code malin — pas de one-liner
cryptique.

**Structure de fichiers** (spec §12) :

```
src/
  shell/          LessonShell, ConceptPanel, Nav, ReducedMotionToggle
  scenes/         WebglScene, CssCubeScene, DomGridScene, ScrollColumnScene, CanvasHost
  transport/      TransportBar, drivers/ (gsap, waapi, css, raf)
  controls/       SliderControl, ChoiceControl, ToggleControl, EaseControl
  code/           CodePanel, highlight
  i18n/           fr.ts, en.ts, useTranslation
  lessons/
    native/tween/   lesson.ts (descripteur) + animation.ts + concept.fr.md
    native/easing/
    gsap/...
    shaders/...
  core/           types.ts, lessonRegistry.ts, paramStore.ts, storage.ts,
                  reducedMotion.ts, perf.ts
```

**Définition du « terminé » pour une leçon** (spec §11) — les huit points doivent être
vrais, sans exception :

1. Tous les paramètres déclarés sont réglables et affectent réellement le rendu.
2. Le code affiché correspond exactement aux valeurs courantes.
3. La surbrillance fonctionne pour chaque paramètre.
4. Le texte du concept est écrit en français, relu, et fait entre 150 et 300 mots.
5. Modifier un paramètre pendant la lecture ne casse rien.
6. Le mode mouvement réduit donne un résultat utilisable.
7. Quitter la leçon ne laisse ni timeline vivante ni ressource WebGL non libérée.
8. Aucune chaîne traduisible n'est écrite en dur ; tout passe par le dictionnaire.

## Constraints

**Performance** (spec §6) :

- Chargement initial sous **200 ko de JS gzip, hors Three.js**. L'unité est le gzip :
  c'est ce que l'utilisateur télécharge, c'est ce que nginx sert (compression activée,
  §8), et lu en octets bruts le budget serait consommé à 95 % par React seul.
  Mesure : la sortie de `vite build` pour le chunk de la route initiale, hors chunks
  chargés paresseusement par famille et hors Three.js. Le budget porte sur la route
  initiale, pas sur la somme des chunks.
- Three.js, GSAP et les plugins chargés à la demande, par famille de leçons.
- Aucune leçon sous **55 images par seconde** sur un portable milieu de gamme — sauf la
  démonstration du coût de rendu, où la chute de performance *est* le contenu : ne pas
  l'optimiser.
- Textures des leçons shaders : compressées, **1024 px maximum**.
- Vérification au profileur React : un déplacement de curseur ne doit provoquer aucun
  rendu au-delà du composant qui affiche la valeur. Vérification manuelle, en revue de
  lot — non automatisable de façon fiable.
- Pause hors écran (`IntersectionObserver`) ; `frameloop="demand"` partout où l'animation
  n'est pas continue.

**Ressources.** Une seule scène active à la fois. Changer de leçon libère les ressources
de la précédente : `dispose` sur géométries, matériaux et textures, révocation du contexte
GSAP, `cancel` sur les animations WAAPI, `ScrollTrigger.kill()`. Une fuite mémoire sur un
site de 25 scènes est le risque numéro un — le canvas persiste, son contenu non.

**Internationalisation.** MVP en français, bilingue français/anglais à terme. L'anglais
n'est pas implémenté maintenant, mais **aucune chaîne traduisible ne doit être écrite en
dur** — c'est la seule dette non rattrapable à moindre coût. Routes préfixées par la
locale dès le MVP : ajouter le préfixe après coup casse toutes les URL déjà partagées. Le
**segment de famille reste stable en anglais** quelle que soit la locale — `/fr/native/tween`
et `/en/native/tween` — de sorte que changer de langue soit un remplacement de préfixe, sans
table de correspondance ni URL à réécrire. Distinction à tenir : les libellés techniques (`duration`, `translateX`)
ne se traduisent pas et restent en monospace ; les gloses et les titres se traduisent. Le
code affiché ne se traduit jamais, commentaires compris.

**Accessibilité** (spec §9). Navigation clavier complète, focus visible, ordre de
tabulation cohérent. Curseurs en rôle `slider` avec valeurs annoncées et réglage aux
flèches. Transport utilisable au clavier (`Espace`, flèches). Le panneau Concept piège le
focus tant qu'il est ouvert et le restitue à la fermeture. Description textuelle courte
par scène. Contrastes AA. `lang` mis à jour selon la locale.

**Dégradation.** Absence de WebGL : bascule automatique vers `css-cube` si la leçon le
permet, message explicite sinon. Erreur de compilation d'un shader : afficher le message
GLSL brut dans le panneau de code plutôt que d'écrouler la page.

**Secrets.** Tous les secrets passent par Doppler. Aucun `.env` commité, aucun secret en
dur, aucun secret dans un log. `.env*` dans `.gitignore`.

**Livraison.** Le lot 1 est une tranche verticale complète, pas une couche horizontale :
une seule leçon qui fonctionne de bout en bout vaut mieux qu'un système de composants sans
contenu.
