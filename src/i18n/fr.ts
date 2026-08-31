// Dictionnaire français — la locale de référence. Ses clés définissent le contrat i18n :
// `I18nKey` en est dérivé, donc une clé absente d'ici ne compile nulle part ailleurs.
//
// Ce qui n'entre PAS dans ce fichier : les libellés techniques (`duration`, `translateX`,
// `position.x`). Ils ne se traduisent pas, restent en monospace, et vivent dans le
// descripteur de la leçon. Seules les gloses et les titres se traduisent (spec §7).

export const fr = {
  // Familles
  'family.native': 'Socle natif',
  'family.gsap': 'GSAP',
  'family.shaders': 'Shaders',

  // Chrome
  'chrome.reducedMotion': 'motion réduit',
  'chrome.reducedMotion.on': 'Mouvement réduit activé',
  'chrome.reducedMotion.off': 'Mouvement réduit désactivé',
  'chrome.families': 'Familles de leçons',
  'chrome.lessons': 'Leçons de la famille',

  // Écrans
  'home.tagline': "Vingt-cinq leçons manipulables sur l'animation web.",
  'lesson.missing': "Cette leçon n'existe pas.",
  'family.empty': 'Les leçons de cette famille ne sont pas encore écrites.',
  'chrome.home': "Retour à l'accueil",
  'lesson.missing.back': 'Revenir à la liste des leçons',

  // Blocs de contrôles
  'group.method': 'MÉTHODE',
  'group.values': 'VALEURS',
  'group.curve': 'COURBE',

  // Transport
  'transport.label': 'Transport — Espace pour lire ou mettre en pause, flèches pour scrubber',
  'transport.restart': 'Revenir au début',
  'transport.play': 'Lecture',
  'transport.pause': 'Pause',
  'transport.loop': 'Boucle',
  'transport.scrub': 'Progression',

  // Panneau de code
  'code.label': 'Code',
  'code.copy': 'Copier',
  'code.copied': 'Copié',
  'code.expand': 'Déplier le code',
  'code.collapse': 'Replier le code',

  // Panneau Concept
  'concept.label': 'CONCEPT',
  'concept.open': 'Concept',
  'concept.close': 'Fermer',
  'concept.unread': 'Concept pas encore lu',
  'concept.markRead': 'Marquer comme lu',
  'concept.escHint': 'Échap pour fermer',

  // Leçon native-tween
  'lesson.native-tween.title': "Anatomie d'un tween",
  'lesson.native-tween.scene': 'Un cube isométrique se déplace horizontalement sur une grille.',
  'param.method.gloss': 'ce que le code écrit du trajet',
  'method.to.gloss': 'va vers',
  'method.from.gloss': 'arrive de',
  'method.fromTo.gloss': 'de … à …',
  'method.set.gloss': 'saute, sans trajet',
  'param.from.gloss': 'x de départ',
  'param.to.gloss': "x d'arrivée",
  'param.duration.gloss': 'secondes',
  'param.ghosts.gloss': 'trace du trajet',
  'param.easing.gloss': 'forme du trajet',
} as const

export type FrenchDictionary = typeof fr
