# Anima Lab — spécification fonctionnelle et technique

Document destiné à Claude Code. Objectif : produire un plan de développement, puis implémenter.

---

## 0. Comment utiliser ce document

1. **Ne code rien avant d'avoir produit un plan.** Lis ce document en entier, puis propose un découpage en lots avec, pour chaque lot, les fichiers créés, les décisions prises et le critère de fin.
2. **Le lot 1 est une tranche verticale complète**, pas une couche horizontale. Une seule leçon qui fonctionne de bout en bout vaut mieux qu'un système de composants sans contenu.
3. **Rédige un `CLAUDE.md`** à la racine à l'issue du lot 1 : conventions de nommage, structure des dossiers, commandes utiles, et la procédure exacte pour ajouter une leçon. C'est ce fichier qui évitera la dérive sur les 24 leçons suivantes.
4. Les décisions produit sont prises (section 12). Si une décision technique non tranchée bloque le plan, pose la question au lieu de choisir seul.

---

## 1. Le produit

Site pédagogique sur l'animation web. 25 leçons réparties en trois familles : **socle natif** (10), **GSAP** (10), **shaders** (5).

Chaque leçon est une démonstration manipulable : une scène animée, des contrôles qui règlent ses paramètres, et le code source correspondant qui se met à jour en temps réel avec les valeurs réglées.

**La contrainte centrale** : les 25 leçons partagent un seul gabarit d'écran mais recouvrent des technologies d'animation incompatibles entre elles (CSS, WAAPI, GSAP, WebGL, GLSL). L'architecture doit absorber cette hétérogénéité sans que chaque leçon devienne un composant sur mesure.

Le design existe (maquettes fournies séparément). Ce document décrit le comportement, pas l'apparence.

---

## 2. Stack

- **React 19 + TypeScript strict + Vite**
- **react-three-fiber + @react-three/drei** pour les scènes WebGL, Three.js accessible directement quand nécessaire
- **GSAP** (core + ScrollTrigger, SplitText, MorphSVG, DrawSVG, MotionPath, Flip — tous gratuits depuis la 3.13), avec **`@gsap/react`** et son hook `useGSAP`
- **Zustand** pour l'état global (préférence de mouvement réduit, progression, locale)
- **React Router** en mode déclaratif, une route par leçon
- Pas de framework de documentation (Docusaurus, Nextra) : le contenu n'est pas du markdown, c'est de l'interactif
- Pas de Next.js : le déploiement est statique (section 8), un SPA Vite suffit

**Interdits explicites** : aucune bibliothèque d'animation supplémentaire (Motion, anime.js, react-spring) — le sujet du site est précisément de montrer ce que font les technologies enseignées. Aucune librairie de composants UI. Le CSS est écrit à la main à partir des tokens du design.

### Trois pièges React à traiter dès le lot 1

Ce sont les points où une implémentation React naïve casse ce projet en particulier :

1. **`StrictMode` monte les composants deux fois en développement.** Toute animation doit être idempotente et nettoyée correctement. Utilise `useGSAP` (qui gère `gsap.context()` et la révocation automatique au démontage) plutôt que `useEffect` + `gsap.to` à la main.
2. **Un curseur déplacé produit 60 changements de valeur par seconde.** Si chaque changement re-rend l'arbre React, la démonstration saccade — sur un site qui enseigne la fluidité, c'est rédhibitoire. Les valeurs de paramètres vivent dans un store Zustand ; la scène et le moteur d'animation s'y abonnent en **mise à jour transitoire** (`store.subscribe`, sans re-rendu) ; seuls les composants d'affichage de la valeur re-rendent, et le panneau de code est regénéré en différé (`requestIdleCallback` ou debounce court).
3. **Le canvas ne doit pas être démonté entre les leçons.** Un seul `<Canvas>` react-three-fiber monté haut dans l'arbre, dont le contenu change selon la route. Remonter un contexte WebGL à chaque navigation provoque des à-coups et, à terme, l'épuisement des contextes disponibles.

---

## 3. L'architecture, en une idée

**Une leçon est une donnée, pas un composant.**

Chaque leçon déclare son type de scène, ses paramètres, sa variante de transport et son gabarit de code. Le shell lit ce descripteur et construit l'écran. Le code spécifique à une leçon se limite à sa fonction d'animation.

C'est le point le plus important du document. Si à la leçon 12 on écrit encore du JSX sur mesure pour poser des curseurs, l'architecture a échoué.

### Le contrat

À écrire en premier, avant tout composant :

```ts
type SceneKind = 'webgl' | 'css-cube' | 'dom-grid' | 'scroll-column'
type TransportKind = 'timeline' | 'scroll' | 'none'
type Family = 'native' | 'gsap' | 'shaders'

type I18nKey = string          // jamais de littéral français dans un descripteur — voir section 7

interface Param {
  id: string                   // sert de clé partout : contrôle, animation, surbrillance du code
  label: string                // libellé technique, en monospace, non traduit ("duration")
  glossKey?: I18nKey           // glose traduite, affichée sous le libellé
  group: I18nKey               // titre du bloc de contrôles ("VALEURS")
  control:
    | { type: 'slider'; min: number; max: number; step: number; unit?: string }
    | { type: 'choice'; options: { value: string; labelKey: I18nKey; glossKey?: I18nKey }[] }
    | { type: 'toggle' }
    | { type: 'ease' }         // sélecteur de courbe, rendu spécialisé
  default: number | string | boolean
}

interface Lesson {
  id: string                   // 'native-tween'
  family: Family
  order: number
  titleKey: I18nKey
  scene: SceneKind
  engineToggle?: boolean       // affiche la bascule WebGL / CSS
  split?: { leftKey: I18nKey; rightKey: I18nKey; metrics?: ('fps' | 'pipeline')[] }
  transport: TransportKind
  params: Param[]
  code: CodeTemplate[]         // un par onglet (CSS / JS / GLSL)
}

interface CodeTemplate {
  tab: 'CSS' | 'JS' | 'GLSL'
  render: (values: ParamValues) => CodeLine[]
}

interface CodeLine {
  text: string
  paramIds?: string[]          // quels contrôles surlignent cette ligne
}
```

Le texte du concept n'est pas dans le descripteur : c'est un fichier markdown par leçon et par locale, chargé à la demande (section 7).

### Le flux de données

Une seule source de vérité : le store des paramètres de la leçon en cours.

```
store des paramètres (Zustand)
   ├──> contrôles            (lecture + écriture, re-rendu)
   ├──> moteur d'animation   (abonnement transitoire, sans re-rendu)
   └──> panneau de code      (regénéré en différé, surbrillance par paramètre actif)
```

Deux règles qui découlent de ce flux :

1. **Le code affiché est dérivé, jamais saisi en dur.** Il doit refléter exactement les valeurs courantes, y compris après réglage. Le bouton « copier » copie ce qui est affiché.
2. **Modifier un paramètre pendant la lecture ne doit pas casser la lecture.** Comportement attendu : l'animation est reconstruite et reprend à la même progression normalisée. C'est un cas à traiter explicitement, pas à découvrir en test.

---

## 4. Les briques

### 4.1 Shell de leçon

Le gabarit commun : chrome + scène + contrôles + transport + code + panneau Concept. Il lit un `Lesson` et n'a aucune connaissance des leçons individuelles.

### 4.2 Hôte de scène

Quatre implémentations derrière une interface unique :

| Type | Rendu | Points d'attention |
|---|---|---|
| `webgl` | react-three-fiber, cube isométrique + sol quadrillé | Canvas unique et persistant, seul son contenu change entre les routes |
| `css-cube` | 6 divs, `preserve-3d` | Doit être visuellement superposable au cube WebGL |
| `dom-grid` | 12 à 200 tuiles | Le nombre est un paramètre de leçon, pas une constante |
| `scroll-column` | Cube fixé + contenu défilant | Conteneur à défilement propre, ne défile pas la page |

Interface attendue : `mount / play / pause / seek(progress) / setParams / dispose`.

La bascule `engineToggle` intervertit `webgl` et `css-cube` sans remonter le reste de l'écran.

### 4.3 Barre de transport

Trois variantes, même emplacement et même hauteur.

- **`timeline`** : retour au début, lecture/pause, boucle, scrub, temps écoulé / durée, vitesse (`0.25×` à `4×`, valeurs négatives incluses). Le scrub pilote la progression normalisée, quelle que soit la technologie sous-jacente.
- **`scroll`** : position de défilement, plus deux poignées déplaçables matérialisant les bornes de déclenchement (`animation-range`).
- **`none`** : la barre disparaît, la scène récupère l'espace.

**Adaptateur nécessaire.** Le transport doit piloter indifféremment une timeline GSAP, une `Animation` WAAPI, une animation CSS et une boucle de rendu WebGL. Écris une interface `TimeDriver` avec quatre implémentations plutôt que des conditions dispersées dans le composant. Le scrub doit rester fluide : il agit sur le driver, pas sur l'état React.

### 4.4 Panneau de contrôles

Rendu générique à partir de `params`, groupé par `group`. Chaque type de contrôle est un composant. Le sélecteur d'easing est le seul cas spécialisé (vignettes de courbes tracées en SVG).

Les curseurs sont non contrôlés au sens React : la valeur part dans le store, l'affichage chiffré s'abonne, l'élément `input` n'est pas repiloté par un état parent à chaque frame.

### 4.5 Panneau de code

Replié en une ligne par défaut, dépliable. Onglets si plusieurs `CodeTemplate`. Coloration syntaxique légère (Shiki en import dynamique, ou une coloration minimale maison — pas de dépendance lourde chargée au démarrage). **Surbrillance de la ligne correspondant au contrôle en cours de manipulation**, via `paramIds`. Bouton copier.

### 4.6 Panneau Concept

Flottant, déployé depuis le bouton en haut de la scène, en surimpression. La démo continue de jouer derrière. Fermeture par bouton, `Échap` et clic extérieur. Indicateur « pas encore lu » sur les leçons dont le concept n'a jamais été ouvert.

Le contenu est un markdown chargé à la demande, jamais inclus dans le bundle initial.

### 4.7 Navigation

Deux niveaux : famille puis leçon. Route par leçon, état partageable par URL. **Les valeurs des paramètres sont sérialisées dans la query string** : c'est ce qui rend un réglage partageable, et c'est une fonctionnalité, pas un détail. Prévoir le préfixe de locale dans le chemin (section 7).

### 4.8 Préférence de mouvement réduit

Store global à trois états : `système` / `forcé actif` / `forcé inactif`. L'interrupteur du chrome écrase la valeur détectée. Toutes les scènes le lisent.

Effet attendu quand il est actif : **les démos ne disparaissent pas**, elles passent en lecture manuelle — pas de lecture automatique, scrub uniquement, transitions d'interface supprimées.

---

## 5. Comportements transverses

- **Une seule scène active à la fois.** Changer de leçon libère les ressources de la précédente : `dispose` sur les géométries, matériaux et textures, révocation du contexte GSAP (`useGSAP` s'en charge), `cancel` sur les animations WAAPI, `ScrollTrigger.kill()`. Une fuite mémoire sur un site de 25 scènes est le risque numéro un — le canvas persiste, son contenu non.
- **Pause hors écran.** `IntersectionObserver` : une scène invisible ne consomme pas de frame. Sur react-three-fiber, utiliser le mode de rendu à la demande (`frameloop="demand"`) partout où l'animation n'est pas continue.
- **Compteur d'images par seconde** disponible par moitié de scène, activé uniquement sur les leçons qui le déclarent (`split.metrics`).
- **Indicateur `layout · paint · composite`** pour la leçon sur le coût de rendu : dérivé de la propriété animée, pas d'une mesure réelle du navigateur (l'API ne permet pas de le faire proprement).
- **Absence de WebGL** : bascule automatique vers `css-cube` si la leçon le permet, message explicite sinon.
- **Erreur de compilation d'un shader** : afficher le message GLSL brut dans le panneau de code plutôt que d'écrouler la page. Une frontière d'erreur React par leçon, pour qu'une leçon cassée n'emporte pas le site.

---

## 6. Performance

- Chargement initial visé sous 200 ko de JS **gzip**, hors Three.js — mesuré sur le chunk de la route initiale, hors chunks chargés par famille.
- Three.js, GSAP et les plugins chargés à la demande, par famille de leçons (`React.lazy` + découpage Vite par route).
- Aucune leçon ne descend sous 55 images par seconde sur un portable milieu de gamme — **sauf la démonstration du coût de rendu, où la chute de performance est le contenu** ; ne l'optimise pas.
- Textures des leçons shaders : compressées, 1024 px maximum.
- Vérifier au profileur React qu'un déplacement de curseur ne provoque pas de rendu au-delà du composant qui affiche la valeur.

---

## 7. Internationalisation

**MVP en français. Bilingue français/anglais à terme.** L'anglais n'est pas implémenté maintenant, mais **aucune chaîne traduisible ne doit être écrite en dur dans un composant ou un descripteur** — c'est la seule dette qu'on ne pourra pas rattraper à moindre coût plus tard.

- Dictionnaire par locale : `src/i18n/fr.ts`, typé, avec `en.ts` créé mais vide au départ. Une bibliothèque n'est pas nécessaire au MVP ; si tu en veux une, `react-i18next` avec un seul namespace.
- Distinction à tenir : les **libellés techniques** (`duration`, `from`, `translateX`) ne se traduisent pas et restent en monospace ; les **gloses** et les titres se traduisent.
- Textes des concepts : `lessons/<famille>/<leçon>/concept.fr.md`, `concept.en.md`. Chargement dynamique selon la locale, repli sur le français si le fichier manque.
- Le code affiché dans le panneau ne se traduit jamais, commentaires compris — sauf à prévoir des commentaires par locale dans le `CodeTemplate`, ce que je déconseille pour le MVP.
- Routes préfixées par la locale (`/fr/socle/tween`) dès le MVP : ajouter le préfixe après coup casse toutes les URL déjà partagées.

**Rédaction des concepts** : le texte de chaque leçon est écrit au fil des lots, en même temps que la leçon. Une leçon dont le concept est un texte de remplissage n'est pas terminée (section 10).

---

## 8. Persistance et déploiement

### Persistance

`localStorage` uniquement pour le MVP : leçons visitées, concepts lus, préférence de mouvement réduit, locale. Aucun compte utilisateur, aucun serveur applicatif.

Isoler ces accès derrière un module unique (`core/storage.ts`) avec une interface qui pourrait être réimplémentée en appels réseau. Un compte utilisateur reste envisagé plus tard ; le but n'est pas de le préparer, seulement de ne pas disperser `localStorage` dans quinze composants.

### Déploiement

Build statique servi par nginx dans une image Docker multi-étapes :

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

Points à ne pas oublier dans la configuration nginx :

- `try_files $uri $uri/ /index.html;` — sans cette ligne, un accès direct à `/fr/socle/tween` renvoie une 404, ce qui casse précisément la fonctionnalité de partage d'URL décrite en 4.7.
- Cache long et immuable sur les fichiers hachés de `assets/`, aucun cache sur `index.html`.
- Compression brotli ou gzip activée : les bundles Three.js et GSAP en dépendent fortement.
- Types MIME corrects pour `.wasm` si une dépendance en introduit.

**Point à trancher** : un SPA pur ne produit aucun HTML par route, donc aucune indexation des 25 leçons par les moteurs de recherche. Si la découvrabilité compte, un prérendu à la compilation (`vite-react-ssg` ou équivalent) reste entièrement statique et compatible avec cette image Docker. À décider avant le lot 7, pas avant le lot 1.

---

## 9. Accessibilité

- Navigation clavier complète, focus visible, ordre de tabulation cohérent.
- Curseurs : rôle `slider` avec valeurs annoncées, réglables aux flèches.
- La barre de transport est utilisable au clavier (`Espace` pour lecture/pause, flèches pour le scrub).
- Le panneau Concept piège le focus tant qu'il est ouvert et le restitue à la fermeture.
- Chaque scène a une description textuelle courte pour les lecteurs d'écran.
- Contrastes conformes AA sur le texte et les contrôles.
- `lang` mis à jour selon la locale active.

---

## 10. Plan de livraison attendu

Propose un découpage proche de celui-ci, en le corrigeant si tu vois mieux :

**Lot 1 — tranche verticale.** Les contrats TypeScript, le store de paramètres, le shell, le canvas persistant, la scène `webgl`, le transport `timeline` avec son premier driver, les contrôles `slider` et `choice`, le panneau de code avec surbrillance, l'ossature i18n, et **une seule leçon complète** : `native-tween`, concept rédigé compris. Critère de fin : on règle la durée, le cube bouge, le code affiche la bonne valeur, on peut scrubber, et le profileur React ne montre pas de rendu parasite pendant le réglage. Puis rédaction du `CLAUDE.md`.

**Lot 2 — validation du contrat.** Deux leçons de plus sur la même configuration (`easing`, `waapi`) en n'écrivant que des descripteurs et des fonctions d'animation. Si l'une des deux exige de modifier le shell, le contrat est mauvais — corrige-le maintenant, pas à la leçon 15.

**Lot 3 — les configurations dures.** Scène divisée + métriques, scène `dom-grid`, transport `none`, bascule de moteur. Elles couvrent les leçons sur le coût de rendu, transform, transition/keyframes et FLIP.

**Lot 4 — scroll.** Scène `scroll-column`, transport `scroll`, poignées de plage. Deux leçons : natif puis ScrollTrigger.

**Lot 5 — reste du socle et famille GSAP.** Essentiellement du contenu, peu de code de plateforme.

**Lot 6 — shaders.** Uniforms exposés comme paramètres standards, panneau de code en onglet `GLSL`, gestion des erreurs de compilation.

**Lot 7 — finition.** Sérialisation URL, persistance, mobile, accessibilité, audit de performance, image Docker et configuration nginx, décision sur le prérendu.

**Lot 8 (hors MVP) — anglais.** Remplissage de `en.ts` et des `concept.en.md`. Ne rien coder pour ça avant, hormis l'ossature du lot 1.

---

## 11. Définition du « terminé » pour une leçon

Une leçon n'est finie que si les huit points sont vrais :

1. Tous les paramètres déclarés sont réglables et affectent réellement le rendu.
2. Le code affiché correspond exactement aux valeurs courantes.
3. La surbrillance fonctionne pour chaque paramètre.
4. Le texte du concept est écrit en français, relu, et fait entre 150 et 300 mots.
5. Modifier un paramètre pendant la lecture ne casse rien.
6. Le mode mouvement réduit donne un résultat utilisable.
7. Quitter la leçon ne laisse ni timeline vivante ni ressource WebGL non libérée.
8. Aucune chaîne traduisible n'est écrite en dur ; tout passe par le dictionnaire.

---

## 12. Structure de fichiers suggérée

```
src/
  shell/          LessonShell, ConceptPanel, Nav, ReducedMotionToggle
  scenes/         WebglScene, CssCubeScene, DomGridScene, ScrollColumnScene, CanvasHost
  transport/      TransportBar, drivers/ (gsap, waapi, css, raf)
  controls/       SliderControl, ChoiceControl, ToggleControl, EaseControl
  code/           CodePanel, highlight
  i18n/           fr.ts, en.ts, useTranslation
  lessons/
    native/tween/     lesson.ts (descripteur) + animation.ts + concept.fr.md
    native/easing/
    gsap/...
    shaders/...
  core/           types.ts, lessonRegistry.ts, paramStore.ts, storage.ts, reducedMotion.ts, perf.ts
```

Une leçon = un dossier = trois fichiers. Si une leçon en demande davantage, c'est un signal à remonter.

---

## 13. Décisions déjà prises

Ne les remets pas en question dans le plan :

1. React 19 + TypeScript + Vite. Pas de Next.js, pas de Vue.
2. Les textes des concepts sont rédigés au fil des lots, avec la leçon concernée.
3. `localStorage` pour le MVP ; le compte utilisateur est une hypothèse ultérieure, pas une exigence.
4. Français au MVP, bilingue français/anglais à terme : ossature i18n dès le lot 1, traductions au lot 8.
5. Déploiement en image Docker servant un build statique.

## 14. Ce qu'il ne faut pas faire

- Généraliser avant le lot 2. Le contrat se valide sur des cas réels, pas par anticipation.
- Écrire un moteur d'animation maison par-dessus GSAP ou la WAAPI.
- Piloter une animation par l'état React à chaque frame. React orchestre, il n'anime pas.
- Rendre les scènes shaders configurables « à la carte » : chaque leçon shader a son couple de programmes, écrits à la main.
- Stocker les valeurs des paramètres dans plusieurs endroits.
- Ajouter des transitions d'interface décoratives. Sur ce site, seule la scène a le droit de bouger fort.
