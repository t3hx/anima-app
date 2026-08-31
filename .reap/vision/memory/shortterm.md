# Shortterm Memory

## Handoff — après `gen-002-039410` (lot 1, tranche verticale `native-tween`)

Le lot 1 est livré et validé : contrat de données, store, registre, routage, i18n, canvas
persistant, scène WebGL, driver WAAPI, transport, quatre contrôles, panneau de code, et la
leçon `native-tween` complète avec son concept de 297 mots.

**186 tests unitaires, 64 scénarios de bout en bout**, route initiale à 97,93 ko gzip.
`CLAUDE.md` est rédigé, avec la procédure d'ajout d'une leçon.

**Prochaine étape : lot 2**, EPIC `T3H-112` — `easing` et `waapi`, en n'écrivant **que** des
descripteurs et des fonctions d'animation. C'est le juge du contrat.

## Ce qu'il faut savoir avant de reprendre

- **Le contrat a gagné cinq champs** que la spec §3 n'avait pas : `ParamValues`, `slug`,
  `animate`, `timing`, `visibleWhen`. Chacun imposé par un cas réel, aucun par anticipation.
- **Le mode embryo devait s'arrêter à la fin du lot 2.** Le contrat n'a toujours pas été
  éprouvé sur une deuxième leçon.
- **Le génome et la spec §7 disent encore `/fr/socle/tween`.** Les routes sont
  `/fr/native/tween` — segments stables en anglais, décision D2 du plan. À corriger en
  phase adapt.
- **La spec §4.3 demande un sélecteur de vitesse**, retiré sur demande explicite de
  l'humain. L'écart est consigné dans `TransportBar.tsx`.

## En attente

Rien n'est poussé ni fusionné à la clôture de cette génération.
