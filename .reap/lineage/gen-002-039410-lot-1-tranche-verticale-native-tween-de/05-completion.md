# Completion

> Génération `gen-002-039410` (embryo) — lot 1, tranche verticale `native-tween`.
> Verdict de validation : **pass**, au terme de huit tours de retour humain.

## Summary

Le dépôt est passé d'une chaîne d'outils sans code produit à **une leçon complète et
manipulable**, et surtout à un contrat de données que le lot 2 pourra mettre à l'épreuve.

Vingt tâches planifiées, huit tâches de correction issues des retours. Ce qui existe :

- le contrat (`core/types.ts`), durci en unions discriminées et enrichi de quatre champs
  que la spec §3 n'avait pas — `ParamValues`, `slug`, `animate`, `timing`, `visibleWhen`,
  chacun imposé par un cas réel ;
- le store unique, avec sa lecture re-rendante et son abonnement transitoire ;
- le registre par famille, le routage préfixé par la locale, l'ossature i18n dont les clés
  sont vérifiées par le compilateur ;
- le canvas WebGL unique et persistant, la scène perspective avec son sol fondu, sa trace
  de fantômes et ses graduations qui mesurent réellement l'axe ;
- le `TimeDriver` WAAPI à cible nulle, le transport, les quatre contrôles génériques, le
  panneau de code dérivé et surligné ;
- la leçon `native-tween` : trois fichiers, concept rédigé de 297 mots.

**186 tests unitaires, 64 scénarios de bout en bout.** Route initiale à 97,93 ko gzip sur
un budget de 200, Three.js chargé à la demande.

## Lessons Learned

### Un test doit observer ce que l'utilisateur observe

C'est la leçon centrale, et elle a coûté huit tours. Trois fois, un test regardait un
intermédiaire — un compteur interne, le libellé d'un bouton, un état initial — au lieu du
résultat. Il était vert, et la fonctionnalité ne marchait pas. Une fois, la suite entière
était verte sur un **écran vide**.

Le vert est la partie trompeuse : il ne dit pas « ça marche », il dit « rien de ce que
j'observe n'a bougé ». Encore faut-il observer la bonne chose.

### Sur un produit visuel, aucun compteur ne remplace la lecture des pixels

Canvas monté, sept géométries, trois programmes compilés, triangles dessinés, driver actif,
aucune fuite, budget tenu — et rien à l'écran. Tous ces nombres, l'application les rapporte
sur elle-même.

Et il en faut **deux** : compter les pixels du sujet dit qu'il y a quelque chose, mesurer
l'étalement du sol dit que c'est cadré. La première seule laissait passer une caméra
perdue, le cube passant simplement collé à l'objectif.

### Une valeur dérivée calculée à deux endroits finit par mentir

Trois défauts de cette génération ont cette cause unique, dont le plus grave : le shell
calculait le cadencement du driver pendant que la leçon calculait celui du code affiché.
L'écran montrait `linear`, le navigateur appliquait `ease-out`. Sur un site dont le code
*est* le produit, c'est le défaut qu'on ne peut pas se permettre.

### Un mutant doit compiler, et faire échouer l'assertion qui porte le sens

Deux preuves par mutation n'ont rien prouvé : l'une ne compilait pas — elle testait la
chaîne de build — l'autre faisait échouer une assertion voisine qui se déclenchait avant
celle qui comptait.

### Une capture d'écran ne prouve pas une couleur

J'ai annoncé une correction qui n'existait pas, en me fiant à une image où je croyais voir
un accent. La règle CSS n'avait jamais été écrite : un script d'édition avait échoué sur une
assertion postérieure, emportant avec lui les remplacements déjà faits. Depuis, toute
affirmation visuelle passe par un style calculé.

### Une contrainte qu'on s'invente coûte plus cher qu'une contrainte réelle

Les barres de défilement venaient d'une exigence que rien n'imposait : que les deux colonnes
finissent sur la même ligne. En l'abandonnant, elles ont disparu — et la scène a retrouvé le
rapport exact du handoff, que j'avais déclaré inatteignable un tour plus tôt.

## Next Generation Hints

Le lot 2 (`T3H-112`) est le juge du contrat : deux leçons de plus, `easing` et `waapi`,
écrites en n'ajoutant **que** des descripteurs et des fonctions d'animation. Points de
vigilance :

- `CodeTemplate[]` n'a jamais été éprouvé au pluriel — le lot 1 ne livre qu'un onglet ;
- `visibleWhen` et `timing` sont nés d'un seul cas ; deux leçons de plus diront s'ils
  tiennent ou s'ils étaient déjà une généralisation prématurée ;
- les fixtures `Lesson` sont dupliquées dans neuf fichiers de test — chaque extension du
  contrat a coûté neuf modifications identiques. Une fabrique partagée est à écrire ;
- l'invariant i18n n'est tenu qu'à moitié : rien n'empêche un composant d'écrire une chaîne
  française en JSX. Il faudrait une règle de lint ;
- rien n'est vérifié hors Chromium, et les 55 images par seconde n'ont jamais été mesurées.
