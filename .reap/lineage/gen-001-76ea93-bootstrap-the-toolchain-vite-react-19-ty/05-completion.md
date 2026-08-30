# Completion

> Génération `gen-001-76ea93` (embryo) — lot 0, amorçage de la chaîne d'outils.
> Verdict de validation : **pass**.

## Summary

Le dépôt est passé de « connaissance seule » à « dépôt qui construit et se vérifie ».

Sept commandes existent et passent depuis un `npm ci` propre : `dev`, `build`, `preview`,
`typecheck`, `check`, `test`, `test:e2e`. Le typecheck est strict, le formatage est
idempotent, quatre tests unitaires et deux scénarios de bout en bout tournent contre le
build de production réel.

Aucun code produit n'a été écrit — c'était la contrainte principale, et elle est tenue :
les neuf dossiers de la structure §12 existent, vides, avec leurs alias configurés et
vérifiés par test. Le lot 1 les remplit.

Dix-sept tâches sur dix-huit exécutées ; la dix-huitième (mise à jour de l'environnement)
a été convertie en backlog puis appliquée dans cette phase, l'implémentation n'ayant pas le
droit de modifier `environment/`.

## Lessons Learned

### La preuve par mutation, quand le TDD est structurellement impossible

Le test des alias est passé au vert dès sa première exécution : Vitest lit
`vite.config.ts`, donc les alias étaient déjà résolus côté test. Il n'y avait pas de rouge
à obtenir par antériorité.

Un test vert d'emblée peut n'exécuter strictement rien. Plutôt que de le déclarer valide,
la divergence qu'il doit détecter a été introduite volontairement — retrait du seul alias
`@transport` de `vite.config.ts` — puis constatée en rouge, puis restaurée.

C'est la leçon la plus réutilisable de cette génération, promue en mémoire long terme.

### TypeScript 7 est utilisable, avec une rupture de configuration

Le compilateur natif écrit en Go fonctionne avec Vite 8, Biome, Vitest et Playwright. Le
repli sur la lignée 6 prévu au plan n'a pas servi.

Une seule rupture rencontrée : **`baseUrl` a été supprimé**. Les mappings de `paths`
doivent être relatifs et commencer par `./`, sinon `TS5102` et `TS5090`. Consigné dans
`environment/summary.md` — c'est typiquement le détail qui coûte une heure à qui ne l'a
jamais vu.

### Un budget sans unité n'est pas un budget

Le squelette — React et react-dom seuls, aucun code produit — pèse 190,55 ko bruts pour un
budget de 200 ko « hors Three.js ». Lu en octets bruts, la contrainte est consommée à 95 %
avant la première ligne de code et devient intenable ; lue en gzip (60,02 ko), elle laisse
140 ko et devient un objectif réel.

L'ambiguïté a été trouvée au lot 0 parce qu'on a regardé la sortie du premier build. Elle
serait apparue au lot 7, à l'audit de performance, quand la corriger aurait signifié soit
échouer contre un nombre impossible, soit réinterpréter le génome en cours de route. Une
contrainte qu'on réinterprète quand elle dérange cesse d'être une contrainte.

## Next Generation Hints

**Lot 1 — EPIC `T3H-111`, la tranche verticale `native-tween`.**

Ordre imposé par le génome : **`core/types.ts` en premier, avant tout composant.** Le
contrat est le pivot ; l'écrire après le shell revient à le déduire de ce qu'on a codé au
lieu de l'inverse.

Points d'attention hérités de cette génération :

- Les alias sont posés et protégés par `src/test/aliases.test.ts`. Ajouter un dossier à la
  structure §12 exige de le déclarer dans `vite.config.ts` **et** `tsconfig.json`, sinon
  ce test échoue — c'est voulu.
- `tsconfig.json` est plus strict que ce que le génome exigeait : `noUncheckedIndexedAccess`
  et `exactOptionalPropertyTypes` sont actifs. Les descripteurs de leçon devront gérer les
  accès indexés et les propriétés optionnelles proprement dès l'écriture du contrat.
- Playwright construit et sert lui-même l'application. Les scénarios par leçon, couvrant
  les points 5 et 7 du « terminé », doivent être générés depuis le descripteur — pas écrits
  à la main, sinon vingt-cinq tests non maintenus.
- Le budget des 200 ko reste à trancher avant de configurer le découpage par route.

**Décisions en attente de l'humain :** l'unité du budget, et le commit du lot 0 — rien
n'est commité, la branche `chore/bootstrap-toolchain` porte tout en fichiers non suivis.
