# Source Map — anima

> Structure du code — à quoi sert chaque module et ce qu'il possède.
> Chargé à la demande, contrairement à `environment/summary.md` qui charge à chaque
> session. La structure vit ici ; le résumé n'en garde qu'un pointeur.
>
> **Le lot 1 est écrit.** Les modules ci-dessous existent ; ceux marqués « lot N » sont
> encore à venir. Les alias sont vérifiés par `src/test/aliases.test.ts`, qui échoue si
> `vite.config.ts` et `tsconfig.json` divergent.
>
> Alias : `@` (racine `src/`), `@core`, `@shell`, `@scenes`, `@transport`, `@controls`,
> `@code`, `@i18n`, `@lessons`.
>
> Mettre à jour au fil du code : `reap index` dit qui appelle quoi, ce fichier dit pourquoi.

## Directory Structure

```
src/
  shell/          gabarit d'écran commun
  scenes/         quatre hôtes de scène
  transport/      barre de transport et pilotes de temps
  controls/       contrôles génériques rendus depuis params
  code/           panneau de code et coloration
  i18n/           dictionnaires et hook de traduction
  lessons/        une leçon = un dossier = trois fichiers
  core/           contrat, store, registre, services transverses
```

## Modules

### `core/` — le socle, écrit en premier

Possède le contrat de données et l'unique source de vérité. Aucun autre module ne
définit de type de leçon ni ne stocke de valeur de paramètre.

| Fichier | Rôle | Possède |
|---|---|---|
| `types.ts` | le contrat : `Lesson`, `Param`, `CodeTemplate`, `CodeLine`, `CubeAnimation`, `LessonTiming`, `VisibilityRule` | la forme de toute leçon. **Cinq champs absents de la spec §3** — `ParamValues`, `slug`, `animate`, `timing`, `visibleWhen` — chacun imposé par un cas réel |
| `paramStore.ts` | store Zustand des paramètres de la leçon en cours | **l'unique** source de vérité des valeurs. Expose lecture avec re-rendu (contrôles) et abonnement transitoire sans re-rendu (moteur d'animation) |
| `lessonRegistry.ts` | découverte et chargement des descripteurs, par famille | l'association route ↔ leçon, le découpage paresseux, et `globalIndex` — le compteur `n / 25` est l'index de la leçon dans le catalogue, pas un décompte de visites |
| `reducedMotion.ts` | préférence à trois états — `système` / `forcé actif` / `forcé inactif` | la valeur effective. `watchSystemPreference()` est **appelé explicitement** : un effet de bord à l'import s'exécute avant que rien puisse l'observer |
| `easings.ts` | catalogue des six courbes | leur forme CSS **et** leurs points de contrôle, dont les vignettes SVG sont tracées |
| `redraw.ts` | signal « le temps a bougé, redessine » | le seul couplage entre ce qui fait avancer le temps et ce qui dessine. `frameloop="demand"` ne redessine pas sans lui |
| `diagnostics.ts` | `window.__anima` — horloges vivantes, ressources WebGL, position du sujet | la seule observabilité du point 7 : `document.getAnimations()` est aveugle aux animations à cible nulle |
| `storage.ts` | *(lot 7)* accès unique à `localStorage` | leçons visitées, concepts lus, locale |
| `perf.ts` | *(lot 3)* indicateur `layout · paint · composite` | les métriques des leçons qui les déclarent |

### `shell/` — le gabarit, ignorant des leçons

Lit un `Lesson` et construit l'écran. **N'a aucune connaissance des leçons
individuelles** : si le shell doit changer pour accueillir une leçon, le contrat est
mauvais.

| Fichier | Rôle |
|---|---|
| `LessonShell` | assemble chrome + scène + contrôles + transport + code + Concept |
| `ConceptPanel` | panneau flottant en surimpression, markdown chargé à la demande. Piège le focus, se ferme par bouton, `Échap` et clic extérieur. La démo continue derrière |
| `Nav` | navigation à deux niveaux — famille puis leçon |
| `ReducedMotionToggle` | interrupteur du chrome, écrase la valeur détectée |

### `scenes/` — quatre implémentations, une interface

Interface commune : `mount / play / pause / seek(progress) / setParams / dispose`.

| Fichier | Rôle | Point d'attention |
|---|---|---|
| `CanvasLayer` | le calque, **chargé paresseusement** | sans lui, three.js part dans le chunk de la route initiale — mesuré à 332 ko gzip |
| `CanvasHost` | **le** `<Canvas>`, unique et persistant, calé sur le rectangle publié par le shell | changer de leçon met à jour un style, jamais un montage. `zIndex: 1` — sans lui il rend **sous** le fond de la scène |
| `PerspectiveRig` | caméra perspective à longue focale | la maquette montre un sol en perspective, pas isométrique. La longue focale garde l'échelle presque constante, donc l'espacement des fantômes lisible |
| `WebglScene` | cube, sol, trace de fantômes | lit les valeurs **hors de React** ; publie la projection de l'axe et la position du sujet |
| `SceneOverlay` | fil d'Ariane, pilule de propriété, graduations, mesures `x · t · fps` | les repères sont placés par **projection** de leur valeur : ils mesurent, ils ne décorent pas |
| `floorTexture` | sol dessiné dans un canvas 2D, fondu vers l'horizon | le brouillard de three.js mélangerait vers une couleur opaque, visible sur un canvas transparent |
| `projection` / `sceneStore` | où tombe une abscisse ; ce que le canvas doit dessiner | le store porte une **donnée**, jamais un élément React |
| `CssCubeScene` | *(lot 3)* 6 divs en `preserve-3d` | doit être superposable au cube WebGL |
| `DomGridScene` | *(lot 3)* 12 à 200 tuiles | le nombre est un paramètre de leçon |
| `ScrollColumnScene` | *(lot 4)* cube fixé + contenu défilant | conteneur à défilement propre |

### `transport/` — piloter le temps sans passer par React

| Fichier | Rôle |
|---|---|
| `TransportBar` | trois variantes — `timeline`, `scroll`, `none` — même emplacement, même hauteur |
| `drivers/waapi.ts` | une `Animation` à **cible nulle** : elle n'anime rien, elle sert d'horloge. Le navigateur applique la courbe, la scène lit `getComputedTiming().progress` |
| `drivers/gsap.ts` | *(lot 5)* timeline GSAP |
| `drivers/css.ts` | *(lot 3)* animation CSS |
| `drivers/raf.ts` | *(lot 3)* boucle de rendu WebGL |

Les quatre implémentent `TimeDriver`. Le scrub agit sur le driver, **jamais** sur l'état
React. Une interface, pas des conditions dispersées dans le composant.

### `controls/` — rendus génériquement depuis `params`

Un composant par type de contrôle, jamais de JSX sur mesure par leçon. Les curseurs sont
non contrôlés au sens React : la valeur part dans le store, l'affichage chiffré s'y
abonne, l'élément `input` n'est pas repiloté à chaque frame.

`SliderControl`, `ChoiceControl`, `ToggleControl`, `EaseControl` — ce dernier est le seul
cas spécialisé : vignettes de courbes tracées en SVG.

### `code/` — le code affiché est dérivé, jamais saisi

| Fichier | Rôle |
|---|---|
| `CodePanel` | replié sur une ligne par défaut, onglets si plusieurs `CodeTemplate`, bouton copier. Regénéré en différé (`requestIdleCallback` ou debounce court) |
| `highlight` | coloration légère — Shiki en import dynamique, ou minimale maison. Jamais de dépendance lourde au démarrage. Surligne la ligne du paramètre manipulé via `paramIds` |

### `i18n/` — aucune chaîne traduisible en dur, nulle part

`fr.ts` (rempli au MVP), `en.ts` (créé vide, rempli au lot 8), `useTranslation`.
Les libellés techniques (`duration`, `translateX`) ne passent pas par le dictionnaire :
ils ne se traduisent pas et restent en monospace. Les gloses et les titres, si.

### `lessons/` — une leçon = un dossier = trois fichiers

```
lessons/<famille>/<leçon>/
  lesson.ts        le descripteur Lesson — données, pas de JSX
  animation.ts     la fonction d'animation, seul code spécifique à la leçon
  concept.fr.md    150 à 300 mots, chargé à la demande (concept.en.md au lot 8)
```

**La procédure exacte pour en ajouter une est dans `CLAUDE.md`.** Écrite : `native/tween`.

Familles : `native/` (10), `gsap/` (10), `shaders/` (5). Si une leçon demande un quatrième
fichier, c'est un signal à remonter — pas à absorber en silence.
