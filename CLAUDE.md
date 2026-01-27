# Chilly Bird - Projet Overview

Clone de Flappy Bird avec style cyberpunk/néon, disponible en mode 2D et 3D.

## Architecture

```
chilly-bird/
├── index.html          # Point d'entrée, structure HTML
├── css/styles.css      # Styles (thème néon/cyberpunk)
└── js/
    ├── config.js       # Configuration du jeu (vitesses, gaps, ratios, powerups)
    ├── game.js         # Boucle de jeu 2D, gameState, logique principale
    ├── game3d.js       # Version 3D complète avec Three.js
    ├── physics.js      # Physique oiseau, création tuyaux, collisions, vitesse
    ├── graphics.js     # Rendu 2D (fond, tuyaux, oiseau, particules)
    ├── powerups.js     # Création et gestion des power-ups
    ├── audio.js        # Sons et musique
    ├── menu.js         # Navigation entre écrans
    ├── firebase.js     # Gestion des scores en ligne
    ├── firebase-config.js  # Config Firebase (gitignored)
    └── main.js         # Initialisation, event listeners
```

## Concepts clés

### Modes de jeu
- **2D**: Canvas HTML5, rendu dans `graphics.js`
- **3D**: Three.js, tout dans `game3d.js` (scène, caméra, meshes)

### Power-ups (config.js)
- `LIFE`: +1 vie
- `SLOW`: Vitesse x0.5 pendant 5s
- `FAST`: Vitesse x1.5 pendant 3s
- `WIDE`: Gap élargi pendant 5s

### Variables d'état importantes
- `gameState` (game.js): État du jeu 2D
- `game3DState` (game3d.js): État du jeu 3D
- `GAME_CONFIG` (config.js): Configuration dynamique selon résolution

### Spawn des tuyaux
Le spawn est basé sur la **distance parcourue** (pas le temps) pour garantir un espacement constant quelle que soit la vitesse:
```javascript
pipeSpawnAccumulator += pipeSpeed * deltaMultiplier;
```

### Delta Time
Le jeu utilise un système de delta time pour être indépendant du FPS:
- `deltaMultiplier = 1.0` à 60 FPS
- Toutes les vitesses sont multipliées par `deltaMultiplier`

## Conventions

- Résolution de référence: 1920x1080
- Les ratios dans `GAMEPLAY_RATIOS` garantissent une difficulté identique sur tous les écrans
- Firebase config dans fichier séparé (non commité)

## Workflow obligatoire

Après toute modification du code :

1. **Incrémenter la version** dans `version.json` :
   - `build` : +1 à chaque modification
   - `version` : selon sémantique (patch/minor/major)
   - `date` : date du jour (YYYY-MM-DD)

2. **Ouvrir le jeu pour test** :
   ```bash
   start index.html
   ```

## Commandes utiles

Pas de build nécessaire - ouvrir `index.html` dans un navigateur ou serveur local.
