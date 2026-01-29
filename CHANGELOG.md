# Changelog - Chilly Bird

## [2.6.6] - 2026-01-29
### Changed
- **Amélioration majeure de l'équilibre du gameplay 3D**
  - Augmentation de vitesse réduite (0.01 → 0.005 par point) pour garder le jeu jouable
  - Espacement horizontal dynamique : augmente avec la vitesse pour maintenir le temps de réaction
  - Limitation de l'écart vertical entre portes consécutives (66% de la hauteur max)
    - Garantit que toutes les portes sont atteignables
    - Système identique au mode 2D pour une cohérence

## [2.6.5] - 2026-01-29
### Fixed
- Saut de l'oiseau en mode 3D maintenant constant (ne dépend plus du score)
  - Le saut augmentait progressivement avec le score, rendant le jeu trop facile
  - Aligné avec le comportement 2D où le saut reste constant
- Augmentation de vitesse en 3D plus visible (0.002 → 0.01 par point)
  - La vitesse augmentait trop lentement, rendant la progression imperceptible

## [2.6.4] - 2026-01-28
### Fixed
- Indicateurs de score maintenant parfaitement synchronisés avec les tuyaux
  - Ligne verticale dorée épaisse (5px) avec pointillés
  - Badge très grand (160x70) avec texte lisible
  - Rang en 32px, nom en 24px
  - Défilent et disparaissent avec les tuyaux (liés directement)

## [2.6.2] - 2026-01-27
### Changed
- Message de record battu réduit à 1.5 secondes (au lieu de 3)
- Indicateurs de score : lignes verticales dorées qui défilent avec le décor
  - Nom du joueur affiché en bas dans un badge
  - Disparaissent correctement quand ils sortent de l'écran
- Effet de feu amélioré avec vraie traînée de feu derrière l'oiseau
  - Traînée qui suit la trajectoire de l'oiseau
  - Plus d'étincelles et particules

## [2.6.1] - 2026-01-27
### Fixed
- Indicateurs de score sur les tuyaux : meilleure lisibilité (plus grand, bordure dorée épaisse, étoile)
- Indicateurs maintenant bien liés aux tuyaux (disparaissent avec eux)

### Changed
- God Mode amélioré :
  - +1 score à chaque collision (au lieu de juste ne pas mourir)
  - Vitesse x2 pour plus de challenge
  - Pas de reset de position lors des collisions

## [2.6.0] - 2026-01-27
### Added
- Effet de feu spectaculaire sur l'oiseau quand on dépasse le meilleur score (2D et 3D)
  - Flammes animées multicouches derrière l'oiseau
  - Étincelles et particules de feu
  - Changement de couleur de l'oiseau (orange/rouge)
- Message "RECORD DE XXX BATTU!" affiché pendant 3 secondes
- Indicateurs dorés sur les tuyaux avec le rang et nom du joueur (top 10 uniquement)
- Fichier CHANGELOG.md pour suivre les modifications

## [2.5.0] - 2026-01-27
### Added
- Première version de l'effet de feu (changement de couleur basique)

## [2.4.1] - 2026-01-27
### Fixed
- Bouton "ENREGISTRER" maintenant visible même si le score n'est pas un record (si score > 0)

## [2.4.0] - 2026-01-27
### Added
- Cheat code God Mode : appuyer sur H 3 fois dans le menu pour activer les vies infinies
- Feedback visuel du God Mode (titre rouge)

## [2.3.2] - 2026-01-27
### Fixed
- Distance horizontale entre les tuyaux maintenant constante quelle que soit la vitesse
- Correction du problème de tuyaux trop proches après la fin du powerup FAST
- Le spawn des tuyaux est maintenant basé sur la distance parcourue, pas le temps

## [2.3.1] - 2026-01-22
### Changed
- Améliorations diverses

## [2.3.0] et versions antérieures
### Features
- Mode 2D avec canvas HTML5
- Mode 3D avec Three.js
- Système de power-ups (LIFE, SLOW, FAST, WIDE)
- Scores en ligne avec Firebase
- Tuyaux mobiles après score 5
- Thèmes de couleurs changeants tous les 10 points
- Effets visuels : étoiles, nébuleuses, galaxies, particules
- Sons et musique
- Système de vies
