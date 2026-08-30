# Source Map — anima

> Structure du code — à quoi sert chaque module et ce qu'il possède.
> Chargé à la demande, contrairement à `environment/summary.md` qui charge à chaque
> session. La structure vit ici ; le résumé n'en garde qu'un pointeur.
>
> **Les dossiers existent, les modules non.** Les neuf dossiers de la structure §12 sont
> créés et leurs alias configurés dans `vite.config.ts` et `tsconfig.json` — vérifiés par
> `src/test/aliases.test.ts`, qui échoue si les deux divergent. Aucun module décrit
> ci-dessous n'est encore écrit : le lot 1 les remplit.
>
> Alias disponibles : `@` (racine `src/`), `@core`, `@shell`, `@scenes`, `@transport`,
> `@controls`, `@code`, `@i18n`, `@lessons`.
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
| `types.ts` | le contrat : `Lesson`, `Param`, `CodeTemplate`, `CodeLine`, `SceneKind`, `TransportKind`, `Family`, `I18nKey` | la forme de toute leçon. Écrit avant tout composant |
| `paramStore.ts` | store Zustand des paramètres de la leçon en cours | **l'unique** source de vérité des valeurs. Expose lecture avec re-rendu (contrôles) et abonnement transitoire sans re-rendu (moteur d'animation) |
| `lessonRegistry.ts` | découverte et chargement des descripteurs, par famille | l'association route ↔ leçon, et le découpage paresseux par famille |
| `storage.ts` | accès unique à `localStorage` | leçons visitées, concepts lus, préférence de mouvement réduit, locale. Interface réimplémentable en appels réseau |
| `reducedMotion.ts` | préférence à trois états — `système` / `forcé actif` / `forcé inactif` | la valeur effective que toutes les scènes lisent |
| `perf.ts` | compteur d'images par seconde, indicateur `layout · paint · composite` | les métriques, activées seulement sur les leçons qui les déclarent |

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
| `CanvasHost` | **le** `<Canvas>` react-three-fiber, unique et persistant, monté haut dans l'arbre | seul son contenu change selon la route. Ne jamais le remonter |
| `WebglScene` | cube isométrique + sol quadrillé | `frameloop="demand"` quand l'animation n'est pas continue |
| `CssCubeScene` | 6 divs en `preserve-3d` | doit être visuellement superposable au cube WebGL — c'est ce qui rend `engineToggle` crédible |
| `DomGridScene` | 12 à 200 tuiles | le nombre est un paramètre de leçon, jamais une constante |
| `ScrollColumnScene` | cube fixé + contenu défilant | conteneur à défilement propre, ne défile pas la page |

### `transport/` — piloter le temps sans passer par React

| Fichier | Rôle |
|---|---|
| `TransportBar` | trois variantes — `timeline`, `scroll`, `none` — même emplacement, même hauteur |
| `drivers/gsap.ts` | pilote une timeline GSAP |
| `drivers/waapi.ts` | pilote une `Animation` WAAPI |
| `drivers/css.ts` | pilote une animation CSS |
| `drivers/raf.ts` | pilote une boucle de rendu WebGL |

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

Familles : `native/` (10), `gsap/` (10), `shaders/` (5). Si une leçon demande un quatrième
fichier, c'est un signal à remonter — pas à absorber en silence.
