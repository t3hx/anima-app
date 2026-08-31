# anima

**Anima Lab** — site pédagogique sur l'animation web. 25 leçons manipulables en trois
familles : socle natif, GSAP, shaders.

## Sources de vérité

| Fichier | Contenu |
|---|---|
| `design/spec-technique-anima-lab.md` | spécification fonctionnelle et technique — le comportement attendu, le plan en 8 lots, la définition du « terminé » |
| `design/handoff_anima_lab/` | maquettes et tokens — l'apparence. **Ouvre le fichier**, ne te fie pas au résumé : c'est en le relisant qu'on découvre que le sol est en perspective, pas isométrique |
| `.reap/genome/application.md` | identité, architecture, stack, conventions, contraintes (auto-importé) |
| `.reap/genome/invariants.md` | interdits absolus (auto-importé) |
| `.reap/environment/source-map.md` | rôle de chaque module — **à lire avant de toucher au code** |

## Le principe qui gouverne tout

**Une leçon est une donnée, pas un composant.** Le shell lit un descripteur et construit
l'écran. Le code spécifique à une leçon se limite à sa fonction d'animation. Si tu écris
du JSX sur mesure pour poser un contrôle, tu es en train de casser l'architecture.

Corollaire vérifié par test : `LessonShell` ne contient **aucun** `if (lesson.id === …)`,
et un descripteur de forme inattendue produit un écran cohérent sans qu'on le modifie.

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement, `:5173` |
| `npm run build` | `tsc --noEmit && vite build` vers `dist/` |
| `npm run preview` | sert le build sur `:4173` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check` / `check:fix` | Biome — formatage et lint |
| `npm run test` / `test:watch` | Vitest (unitaires et composants) |
| `npm run test:e2e` | Playwright contre le build de prévisualisation |

Diagnostics disponibles dans la console du navigateur :

```js
__anima.liveDrivers()  // horloges WAAPI non libérées — doit valoir 0 hors d'une leçon
__anima.webgl()        // géométries, textures, programmes, images rendues
__anima.subject()      // position du sujet en coordonnées d'écran, -1..1
```

## Ajouter une leçon

C'est la procédure qui évite la dérive sur les 24 leçons suivantes. **Une leçon = un
dossier = trois fichiers.** Si tu en veux un quatrième, arrête-toi et remonte le problème.

### 1. Créer le dossier

```
src/lessons/<famille>/<slug>/
  lesson.ts        le descripteur — des données, jamais de JSX
  animation.ts     la fonction d'animation, seul code spécifique à la leçon
  concept.fr.md    150 à 300 mots, rédigé et relu
```

### 2. Écrire `animation.ts`

Une fonction **pure** : une progression et des valeurs entrent, un état de scène sort.
Elle ne connaît ni three.js, ni le DOM, ni le store — c'est ce qui la rend testable sans
navigateur.

```ts
export const animate: CubeAnimation = (progress, values) => ({
  x: /* … */,
  showGhosts: values.ghosts === true,
})
```

N'y calcule **aucune courbe** : le navigateur applique l'easing, la fonction reçoit une
progression déjà transformée.

### 3. Écrire `lesson.ts`

```ts
export const maLecon: Lesson = {
  id: 'native-easing',        // kebab-case, clé globale
  slug: 'easing',             // segment d'URL, stable quelle que soit la locale
  family: 'native',
  order: 3,
  titleKey: 'lesson.native-easing.title',
  scene: 'webgl',
  transport: 'timeline',
  property: 'position.x',     // pilule technique, non traduite
  params: [ /* … */ ],
  code: [{ tab: 'JS', render }],
  animate,
  timing,                     // durée et courbe demandées au driver
}
```

Trois pièges à connaître, chacun payé au lot 1 :

- **`timing` et le gabarit de code doivent lire la même fonction.** Les séparer a produit
  un écran qui affichait `linear` pendant que le driver appliquait `ease-out`. Sur ce site,
  le code affiché *est* le produit : il ne peut pas mentir.
- **Un paramètre qui n'a pas de sens pour tous les réglages porte un `visibleWhen`.**
  Afficher `from` quand la méthode déclare l'arrivée enseigne le contraire de la leçon.
- **Le code est écrit pour tenir dans le rail** — 44 colonnes, constante
  `MAX_CODE_COLUMNS`. Un extrait qu'il faut faire défiler ne se lit pas au moment où on
  le lit, c'est-à-dire pendant qu'on règle un curseur.

### 4. Ajouter les clés de traduction

Toutes dans `src/i18n/fr.ts`. `I18nKey` en est **dérivé** : une chaîne traduisible écrite
en dur dans un descripteur ne compile pas. Les libellés techniques (`duration`,
`translateX`, `to`) ne passent **pas** par le dictionnaire — ils ne se traduisent pas et
restent en monospace.

### 5. Enregistrer la leçon

Une ligne dans `src/lessons/<famille>/index.ts`. Rien d'autre : la route, la navigation et
le compteur en découlent.

### 6. Rédiger `concept.fr.md`

150 à 300 mots, vérifié par test. Une leçon dont le concept est un texte de remplissage
n'est pas livrée, elle est en dette.

### 7. Écrire les tests

| Niveau | Ce qu'il couvre |
|---|---|
| `animation.test.ts` | le comportement pédagogique — ce que chaque réglage fait réellement |
| `lesson.test.ts` | le descripteur, le code généré, la surbrillance, le concept, la largeur des lignes |
| `tests/e2e/<slug>.spec.ts` | points 5 et 7 du « terminé » : réglage pendant la lecture, et sortie sans fuite |

**Et vérifie que la scène affiche quelque chose.** `tests/e2e/scene-visible.spec.ts` lit
les pixels : c'est le seul contrôle qui ne peut pas être trompé.

## Ce que cette génération a appris, et qui vaut pour les suivantes

Ces règles ne sont pas théoriques : chacune vient d'un défaut livré au lot 1.

**Un test doit observer ce que l'utilisateur observe.** Trois fois de suite, un test
regardait un intermédiaire — un compteur interne, le libellé d'un bouton, un état initial —
au lieu du résultat. Il était vert, et la fonctionnalité ne marchait pas. La suite entière
a été verte sur un écran vide.

**Sur un produit visuel, aucun compteur ne remplace la lecture des pixels.** Et un contrôle
de rendu doit mesurer la présence *et* le cadrage : compter les pixels du sujet ne voit pas
une caméra perdue, le cube passe simplement collé à l'objectif.

**Un mutant doit compiler**, sinon il teste la chaîne de build et non l'assertion visée.
Et une preuve par mutation doit faire échouer l'assertion qui *porte le sens*, pas une
assertion voisine qui se déclenche avant elle.

**jsdom n'implémente ni les Web Animations, ni le WebGL, ni le clavier d'un
`input[type=range]`.** Ce qui en dépend se vérifie dans un navigateur, jamais autrement.

**Une valeur dérivée calculée à deux endroits finit par mentir.** Trois défauts de cette
génération ont cette cause unique.

**Une capture d'écran ne prouve pas une couleur ; un style calculé, si.**
`tests/e2e/design-contract.spec.ts` fige les affirmations visuelles pour cette raison.

## Conventions

**Langue.** Zéro français dans le code : identifiants, chaînes techniques et logs en
anglais. Seuls les commentaires peuvent être en français. Commits, PR, issues : anglais.

**Nommage.** `PascalCase.tsx` pour les composants, `camelCase.ts` pour les modules, `id` de
leçon et de paramètre en kebab-case. Le CSS d'un composant vit à côté de lui.

**Rendus.** Un curseur déplacé ne doit re-rendre que l'affichage de sa valeur. Le moteur
d'animation s'abonne en transitoire (`useParamSubscription`), jamais par `useParamValue`.
Un test compte les rendus et le prouve par mutation.

**TDD strict** : le test qui échoue, le minimum pour le faire passer, puis la relecture.
Aucune tâche annoncée terminée sans avoir montré la sortie des tests.

## REAP

This project uses REAP (Recursive Evolutionary Autonomous Pipeline).
All work must follow genome principles.

### Knowledge Loading

REAP knowledge is loaded in two layers:

1. **Static knowledge** (genome, environment, vision, memory, reap-guide) is auto-loaded by Claude Code via the `@` import references below — no hook required.
2. **Dynamic context** (current generation state, strict mode, language directive) is injected by the SessionStart hook (`reap load-context`).

If dynamic context was lost (e.g. after a context compaction), re-run the hook:
```
/reap.knowledge reload
```

### Static Knowledge (auto-imported)

@~/.reap/reap-guide.md
@.reap/genome/application.md
@.reap/genome/evolution.md
@.reap/genome/invariants.md
@.reap/environment/summary.md
@.reap/vision/goals.md
@.reap/vision/memory/longterm.md
@.reap/vision/memory/midterm.md
@.reap/vision/memory/shortterm.md

### Termination Paths

Generation은 세 가지 방식으로 종료할 수 있다:
- `/reap.abort` — 실패/취소. life/ 삭제, lineage 미기록.
- `/reap.early-close` — 부분 완료. lineage에 보존(`status: partial`), 미완 task는 자동 backlog 승계. implementation/validation에서만 호출 가능.
- 정식 completion — validation 후 자연 흐름.

사용자가 "중단/포기/스코프 축소" 의도를 표명하면 agent는 위 세 선택지를 안내하고 사용자가 선택하게 한다.

### Agent

When delegating a generation to a subagent, use `subagent_type: "reap-evolve"`. Dynamic context (generation state, vision, memory) is passed via prompt parameters.
