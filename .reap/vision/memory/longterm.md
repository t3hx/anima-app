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
