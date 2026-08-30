# Invariants

> Contraintes absolues. Modification par l'humain uniquement.

## REAP core

- Do not skip lifecycle stages
- Do not forge nonce tokens
- Do not modify invariants.md without human approval

## Projet — Anima Lab

**Architecture**

- Une leçon est une donnée, pas un composant. Ne jamais écrire de JSX sur mesure pour
  poser les contrôles d'une leçon : ils sont rendus génériquement depuis `params`.
- Ne jamais généraliser avant le lot 2. Le contrat se valide sur des cas réels, pas par
  anticipation.
- Ne jamais stocker les valeurs des paramètres ailleurs que dans le store unique.
- Ne jamais piloter une animation par l'état React à chaque frame. React orchestre, il
  n'anime pas.
- Ne jamais écrire un moteur d'animation maison par-dessus GSAP ou la WAAPI.
- Ne jamais démonter puis remonter le canvas WebGL entre deux leçons. Un seul `<Canvas>`
  persistant, seul son contenu change.
- Ne jamais rendre les scènes shaders configurables « à la carte » : chaque leçon shader
  a son couple de programmes, écrits à la main.

**Dépendances**

- Ne jamais ajouter de bibliothèque d'animation au-delà de GSAP et des API natives
  (Motion, anime.js, react-spring, etc. sont interdites) : le sujet du site est de montrer
  ce que font les technologies enseignées.
- Ne jamais ajouter de librairie de composants UI. Le CSS est écrit à la main depuis les
  tokens du design.
- Ne jamais remettre en question React 19 + TypeScript + Vite, ni introduire Next.js.

**Contenu et i18n**

- Ne jamais écrire en dur une chaîne traduisible dans un composant ou un descripteur.
  Tout passe par le dictionnaire i18n.
- Ne jamais servir une route sans préfixe de locale.
- Ne jamais livrer une leçon dont le concept est un texte de remplissage.
- Ne jamais écrire de français dans le code : identifiants, chaînes techniques et logs en
  anglais. Seuls les commentaires peuvent être en français.

**Ressources et performance**

- Ne jamais quitter une leçon en laissant une timeline vivante, un `ScrollTrigger` actif
  ou une ressource WebGL non libérée.
- Ne jamais optimiser la démonstration du coût de rendu : sa chute de performance est le
  contenu.
- Ne jamais ajouter de transition d'interface décorative. Sur ce site, seule la scène a le
  droit de bouger fort.

**Processus**

- Ne jamais annoncer une tâche terminée sans avoir fait tourner les tests et montré leur
  sortie.
- Ne jamais écrire le code avant le test qui échoue.
- Ne jamais livrer une leçon sans son scénario Playwright couvrant les points 5 et 7 du
  « terminé » : réglage pendant la lecture, et libération complète des ressources à la
  sortie.
- Ne jamais `push`, `merge` ou `git commit` sans demande explicite de l'humain.
- Ne jamais commiter un `.env` ni un secret en dur. Tout passe par Doppler.
