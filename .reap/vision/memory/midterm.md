# Midterm Memory

## Piste : valider le contrat de données (lots 1 → 2)

La question ouverte du projet, celle dont dépend tout le reste : le contrat `Lesson` /
`Param` / `CodeTemplate` absorbe-t-il des technologies d'animation incompatibles sans que
le shell change ?

- **Lot 1** (`T3H-111`) écrit le contrat et une seule leçon complète, `native-tween`.
- **Lot 2** (`T3H-112`) est le juge : deux leçons de plus (`easing`, `waapi`) écrites en
  n'ajoutant **que** des descripteurs et des fonctions d'animation. Si l'une des deux
  oblige à toucher le shell, le contrat est mauvais et se corrige là — pas à la leçon 15,
  quand douze leçons en dépendront.

Prochaine étape : démarrer le lot 1 par `core/types.ts`.

## Piste : décision sur le prérendu statique (échéance lot 7)

Direction privilégiée par l'humain : adopter un prérendu au build (`vite-react-ssg` ou
équivalent) **si ça ne gêne rien d'autre**. Critère de gêne arrêté : le prérendu exécute le
rendu dans Node, donc tout accès à `window`, `document`, WebGL ou `localStorage` doit être
gardé. Si l'absorber tord le shell, le canvas persistant ou le store, on renonce et on
reste en SPA pur.

Prochaine étape : rien avant le lot 7. À réévaluer quand le shell et le canvas persistant
existent — pas avant, la question n'a pas de réponse sur du vide.
