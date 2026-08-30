# Vision Goals

## Ultimate Goal

**Anima Lab en ligne, bilingue français/anglais, avec ses 25 leçons complètes.**

Complète au sens strict de la spec §11 : pour chacune des 25 leçons, les huit points sont
vrais — paramètres réellement effectifs, code affiché exact, surbrillance fonctionnelle,
concept rédigé et relu (150 à 300 mots), réglage pendant la lecture sans casse, mouvement
réduit utilisable, aucune ressource fuitée à la sortie, aucune chaîne traduisible en dur.

L'état final, c'est un développeur front-end qui ouvre `/en/gsap/scroll-trigger`, déplace
un curseur, voit le cube répondre et le code se mettre à jour sous ses yeux — puis partage
l'URL de son réglage à un collègue, qui retrouve exactement la même scène.

Ce qui reste hors périmètre : compte utilisateur, contributions externes, extension du
catalogue au-delà des 25 leçons. `core/storage.ts` garde la porte ouverte sans que rien
ne soit construit pour.

## Goal Items

Les jalons suivent le plan de livraison de la spec §10. Chaque lot est une génération
REAP, ou une suite de générations.

- [ ] **Lot 0 — amorçage** (`T3H-110`). Branche `dev`, remote `origin` et suivi Linear
      **faits**. Reste à échafauder Vite + React 19 + TypeScript strict, Biome, Vitest et
      Playwright.
- [ ] **Lot 1 — tranche verticale.** Contrats TypeScript, store de paramètres, shell,
      canvas persistant, scène `webgl`, transport `timeline` et son premier driver,
      contrôles `slider` et `choice`, panneau de code avec surbrillance, ossature i18n,
      et **une seule leçon complète** : `native-tween`, concept rédigé compris.
      *Critère de fin* : on règle la durée, le cube bouge, le code affiche la bonne
      valeur, on peut scrubber, et le profileur React ne montre aucun rendu parasite
      pendant le réglage. Puis rédaction du `CLAUDE.md` complet.
- [ ] **Lot 2 — validation du contrat.** Deux leçons de plus (`easing`, `waapi`) en
      n'écrivant **que** des descripteurs et des fonctions d'animation.
      *Critère de fin* : aucune des deux n'a exigé de modifier le shell. Si l'une l'a
      exigé, corriger le contrat maintenant — pas à la leçon 15.
- [ ] **Lot 3 — les configurations dures.** Scène divisée + métriques, scène `dom-grid`,
      transport `none`, bascule de moteur. Couvre coût de rendu, transform,
      transition/keyframes, FLIP.
- [ ] **Lot 4 — scroll.** Scène `scroll-column`, transport `scroll`, poignées de plage.
      Deux leçons : natif puis ScrollTrigger.
- [ ] **Lot 5 — reste du socle et famille GSAP.** Essentiellement du contenu, peu de code
      de plateforme. C'est ici que le contrat prouve sa valeur ou révèle sa dette.
- [ ] **Lot 6 — shaders.** Uniforms exposés comme paramètres standards, onglet `GLSL` dans
      le panneau de code, gestion des erreurs de compilation.
- [ ] **Lot 7 — finition.** Sérialisation URL, persistance, mobile, accessibilité, audit
      de performance, image Docker et `nginx.conf`, **décision sur le prérendu statique**.
- [ ] **Lot 8 — anglais.** Remplissage de `en.ts` et des `concept.en.md`. Rien n'est codé
      pour ça avant, hormis l'ossature du lot 1.
- [ ] **Mise en ligne.** CI GitHub Actions → image sur ghcr.io → Dokploy → VPS.

## Points de vigilance en travers des générations

- **Le contrat se juge au lot 2, pas au lot 1.** Un contrat qui ne tient pas doit être
  corrigé là, tant que trois leçons seulement en dépendent.
- **La dette i18n est la seule non rattrapable.** Une chaîne traduisible écrite en dur au
  lot 3 coûtera dix fois plus cher au lot 8.
- **Les fuites de ressources sont le risque numéro un** sur un site de 25 scènes. Le
  scénario Playwright du point 7 est ce qui empêche la dérive silencieuse.
- **Le contenu fait partie de la leçon.** Une leçon dont le concept est un texte de
  remplissage n'est pas livrée, elle est en dette.
