# Shortterm Memory

## Handoff — après `gen-001-76ea93` (lot 0, chaîne d'outils)

La chaîne d'outils est posée et vérifiée. Sept commandes passent depuis un `npm ci`
propre : `dev`, `build`, `preview`, `typecheck`, `check`, `test`, `test:e2e`.
Aucun code produit n'existe.

**Commité** en `6f183dc` sur `chore/bootstrap-toolchain`, validé par l'humain. Non poussé :
le dépôt distant `t3hx/anima-app` est toujours vide. La branche n'est pas encore fusionnée
dans `dev`.

**Prochaine étape : lot 1**, EPIC `T3H-111` — la tranche verticale `native-tween`.
Commencer par `core/types.ts` (le contrat), avant tout composant. Neuf FEAT découpées,
`T3H-139` à `T3H-159`.

## Décisions tranchées en phase adapt

- **Budget : 200 ko gzip**, mesurés sur le chunk de la route initiale, hors chunks par
  famille et hors Three.js. Génome et spec §6 corrigés. React consomme 60,02 ko, il reste
  ~140 ko.
- **Mode embryo maintenu jusqu'à la fin du lot 2** : le contrat de données n'a pas encore
  été mis à l'épreuve, le génome doit rester corrigeable si le lot 2 le prend en défaut.

## En attente

- **Push.** Le lot 0 est commité (`6f183dc`) mais rien n'est poussé ; `t3hx/anima-app` est
  toujours vide. Aucun push sans demande explicite de l'humain.

## Backlog

| Élément | État |
|---|---|
| `clarify-the-200-kb-initial-js-budget-compressed-or-raw.md` | **done** — tranché en gzip, génome et spec corrigés |
| `update-environment-summary-with-the-real-toolchain.md` | **done** — appliqué en phase reflect |

Aucun backlog en attente pour le lot 1.
