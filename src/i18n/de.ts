import type { Rank, Suit } from '../game/cards'

export const RANK_LABEL: Record<Rank, string> = {
  '6': '6',
  '7': '7',
  '8': '8',
  banner: '10',
  under: 'U',
  ober: 'O',
  koenig: 'K',
  '9': '9',
  ass: 'A',
}

export const RANK_FULL: Record<Rank, string> = {
  '6': 'Sechs',
  '7': 'Sieben',
  '8': 'Acht',
  banner: 'Banner (10)',
  under: 'Under',
  ober: 'Ober',
  koenig: 'König',
  '9': 'Nell (9)',
  ass: 'Ass',
}

export const SUIT_LABEL: Record<Suit, string> = {
  schellen: 'Schellen',
  schilten: 'Schilten',
  rosen: 'Rosen',
  eichel: 'Eichel',
}

export const DIFFICULTY_LABEL = {
  leicht: 'Leicht',
  mittel: 'Mittel',
  schwer: 'Schwer',
} as const

export const DIFFICULTY_HINT = {
  leicht: 'Spielt solide, aber mit Patzern.',
  mittel: 'Rechnet Wahrscheinlichkeiten, spielt sauber.',
  schwer: 'Monte-Carlo & Gegner-Lesen – ernsthafte Gegner.',
} as const

export const T = {
  title: 'Fuck Your',
  titleAccent: 'Neighbour',
  subtitle: 'Schweizer Jass · ohne Trumpf · nur Rang zählt',
  players: 'Spieler',
  difficulty: 'Schwierigkeit',
  start: 'Spiel starten',
  rules: 'Regeln',
  round: 'Runde',
  cards: 'Karten',
  yourBid: 'Deine Ansage',
  howManyTricks: 'Wie viele Stiche machst du?',
  waiting: 'wartet …',
  thinking: 'überlegt …',
  bidding: 'Ansage',
  yourTurn: 'Du bist dran',
  playACard: 'Spiel eine Karte',
  discardACard: 'Wirf eine Karte ab (Stechen)',
  stechen: 'Stechen!',
  erben: 'Erben – die darunterliegende Karte gewinnt',
  trick: 'Stich',
  tricks: 'Stiche',
  bid: 'Ansage',
  made: 'Gemacht',
  points: 'Punkte',
  total: 'Total',
  roundResult: 'Rundenergebnis',
  continue: 'Weiter',
  gameOver: 'Spiel beendet',
  winner: 'Sieger',
  newGame: 'Neues Spiel',
  backToMenu: 'Zum Menü',
  yourForeheadCard: 'Deine Karte (verdeckt)',
  playForeheadCard: 'Verdeckte Karte ausspielen',
  oneCardExplain: 'Du siehst alle Karten – nur deine eigene nicht.',
  sound: 'Sound',
  scoreboard: 'Punktetafel',
  you: 'Du',
  // Stiche-Rückblick (nach der Runde)
  reviewTricks: 'Stiche ansehen',
  trickReview: 'Stiche der Runde',
  trickNo: 'Stich',
  wonBy: 'gewinnt',
  close: 'Schliessen',
  // Einstellungen
  settings: 'Einstellungen',
  settingsHint: 'Regeln anpassen – wird für spätere Partien gespeichert.',
  ruleDoubleZero: 'Regel „nicht zweimal 0“',
  ruleDoubleZeroHint: 'Niemand darf zweimal in Folge 0 ansagen (gilt nie bei 1 Karte).',
  scoreHit: 'Punkte bei Treffer',
  scoreHitHint: 'Exakt getroffene Ansage.',
  scoreMiss: 'Strafe pro Stich daneben',
  scoreMissHint: 'Abzug je Stich Abweichung.',
  ruleSuitTiebreak: 'Erben: Farbentscheid',
  ruleSuitTiebreakHint:
    'Bleibt der letzte Stich gleich, gewinnt die höhere Farbe (Rosen < Eichel < Schilten < Schellen) statt des nächsten Spielers.',
  resetDefaults: 'Standard',
  save: 'Speichern',
  on: 'An',
  off: 'Aus',
} as const
