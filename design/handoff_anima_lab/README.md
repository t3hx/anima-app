# Handoff : Anima Lab — refonte UI complète

## Overview

Anima Lab est un site pédagogique qui enseigne l'animation web **en la faisant manipuler** : chaque leçon est une démo vivante dont l'utilisateur règle les paramètres (méthode, valeurs, courbe d'easing…), avec le code correspondant qui se met à jour en temps réel et se copie tel quel. Public : débutants (viennent chercher le « pourquoi ») et intermédiaires (viennent chercher un réglage précis et son code). Ton : atelier technique, phrases courtes en français, aucune emphase marketing, aucune gamification.

Ce handoff couvre le design system (tokens) et 6 écrans/vues de référence validés par le client.

## About the Design Files

Les fichiers HTML de ce dossier sont des **références de design** (maquettes statiques haute fidélité créées en HTML), pas du code de production. La tâche est de **recréer ces designs dans l'environnement du projet cible** (React, Vue, Svelte, vanilla…) avec ses patterns et bibliothèques existants — ou, si le projet part de zéro, de choisir le framework le plus adapté. Ne pas copier le HTML directement.

- `Anima Lab — Écrans.dc.html` — **le document de référence** : tokens + 7 livrables (sections repérées 2a → 2g).
- `Anima Lab — Options.dc.html` — historique : les 3 pistes explorées. La direction retenue est **1a « Braise »** ; les autres pistes sont conservées pour contexte uniquement.

Les maquettes s'ouvrent dans un navigateur. Chaque section porte un badge (`2a`, `2b`…) référencé ci-dessous.

## Fidelity

**Haute fidélité** pour les couleurs, la typographie, les espacements, les rayons et la structure des composants : recréer à l'identique.
**Indicatif** pour : le rendu 3D de la scène (le cube isométrique des maquettes est un placeholder CSS — l'implémentation réelle est une scène WebGL, three.js recommandé, avec une variante DOM/CSS), les valeurs de démonstration (fps, temps) et les textes de leçon.

## Design Tokens

### Couleurs (7 + 2 accents de famille)

| Token | Valeur | Usage |
|---|---|---|
| `braise-950` | `#14100D` | fond des blocs code, barres overlay |
| `braise-900` | `#1C1815` | fond application |
| `braise-800` | `#26211C` | cartes, rail de contrôles, panneaux |
| `ligne` | `rgba(242,233,220,.08)` | bordures, séparateurs, graduations (variantes .10/.12/.14 pour bordures interactives) |
| `encre` | `#F2E9DC` | texte principal |
| `encre-sourde` | `#A2907C` | gloses, labels de bloc, valeurs secondaires |
| `ambre` | `#F09D5A` | accent — famille **Socle natif** (texte accent clair : `#F0B678`, encre sur accent : `#221507`) |
| `coral` | `#EE6C4D` | accent — famille **GSAP** (clair : `#F0876B`, encre sur accent : `#2A120A`) |
| `rose` | `#D96A8F` | accent — famille **Shaders** (clair : `#E694AE`) |

Les trois accents partagent chroma et luminosité (oklch ≈ 0.76 / 0.13), seule la teinte varie. L'accent de la famille active colore TOUT l'écran : sélections, curseurs, toggles, surlignage de code, logo losange.

Fonds sélectionnés : `rgba(<accent>, .10–.12)` + bordure `<accent>` (plein ou .35–.55 selon l'importance).
Scène : `radial-gradient(120% 90% at 50% 28%, #251D16 0%, #161210 72%)`. Grille au sol : lignes 1 px `rgba(<accent>, .16)` / `.12`, en perspective (`rotateX ≈ 58°`), fondue vers l'horizon.

### Typographie

Deux familles. **Règle absolue : la monospace marque uniquement ce qui est du code réel** (`position.x`, `from`, `gsap.from(...)`, valeurs copiables) ; tout ce qui est explicatif est en sans.

| Style | Police | Taille/graisse |
|---|---|---|
| Titre d'écran | Instrument Sans | 22 / 600 |
| Libellé de contrôle | Instrument Sans | 13 / 600 |
| Corps (Concept) | Instrument Sans | 12.5 / 400, line-height 1.55–1.6 |
| Glose française | Instrument Sans | 11 / 400, encre-sourde |
| LABEL DE BLOC | IBM Plex Mono | 10 / 600, letter-spacing +14%, MAJUSCULES, encre-sourde |
| Valeur | IBM Plex Mono | 13 / 600 |
| Code | IBM Plex Mono | 11 / 400, line-height 1.7 |
| Mesures / graduations | IBM Plex Mono | 9–10 / 500 |

### Espacement, rayons, mouvement

- Échelle d'espacement : `4, 6, 8, 12, 16, 24` px.
- Rayons : `6` (champ), `10` (carte de contrôle), `14` (bloc/scène), `12` (tiroir code), `99px` (pilules).
- Mouvement d'interface : hover/press `120ms cubic-bezier(.2,.7,.2,1)` · sélection/onglets `200ms` idem · panneaux/tiroirs `320ms cubic-bezier(.3,.8,.3,1)`.
- **Règle : la scène est la seule chose qui a le droit de bouger fort.** Aucune animation d'interface pendant qu'une démo joue, hors feedback direct du contrôle manipulé.

### Direction « banc d'essai »

Le site ressemble à un instrument de mesure : graduations fines sur les bords de scène (`repeating-linear-gradient`, 1 px encre 14%, pas ~22 px, avec repères chiffrés 0/5/10), mesures affichées en permanence (x, t, fps) dans un encart mono en bas de scène, graduations sur les pistes de curseur/transport/jauge, mini-grille dans les vignettes de courbe. Matière par famille : natif = tracé fin et net · GSAP = trajectoire et rémanence (fantômes) · shaders = grain léger sur les fonds de scène.

## Screens / Views

### 2b — Écran de référence (leçon type A : scène WebGL + transport temporel)

Layout desktop (1180 de référence, fluide en vrai) :
- **Chrome** : rangée 1 (50 px) : logo losange 16 px accent + « Anima Lab » à gauche ; 3 familles centrées ; interrupteur `motion réduit` + compteur `2 / 25` à droite. Rangée 2 (40 px) : pilules de leçons de la famille active. Bordure basse `ligne`.
- **Corps** : grid `1fr 344px`, gap 14, padding 14. Gauche : scène (radius 14, bordure ligne) + barre de transport (52 px, `braise-800`, radius 12). Droite : rail de blocs empilés, le bloc code collé en bas (`margin-top:auto`).

Scène :
- En-tête interne : fil d'Ariane mono (`NATIF.02 · ANATOMIE D'UN TWEEN`) + pilule propriété (`position.x`, fond accent 14%).
- En haut à droite : **bascule moteur** `WebGL | CSS` (pilule sombre, segment actif fond accent 18%) + **bouton Concept** (pilule sombre, `?` dans un rond accent, point ambre 9 px en haut-droite tant que le Concept n'a pas été ouvert sur cette leçon).
- Graduations gauche + bas, repères chiffrés, encart mesures `x 3.42 · t 0.76 s · 60 fps` en bas à droite.
- **Calque de fantômes** : pendant la lecture, une copie silhouette du cube (hexagone plein, couleur accent) est déposée tous les 100 ms le long du trajet. Opacité de 24 % (la plus récente) à 7 % (la plus ancienne), 5 visibles max. En `power1.out` elles s'entassent à l'arrivée — c'est le but pédagogique. Toggle « Fantômes » dans le bloc VALEURS.

Transport (variante 1/3) : ⏮ lecture/pause (bouton plein accent) ⟳ boucle · piste scrub graduée 10 % avec progression en dégradé `#B9622F → accent` et poignée ronde 14 px `#F6E3CD` · `0.76 / 2.00 s` mono · menu vitesse `1× ▾` (0.25× à 4×, valeurs négatives incluses).

Rail de contrôles (blocs `braise-800`, padding 13×15, label mono en tête) :
- **MÉTHODE** : grille 2×2 de cartes (libellé mono 12.5/600 + glose 11 dessous). Sélection : bordure accent + fond accent 10%.
- **VALEURS** : par valeur continue, ligne libellé (+ glose inline) / champ numérique éditable (mono, fond `braise-900`, bordure accent quand en cours de réglage) + curseur dessous (piste 5 px graduée, remplissage accent, poignée 13–14 px ; halo `rgba(accent,.25)` pendant le drag). Bascules : interrupteur 32×18.
- **COURBE** : grille 3 colonnes de vignettes (tracé SVG 2 px, mini-grille de fond 11×9 px encre 5%, nom mono 9.5 dessous). Sélection : bordure + tracé accent, point `#F6E3CD` sur la courbe à la position temporelle courante.
- **CODE** (voir Interactions).

### 2c — Écran de comparaison

Scène divisée en 2 moitiés égales (grid `1fr 1fr`), séparées par un **filet vertical pointillé** `1px dashed` encre 18%. Chaque moitié : sa propre grille au sol + son cube ; **étiquette** mono 11/600 centrée en haut (pilule sombre bordée) — texte court en mono car c'est du code (`left`, `translateX`) ; **barre d'indicateurs** en bas (fond `rgba(20,16,13,.8)`, radius 9) : fps à gauche (mono 11/600 accent clair), pastilles `layout · paint · composite` à droite — allumée = rond plein accent + texte accent clair, éteinte = rond contour + texte `#7D6E5C`. Pas de dramatisation du côté lent : les 34 fps s'affichent au même style que les 60.

Un seul jeu de contrôles pilote les deux moitiés (le label du bloc le dit : « VALEURS · pilotent les deux moitiés »). Bloc « LECTURE » : 2–3 phrases sans qui expliquent ce que montrent les indicateurs. Transport temporel standard, vitesse 0.5× par défaut sur cette leçon.

### 2d — Écran scroll (famille GSAP, accent coral)

Scène : cube épinglé aux 62 % gauches (rotation liée au scroll, légende mono discrète dessous) ; **zone défilante** aux 38 % droits (fond assombri `rgba(20,15,12,.55)`, bordure gauche ligne) : cartes placeholder empilées, la section active bordée accent, mini-scrollbar propre à la zone à droite. Le scroll de cette zone est **indépendant du scroll de page**.

À la place du transport, même emplacement et même hauteur (52 px) : **jauge de scroll** — label mono `SCROLL`, piste graduée 10 %, plage `start→end` remplie `rgba(accent,.28)`, **deux poignées losange** (11 px, rotation 45°, accent, draggables) avec labels mono `start 20%` / `end 80%` sous les poignées, trait vertical 2 px `#F4EBE2` = position courante, `45 %` à droite.

Contrôles : DÉCLENCHEMENT (toggles `scrub`, `pin` avec gloses ; champs `start` / `end` en mono) · ANIMATION LIÉE (pastilles Rotation/Position/Échelle + curseur Amplitude). Encart mesures : `progress 0.42 · 60 fps`.

### 2e — Panneau Concept (ouvert)

- Largeur fixe **400 px**, ancré sous le bouton Concept (en haut à droite de la scène), radius 16, fond `braise-800`, bordure encre 14%, ombre `0 18px 50px rgba(0,0,0,.55)`.
- La scène derrière est assombrie (voile `rgba(12,9,7,.45)`) mais **la démo continue de jouer** et le transport reste actif.
- Contenu : label mono `CONCEPT` accent + bouton × (24 px, radius 8) · titre sans 16/600 · 150–300 mots en corps 12.5/1.6 · **encart contextuel** (fond accent 10%, bordure accent 30%, radius 10) qui reformule le réglage courant de l'utilisateur · pied : « Échap pour fermer » (11, sourde) à gauche, « Marquer comme lu » (11.5/600, accent clair) à droite.
- Fermeture : ×, clic hors panneau, Échap.
- États du bouton : **non lu** (pilule sombre + point ambre) → **ouvert** (fond accent 16%, bordure accent) → **lu** (pilule sombre atténuée, `?` accent 40%, plus de point). Le point disparaît dès la première ouverture sur la leçon (persister par leçon, ex. localStorage).
- Mobile : feuille plein écran (pas de panneau flottant).

### 2f — Navigation 2 niveaux

- **Rangée 1** : familles avec point de teinte 7 px + soulignement 2 px accent sur l'active ; familles inactives en encre-sourde, leur point à 45 % d'opacité. Le logo losange prend la teinte de la famille active.
- Interrupteur **`prefers-reduced-motion`** global (32×17 + label mono `motion réduit`) : actif = piste accent, label accent clair. C'est un objet d'enseignement, visible en permanence. Effet : les démos passent en **scrub seul** (pas de lecture automatique), elles ne disparaissent pas. Doit aussi refléter/simuler la préférence système.
- Compteur sobre `n / 25` en mono. Pas de barre de progression, pas de célébration.
- **Rangée 2** : pilules `numéro mono + nom sans` ; l'active : fond accent 12% + bordure accent 35%. Scroll horizontal si débordement.
- Contenu : Socle natif 10 leçons (Pipeline, Anatomie d'un tween, Easing, Transition vs keyframes, Transform, WAAPI, Non-interpolables, Scroll, FLIP, Accessibilité) · GSAP 10 (Tween, Timeline, Stagger, Eases, Contrôle temporel, ScrollTrigger, Hors DOM, SplitText, SVG, Flip) · Shaders 5 (Modèle d'exécution, Temps & progression, mix·step·smoothstep, Bruit, Déplacement de géométrie).

### 2g — Mobile (écran de référence)

Empilement : header condensé (logo + **2 pilules-menus** : famille avec point de teinte, leçon avec numéro ; compteur à droite) → scène ~300 px (fantômes, graduations bas, mesures, moteur + Concept compactés) → transport compact (lecture, scrub gradué, temps, vitesse) → **bottom sheet** (fond `braise-800`, radius 22 en haut, poignée 38×4) avec onglets segmentés `Méthode / Valeurs / Courbe` (segment actif plein accent) → barre code repliée en bas de la sheet.

Règles mobiles : comparaison **superposée** (moitié A dessus, B dessous, bascule A/B au-dessus des indicateurs — jamais côte à côte) · leçon scroll : la démo passe en plein écran (bouton « ouvrir la démo »), la page ne défile pas dessous · code déplié : recouvre la sheet en glissant du bas, **jamais la scène**. Cibles tactiles ≥ 44 px.

## Interactions & Behavior

### Tiroir de code (présent sur tous les écrans)

- Replié par défaut : une ligne (`‹/›` accent + code tronqué + chevron), fond `braise-950`.
- Déplié : en-tête (`‹/›`, onglets `CSS | JS` quand la démo existe dans les deux langages, bouton `Copier` fond accent 14%) + bloc code 11/1.7.
- **La ligne correspondant au contrôle en cours de manipulation est surlignée** (fond `rgba(accent,.13)`, valeur en gras accent clair) pendant le réglage, et reste lisible pendant que la démo joue.
- `Copier` copie le code **avec les valeurs exactement réglées**.
- Le code se régénère à chaque changement de contrôle (méthode, valeurs, courbe).

### Scène

- 4 types : **A** scène WebGL (cube 3D) · **B** cube CSS (6 faces DOM, visuellement identique — permet la bascule moteur) · **C** grille DOM (12–200 tuiles isométriques plates : coût de rendu, FLIP, stagger) · **D** colonne scrollable (cube fixé + contenu qui défile).
- 3 pilotages : transport temporel · jauge de scroll · aucune barre (leçons à états discrets — la scène récupère l'espace, il n'est pas laissé vide).
- Bascule moteur `WebGL / CSS` : l'image ne change pas, la technologie dessous change. Uniquement sur les leçons qui ont les deux implémentations.
- FLIP : mode « décomposer » qui rejoue les 3 phases au ralenti en superposant les rectangles mesurés (position initiale / finale) sur la grille — tracés fins accent, pas de remplissage.

### Micro-interactions

Hover cartes/pilules : bordure encre 10% → 22%, 120 ms. Press : fond +4 % luminosité. Drag curseur : halo accent 25% autour de la poignée + champ numérique bordé accent + ligne de code surlignée, tout se relâche ensemble au drop. Ouverture panneau/tiroir : 320 ms, translation + fondu léger. Aucun autre mouvement d'interface.

## State Management

- **Global** : famille active, leçon active, progression (leçons visitées → compteur `n/25`), interrupteur motion réduit, Concepts lus (par leçon). Persister localement.
- **Par leçon** : valeurs des contrôles (méthode, propriété, valeurs numériques, courbe, toggles), état lecture (temps courant, vitesse, boucle), moteur WebGL/CSS, tiroir code ouvert/fermé + onglet CSS/JS, panneau Concept ouvert.
- Dérivés : extrait de code généré depuis l'état des contrôles ; encart contextuel du Concept reformulé depuis la méthode choisie ; mesures (x, t, fps, progress) lues depuis la boucle d'animation.

## États à ne pas oublier

- **Chargement WebGL** (première visite) : réserver la scène à sa taille, indicateur discret.
- **WebGL indisponible** : basculer sur la version CSS quand elle existe ; sinon message court expliquant.
- **Motion réduit actif** : scrub uniquement, pas de lecture automatique ; les démos restent manipulables.
- **Leçon terminée** : invitation sobre à la suivante (pas de célébration) — ex. la pilule de la leçon suivante s'anime discrètement une fois, ou lien texte en pied de rail.
- **Code déplié pendant lecture** : surlignage stable et lisible.

## À éviter (contraintes client)

Dégradés violet/bleu et esthétique « SaaS 2021 » · micro-animations décoratives · libellés vagues (chaque contrôle porte le nom exact de la propriété + glose française) · gamification (badges, félicitations) · cacher le code — il est la moitié du produit.

## Assets

Aucun asset binaire. Polices : **Instrument Sans** (400–700) et **IBM Plex Mono** (400–600) via Google Fonts. Logo = losange CSS (carré tourné/clip-path) dans la teinte de famille. Le cube isométrique des maquettes est un placeholder CSS (3 clip-paths : `#F8C98F` dessus, `#E0854A` gauche, `#A9542B` droite) — la version production est rendue par la scène (WebGL ou CSS 3D). Courbes d'easing : SVG tracés 2 px générés depuis les fonctions d'easing réelles.

## Files

- `Anima Lab — Écrans.dc.html` — référence : tokens (2a), écran de référence (2b), comparaison (2c), scroll (2d), Concept (2e), navigation (2f), mobile (2g).
- `Anima Lab — Options.dc.html` — exploration initiale ; direction retenue : 1a « Braise ».
