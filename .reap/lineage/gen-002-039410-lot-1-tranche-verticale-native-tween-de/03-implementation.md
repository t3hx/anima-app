# Implementation Log

> Génération `gen-002-039410` (embryo) — lot 1, tranche verticale `native-tween`.
>
> Convention de preuve (génome, § « Record what kind of evidence you have ») :
> `[ran]` commande exécutée dans cette génération · `[negative]` cassé exprès et vu rouge ·
> `[read]` jugé par lecture, non exécuté.

## Completed Tasks

| # | Tâche | État | Preuve |
|---|---|---|---|
| T001 | Dépendances produit | fait | `[ran]` |
| T002 | `core/types.ts` — le contrat | fait | `[ran]` `[negative]` |
| T003 | `core/paramStore.ts` — la source unique | fait | `[ran]` |
| T004 | Preuve « aucun rendu parasite » | fait | `[ran]` `[negative]` |
| T005 | `core/lessonRegistry.ts` | fait | `[ran]` |
| T006 | Ossature i18n + resserrement de `I18nKey` | fait | `[ran]` `[negative]` |
| T007 | Routage préfixé par la locale | fait | `[ran]` |
| T008 | Tokens CSS du design | fait | `[ran]` |
| T009 | `reducedMotion` + `Nav` + `ReducedMotionToggle` | fait | `[ran]` |
| T010 | `TimeDriver` + driver WAAPI | fait | `[ran]` `[negative]` |
| T011 | `TransportBar` variante timeline | fait | `[ran]` |
| T012 | `CanvasHost` — le canvas unique et persistant | fait | `[ran]` `[negative]` |
| T013 | `WebglScene` — cube et sol quadrillé | fait | `[read]` — vérification navigateur en T020 |
| T014 | `SliderControl` + `ChoiceControl` | fait | `[ran]` `[negative]` |
| T015 | `ToggleControl` + `EaseControl` + catalogue de courbes | fait | `[ran]` |
| T016 | `code/generate.ts` | fait | `[ran]` `[negative]` |
| T017 | `CodePanel` + surbrillance + différé + copie | fait | `[ran]` `[negative]` |
| T018 | `LessonShell` | fait | `[ran]` |
| T019 | La leçon `native-tween` — trois fichiers | fait | `[ran]` |
| T020 | Scénario Playwright, points 5, 6 et 7 + budget | fait | `[ran]` `[negative]` |
| T021 | **Correction : la scène n'affichait rien** (régression depuis validation) | fait | `[ran]` `[negative]` |
| T022 | **Correction : clavier, mouvement réduit, méthodes, décors** (2ᵉ retour humain) | fait | `[ran]` `[negative]` |
| T023 | **Correction : caméra perspective, sol fondu, proportions** (3ᵉ retour humain) | fait | `[ran]` `[negative]` |
| T024 | **Correction : alignement, vignettes, `set`, paramètres conditionnels** (4ᵉ retour) | fait | `[ran]` |
| T025 | **Correction : huit points, dont deux règles CSS jamais écrites** (5ᵉ retour) | fait | `[ran]` |
| T026 | **Finition : séparateur, graisse, stabilité de la scène, retrait de la vitesse** (6ᵉ retour) | fait | `[ran]` |
| T027 | **Mise en page sans barre de défilement, transport aux valeurs du handoff** (7ᵉ retour) | fait | `[ran]` |
| T028 | **Poignées au-dessus de leur piste, code borné en colonnes** (8ᵉ retour) | fait | `[ran]` `[negative]` |

### T001 — dépendances

Installé : `zustand@5.0.15`, `react-router@8.3.1`, `three@0.185.1`,
`@react-three/fiber@9.7.0`, `@react-three/drei@10.7.8`, plus `@types/three@0.185.4` en
dépendance de développement. **GSAP n'est pas installé** — décision D1 du plan : le lot 1
n'utilise que la WAAPI.

`[ran]` `npm run build` → `dist/assets/index-DSb_Smf7.js` 190,55 ko brut, **60,02 ko gzip**.

Chiffre identique à celui du lot 0, et c'est le résultat attendu : aucun module ne les
importe encore, donc Vite ne les embarque pas. C'est la **ligne de base** contre laquelle
se mesurera le budget en T020, pas une mesure du coût des dépendances.

### T002 — `core/types.ts`, le contrat

Transcription de la spec §3, durcie sur trois points :

1. **`ParamValues` est défini.** La spec le référence dans `CodeTemplate.render` sans
   jamais le poser. C'est `Readonly<Record<string, ParamValue>>` avec
   `ParamValue = number | string | boolean`.
2. **`Param` est une union discriminée** sur `control.type`, ce qui lie chaque type de
   contrôle au type de sa valeur par défaut. La spec laissait `default: number | string |
   boolean` pour tous les contrôles : un curseur dont le défaut est `'two'` compilait.
   Il ne compile plus.
3. **`slug` ajouté à `Lesson`.** Imposé par la décision D2 : le routage
   `/fr/native/tween` a besoin d'un segment d'URL distinct de l'`id` global
   (`native-tween`). Sans lui, il faudrait le dériver par découpage de chaîne, un couplage
   implicite entre l'identifiant et l'URL.

`EaseSpec` reste nu (`{ type: 'ease' }`) comme dans la spec : la liste des courbes est
commune à toutes les leçons et vivra dans `@core/easings`. Ne pas la porter dans le
descripteur, c'est appliquer « ne jamais généraliser avant le lot 2 ».

`I18nKey` reste `string` à ce stade. Il sera resserré sur les clés réelles du dictionnaire
en T006 — c'est là que « clé absente = erreur de compilation » devient vrai. Tant que ce
n'est pas fait, l'invariant i18n n'est tenu que par la relecture.

### T003 — `core/paramStore.ts`, l'unique source de vérité

Store Zustand `vanilla` + middleware `subscribeWithSelector`, en instance unique de module :
une seule scène est active à la fois, donc un seul store. Le choix du store *vanilla*
plutôt que du `create` React est ce qui permet au moteur d'animation de s'abonner **hors de
React** ; les hooks sont ajoutés par-dessus, pas l'inverse.

API : `loadLesson` (amorce depuis les `default` du descripteur), `setValue`, `reset`
(retour aux défauts sans changer de leçon), `clear` (sortie de leçon), `subscribeToParam`
(transitoire, un seul paramètre, le listener reçoit la valeur et rien d'autre).

Deux comportements décidés ici, non dictés par la spec :

- **`loadLesson` abandonne intégralement les valeurs précédentes.** Un report silencieux
  d'une leçon à l'autre ferait diverger la scène du descripteur.
- **`setValue` ignore un `id` que la leçon ne déclare pas.** Accepter n'importe quelle clé
  laisserait le panneau de code afficher une valeur qu'aucun contrôle ne pilote.

`[ran]` `npm run test` → 10 tests du store, verts. `[ran]` `typecheck`, `check` verts.

### T004 — la preuve « aucun rendu parasite » (`T3H-142`)

Le profileur React n'est pas automatisable de façon fiable ; on compte donc les rendus.
L'arbre de test reproduit la situation réelle : un `AnimationEngine` qui suit la valeur et
un `ValueReadout` qui l'affiche, puis 60 écritures successives, **chacune dans son propre
`act`** — un drag, pas un lot groupé par React.

Pour que la mutation porte sur du **code produit** et non sur le test, les deux hooks
vivent dans `paramStore.ts` :

- `useParamValue(id)` — lecture re-rendante, réservée au composant dont l'affichage *est*
  la valeur ;
- `useParamSubscription(id, listener)` — abonnement transitoire, aucun rendu. Le listener
  est gardé en référence pour que sa recréation à chaque rendu ne relance pas
  l'abonnement ; seul un changement d'`id` le fait.

Résultat `[ran]` : moteur **1 rendu**, affichage **61 rendus**, listener **60 appels**.

Une assertion a été **réordonnée** après la première mutation : le compte d'appels
échouait avant que le compte de rendus soit atteint, si bien que la revendication centrale
du test n'était pas celle qui mordait. Elle est désormais assertée en premier.

### T005 — `core/lessonRegistry.ts`

Deux responsabilités, pas une de plus : résoudre `famille + slug → Lesson`, et charger les
descripteurs **par famille**. Le découpage par famille n'est pas un choix esthétique — la
navigation n'affiche jamais que les leçons de la famille active (maquette 2f), donc rien
n'oblige à charger les 25 descripteurs, et chaque famille devient un chunk Vite.

Trois comportements décidés ici :

- **Une famille inconnue rend une liste vide, elle ne lève pas.** Une URL erronée est un
  cas d'usage, pas un défaut de programmation.
- **Deux leçons au même slug lèvent, au chargement de la famille.** Une URL qui désigne
  deux écrans est un défaut de programmation, lui — et mieux vaut l'apprendre au chargement
  qu'au partage d'un lien.
- **Le chargement est mémoïsé par famille**, donc une seconde visite ne coûte rien.

`TOTAL_LESSONS = 25` est une constante produit (« 25 leçons »), pas un total dérivé : le
compteur `n / 25` du chrome ne doit pas dépendre du nombre de familles chargées.

### T006 — ossature i18n, et l'invariant rendu vérifiable

Trois fichiers : `i18n/fr.ts` (le dictionnaire, `as const`), `i18n/en.ts` (vide, `Partial`),
`i18n/translate.ts` (`I18nKey`, `Locale`, `translate`, `createTranslator`, `isLocale`).

**Le point qui compte : `I18nKey` n'est plus `string`.** La spec §3 l'écrit
`type I18nKey = string`, ce qui ne contraint rien — une chaîne française en dur dans un
descripteur compile parfaitement. Il est désormais dérivé du dictionnaire français
(`keyof typeof fr`), locale de référence. L'invariant « aucune chaîne traduisible en dur »
est donc tenu par le compilateur, pas par la relecture.

Le repli est **clé par clé**, pas dictionnaire par dictionnaire : au lot 8, une traduction
anglaise partielle affichera l'anglais là où il existe et le français ailleurs, plutôt que
de basculer tout l'écran dans une seule langue.

### T007 — routage préfixé par la locale

`routes.tsx` déclare trois niveaux : `/` redirige vers la locale par défaut, `/:locale`
valide le préfixe, `/:locale/:family/:slug` résout la leçon. Segments de famille **stables
en anglais** (décision D2).

Une locale inconnue est **réécrite** vers le français en conservant le reste du chemin :
`/de/native/tween` → `/fr/native/tween`. Un lien mal formé mène à la bonne leçon plutôt
qu'à une impasse — c'est le comportement qui sert le partage d'URL, la raison d'être du
préfixe.

`localeStore` (Zustand) **reflète** l'URL, il ne la pilote pas. L'inverse casserait le
partage : un lien doit restituer la langue de l'expéditeur, pas la préférence du visiteur.
`useTranslation` lit ce miroir.

`LessonRoute` résout la leçon, charge ses valeurs dans le store et **le vide au
démontage** — première application concrète de « une seule scène active à la fois ».

Quatre fichiers de support créés : `shell/Home.tsx` (accueil provisoire, remplacé par la
navigation en T009), `lessons/registry.ts` (le seul endroit qui connaît les familles),
`lessons/native/index.ts` (vide jusqu'à T019), et `App.tsx` réduit au montage du routeur.

`[ran]` `npm run build` → route initiale **91,71 ko gzip** (budget 200), et un chunk
`native-*.js` distinct : le découpage paresseux par famille fonctionne réellement.

`[ran]` `npm run test:e2e` → 6 scénarios verts, dont l'accès **direct** à
`/fr/native/tween` en 200, ce que jsdom ne peut pas vérifier.

### T008 — tokens du design

`styles/tokens.css` et `styles/base.css`, transcription du handoff 2a : les sept couleurs,
les trois accents de famille, les deux polices Google, l'échelle d'espacement, les cinq
rayons, les trois durées de mouvement d'interface.

L'accent actif est une variable (`--accent`) réécrite par `[data-family]` : recolorer tout
un écran est un attribut sur un conteneur, pas une prop à faire descendre. Les trois
accents partagent chroma et luminosité, donc le contraste ne change pas d'une famille à
l'autre.

`--duration-*` tombe à `0ms` sous `prefers-reduced-motion` **et** sous
`[data-reduced-motion='true']`, que l'application pose depuis la préférence effective.
Sans le second, l'interrupteur du chrome n'aurait aucun effet sur les transitions
d'interface — seulement sur les scènes.

**Ajout de structure** : `src/styles/`, absent de la spec §12. Vingt-cinq leçons ne
tiendront pas dans une feuille unique, et le CSS de composant vit à côté du composant
(`Nav.css`, `ReducedMotionToggle.css`). À consigner dans l'environnement en phase reflect.

### T009 — mouvement réduit, navigation, interrupteur

`core/reducedMotion.ts` — trois états `system / forced-on / forced-off`. L'interrupteur du
chrome n'a que deux positions : `toggle()` traduit l'état effectif courant en `forced-on`
ou `forced-off`, donc une préférence système est un **défaut, pas une prison**.

`shell/Nav.tsx` — deux rangées (maquette 2f). Seule la famille active est chargée, ce qui
rend le découpage par chunk réel plutôt que théorique. La famille active porte
`aria-current="page"` : elle n'est pas signalée que par la couleur.

`shell/ReducedMotionToggle.tsx` — `role="switch"` plutôt qu'une case à cocher stylée : la
technologie d'assistance l'annonce correctement et `Espace` le bascule sans code
supplémentaire. Testé au clavier, pas seulement au clic.

### T010 — `TimeDriver` et le driver WAAPI

L'interface distingue **deux progressions**, et les confondre serait le bug que personne ne
verrait en relecture :

- `timeProgress` — la position dans le temps, linéaire. C'est ce que pilote le scrub et ce
  qu'affiche la barre de transport.
- `easedProgress` — la progression après application de la courbe. C'est ce que la scène
  applique à la propriété animée.

Les confondre ferait sauter la poignée de scrub en même temps que le cube décélère.

`retime(...)` porte le point 5 du « terminé » : il lit la progression **avant** de changer
le temps, applique la nouvelle durée, puis restitue la même progression normalisée.

Le driver WAAPI repose sur un `KeyframeEffect` à **cible nulle** — l'animation n'anime
rien, elle sert d'horloge. C'est ce qui permet à une API qui ne connaît que le DOM de
piloter un `mesh` three.js sans qu'on écrive le moindre calcul de courbe (invariant
« ne jamais écrire un moteur d'animation maison par-dessus la WAAPI »).

### T011 — `TransportBar`, variante timeline

Retour au début, lecture/pause, boucle, scrub gradué, temps écoulé / durée, vitesses de
`-2×` à `4×`. React ne re-rend que sur les événements discrets — lecture, boucle, vitesse.
La position de la poignée et le temps affiché sont écrits **directement dans le DOM**
depuis une boucle `requestAnimationFrame`. Un `value` piloté par un état re-rendrait la
barre soixante fois par seconde.

Les commandes sont des éléments natifs : `<button>` pour la lecture (donc `Espace` marche
sans code), `<input type="range">` pour le scrub (donc rôle `slider`, valeur annoncée et
flèches sans code). Redoubler ces valeurs en attributs `aria-*` est la façon habituelle de
les faire diverger — on ne le fait pas.

### T012 — le canvas unique et persistant

`sceneStore` porte **une donnée** (`kind`, `lessonId`, `driver`), pas un élément React :
le canvas lit ce descripteur et choisit son contenu, exactement comme le shell lit un
`Lesson`. `CanvasHost` n'existe pas tant qu'aucune leçon WebGL n'est active — l'accueil ne
paie ni contexte WebGL ni coût de rendu.

### T013 — `WebglScene`

Cube isométrique, sol quadrillé, éclairage. La scène **lit** `driver.easedProgress` dans
`useFrame` et l'applique à `position.x`. Aucun état React n'intervient dans la boucle :
React orchestre, il n'anime pas.

Marquée `[read]` : jsdom n'a pas de WebGL, donc rien ici n'est encore exécuté. La
vérification réelle — rendu, libération des géométries et matériaux — est en T020.

### T014 / T015 — les quatre contrôles

`ControlPanel` groupe par `group` et aiguille sur `control.type`. **Aucune condition sur
un identifiant de leçon** : c'est l'invariant du projet, et un test le vérifie sur un
descripteur de forme volontairement étrangère à `native-tween`.

`core/easings.ts` porte le catalogue de six courbes. Les vignettes sont tracées **depuis
les points de contrôle réels**, pas depuis un chemin SVG en dur. Un test croise le traceur
avec la mesure Chromium de la planification : `cubic-bezier(0.25, 1, 0.5, 1)` à 25 % rend
`0.6885899` des deux côtés. La vignette dessine donc bien la courbe que la scène suit.

L'inversion `x(t)` se fait par bissection et non par Newton : la dérivée s'annule sur les
courbes à dépassement (`back-out`), où Newton diverge.

### T016 / T017 — le code affiché

`generate.ts` est du calcul pur : `CodeTemplate` + valeurs → `CodeLine[]`, plus
`linesForParam` et `joinLines`. C'est le premier endroit où un écart entre la scène et le
code se verrait, et il se teste sans DOM.

`CodePanel` est regénéré **en différé** (`requestIdleCallback`, repli sur un délai court —
Safari et jsdom ne l'implémentent pas). La surbrillance suit le dernier paramètre touché,
que le store porte désormais (`touchedId`).

### T018 — `LessonShell`

Assemble chrome, scène, contrôles, transport, code, **sans un seul `if (lesson.id === …)`**.
Deux tests le vérifient : un descripteur de forme étrangère à `native-tween` produit un
écran cohérent, et un descripteur en `transport: 'none'` fait disparaître la barre.

Le chargement des valeurs se fait **pendant le rendu**, pas dans un effet. Un effet
s'exécute après le premier rendu des enfants, et le panneau de code affichait alors une
ligne calculée sur un store vide — une ligne fausse, sur le composant dont toute la raison
d'être est d'afficher le code exact. L'appel est idempotent, donc sûr au double rendu de
`StrictMode`.

`LessonRoute` chargeait aussi la leçon : la même logique à deux endroits. Le shell la
garde, la route ne fait plus que résoudre.

### T019 — la leçon, trois fichiers

`lesson.ts` (descripteur), `animation.ts` (fonction pure), `concept.fr.md` (271 mots,
relu). Aucun quatrième fichier n'a été nécessaire.

Le bloc MÉTHODE a gagné au passage en WAAPI : `to`, `from`, `fromTo` et `set` ne sont plus
des noms de méthodes de bibliothèque mais les **règles de keyframes implicites**. `from` et
`fromTo` produisent d'ailleurs le même mouvement — ils diffèrent par ce que le code écrit,
pas par ce qu'on voit, et c'est très exactement le propos de la leçon. Un test le fige.

### T020 — le scénario de la leçon

Huit scénarios dans Chromium : rendu depuis le seul descripteur, WebGL réellement actif,
point 5 (réglage pendant la lecture), code suivant les valeurs et surbrillance, clavier du
transport, point 6 (mouvement réduit), point 7 (libération), et accumulation sur quatre
allers-retours.

Budget `[ran]` : route initiale **96,77 ko gzip** sur 200 autorisés. Three.js, drei et
react-three-fiber sont dans un chunk `View-*.js` de 234 ko gzip **chargé à la demande** —
l'accueil ne le télécharge jamais.

### T021 — la scène n'affichait rien, et rien ne le disait

**Découvert par l'humain, pas par la suite de tests.** À la validation manuelle : « pas de
cube apparent ». La génération était pourtant au vert intégral — 179 tests unitaires,
23 scénarios de bout en bout, verdict `pass` — et l'écran était vide.

Diagnostic mené par mesure, pas par supposition. Sonde dans Chromium : canvas 1280 × 720,
sept géométries, trois programmes compilés, transport à 1,17 / 2,00 s, zéro erreur console.
**Tout fonctionnait sauf la seule chose qui compte.** Trois causes empilées :

1. **Aucune caméra explicite.** Perdue en réécrivant `CanvasHost` pour le `<View>` de drei.
   react-three-fiber en pose une par défaut en `[0, 0, 5]` regardant l'origine : la grille
   au sol se voit exactement par la tranche, et le cube, qui voyage de x = 10 à x = 0,
   traverse le plan de la caméra.
2. **Le `<View>` de drei mesurait une hauteur nulle.** Mesuré : `{ width: 892, height: 0 }`
   pour une boîte qui fait 892 × 562 à l'écran. Le ciseau de découpe était donc plat, et
   les triangles étaient dessinés dans une bande de zéro pixel de haut. Le `View` a été
   retiré : le canvas se positionne lui-même sur le rectangle que le shell publie. Moins
   astucieux, et vérifiable.
3. **Le canvas était peint sous le fond de la scène.** Déclaré avant le contenu et sans
   `z-index`, il passait derrière tout élément positionné qui suit — dont l'aplat opaque de
   la boîte de scène. Trois tokens d'empilement introduits (`--z-scene`, `--z-canvas`,
   `--z-chrome`).

Deux défauts de plus, trouvés en regardant les captures :

4. **`frameloop="demand"` ne redessinait jamais sur scrub à l'arrêt.** La seule demande de
   rendu venait de `useFrame`, qui ne s'exécute que pendant un rendu : la boucle ne se
   réamorçait pas. Le symptôme est le pire possible — la barre de transport avance,
   l'interface a l'air de fonctionner, et la scène est figée. Résolu par `@core/redraw`,
   que le transport sollicite quand la progression change et le store quand une valeur
   change.
5. **La chaîne des hauteurs ne se résolvait pas.** `.lesson { height: calc(100% - 90px) }`
   n'a jamais rien valu : un `div` intermédiaire sans hauteur, posé uniquement pour porter
   des attributs de test, coupait la chaîne des pourcentages. La mise en page ne tenait que
   tant que le rail restait court ; déplier le tiroir de code emportait la barre de
   transport hors de l'écran. Remplacé par une colonne flex, et le `div` supprimé — les
   attributs vivent sur le `<main>` du shell.

Trois corrections de finition au passage : cadrage à `zoom: 32` (la maquette montre un cube
autrement plus présent), lignes de sol dans la teinte de la famille, code reformaté pour se
lire dans un rail de 344 px sans défilement horizontal.

### T022 — deuxième passage de validation humaine

Sept remarques, dont **deux fonctionnalités déclarées vérifiées qui ne marchaient pas**.

**`Espace` et les flèches sans effet.** Deux causes. D'abord, les raccourcis n'existaient
que sur les commandes elles-mêmes : il fallait avoir tabulé jusqu'au bon bouton, ce que
personne ne fait en arrivant sur une page. Ensuite, l'état `playing` de React ne suivait
jamais le driver — une animation qui se terminait laissait « Pause » affiché
indéfiniment, si bien que la première pression mettait en pause ce qui était déjà arrêté.
Les raccourcis sont désormais posés sur le document, en laissant la priorité aux commandes
natives (un curseur focalisé répond lui-même aux flèches), et l'état de lecture est
resynchronisé depuis le driver à chaque image.

**L'interrupteur de mouvement réduit sans effet.** La préférence n'était lue **qu'à la
création du driver**. Basculer l'interrupteur pendant la leçon ne pouvait donc rien faire.
Le driver s'abonne maintenant au store.

**`fromTo` et `set` sans destination.** Le descripteur ne déclarait que `from` : deux des
quatre méthodes n'avaient aucune arrivée réglable, donc étaient indémontrables. Un
paramètre `to` a été ajouté, et les quatre méthodes ont été redéfinies proprement.

**`set` n'animait rien.** Il rendait une position constante — techniquement « sans
trajet », visuellement indistinguable d'un bug. Il conserve désormais la durée déclarée et
saute à la fin, ce qui s'écrit en WAAPI `easing: 'steps(1, end)'` — la façon native de dire
« pas d'interpolation », et un vrai point d'enseignement. Le saut se **voit**.

**Lecture en boucle par défaut.** Sans elle, la démonstration s'arrêtait après deux
secondes et tout ce qui suit — observer un réglage, voir l'effet du mouvement réduit —
devenait inobservable.

**Décors de scène absents.** Le handoff demande une direction « banc d'essai » :
graduations fines sur les bords, repères chiffrés, mesures affichées en permanence. Rien
n'avait été fait. `SceneOverlay` pose le fil d'Ariane `NATIF.02 · …`, la pilule de
propriété `position.x`, les règles graduées au pas de 22 px, les repères 0/5/10 et l'encart
`x · t · fps`, mis à jour par `requestAnimationFrame` sans passer par React.

**Lisibilité.** Icônes de transport passées de 28 à 34/38 px, chevron du tiroir de code
agrandi et pourvu d'une zone de clic, graduations de la piste rendues visibles sur toute la
hauteur. **Pistes de curseur invisibles** : dessinées en encre à 10 % sur une carte déjà
sombre, elles se confondaient avec le fond ; elles sont maintenant tracées, et **remplies
jusqu'à la valeur** en teinte de famille, comme le demande le handoff.

**Largeur.** Tout s'étirait sur la fenêtre entière. La maquette est calée sur 1180 px : un
plafond a été posé, et le zoom de la caméra est désormais **dérivé de la taille de la
boîte** au lieu d'être fixe — sinon le sujet rétrécit dès que la scène s'agrandit, ce qui
était précisément le symptôme.

### T023 — la caméra orthographique était un contresens

Question de l'humain : « la vue orthographique, pourquoi ? les maquettes montrent une vue
perspective ». Vérification faite dans le fichier de maquette plutôt que de mémoire :

```
transform: perspective(700px) rotateX(58deg); transform-origin: 50% 0;
mask-image: linear-gradient(to bottom, transparent, rgba(0,0,0,.9) 45%);
```

Le sol est une **vraie perspective**, inclinée à 58°, **fondue vers l'horizon**, et il
n'occupe que la moitié basse de la scène. Ce qui est isométrique dans la maquette, c'est
uniquement le cube — un `clip-path` hexagonal que le handoff qualifie lui-même de
placeholder.

L'argument que j'avais écrit en commentaire — « en perspective, la lecture des distances
devient fausse » — est réel mais étroit : il ne mord que si le trajet a de la profondeur.
Ici le cube se déplace sur un seul axe, vue de face. **Un principe a été appliqué contre
une source de vérité explicite**, et le commentaire qui le justifiait donnait à ce choix
une autorité qu'il n'avait pas.

Remplacé par une **perspective à longue focale** : champ étroit, caméra reculée à 38
unités. Le sol converge et se fond comme dans la maquette, et la variation d'échelle sur le
trajet reste de quelques pour cent — donc l'espacement des fantômes reste une lecture
honnête de la vitesse.

Quatre choses manquaient encore par rapport aux écrans de design :

- **le fondu d'horizon** — le sol est désormais une texture avec le dégradé d'effacement
  déjà dedans, exactement comme le `mask-image` du handoff. Ses positions ne sont pas
  décoratives : elles sont calées sur la géométrie du plan, et le commentaire donne le
  calcul ;
- **l'ombre portée** sous le cube, qui l'ancre au sol ;
- **le volume du cube** — il se lisait comme un rectangle plat. La maquette montre un sol
  vu de face et un cube qui montre plusieurs faces : c'est donc **le cube qu'on tourne**,
  pas la caméra, sinon on gagne le second en perdant le premier ;
- **les proportions** — la scène s'étirait en carré sur une fenêtre haute. Elle a
  maintenant le rapport de la maquette (1,41), et mesure 794 × 563 contre 800 × 566 au
  handoff.

Deux pièges de mise en page rencontrés : `aspect-ratio` sur un élément en `flex: 1` calcule
sa **largeur depuis sa hauteur**, si bien que la boîte devenait plus large que sa colonne et
que le canvas débordait sous le rail ; et centrer la scène seule décollait la barre de
transport, qui tombait en bas de fenêtre — le centrage appartient à la colonne, pas à la
scène.

La plage des curseurs `from` et `to` a été ramenée à ±10, calée sur les repères chiffrés
de la scène (0, 5, 10) : au-delà, un réglage faisait sortir le cube du cadre.

### T024 — huit remarques, dont une divergence entre le code affiché et le code exécuté

**Alignement.** Deux mises en page avaient échoué avant celle-ci : étirée, la scène se
centrait dans sa colonne pendant que le tiroir de code restait collé au bas du rail ;
plafonnée à une hauteur fixe, le rail débordait dès que le bloc COURBE apparaissait. La
ligne de grille se dimensionne maintenant sur son contenu, et `space-between` renvoie le
jeu résiduel entre la scène et le transport. Mesuré : les deux colonnes commencent à 217,0
et finissent à 873,9.

**Vignettes de courbe.** Le `viewBox` faisait 160 unités de haut pour 42 px de rendu : le
tracé occupait un sixième de sa boîte. Corrigé à la proportion réelle. La mini-grille est
passée du SVG à la **carte**, comme dans le handoff, et **disparaît quand la carte est
sélectionnée** — le fond accent la remplace. Nom en `#f0b678`, comme le mockup.

**Nom de la méthode choisie** coloré en teinte de famille, et **valeur, libellé et réglette
en surbrillance pendant le réglage**. Porté par `:focus-within`, pas par un état React : la
surbrillance est un fait du DOM, et la faire transiter par React re-rendrait le curseur à
chaque mouvement.

**Couleurs du cube.** Trois faces aux teintes exactes du handoff — `#f8c98f` dessus,
`#e0854a` à gauche, `#a9542b` à droite — en matériau **non éclairé** : la maquette dessine
des aplats, et laisser l'éclairage décider des teintes les aurait rendues dépendantes de la
position des lampes.

**Paramètres conditionnels.** `from` n'a aucun sens quand la méthode déclare l'arrivée, et
réciproquement ; `set` ne suit aucune courbe. Afficher les trois en permanence laissait
croire que les quatre méthodes lisent les mêmes valeurs — l'inverse exact de ce que la
leçon enseigne. Le contrat gagne `visibleWhen`, une **donnée** : le shell reste ignorant
des leçons.

**`set` saute enfin.** La version précédente sautait en toute fin de course : une image,
invisible. Il est maintenant écrit avec **deux keyframes au même offset 0,5** — la façon
native d'exprimer une discontinuité — donc la valeur tient la première moitié, saute, et
tient la seconde. Le saut se voit, et le code affiché l'explique.

### T025 — j'ai annoncé une correction qui n'existait pas

L'humain : « tu m'as menti ». Il a raison, et le mécanisme mérite d'être écrit.

J'avais annoncé que le nom de la méthode sélectionnée se colorait. La règle CSS **n'avait
jamais été écrite** : le script d'édition qui la posait avait échoué sur une assertion
*postérieure*, si bien que le fichier n'a jamais été enregistré — les remplacements déjà
faits en mémoire ont été perdus avec lui. J'ai ensuite confirmé le résultat d'après une
capture d'écran où je croyais voir la couleur.

Deux fautes distinctes, et la seconde est la vraie :

1. Les assertions ajoutées après le premier incident protègent d'un **motif absent**, pas
   de la **perte des remplacements précédents** dans un script qui s'interrompt.
2. Une capture d'écran ne prouve pas une couleur. Un style calculé, si. J'ai affirmé sans
   mesurer — exactement ce que je reproche aux tests depuis le début de cette génération.

Correctif de méthode : après chaque édition, **grep du résultat attendu**, et pour toute
affirmation visuelle, une lecture de `getComputedStyle` plutôt qu'un coup d'œil.
`tests/e2e/design-contract.spec.ts` fige dix de ces affirmations.

### Les huit points, et ce que chacun a demandé

| Point | Cause | Vérification |
|---|---|---|
| Bloc décollé du chrome | `margin: auto` centrait verticalement | écart chrome → contenu mesuré à **0 px** |
| Nom de méthode non coloré | règle CSS jamais écrite | `color` calculé = `rgb(240, 182, 120)` |
| Grille des vignettes disparue | même script perdu | `background-image` = `linear-gradient…` non sélectionnée, `none` sélectionnée |
| `to` « plante » | destination par défaut à 0, soit la position de repos : trajet nul | x mesuré de −1,82 à −4,57 |
| Tiroir de code cassait l'écran | il était replié par défaut et non borné | ouvert d'office, hauteur bornée, colonnes alignées à 105 / 880 |
| Vitesse « sans utilité » | elle fonctionnait | t = 1,57 s à 4× contre 0,20 s à 0,5× sur la même durée |
| Pas de séparateur de chrome | la maquette en a un sur **chaque** rangée | `border-bottom-width` = 1 px sur la rangée 1 |
| Repères qui ne mesurent rien | ils étaient posés à intervalle fixe | repères −10…10 placés par **projection** de la caméra, à 6,2 / 28,1 / 50 / 71,9 / 93,8 % |

### T026 — quatre finitions, dont une qui remet la scène d'aplomb

**Séparateur du chrome.** Le trait du haut était posé sur la rangée, plafonnée à la largeur
de référence : il s'arrêtait au milieu de l'écran quand celui du bas courait d'un bord à
l'autre. Il vit désormais sur une bande pleine largeur.

**Graisse de la pilule.** La maquette met le nom de la leçon active en 600 et en pleine
encre ; les inactives en poids normal et en `encre-sourde`. Le numéro passe de 10 à 9,5 px,
et ne prend la teinte d'accent que sur l'active.

**La scène ne dépend plus du rail.** C'était le vrai défaut : choisir `set` masque le bloc
COURBE, ce qui raccourcissait le rail, donc la ligne de grille, donc la scène — changer de
méthode aplatissait l'écran. Le contenu du rail est maintenant posé en **position
absolue** : il remplit sa colonne sans jamais en dicter la hauteur. C'est la scène qui
commande, avec le rapport 1,41 du handoff, et le tiroir de code **remonte à la place** du
bloc disparu au lieu de laisser un trou.

Effet de bord heureux : la scène mesure désormais **794 × 563**, soit exactement les
800 × 566 de la maquette — un rapport que j'avais déclaré inatteignable à l'itération
précédente. Il l'était tant que le rail dictait la hauteur ; il ne l'est plus dès que la
scène la dicte et que le rail défile.

**Retrait du sélecteur de vitesse.** Écart assumé à la spec §4.3, sur demande explicite. Il
fonctionnait — mesuré, 1,57 s parcourues à 4× contre 0,20 s à 0,5× sur le même laps — mais
il n'apportait rien à cette leçon. Le `setRate` du driver reste, pour les leçons où la
vitesse *est* le sujet. Un test vérifie que son absence est un choix et non une régression
silencieuse.

Deux réglages de compression découverts en mesurant : sur une fenêtre de 720 px, c'était la
**barre de transport** qui s'écrasait à 38 px pendant que la scène gardait sa taille. La
proportion est une taille *préférée*, pas un plancher : c'est à la scène de céder, elle a de
la marge, et les commandes ont une taille minimale utilisable.

### T027 — les barres de défilement venaient d'une contrainte que je m'étais inventée

L'humain : « il y a des barres de défilement, c'est atroce et ça casse tout le design ».
Sa proposition — figer le rail, le laisser dépasser un peu sous la barre de transport,
garder la scène à taille fixe, et **donner au corps des marges différentes de celles du
chrome** — était la bonne, et elle règle le problème à sa racine.

La racine : j'avais tenu pour acquis que les deux colonnes devaient finir sur la même
ligne. Rien ne l'exigeait. Cette contrainte forçait l'une des deux à défiler chez elle, et
c'est de là que venait chaque barre de défilement. Les colonnes ont désormais chacune leur
hauteur ; si la fenêtre est trop courte, c'est la **page** qui défile, comme n'importe
quelle page.

Deuxième idée reprise : rien n'oblige le chrome et le corps à partager leurs marges. Le
corps a maintenant les siennes, plus courtes — et la scène passe de 794 × 563 à
**1134 × 804**, en gardant exactement le rapport 1,41 du handoff.

Un garde-fou a été nécessaire : la scène tirant sa hauteur de sa largeur, un écran large
mais court la faisait déborder sous le pli. La largeur du bloc est donc bornée **par la
hauteur disponible** — hauteur restante × 1,41, plus le rail et les gouttières.

Mesuré : à 1600 × 1000 et 1920 × 1080, aucun défilement ; à 1440 × 900, le rail dépasse le
transport de 14 px — exactement le croquis de l'humain — et la page défile de 15 px.

**Transport aux valeurs du handoff.** Les commandes étaient rondes et de tailles inégales,
là où la maquette pose trois carrés arrondis identiques : `32 × 32`, rayon `9`. La barre
gagne son contour net (`1px solid`, rayon 12), la piste ses 6 px gradués tous les 10 %, le
remplissage son dégradé `#b9622f → accent`, la poignée ses 14 px avec ombre portée, et le
temps sa pastille. Les blocs de contrôles retrouvent la bordure que je leur avais retirée
en cherchant à gagner de la hauteur — une économie devenue inutile.

### T028 — deux détails, deux causes de fond

**Les poignées traversées par leur piste.** Un ordre de peinture, pas un `z-index` oublié :
le remplissage de la piste est un pseudo-élément du conteneur, et un `::after` vient
**après** les enfants dans l'arbre de boîtes. Il se peignait donc par-dessus l'`input`.
L'élément interactif est remonté au-dessus de son décor, au rail comme au transport.

**La dernière barre de défilement.** L'humain proposait de formater le code avec un nombre
maximal de colonnes pour qu'il revienne à la ligne au lieu de s'étaler. C'est la bonne
réponse, et elle vaut mieux qu'un `overflow` : un extrait qu'il faut faire défiler pour
lire ne se lit pas pendant qu'on règle un curseur, c'est-à-dire au moment précis où on le
lit.

La contrainte est donc **écrite dans le gabarit** (`MAX_CODE_COLUMNS = 44`) et vérifiée sur
**toutes les combinaisons de réglages** — quatre méthodes × trois positions de départ ×
trois d'arrivée × trois durées × six courbes. C'est ce balayage qui a trouvé le vrai
coupable : la ligne `easing:` de la courbe à dépassement, `cubic-bezier(0.34, 1.56, 0.64,
1)`, dépassait de trois colonnes. Elle est écrite en forme compacte, que la syntaxe CSS
accepte.

`[negative]` Remettre la déclaration du `KeyframeEffect` sur une seule ligne fait sortir le
test : « 49 cols · to/linear · `const effect = new KeyframeEffect(null, frames, {` ».

Une ligne vide ne s'affichait pas : un `<code>` sans contenu n'a pas de boîte de ligne, et
les respirations écrites dans le gabarit disparaissaient.

## Discovered Issues

### Un test de types est invisible pour Vitest — et il annonce « vert »

`src/core/types.test.ts` est écrit avant `src/core/types.ts`, donc il devrait échouer.
`[ran]` `npm run test` → **3 fichiers, 15 tests passés**, alors que le module importé
n'existait pas.

Cause : `expectTypeOf` est une assertion de compilation, effacée à l'exécution, et
l'import est `import type`, donc supprimé par la transformation. Le fichier ne contient
plus, au moment où Vitest le charge, aucune instruction observable. Vitest compte les `it`
et les déclare passés.

`[ran]` `npm run typecheck` sur le même état → **3 erreurs**, dont `TS2307: Cannot find
module '@core/types'`. Le rouge existait, il n'était pas là où on le cherchait.

**Conséquence de méthode, valable pour toute la suite du lot** : pour un module de types,
le test qui échoue en premier se constate avec `npm run typecheck`, jamais avec
`npm run test`. Un « 15 tests passés » sur un fichier `expectTypeOf` ne prouve rien — c'est
la même famille d'erreur que la leçon de `longterm.md` sur le harnais jamais vu échouer,
mais par un mécanisme différent : ici le vert n'est pas un test inerte, c'est un test
**absent** que le rapporteur compte quand même.

À porter en mémoire long terme en phase reflect.

### Le rapport 1,41 de la maquette est arithmétiquement incompatible avec un code visible

Poursuivi pendant plusieurs itérations avant d'être calculé. Les trois blocs de contrôles
mesurent **571 px**. Pour que la scène ait le rapport 800 × 566 du handoff, le rail devrait
faire 629 px — il ne resterait donc que 48 px au tiroir de code, soit son en-tête seul.

La maquette tient son rapport parce que **son tiroir y est replié**, et parce que son
extrait fait cinq lignes courtes là où le nôtre en faisait dix-neuf.

Deux décisions en découlent : le gabarit de code est ramené à douze lignes, et le rapport
assumé tourne autour de 1,1. Un code visible vaut mieux qu'un rapport exact — c'est
explicitement ce que demande l'humain, et c'est la moitié du produit.

### Le code affiché ne décrivait pas le code exécuté

Le pire défaut possible pour ce produit, et il a été trouvé par un test écrit dans la même
séance.

Le cadencement du driver était calculé **par le shell** (`useLessonDriver` lisait le
paramètre `easing`), tandis que le panneau de code le calculait **par la leçon**. Pour la
méthode `set`, la leçon affichait `linear` — ses keyframes sautent, aucune courbe à
appliquer — pendant que le shell continuait d'appliquer `ease-out`, resté dans le store
sous un contrôle devenu invisible.

Conséquence mesurée : le cube sautait à 40 % du temps au lieu de 50 %. Deux sources de
vérité pour une même chose, et l'écran mentait sur ce qui tournait.

Le contrat gagne `Lesson.timing` : la leçon dit sa durée et sa courbe, **le gabarit de code
et le driver lisent la même fonction**. Il devient impossible qu'ils divergent.

C'est la troisième fois de cette génération qu'une duplication silencieuse produit un
mensonge à l'écran. Le point commun : une valeur dérivée calculée à deux endroits, sans que
rien n'oblige les deux à s'accorder.

### Un commentaire n'est pas une justification

Le choix de la caméra orthographique était accompagné d'un commentaire affirmatif — « la
maquette demande un cube isométrique », « en perspective la lecture des distances devient
fausse ». Les deux tenaient d'une lecture rapide du handoff, et le commentaire leur donnait
l'apparence d'une décision étayée.

C'est plus insidieux qu'un test qui n'observe rien : un commentaire faux **décourage la
vérification**. Il a fallu qu'un humain pose la question pour que le fichier de maquette
soit rouvert, où la réponse était écrite noir sur blanc.

Le commentaire qui remplace l'ancien raconte la décision *et* son revirement, avec le
critère qui les départage. Un lecteur qui hésitera de nouveau saura pourquoi.

### Deux tests verts pour deux fonctionnalités qui ne marchaient pas

Le clavier du transport et le mode mouvement réduit étaient tous deux couverts, tous deux
verts, et tous deux inopérants.

**Le clavier** était testé en donnant d'abord le focus au bouton de lecture, puis en
observant que son libellé changeait. Les deux moitiés étaient fausses : personne n'arrive
sur une page en ayant tabulé jusqu'au bon bouton, et le libellé venait d'un état React qui
pouvait mentir. Le test ne pouvait qu'être vert.

**Le mouvement réduit** était testé dans un contexte navigateur **déjà** en
`reducedMotion: 'reduce'`. Il vérifiait donc l'état initial et jamais la bascule — c'est-à-
dire tout sauf ce que fait l'interrupteur.

Le remplacement, dans les deux cas, consiste à asserter sur **ce que l'utilisateur
observe** : le temps affiché avance-t-il, ou non. Vérifié par mutation : rétablir l'ancien
comportement fait échouer trois scénarios sur le clavier et un sur la bascule.

Le point commun avec l'écran vide de T021 est net. Trois fois de suite, le test regardait
un intermédiaire — un libellé de bouton, un compteur interne, un état initial — au lieu de
regarder le résultat. **Sur ce projet, un contrôle qui n'observe pas ce que l'utilisateur
observe ne prouve rien**, et le fait qu'il soit vert est la partie trompeuse.

### Un remplacement de texte silencieusement sans effet — la deuxième fois

Le correctif du cas limite de boucle dans `waapi.ts` **ne s'est pas appliqué** : Biome avait
reformaté la ligne visée, le motif ne correspondait plus, et le remplacement n'a rien fait
sans rien dire. Exactement le même mécanisme que le câblage perdu dans `App.tsx`.

La première fois, le défaut a survécu onze tâches. La deuxième, un test l'a rattrapé
immédiatement — parce qu'il y avait cette fois un test qui observait le résultat.

Correctif de méthode adopté pour la suite : **toute édition par motif est précédée d'une
assertion que le motif existe**. Un `assert old in s` transforme un échec silencieux en
échec bruyant.

### La suite entière était verte et l'écran était vide

C'est le défaut le plus important de cette génération, et il a été trouvé par l'humain.

Ce qui était vérifié : le canvas est monté, il ne se remonte pas entre deux leçons, sept
géométries existent, trois programmes sont compilés, des triangles sont dessinés, le driver
tourne, la progression est conservée, aucune ressource ne fuit, le budget est tenu.

Ce qui ne l'était pas : **que quoi que ce soit apparaisse**.

Toutes ces assertions portaient sur des nombres que l'application rapporte sur elle-même.
Aucune ne regardait ce que le navigateur affiche. C'est le cas exact que décrit le génome —
« une suite peut tout affirmer autour d'une fonctionnalité sans que rien n'observe qu'elle
se produit » — et la démonstration qu'un projet dont le contenu *est* visuel ne peut pas
s'en remettre à des compteurs.

**Le contrôle construit en réponse** (`tests/e2e/scene-visible.spec.ts`) lit les **pixels**
d'une capture de la boîte de scène. Il ne demande rien à l'application, donc il ne peut être
trompé ni par une caméra correcte devant un aplat, ni par un `z-index` malheureux, ni par un
ciseau de découpe plat, ni par une boucle de rendu qui ne se réamorce pas.

Il a fallu **deux mesures**, et la première ne suffisait pas :

- compter les pixels du sujet dit qu'**il y a quelque chose** ;
- mesurer l'étalement du sol quadrillé dit que **c'est cadré**.

Vérifié par mutation : retirer la caméra isométrique laisse le compte du sujet parfaitement
satisfaisant — le cube passe simplement collé à l'objectif — et seul l'étalement du sol
s'effondre, de 100 % des lignes à 17 %. Sans cette seconde mesure, le contrôle aurait de
nouveau asserté à côté de la chose.

À porter en mémoire long terme : **sur un produit visuel, aucun compteur ne remplace la
lecture des pixels**, et un contrôle de rendu doit mesurer la présence *et* le cadrage.

### Une modification silencieusement sans effet, et rien pour la voir

`App.tsx` devait, depuis T009, appeler `watchSystemPreference()` et publier la préférence
effective en `data-reduced-motion` sur `<html>`. La modification **ne s'est jamais
appliquée** — un remplacement de texte sans correspondance, sans erreur.

Constaté seulement onze tâches plus tard, en ajoutant le diagnostic. `typecheck`, `check`
et 176 tests étaient verts : **rien ne couvrait le composant racine**, au motif qu'il ne
fait « qu'assembler ». C'est précisément là qu'un branchement disparaît sans bruit.

Conséquence réelle si c'était parti en production : l'interrupteur de mouvement réduit
n'aurait eu aucun effet sur les transitions d'interface, et un changement de préférence
système en cours de session n'aurait pas été vu.

Corrigé, et couvert par `src/App.test.tsx` : trois tests sur l'assemblage lui-même.

### Three.js dans le chunk initial : 332 ko gzip

Premier build après le câblage de la scène : **332 ko gzip** sur la route initiale, pour un
budget de 200. Le canvas est monté au-dessus des routes pour être persistant, donc importé
statiquement — et il tire three.js, drei et react-three-fiber derrière lui.

Résolu par deux `React.lazy` : un calque (`CanvasLayer`) qui ne charge le canvas que
lorsqu'une leçon WebGL est active, et un registre de scènes (`sceneRegistry`) qui charge
l'hôte de scène à la demande. Les deux partagent le même chunk `View-*.js`.

Résultat `[ran]` : route initiale **96,77 ko gzip**, chunk WebGL de 234 ko chargé seulement
à l'ouverture d'une leçon. Persistance et budget ne s'opposent donc pas — il fallait rendre
paresseux le *calque*, pas le canvas.

### Le scénario du point 7 était plus faible qu'il n'en avait l'air

Premier jet : quitter la leçon avec `page.goto('/fr')`, puis vérifier qu'aucune horloge ne
survit. Preuve par mutation — suppression du `dispose()` en sortie de leçon : **le test est
resté vert.** Seul le scénario d'aller-retour a échoué (3 horloges au lieu d'une).

Cause : `page.goto` **recharge la page**. Tout est remis à zéro, y compris la fuite. Le
test mesurait un état neuf en croyant mesurer une sortie propre.

Corrigé en quittant la leçon par un **lien** — une navigation côté client, ce que fait un
visiteur réel. Le même mutant fait désormais échouer deux tests au lieu d'un.

Ce défaut en a révélé un autre : la marque n'était pas un lien, et surtout `/fr/native`
**ne correspondait à aucune route** — la navigation par famille menait à une page vide sous
le chrome. Ajout de `FamilyRoute`, qui redirige vers la première leçon de la famille, ou
dit que les leçons ne sont pas encore écrites.

### `document.getAnimations()` étant aveugle, il a fallu exposer un diagnostic

Le point 7 n'est **pas observable de l'extérieur** : `getAnimations()` ne voit pas nos
horloges (cible nulle, mesuré), et rien dans le DOM ne dit combien de géométries three.js
retient. Sans point d'observation, le scénario exigé par les invariants ne peut pas exister.

`src/core/diagnostics.ts` expose `window.__anima.liveDrivers()` et `window.__anima.webgl()`.
Quelques centaines d'octets, et un développeur peut vérifier lui-même dans sa console
qu'une navigation ne laisse rien derrière — ce qui, sur un site consacré au coût de
l'animation, est plutôt à sa place.

### Un test qui assertait *autour* de la propriété centrale du projet

Le premier test de T014 vérifiait qu'un drag de curseur ne re-rend pas `ControlPanel`.
Preuve par mutation : j'ai fait lire au curseur sa propre valeur (`useParamValue`),
l'implémentation naïve. **Le test est resté vert.**

La raison est structurelle : un composant qui se re-rend à cause de son propre abonnement
ne fait bouger aucun parent. Observer le panneau ne peut pas voir le curseur se re-rendre,
et c'est pourtant le curseur qui compte — c'est lui qui porte l'`<input>`.

C'est exactement le cas que décrit le génome : « une suite peut tout affirmer autour d'une
fonctionnalité sans que rien n'observe qu'elle se produit ». Le test observait le mauvais
composant tout en ayant l'air de tester la bonne chose.

Corrigé par un point d'observation dans `SliderControl` lui-même. Le mutant échoue
désormais avec **31 rendus au lieu de 1**.

C'est aussi la justification de la prop `onRender` : ce n'est pas un accessoire de confort,
c'est le seul endroit d'où la propriété est observable.

### Zustand 5 : un sélecteur qui fabrique un objet boucle à l'infini

`useScene` retournait `{ kind, lessonId, driver }`. Cinq tests rouges avec
« Maximum update depth exceeded ».

Zustand 5 s'appuie sur `useSyncExternalStore`, qui compare les instantanés **par
référence** : un sélecteur qui construit un objet en rend un neuf à chaque rendu, donc
React re-rend sans fin. Le symptôme apparaît très loin de la cause.

Ce n'était pas un défaut de test — la boucle aurait tourné en production. Remplacé par un
sélecteur par champ (`useSceneKind`, `useSceneDriver`, `useSceneLessonId`).

### jsdom ne bouge pas un `input type="range"` aux flèches

Mesuré : après `{ArrowRight}` sur un `<input type="range">` focalisé, la valeur reste `0`
et **aucun événement n'est émis**. Le réglage aux flèches, exigé par la spec §9, n'est donc
pas vérifiable sous jsdom.

L'élément reste natif — c'est lui qui donne le rôle, la valeur annoncée et les flèches dans
un vrai navigateur, et le remplacer par un widget maison serait un recul d'accessibilité
pour la seule commodité du test. Sous jsdom on teste la plomberie (un scrub va au driver,
à chaque mouvement) ; **le clavier est vérifié en bout en bout en T020**.

### TypeScript ne resserre pas un type depuis un discriminant imbriqué

`switch (param.control.type)` ne resserre pas `param` : seul un discriminant de premier
niveau remonte au type parent. L'aiguillage de `ControlPanel` ne compilait donc pas.

Résolu par quatre gardes de type d'une ligne (`isSliderParam`, …) plus un `assertNever`
final. Un `as` aurait compilé aussi, et aurait laissé passer une variante mal appariée le
jour où l'union grandira ; le `assertNever` fait de l'oubli d'un futur type de contrôle une
erreur de compilation plutôt qu'un trou silencieux à l'écran.

Les variantes ont été nommées au passage (`SliderParam`, `ChoiceParam`, …), ce qui a
supprimé la prop `spec` que chaque contrôle recevait en double de `param.control`.

### jsdom n'implémente **aucune** API Web Animations

Sonde `[ran]` sous l'environnement de test du projet :

```
{"Animation":"undefined","KeyframeEffect":"undefined","documentTimeline":"undefined",
 "elementAnimate":"undefined","getAnimations":"undefined"}
```

Le driver WAAPI **ne peut pas** être testé sous Vitest. Conséquence de plan, pas de détail :
`src/transport/TimeDriver.test.ts` ne couvre que l'arithmétique du temps, et resterait vert
si `createWaapiDriver` était purement et simplement supprimé.

Réponse : un banc d'essai (`tests/e2e/harness/`) qui importe le vrai module et l'expose à
Playwright, ajouté comme entrée Vite **uniquement sous `E2E_HARNESS`** — posé par le
`webServer` de Playwright, jamais en production. Vérifié `[ran]` : `grep -rl harness dist/`
ne rend rien après un `npm run build` ordinaire.

Le polyfill `web-animations-js` a été écarté : il aurait fait tester la sémantique du
polyfill au lieu de celle du navigateur, alors que tout l'intérêt du montage est que
**c'est le moteur qui applique la courbe**.

Cette contrainte remonte sur les tâches suivantes : la barre de transport (T011) et la
scène (T013) se testent sous jsdom contre un `TimeDriver` factice, le vrai driver n'étant
exerçable qu'en navigateur. C'est un bon effet de bord — c'est exactement ce à quoi sert
une interface.

### `document.getAnimations()` est aveugle à nos animations

Le plan prévoyait, pour le point 7 du « terminé », d'asserter
`document.getAnimations().length === 0` en sortie de leçon. **Cette assertion aurait été
inerte.**

Mesuré `[ran]` dans Chromium, pendant qu'un driver joue :

```
document.getAnimations().length → 0
```

`getAnimations()` ne rend que les animations attachées à un élément du document ; les
nôtres ont une cible nulle. Le contrôle serait resté vert en toute circonstance, fuite
comprise — le cas exact que le génome décrit : « une suite peut tout affirmer autour d'une
fonctionnalité sans que rien n'observe qu'elle se produit ».

Remplacé par un registre des drivers vivants dans le module (`liveDriverCount()`), que
`dispose()` vide. Un test dédié **fige ce constat** plutôt que de le laisser en commentaire :
il assert que `getAnimations()` rend 0 pendant qu'un driver joue, pour qu'un futur lecteur
ne réintroduise pas l'assertion évidente.

Le critère 5 du plan est donc à corriger : il portera sur `liveDriverCount()` et sur
`renderer.info`, pas sur `getAnimations()`.

### `pause()` est différé — la poignée de scrub dérivait d'une frame

Le test « scrub, lecture, pause » échouait de 0,0036 sur une durée de 4 s, soit une frame.
Cause : `animation.pause()` laisse l'animation en état « pause-pending » jusqu'à la
prochaine mise à jour de la timeline, et `currentTime` continue d'avancer d'ici là.

Ce n'était pas une tolérance de test trop serrée : c'est un décalage visible sur la
poignée de scrub à chaque pause. Corrigé dans le driver en réécrivant `currentTime` juste
après `pause()`, ce qui fige l'instant immédiatement.

### `noUnusedLocals` a servi de filet pendant une preuve par mutation

Le premier mutant de T010 (retime sans restitution de la progression) **ne compilait pas** :
la variable `progress` devenait inutile et `noUnusedLocals` l'a rejetée, donc le build
échouait et Playwright ne démarrait même pas — sortie vide, aucun test rouge.

Une sortie vide ressemble à un succès quand on ne lit que le code de retour. Le mutant a
été refait sous une forme qui compile : restituer le temps avec l'**ancienne** durée, le
bug classique de la valeur périmée. Il échoue alors sur l'assertion voulue.

Leçon de méthode : **un mutant doit compiler**, sinon il teste la chaîne de build et non
l'assertion visée.

### Le compteur `n / 25` n'est pas un décompte de progression

Première implémentation : « leçons de la famille chargée / 25 ». Faux.

Les maquettes montrent `2 / 25` sur NATIF.02, `1 / 25` sur NATIF.01 et **`16 / 25` sur
GSAP.06**. Le socle natif comptant dix leçons, 16 = 10 + 6 : le numérateur est l'**index
global de la leçon courante** dans le catalogue, pas un décompte.

Le handoff dit par ailleurs « progression (leçons visitées → compteur n/25) » dans sa
section State Management — les deux lectures coexistent dans le même document. Les
maquettes tranchent, parce qu'elles sont vérifiables : trois écrans, trois valeurs, toutes
cohérentes avec l'index global et aucune avec un décompte de visites.

C'est aussi la lecture qui ne demande **aucune persistance** : le lot 1 n'a pas besoin de
`core/storage.ts`, reporté au lot 7 comme prévu au plan.

Corrigé par `FAMILY_SIZES`, `FAMILY_ORDER` et `globalIndex(lesson)` dans le registre.
`TOTAL_LESSONS` est désormais dérivé des tailles de famille au lieu d'être écrit `25` en
dur — deux constantes qui pouvaient diverger n'en font plus qu'une.

### Un effet de bord à l'import est intestable par construction

`core/reducedMotion.ts` s'abonnait à `matchMedia` au chargement du module. Trois tests
rouges, et pour la bonne raison : l'abonnement s'exécute avant que le test ait pu remplacer
`matchMedia`, donc il écoute un objet que personne n'observe.

Ce n'était pas un défaut de test. Un effet de bord au chargement s'exécute avant que quoi
que ce soit puisse l'observer ou le remplacer, et son moment dépend de l'ordre des imports
— intestable **et** fragile. Remplacé par `watchSystemPreference()`, appelé explicitement
par l'application et rendant sa fonction de désabonnement.

Un test a été ajouté pour cette fonction de désabonnement : sans lui, rien n'aurait vérifié
que l'écoute s'arrête.

### `ChoiceOption.labelKey` était faux dans le contrat de la spec

La spec §3 déclare `options: { value, labelKey: I18nKey, glossKey? }[]` — le libellé d'une
option y est traduisible. Les maquettes disent le contraire : dans le bloc MÉTHODE, `to`
est en monospace avec « va vers » en glose dessous ; dans le bloc COURBE, `linear` et
`power1.out` de même. **Aucune option des maquettes n'a un libellé qui soit de la prose.**

Un `labelKey` traduisible aurait donc forcé à inventer des clés de dictionnaire pour des
identifiants d'API (`to`, `fromTo`, `ease-out`) — exactement ce que la spec §7 interdit
(« les libellés techniques ne se traduisent pas et restent en monospace »).

`ChoiceOption` est corrigé en `{ value, label: string, glossKey?: I18nKey }`. Le jour où une
leçon a besoin d'une option dont le libellé est de la prose, c'est le contrat qu'il faudra
étendre — pas contourner en ajoutant une clé bidon.

Découvert seulement au resserrement de `I18nKey` : tant que `I18nKey` valait `string`,
`labelKey: 'to'` compilait sans rien signaler.

### Positionnement de `@ts-expect-error` sur un littéral d'objet

TypeScript rapporte l'incompatibilité d'un littéral d'objet **sur l'affectation**, pas sur
la propriété fautive. Les deux directives placées devant `default:` étaient donc signalées
inutilisées tandis que l'erreur tombait quatre lignes plus haut. Déplacées sur la ligne de
déclaration.

Sans importance en soi, mais c'est ce qui rend l'assertion réelle : une directive mal
placée est un test qui ne teste rien tout en paraissant en être un.

## Architecture Decisions

Aucune au-delà du plan. Les trois durcissements de T002 relèvent du mandat explicite de
`01-learning.md` (« il y a à le transcrire, à le durcir et à l'éprouver »).

## Verification Log

| Commande | Quand | Résultat |
|---|---|---|
| `npm run build` | après T001 | vert — 60,02 ko gzip (ligne de base) |
| `npm run test` | T002, avant le code | **15 passés — trompeur**, voir Discovered Issues |
| `npm run typecheck` | T002, avant le code | **rouge** — `TS2307` + 2 × `TS2578` |
| `npm run typecheck` | T002, après le code | vert |
| `npm run typecheck` | T002, mutant `Param` relâché | **rouge** — 3 erreurs `[negative]` |
| `npm run typecheck` | T002, restauré | vert |
| `npm run check` | après T002 | vert (après `check:fix` sur l'ordre des imports) |
| `npm run test` | après T002 | 3 fichiers, 15 tests passés |
| `npm run test` | T003, avant le code | **rouge** — module `@core/paramStore` introuvable |
| `npm run test` | après T003 | 4 fichiers, 25 tests passés |
| `npm run test` | T004, avant les hooks | **rouge** — 4 échecs, `useParamValue` / `useParamSubscription` absents |
| `npm run test` | T004, mutant naïf | **rouge** — 3 échecs `[negative]` |
| `npm run test` | après T004, restauré | 5 fichiers, **29 tests passés** |
| `npm run typecheck` / `check` | après T004 | verts |
| `npm run test` | T005, avant le code | **rouge** — module `@core/lessonRegistry` introuvable |
| `npm run test` | après T005 | 6 fichiers, 37 tests passés |
| `npm run test` | T006, avant le code | **rouge** — modules `@i18n/*` introuvables |
| `npm run typecheck` | T006, après resserrement de `I18nKey` | **rouge** — 5 erreurs dans les fixtures |
| `npm run typecheck` | T006, fixtures corrigées | vert |
| `npm run typecheck` | T006, mutant `I18nKey = string` | **rouge** — 3 erreurs `[negative]` |
| `npm run test` | après T006 | 7 fichiers, **47 tests passés** |
| `npm run test` | T007, avant le code | **rouge** — `@shell/routes` et `@i18n/localeStore` introuvables |
| `npm run test` | après T007 | 8 fichiers, **56 tests passés** |
| `npm run typecheck` / `check` | après T007 | verts |
| `npm run test:e2e` | après T007 | **6 scénarios passés** |
| `npm run build` | après T007 | route initiale **91,71 ko gzip** + chunk `native` séparé |
| `npm run test` | T009, avant le code | **rouge** — 3 échecs, l'abonnement `matchMedia` à l'import |
| `npm run test` | T009, `watchSystemPreference` explicite | vert |
| `npm run test` | après T008/T009 | 10 fichiers, **78 tests passés** |
| `npm run typecheck` / `check` | après T009 | verts |
| `npm run test:e2e` | après T009 | 6 scénarios passés |
| `npm run build` | après T009 | route initiale **92,52 ko gzip**, CSS 1,48 ko gzip |
| sonde jsdom WAAPI | T010, avant le code | **aucune API disponible** |
| `npm run test` | après T010 | 11 fichiers, **84 tests passés** |
| `npm run test:e2e` | après T010 | **15 scénarios passés** (dont 9 sur le driver) |
| `npx playwright test` | T010, mutant A — `dispose` ne libère pas | **rouge** — 1 échec `[negative]` |
| `npx playwright test` | T010, mutant B — `retime` avec durée périmée | **rouge** — attendu 0.37, obtenu 0.148 `[negative]` |
| `npm run build` | T010, sans `E2E_HARNESS` | harnais **absent** de `dist/` |
| `npm run test` | après T011 | 12 fichiers, 96 tests passés |
| `npm run test` | T012, avant correction du sélecteur | **rouge** — 5 échecs, boucle infinie |
| `npx vitest` | T012, mutant `<Canvas key={lessonId}>` | **rouge** — 3 montages au lieu de 1 `[negative]` |
| `npm run test` | après T012/T013 | 13 fichiers, 101 tests passés |
| `npm run test` | après T015 | 15 fichiers, **123 tests passés** |
| `npx vitest` | T014, mutant curseur abonné — 1ʳᵉ version du test | **vert — le test ne voyait rien** |
| `npx vitest` | T014, même mutant — test corrigé | **rouge** — 31 rendus au lieu de 1 `[negative]` |
| `npm run typecheck` / `check` | après T015 | verts |
| `npx vitest` | T016/T017, mutant « code figé sur les défauts » | **rouge** — 4 échecs `[negative]` |
| `npx vitest` | T016/T017, mutant « plus de surbrillance » | **rouge** — 2 échecs `[negative]` |
| `npm run build` | après le câblage de la scène | **332 ko gzip — budget dépassé** |
| `npm run build` | après les deux `React.lazy` | **96,77 ko gzip** + chunk WebGL 234 ko à la demande |
| `npx playwright` | T020, mutant « pas de libération », sortie par `page.goto` | **vert — le test ne voyait rien** |
| `npx playwright` | T020, même mutant, sortie par lien | **rouge** — 2 échecs `[negative]` |
| `npm run test` | final | 20 fichiers, **178 tests passés** |
| `npm run test:e2e` | final | **23 scénarios passés** |
| `npm run typecheck` / `check` | final | verts |
| sonde Chromium | T021, diagnostic | canvas 1280×720, 7 géométries, 3 programmes, **écran vide** |
| capture d'écran | T021, avant correction | boîte de scène **entièrement vide** |
| capture d'écran | T021, après correction | cube, trace de fantômes et sol isométrique visibles |
| `npx playwright` | T021, mutant « canvas sans z-index » | **rouge** — 0 pixel d'accent `[negative]` |
| `npx playwright` | T021, mutant « pas de caméra », 1ʳᵉ version | **vert — le contrôle ne voyait rien** |
| `npx playwright` | T021, même mutant, contrôle du cadrage ajouté | **rouge** — sol sur 17 % des lignes `[negative]` |
| `npm run test` | après T021 | 20 fichiers, **179 tests passés** |
| `npm run test:e2e` | après T021 | **30 scénarios passés** |
| `npm run build` | après T021 | route initiale **96,88 ko gzip** |
| `npx playwright` | T022, mutant « pas de raccourcis globaux, état figé » | **rouge** — 3 échecs `[negative]` |
| `npx playwright` | T022, mutant « préférence lue une fois », 1ʳᵉ forme | **ne compilait pas — ne prouvait rien** |
| `npx playwright` | T022, même mutant, forme compilable | **rouge** — 1 échec `[negative]` |
| `npm run test` | après T022 | 20 fichiers, **182 tests passés** |
| `npm run test:e2e` | après T022 | **39 scénarios passés** |
| `npm run build` | après T022 | route initiale **97,73 ko gzip** |
| `npx playwright` | T023, mutant « pas de caméra explicite » | **rouge** — sol sur 24 % des lignes `[negative]` |
| mesure des rectangles | T023 | boîte 794 × 563, canvas 792 × 561 — alignés |
| `npm run test` | après T023 | 20 fichiers, **182 tests passés** |
| `npm run test:e2e` | après T023 | **39 scénarios passés** |
| `npm run build` | après T023 | route initiale **97,73 ko gzip** |
| mesure d'alignement | T024 | colonnes à 217,0 en haut et 873,9 en bas — identiques |
| sonde `set` | T024, avant correction | saut à 40 % du temps au lieu de 50 % |
| sonde `set` | T024, après unification du cadencement | saut à 50 %, deux états et rien entre |
| `npm run test` | après T024 | 20 fichiers, **185 tests passés** |
| `npm run test:e2e` | après T024 | **45 scénarios passés** |
| `npm run build` | après T024 | route initiale **97,90 ko gzip** |
| styles calculés | T025 | dix affirmations visuelles mesurées, aucune jugée à l'œil |
| sonde fenêtre courte | T025 | bloc débordant de **91 px sous le pli**, puis corrigé |
| sonde fenêtre courte | T025, après plancher | rail défilant, tiroir à 128 px, rien sous le pli |
| `npm run test` | après T025 | 20 fichiers, **185 tests passés** |
| `npm run test:e2e` | après T025 | **56 scénarios passés** |
| `npm run build` | après T025 | route initiale **98,03 ko gzip** |
| mesure de la scène | T026 | **794 × 563**, soit le 1,41 du handoff |
| mesure `set` | T026 | hauteur de scène **identique** avec et sans le bloc COURBE |
| mesure fenêtre courte | T026, avant | transport écrasé à **38 px** |
| mesure fenêtre courte | T026, après | transport à 52 px, la scène cède à sa place |
| `npm run test` | après T026 | 20 fichiers, **185 tests passés** |
| `npm run test:e2e` | après T026 | **59 scénarios passés** |
| `npm run build` | après T026 | route initiale **97,94 ko gzip** |
| mesure multi-tailles | T027 | 1600×1000 et 1920×1080 : **aucun défilement** ; 1440×900 : page 915 pour 900 |
| mesure de la scène | T027 | **1134 × 804**, rapport 1,41 conservé à toutes les tailles |
| styles calculés | T027 | trois boutons `32 × 32`, rayon `9` ; barre `1px solid`, 52 px |
| `npm run test` | après T027 | 20 fichiers, **185 tests passés** |
| `npm run test:e2e` | après T027 | **62 scénarios passés** |
| `npm run build` | après T027 | route initiale **97,94 ko gzip** |
| `npm run test` | T028, mutant ligne longue | **rouge** — 49 colonnes détectées `[negative]` |
| `npx playwright` | T028 | `scrollWidth - clientWidth` ≤ 1 px sur les **quatre** méthodes |
| `npm run test` | après T028 | 20 fichiers, **186 tests passés** |
| `npm run test:e2e` | après T028 | **64 scénarios passés** |
| `npm run build` | après T028 | route initiale **97,93 ko gzip** |

### Preuve par mutation de T002 `[negative]`

`Param` remplacé par la forme lâche de la spec :

```ts
export type Param = ParamBase & { readonly control: ControlSpec; readonly default: ParamValue }
```

`[ran]` `npm run typecheck` sur le mutant :

```
src/core/types.test.ts(41,50): error TS2344: Type 'number' does not satisfy the constraint '"Expected: number, Actual: boolean"'.
src/core/types.test.ts(45,5): error TS2578: Unused '@ts-expect-error' directive.
src/core/types.test.ts(57,5): error TS2578: Unused '@ts-expect-error' directive.
```

Les trois assertions du contrat mordent : celle qui vérifie que le défaut d'un curseur est
resserré à `number`, et les deux qui vérifient qu'un défaut de mauvais type est rejeté.
Restauration → vert.

**Ce que cette preuve ne couvre pas** : elle valide la discrimination `control.type` ↔
`default`. Elle ne dit rien de `Lesson.slug` (aucune assertion ne l'exerce encore — ce sera
le registre en T005), ni de l'immuabilité `readonly`, dont aucun test ne tente la
violation.

### Preuve par mutation de T004 `[negative]`

`useParamSubscription` remplacé par l'implémentation naïve — celle qu'une équipe écrit
spontanément : lecture re-rendante puis effet sur changement de valeur.

```ts
const value = useStore(store, (state) => state.values[id])
useEffect(() => { latest.current(value) }, [value])
```

`[ran]` `npm run test` sur le mutant → **3 échecs, chacun sur un défaut distinct** :

```
expected "vi.fn()" to be called 1 times, but got 61 times     ← le moteur re-rend
expected "vi.fn()" to not be called at all, but ... 1 times    ← l'abonnement fuit au démontage
expected "vi.fn()" to be called 1 times, but got 3 times       ← double abonnement sous StrictMode
```

Restauration → 29 verts. Les trois pièges React de la spec §2 sont donc couverts par un
test dont on a vu le rouge, pas seulement le vert.

**Ce que cette preuve ne couvre pas** : elle compte des rendus dans jsdom, sur un arbre de
test. Elle ne dit rien du coût réel d'un rendu, ni du comportement du vrai curseur (T014),
ni de la fluidité observée — les 55 images par seconde restent une vérification manuelle en
revue de lot, comme l'annonce le génome.

### Preuve par mutation de T006 `[negative]`

`I18nKey` remis à la forme littérale de la spec :

```ts
export type I18nKey = string
```

`[ran]` `npm run typecheck` sur le mutant :

```
src/core/types.test.ts(91,7): error TS2578: Unused '@ts-expect-error' directive.
src/i18n/i18n.test.ts(57,5): error TS2578: Unused '@ts-expect-error' directive.
src/i18n/translate.ts(23,21): error TS7053: Element implicitly has an 'any' type ...
```

Les deux assertions mordent : celle qui refuse une chaîne française en dur (`group:
'VALEURS'`) dans un descripteur, et celle qui refuse une clé inconnue. Restauration → vert.

**Ce que cette preuve ne couvre pas** : elle garantit qu'une chaîne traduisible ne peut pas
entrer dans un `Param` ou un `Lesson`. Elle ne garantit rien sur le **JSX** — un composant
qui écrit `<span>Copier</span>` compile toujours. Aucun test ne l'attrape aujourd'hui ;
c'est la relecture qui tient cette moitié de l'invariant, et il faudra une règle de lint
pour la fermer.

### Preuve par mutation de T010 `[negative]`

Deux mutants, pris séparément parce qu'un mutant qui ne compile pas ne prouve rien.

**Mutant A — `dispose()` ne libère rien.** Le corps remplacé par un commentaire.
`[ran]` → 1 échec, 8 passés : le registre des drivers vivants reste à 1 après `dispose()`.

**Mutant B — `retime()` restitue le temps avec l'ancienne durée.** Le bug classique de la
valeur périmée : `progressToTime(progress, options.duration)` au lieu de `duration`.
`[ran]` → 1 échec, avec exactement l'écart prédit :

```
Expected: 0.37
Received: 0.148        (0,37 × 2 s ÷ 5 s)
```

Restauration → 15 scénarios verts.

**Ce que cette preuve ne couvre pas** : elle s'exécute dans Chromium uniquement — c'est le
seul navigateur installé. Le comportement de `getComputedTiming().progress` et celui de
`pause()` sont spécifiés, mais rien ici ne le vérifie sur Firefox ou WebKit. À noter avant
la mise en ligne.

## Deferred Items

- **`CLAUDE.md` complet** (`T3H-159`, spec §0.3) — conventions effectives, structure réelle,
  commandes, et la procédure exacte pour ajouter une leçon. Écrit en phase de complétion :
  avant les 20 tâches, il aurait documenté une structure hypothétique.
- **Onglet `CSS` du panneau de code** — le lot 1 livre un seul gabarit, pour que le code
  affiché reste celui qui s'exécute. Le caractère tableau de `CodeTemplate[]` sera donc
  éprouvé au lot 2, ce qui est conforme à « ne jamais généraliser avant le lot 2 ».
- **Bascule moteur `WebGL | CSS`** — exige `CssCubeScene`, lot 3.
- **Sérialisation des paramètres dans l'URL, persistance, mobile** — lot 7, comme prévu.
- **Fixtures `Lesson` dupliquées dans huit fichiers de test.** L'ajout de `animate` au
  contrat a demandé huit modifications identiques. Une fabrique partagée
  (`src/test/lessonFixture.ts`) est à écrire ; la prochaine extension du contrat ne devrait
  toucher qu'un fichier. Non fait dans cette génération pour ne pas mêler un refactoring
  de tests à la livraison — à porter en backlog.

## Known Limits of the Verification

À lire avec les résultats, pas après :

- **Chromium uniquement.** C'est le seul navigateur installé. `getComputedTiming().progress`,
  le comportement différé de `pause()` et le rendu WebGL ne sont vérifiés nulle part
  ailleurs. À traiter avant la mise en ligne.
- **Les 55 images par seconde ne sont pas mesurées.** Le génome les annonce comme une
  vérification manuelle en revue de lot ; elle reste à faire.
- **L'invariant i18n n'est tenu qu'à moitié par le compilateur.** Une chaîne traduisible ne
  peut pas entrer dans un `Param` ni un `Lesson`, mais rien n'empêche un composant d'écrire
  `<span>Copier</span>`. Il faudrait une règle de lint pour fermer cette moitié.
- **Le canvas persistant n'est prouvé qu'en unitaire.** Le lot 1 n'a qu'une seule leçon
  WebGL : impossible de naviguer d'une leçon WebGL à une autre en bout en bout. Le test de
  montage couvre l'invariant, le navigateur ne le confirmera qu'au lot 2.
- **La leçon a maintenant été regardée** — et c'est ce regard qui a trouvé le défaut que
  179 tests unitaires et 23 scénarios avaient manqué. Ce qu'aucune assertion ne dit encore :
  que le rythme de la démonstration soit juste, que le concept soit pédagogiquement bon, que
  les contrastes tiennent en conditions réelles.
- **Le contrôle de pixels est calibré sur un seul cadrage** (1280 × 800, Chromium). Un
  changement de disposition majeur demandera de recalibrer les seuils ; ils sont documentés
  avec la mesure dont ils viennent.
