---
name: Chilly Bird - Mécanique de jeu
description: Comprendre la physique, les collisions, les power-ups et les mécaniques de gameplay
---

# Skill: Mécanique de jeu Chilly Bird

## Objectif
Ce skill explique en détail comment fonctionne le gameplay de Chilly Bird, incluant la physique, les collisions, les power-ups et les systèmes de progression.

## Physique du Jeu

### Variables Clés (2D)

```javascript
// Dans gameState
bird: {
    x: 150,              // Position X fixe
    y: 0,                // Position Y variable
    width: 50,           // Taille (scalée selon résolution)
    height: 40,
    velocity: 0          // Vélocité verticale
}
```

### Constantes Physiques

```javascript
// Dans GAME_CONFIG (s'adapte à la résolution)
BIRD_GRAVITY: 0.4 * (FIXED_HEIGHT / 1080)
BIRD_JUMP_POWER: -8 * (FIXED_HEIGHT / 1080)
BASE_PIPE_SPEED: 3 * (FIXED_HEIGHT / 1080)
```

**Important**: La gravité et le saut sont proportionnels à la HAUTEUR de l'écran, garantissant la même sensation de jeu sur tous les devices.

### Boucle de Mise à Jour

```javascript
function updateBird(deltaMultiplier = 1) {
    gameState.bird.velocity += GAME_CONFIG.BIRD_GRAVITY * deltaMultiplier;
    gameState.bird.y += gameState.bird.velocity * deltaMultiplier;
}
```

Le `deltaMultiplier` garantit un comportement constant quel que soit le FPS.

## Système de Tuyaux

### Création des Tuyaux

Les tuyaux sont créés selon la **distance parcourue**, pas le temps:

```javascript
pipeSpawnAccumulator += pipeSpeed * deltaMultiplier;
const PIPE_SPAWN_DISTANCE = BASE_PIPE_SPEED * PIPE_SPAWN_INTERVAL;

if (pipeSpawnAccumulator >= PIPE_SPAWN_DISTANCE) {
    pipeSpawnAccumulator -= PIPE_SPAWN_DISTANCE;
    createPipe();
}
```

Cela garantit un espacement constant même quand la vitesse change (powerups).

### Distance Verticale Limitée

Pour éviter des sauts impossibles, la distance verticale entre deux tuyaux consécutifs est limitée:

```javascript
MAX_VERTICAL_DISTANCE_RATIO: 0.66  // 66% de la hauteur de l'écran
```

Le centre du nouveau tuyau est calculé dans une plage autour du précédent:

```javascript
const maxVerticalDistance = canvas.height * GAMEPLAY_RATIOS.MAX_VERTICAL_DISTANCE_RATIO;
const minCenter = Math.max(minTop + pipeGap/2, lastCenter - maxVerticalDistance);
const maxCenter = Math.min(maxTop + pipeGap/2, lastCenter + maxVerticalDistance);
```

### Tuyaux Mobiles

À partir du score 5, les tuyaux peuvent bouger verticalement:

```javascript
// Probabilité croissante
if (score >= 5) {
    const bonusLevels = Math.floor((score - 5) / 5);
    movingProbability = 0.30 + (bonusLevels * 0.15);  // Max 90%
}

// Animation
if (pipe.moving) {
    pipe.top += pipe.moveSpeed * deltaMultiplier;
    
    // Inverser direction aux limites
    if (pipe.top <= originalTop - moveRange || 
        pipe.top >= originalTop + moveRange) {
        pipe.moveSpeed *= -1;
    }
}
```

## Système de Collisions

### Détection

```javascript
function checkCollisions() {
    // Collision sol
    if (bird.y + bird.height >= canvas.height - GROUND_HEIGHT) return true;
    
    // Collision plafond
    if (bird.y <= 0) return true;
    
    // Collision tuyaux
    for (let pipe of pipes) {
        if (bird.x + bird.width > pipe.x && 
            bird.x < pipe.x + PIPE_WIDTH) {
            if (bird.y < pipe.top || 
                bird.y + bird.height > pipe.bottom) {
                return true;
            }
        }
    }
    return false;
}
```

### Gestion des Collisions

```javascript
if (checkCollisions()) {
    lives--;
    
    if (lives <= 0) {
        gameOver();
    } else {
        // Reset position
        bird.y = canvas.height / 2;
        bird.velocity = 0;
        
        // Retirer tuyaux devant
        pipes = pipes.filter(pipe => pipe.x > canvas.width / 2);
    }
}
```

## Power-ups

### Types et Configuration

```javascript
const POWERUP_TYPES = {
    LIFE: {
        color: '#ff0066',
        icon: '❤️',
        effect: () => { lives++; }
    },
    SLOW: {
        color: '#00ccff',
        icon: '🐌',
        duration: 300,  // frames (5s à 60fps)
        effect: () => { 
            activePowerUp = 'SLOW';
            powerUpTimer = 300;
        }
    },
    FAST: {
        color: '#ffaa00',
        icon: '⚡',
        duration: 180,  // 3s
        effect: () => {
            activePowerUp = 'FAST';
            powerUpTimer = 180;
        }
    },
    WIDE: {
        color: '#00ff88',
        icon: '↔️',
        duration: 300,
        effect: () => {
            activePowerUp = 'WIDE';
            powerUpTimer = 300;
            pipeGap = WIDE_PIPE_GAP;  // Gap élargi
        }
    }
};
```

### Spawn des Power-ups

Les power-ups apparaissent **tous les 5 tuyaux**, entre les deux derniers tuyaux:

```javascript
function createPowerUp() {
    const pipe1 = pipes[pipes.length - 2];  // Avant-dernier
    const pipe2 = pipes[pipes.length - 1];  // Dernier
    
    // Position X: au milieu entre les deux
    const x = pipe1.x + ((pipe2.x - pipe1.x) / 2);
    
    // Position Y: au centre du gap
    const gapCenter = pipe1.top + (pipe1.gap / 2);
    const y = gapCenter + (Math.random() - 0.5) * (pipe1.gap * 0.4);
}
```

### Application des Effets

```javascript
function updateGameSpeed() {
    let baseSpeed = BASE_PIPE_SPEED + (score * SPEED_INCREASE_RATE);
    
    if (activePowerUp === 'SLOW') {
        pipeSpeed = baseSpeed * 0.5;
    } else if (activePowerUp === 'FAST') {
        pipeSpeed = baseSpeed * 1.5;
    } else {
        pipeSpeed = baseSpeed;
    }
}
```

## Système de Score

### Incrémentation

Un point est marqué quand l'oiseau passe complètement un tuyau:

```javascript
if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
    pipe.passed = true;
    score++;
    playScoreSound();
    
    // Particules
    for (let i = 0; i < 20; i++) {
        createParticle(bird.x, bird.y, theme.primary);
    }
}
```

### Augmentation de Vitesse

La vitesse augmente progressivement avec le score:

```javascript
baseSpeed = BASE_PIPE_SPEED + (score * SPEED_INCREASE_RATE);
```

Tous les 10 points, un message "VITESSE NIVEAU X!" s'affiche.

### Effet de Feu (Record Battu)

Quand le joueur dépasse le meilleur score mondial:

```javascript
if (!isOnFire && score > currentHighScore && currentHighScore > 0) {
    isOnFire = true;
    fireMessageTimer = 90;  // 1.5s
    
    // Changer couleurs oiseau
    // Ajouter traînée de feu
    // Afficher message "RECORD DE XXX BATTU!"
}
```

## Thèmes de Couleurs

Les couleurs changent tous les 10 points:

```javascript
const COLOR_THEMES = [
    { primary: '#00ffff', secondary: '#ff00ff', accent: '#ffff00' }, // 0-9
    { primary: '#ff6600', secondary: '#0066ff', accent: '#00ff66' }, // 10-19
    { primary: '#ff0066', secondary: '#66ff00', accent: '#0066ff' }, // 20-29
    // ... etc
];

function getCurrentTheme() {
    const themeIndex = Math.min(Math.floor(score / 10), COLOR_THEMES.length - 1);
    return COLOR_THEMES[themeIndex];
}
```

## God Mode (Cheat)

Activation: 3× touche `H` dans le menu principal

Effets:
- Vies infinies
- +1 score à chaque collision (au lieu de perdre une vie)
- Vitesse ×2
- Pas de reset de position

```javascript
if (cheatGodMode) {
    // Collision = +1 score
    score++;
    playScoreSound();
    
    // Vitesse doublée
    pipeSpeed *= 2;
}
```

## Quand utiliser ce skill

- Modifier la physique du jeu
- Ajouter de nouveaux power-ups
- Ajuster la difficulté
- Débugger les collisions
- Comprendre le système de score

## Fichiers concernés

- `physics.js`: Physique, tuyaux, collisions
- `game.js`: Boucle principale, gestion score
- `powerups.js`: Création et gestion power-ups
- `config.js`: Toutes les constantes
