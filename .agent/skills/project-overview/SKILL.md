---
name: Chilly Bird - Vue d'ensemble du projet
description: Comprendre la structure globale, l'architecture et les technologies du projet Chilly Bird
---

# Skill: Vue d'ensemble du projet Chilly Bird

## Objectif
Ce skill vous permet de comprendre rapidement la structure globale du projet Chilly Bird, un clone de Flappy Bird avec esthétique cyberpunk/néon.

## Informations Clés

### Identité du Projet
- **Nom**: Chilly Bird
- **Type**: Clone de Flappy Bird avec modes 2D et 3D
- **Version actuelle**: 2.6.4 (Build 33)
- **Technologies**: HTML5, CSS3, JavaScript ES6+, Canvas API, Three.js, Firebase

### Architecture Globale

Le projet est organisé en modules JavaScript distincts:

```
chilly-bird/
├── index.html              # Point d'entrée
├── version.json            # Versioning
├── CHANGELOG.md            # Historique
├── css/styles.css          # Styles cyberpunk
└── js/
    ├── config.js           # Configuration centrale
    ├── main.js             # Initialisation
    ├── game.js             # Logique 2D
    ├── game3d.js           # Logique 3D (1730 lignes)
    ├── physics.js          # Physique et collisions
    ├── graphics.js         # Rendu 2D (1006 lignes)
    ├── powerups.js         # Power-ups
    ├── audio.js            # Sons (Web Audio API)
    ├── menu.js             # Navigation
    └── firebase.js         # Scores en ligne
```

### Modes de Jeu

**Mode 2D**:
- Rendu Canvas HTML5
- Fond spatial (étoiles, nébuleuses, galaxies)
- Thèmes de couleurs changeants tous les 10 points

**Mode 3D**:
- Rendu Three.js
- Décor de grotte avec parois ondulées
- Oiseau 3D détaillé avec ailes et queue
- Tuyaux style portails néon

### Résolutions Adaptatives

Le jeu s'adapte automatiquement au device:
- **Desktop**: 1920×1080
- **Mobile paysage**: 1280×720
- **Mobile portrait**: 608×1080

Les ratios de gameplay (`GAMEPLAY_RATIOS`) garantissent une difficulté identique partout.

### Concepts Techniques Importants

1. **Delta Time System**: Indépendant du FPS (cible 60 FPS)
2. **Spawn basé sur distance**: Les tuyaux apparaissent selon la distance parcourue, pas le temps
3. **Configuration dynamique**: S'adapte à la résolution via `GAME_CONFIG`
4. **Scores Firebase**: Classement mondial en temps réel avec fallback localStorage

### Fonctionnalités Principales

- **Power-ups**: LIFE (+1 vie), SLOW (vitesse ×0.5), FAST (vitesse ×1.5), WIDE (gap élargi)
- **Tuyaux mobiles**: À partir du score 5, probabilité croissante
- **Système de vies**: 2 vies au départ, reset position après perte
- **Effet de feu**: Quand le joueur bat le record mondial
- **Indicateurs de score**: Marqueurs dorés sur les tuyaux du top 10
- **God Mode**: Cheat code (3× H dans le menu)

### Ordre de Chargement des Scripts

⚠️ **IMPORTANT**: L'ordre est critique!

```html
<script src="js/firebase-config.js"></script>  <!-- EN PREMIER -->
<script src="js/config.js"></script>
<script src="js/firebase.js"></script>
<script src="js/audio.js"></script>
<script src="js/graphics.js"></script>
<script src="js/powerups.js"></script>
<script src="js/physics.js"></script>
<script src="js/game.js"></script>
<script src="js/game3d.js"></script>
<script src="js/menu.js"></script>
<script src="js/main.js"></script>
```

## Quand utiliser ce skill

- Découvrir le projet pour la première fois
- Comprendre l'architecture globale
- Identifier quel fichier modifier pour une fonctionnalité
- Expliquer le projet à quelqu'un

## Fichiers de référence

- `CLAUDE.md`: Documentation du projet
- `CHANGELOG.md`: Historique des modifications
- `version.json`: Version actuelle
- Analyse complète: `analyse_globale.md` (dans artifacts)
