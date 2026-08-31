# Longterm Memory

## Un harnais de test qu'on n'a jamais vu échouer ne prouve rien

Au lot 0, le test censé garantir que les alias de chemins ne divergent pas entre
`vite.config.ts` et `tsconfig.json` est passé au vert dès sa première exécution — Vitest
lit `vite.config.ts` et héritait donc déjà des alias. Aucun rouge n'était atteignable par
antériorité.

Le déclarer valide aurait été une erreur : un test vert d'emblée peut n'exécuter
strictement rien. La preuve a été faite par **mutation** — retirer volontairement l'alias
que le test doit protéger, constater le rouge, restaurer.

À réutiliser chaque fois que le TDD est structurellement impossible : quand on ne peut pas
prouver par antériorité, on prouve par mutation. Ne jamais se contenter d'un vert non
expliqué.

## Un test doit observer ce que l'utilisateur observe

Au lot 1, huit défauts ont été trouvés par l'humain, pas par la suite. À chaque fois, un
test regardait un **intermédiaire** — un compteur interne, le libellé d'un bouton, un état
initial, une caméra bien orientée — au lieu du résultat. Il était vert, et la fonctionnalité
ne marchait pas. Une fois, 179 tests et 23 scénarios étaient verts sur un **écran vide**.

Le vert ne dit pas « ça marche ». Il dit « rien de ce que j'observe n'a bougé ».

Deux corollaires, payés chacun par un défaut livré :

- **Sur un produit visuel, aucun compteur ne remplace la lecture des pixels** — et il en
  faut deux mesures : la présence du sujet *et* son cadrage. Compter les pixels ne voit pas
  une caméra perdue, l'objet passe simplement collé à l'objectif.
- **Une capture d'écran ne prouve pas une couleur ; un style calculé, si.**

## Une valeur dérivée calculée à deux endroits finit par mentir

Trois défauts du lot 1 ont cette cause unique. Le plus grave : le shell calculait le
cadencement du driver pendant que la leçon calculait celui du code affiché. L'écran montrait
`linear`, le navigateur appliquait `ease-out`.

Avant de dupliquer un calcul, donner à la valeur un seul propriétaire et l'injecter.

## Un mutant doit compiler, et faire échouer l'assertion qui porte le sens

Deux preuves par mutation du lot 1 n'ont rien prouvé : l'une ne compilait pas — elle testait
la chaîne de build — l'autre faisait échouer une assertion voisine, déclenchée avant celle
qui comptait. Vérifier **quelle** assertion rougit, pas seulement qu'il y a du rouge.
