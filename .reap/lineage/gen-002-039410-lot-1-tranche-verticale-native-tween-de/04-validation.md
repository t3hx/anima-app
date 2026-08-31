# Validation

> Génération `gen-002-039410` (embryo) — lot 1, tranche verticale `native-tween`.
>
> **Passage final**, après huit tours de retour humain. Les précédents ont rendu `pass` sur
> une leçon qui, à l'usage, ne fonctionnait pas — écran vide, clavier inerte, interrupteur
> sans effet, caméra à contresens, barres de défilement. Chaque fois, c'est l'humain qui l'a
> constaté en essayant. Tout ce qui suit a été **réexécuté**, pas recopié.
>
> **Troisième passage.** Les deux premiers ont rendu `pass` sur une leçon qui, à l'usage,
> ne fonctionnait pas : d'abord un écran vide, puis un clavier et un interrupteur de
> mouvement réduit sans effet. Les deux fois, c'est l'humain qui l'a constaté en essayant.
> La génération est repassée par implémentation (T021 puis T022) ; tout ce qui suit a été
> **réexécuté**, pas recopié.
> Toutes les commandes ci-dessous ont été **exécutées à neuf** pour cette validation, après
> `rm -rf dist node_modules/.vite`. Aucun résultat n'est repris d'une exécution antérieure.

## Commandes

| Commande | Résultat |
|---|---|
| `npm run typecheck` | **vert** — aucune erreur |
| `npm run check` (Biome) | **vert** — 97 fichiers, aucun problème |
| `npm run build` | **vert** — voir le budget ci-dessous |
| `npm run test` (Vitest) | **vert** — 20 fichiers, **186 tests** |
| `npm run test:e2e` (Playwright) | **vert** — **64 scénarios** |

Sortie du build :

```
dist/index.html                       0.71 kB │ gzip:   0.39 kB
dist/assets/main-B0XdNR6k.css        14.44 kB │ gzip:   3.16 kB
dist/assets/native-DQ_bZRMk.js        2.51 kB │ gzip:   1.01 kB
dist/assets/main-G0VFdkxD.js        306.58 kB │ gzip:  97.73 kB
dist/assets/CanvasHost-qb2UYKob.js  882.63 kB │ gzip: 234.50 kB
```

## Le contrôle qui manquait

Le premier passage de validation a rendu `pass` sur une leçon **dont on ne voyait rien**.

Ce qui était vérifié : canvas monté, canvas non remonté entre deux leçons, sept géométries,
trois programmes compilés, triangles dessinés, driver actif, progression conservée, aucune
fuite, budget tenu. Ce qui ne l'était pas : **que quelque chose apparaisse**.

Toutes ces assertions portaient sur des nombres que l'application rapporte sur elle-même.
Aucune ne regardait ce que le navigateur affiche.

`tests/e2e/scene-visible.spec.ts` (8 scénarios) comble cela en lisant les **pixels** d'une
capture de la boîte de scène. Il ne demande rien à l'application, donc il ne peut être
trompé ni par une caméra correcte devant un aplat opaque, ni par un `z-index` malheureux,
ni par un ciseau de découpe plat, ni par une boucle de rendu qui ne se réamorce jamais.

Il porte **deux mesures**, et la première seule ne suffisait pas :

| Mesure | Ce qu'elle attrape | Preuve `[negative]` |
|---|---|---|
| Pixels du sujet, plancher **et plafond** | rien n'est peint · le cube emplit l'écran | canvas sans `z-index` → 0 pixel |
| Étalement du sol quadrillé sur les lignes | le cadrage est perdu | pas de caméra → sol sur **17 %** des lignes au lieu de 100 % |

La seconde ligne est celle qui compte le plus : la première version du contrôle ne comptait
que le sujet, et **retirer la caméra isométrique la laissait verte** — le cube passait
simplement collé à l'objectif. Le contrôle assertait de nouveau à côté de la chose.

## Les contrôles qui manquaient, deuxième série

Le clavier du transport et le mode mouvement réduit étaient **couverts, verts et
inopérants**. Chacun pour une raison différente, et toutes deux instructives.

| Fonctionnalité | Ce que le test regardait | Pourquoi il ne pouvait qu'être vert |
|---|---|---|
| Clavier | le libellé du bouton, après avoir donné le focus au bouton | personne n'arrive sur une page en ayant tabulé ; et le libellé venait d'un état React qui ne suivait pas le driver |
| Mouvement réduit | un contexte navigateur **déjà** en `reducedMotion: reduce` | il vérifiait l'état initial, jamais la bascule — c'est-à-dire tout sauf ce que fait l'interrupteur |

Les deux sont remplacés par des contrôles qui assertent sur **ce que l'utilisateur
observe** : le temps affiché avance-t-il, ou non.

`[negative]` Rétablir l'ancien comportement fait échouer 3 scénarios sur le clavier et 1
sur la bascule.

## Critères de fin du plan

### 0. La démonstration est visible — **satisfait** `[ran]` `[negative]`

Ce critère ne figurait pas au plan. Son absence est ce qui a laissé passer un écran vide.

`scene-visible.spec.ts` : le renderer produit des images et des appels de dessin ; le cube
est dans le champ de la caméra ; il y reste aux deux extrémités du curseur `from` (-12 et
12) ; le sol quadrillé s'étale sur la scène ; un scrub à l'arrêt redessine ; une scène à
l'arrêt cesse de consommer des images ; les pixels de la boîte de scène montrent le sujet ;
et l'image diffère entre les deux extrémités du trajet.

Vérifié aussi **par l'œil**, sur capture : cube, trace de fantômes, sol isométrique.

### 1. Réglage effectif et code exact — **satisfait** `[ran]`

Déplacer `duration` déplace le cube, le panneau affiche la nouvelle valeur, la ligne
`duration` est surlignée. Vérifié dans Chromium : `native-tween.spec.ts` § « the code shown
follows the values exactly » assert `duration: 3400,` après un réglage à 3,4 s, puis
qu'exactement **une** ligne porte `data-highlighted="true"` et que c'est celle-là.

La surbrillance de *chaque* paramètre est vérifiée en unitaire (`lesson.test.ts` § « highlights
a line for every parameter that the code shows ») : `method`, `from`, `duration` et `easing`
revendiquent chacun au moins une ligne.

`[negative]` Deux mutants : code figé sur les valeurs par défaut → 4 échecs ; surbrillance
désactivée → 2 échecs.

### 2. Transport — **satisfait** `[ran]`

`native-tween.spec.ts` § « the transport is operable from the keyboard » : `Espace` sur le
bouton de lecture bascule l'état, deux `ArrowRight` sur la piste augmentent la valeur du
scrub. C'est le seul endroit où cette exigence est vérifiable — jsdom ne bouge pas un
`input[type=range]` aux flèches (mesuré).

Le scrub pilote la progression normalisée : `waapi-driver.spec.ts` § « scrubs, plays, pauses
and changes rate ».

### 3. Réglage pendant la lecture — **satisfait** `[ran]`

`native-tween.spec.ts` § « point 5 » : on laisse jouer, on fige, on note la progression, on
déplace `duration` de 2 s à 4,5 s, et la progression normalisée est conservée à 0,1 près.
La durée affichée passe bien à 4,50 s.

Le mécanisme est aussi testé au niveau du driver : `waapi-driver.spec.ts` § « keeps the
normalized progress when the duration changes mid-play » — 0,37 avant, 0,37 après.

`[negative]` Mutant « `retime` restitue avec l'ancienne durée » → attendu 0,37, obtenu
0,148.

### 4. Aucun rendu parasite — **satisfait** `[ran]` `[negative]`

`paramStore.render.test.tsx` : 60 écritures successives, chacune dans son propre `act`.
Moteur d'animation **1 rendu**, affichage de la valeur **61**, listener **60 appels**.
`ControlPanel.test.tsx` : 30 mouvements de curseur, **0 rendu** du panneau et **0** du
curseur lui-même.

`[negative]` Trois mutants distincts, tous rouges : abonnement transitoire remplacé par une
lecture re-rendante (1 → 61 rendus), curseur abonné à sa propre valeur (1 → 31 rendus),
et — pour le premier jet du test — la découverte que la version qui n'observait que le
panneau **ne voyait rien**.

*Ce que ce critère ne couvre pas* : il compte des rendus sous jsdom. Le profileur React sur
la vraie page reste une vérification manuelle, comme l'annonce le génome.

### 5. Aucune fuite — **satisfait** `[ran]` `[negative]`

`native-tween.spec.ts` § « point 7 » : pendant la leçon, 1 horloge vivante et des géométries
WebGL actives ; après être sorti **par un lien** (navigation côté client), 0 horloge, 0
canvas, et `webgl()` rend `null`. Le scénario d'accumulation fait quatre allers-retours et
vérifie qu'il reste exactement 1 horloge.

`[negative]` Mutant « la leçon ne libère pas son driver » → 2 scénarios rouges.

**Le critère du plan a dû être corrigé deux fois avant d'être réel.** Il portait d'abord sur
`document.getAnimations()`, qui est aveugle à nos horloges (mesuré : 0 pendant qu'un driver
joue). Puis, la sortie de leçon se faisant par `page.goto`, le rechargement effaçait la
fuite et le test restait vert sous le mutant. Les deux défauts n'ont été trouvés que par
mutation.

### 6. Mouvement réduit — **satisfait** `[ran]`

`native-tween.spec.ts` § « point 6 », dans un contexte `reducedMotion: 'reduce'` : pas de
lecture automatique (le bouton affiche « Lecture »), la piste de scrub reste présente, le
canvas est rendu. La démo ne disparaît pas, elle devient manuelle.

`reducedMotion.test.ts` couvre les trois états et la primauté de l'interrupteur du chrome
sur la préférence système, dans les deux sens.

### 7. Livraison — **satisfait** `[ran]`

- **Aucune chaîne traduisible en dur dans les données** : `I18nKey` est dérivé du
  dictionnaire, donc une chaîne française dans un descripteur ne compile pas.
  `[negative]` Mutant `I18nKey = string` → 2 assertions rouges.
- **`concept.fr.md` rédigé et relu, 271 mots** (fourchette exigée : 150 à 300), vérifié par
  test.
- **`typecheck`, `check`, `test`, `test:e2e` verts**, exécutés à neuf ci-dessus.
- **Budget : 96,77 ko gzip** sur le chunk de la route initiale, contre 200 autorisés.
  Three.js, drei et react-three-fiber sont dans `View-BM8Q7qMu.js` (234,06 ko gzip),
  **chargé à la demande** — l'accueil ne le télécharge jamais.

## Les huit tours de retour humain

| Tour | Ce qui a été trouvé | Ce que la suite en dit maintenant |
|---|---|---|
| 1 | **écran vide** — 179 tests verts | `scene-visible.spec.ts` lit les pixels |
| 2 | clavier et mouvement réduit inertes | assertions sur le temps affiché, pas sur un libellé |
| 3 | caméra orthographique contre la maquette | contrôle d'étalement du sol |
| 4 | alignement, `set`, paramètres hors sujet | `layout.spec.ts`, `visibleWhen` |
| 5 | **couleur annoncée, jamais écrite** | `design-contract.spec.ts` lit les styles calculés |
| 6 | scène qui s'aplatit, vitesse inutile | hauteur pilotée par la scène, sélecteur retiré |
| 7 | barres de défilement | colonnes indépendantes, aucun défilement interne |
| 8 | poignées traversées, code débordant | ordre de peinture, budget de 44 colonnes |

Aucun de ces huit défauts n'aurait été trouvé par une exécution ordinaire de la suite telle
qu'elle existait alors. Tous le seraient aujourd'hui.

## Verdict : **pass**

Les vingt tâches du plan sont faites, plus la correction T021. Les sept critères sont
satisfaits, plus le critère 0 que le plan avait omis, et chacun est adossé à une commande
exécutée dans ce passage.

Quatorze preuves par mutation ont été menées. **Six ont d'abord échoué à faire rougir quoi
que ce soit** — c'est-à-dire que six contrôles, à première vue corrects, n'observaient
rien :

1. le test de non-rendu, qui observait le panneau au lieu du curseur ;
2. le contrôle du point 7, fondé sur `document.getAnimations()`, aveugle par construction ;
3. le scénario de sortie de leçon, qui rechargeait la page et effaçait la fuite ;
4. le tout premier mutant du driver, qui ne compilait pas et ne prouvait donc rien ;
5. **toute la suite, face à une scène qui n'affichait rien** ;
6. le contrôle de pixels lui-même, face à une caméra retirée, avant qu'on y ajoute la
   mesure de cadrage.

Le cinquième n'a pas été trouvé par une preuve par mutation mais **par l'humain, en
essayant l'application**. C'est le rappel que ce projet ne peut pas s'en remettre à des
compteurs : son contenu est visuel, et il se vérifie en regardant.

## Ce que cette validation ne dit pas

- **Chromium uniquement** — le seul navigateur installé. `getComputedTiming().progress`, le
  comportement différé de `pause()` et le rendu WebGL ne sont vérifiés nulle part ailleurs.
- **Les 55 images par seconde ne sont pas mesurées**, ni le profileur React sur la vraie
  page. Le génome les classe en vérification manuelle de revue de lot ; elles restent à
  faire.
- **L'invariant i18n n'est tenu qu'à moitié par le compilateur** : rien n'empêche un
  composant d'écrire `<span>Copier</span>`. Il y faudrait une règle de lint.
- **Le canvas persistant n'est prouvé qu'en unitaire** : le lot 1 n'a qu'une leçon WebGL,
  donc aucune navigation de leçon WebGL à leçon WebGL n'est possible en bout en bout. Le
  navigateur ne le confirmera qu'au lot 2.
- **L'écran a été regardé deux fois, et les deux fois le regard a trouvé ce que la suite
  ne voyait pas.** D'abord un écran vide, puis deux commandes inertes. Ce qu'aucune
  assertion ne dit encore : que le rythme de la démonstration soit juste, que le concept
  soit pédagogiquement bon, que les contrastes tiennent en conditions réelles.
- **La leçon de méthode de cette génération** : trois fois de suite, un test regardait un
  intermédiaire — un libellé de bouton, un compteur interne, un état initial — au lieu du
  résultat. Sur ce projet, un contrôle qui n'observe pas ce que l'utilisateur observe ne
  prouve rien, et son vert est la partie trompeuse.
- **Les seuils du contrôle de pixels sont calibrés sur un cadrage** (1280 × 800, Chromium),
  et documentés avec la mesure dont ils viennent. Un changement majeur de disposition
  demandera de les recalibrer.
