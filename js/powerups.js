// ===== GESTION DES POWER-UPS =====

// Créer un power-up À ÉGALE DISTANCE ENTRE LES DEUX DERNIERS TUYAUX
function createPowerUp() {
    // Ne créer un power-up que s'il y a au moins 2 tuyaux
    if (gameState.pipes.length < 2) return;

    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWERUP_TYPES[type];

    // Prendre les deux derniers tuyaux (les plus récents, à droite de l'écran)
    const pipe1 = gameState.pipes[gameState.pipes.length - 2]; // Avant-dernier
    const pipe2 = gameState.pipes[gameState.pipes.length - 1]; // Dernier (vient d'être créé)

    // Si les tuyaux ne sont pas valides, on sort
    if (!pipe1 || !pipe2) return;

    // Position X : au milieu entre les deux tuyaux
    const x = pipe1.x + ((pipe2.x - pipe1.x) / 2);

    // Position Y : au centre de la zone de passage (gap) du premier tuyau
    const gapCenter = pipe1.top + (pipe1.gap / 2);
    // Petite variation aléatoire pour ne pas toujours être au centre exact
    const variationY = (Math.random() - 0.5) * (pipe1.gap * 0.4);
    const y = gapCenter + variationY;

    // S'assurer que le power-up reste dans une zone jouable
    const minY = 100;
    const maxY = canvas.height - GAME_CONFIG.GROUND_HEIGHT - 100;
    const safeY = Math.max(minY, Math.min(maxY, y));

    gameState.powerUps.push({
        x: x,
        y: safeY,
        size: 50, // Un peu plus gros pour être visible
        type: type,
        config: config,
        rotation: 0
    });

    console.log(`🎁 Power-up créé: ${type} à x=${Math.round(x)}, y=${Math.round(safeY)}`);
}

// Dessiner les power-ups
function drawPowerUps() {
    gameState.powerUps.forEach(powerUp => {
        ctx.save();

        powerUp.rotation += 0.05;

        // Lueur pulsante
        const pulse = Math.sin(gameState.frameCount * 0.1) * 10 + 20;
        ctx.shadowColor = powerUp.config.color;
        ctx.shadowBlur = pulse;

        // Cercle externe
        ctx.fillStyle = powerUp.config.color;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Cercle interne blanc
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, powerUp.size / 3, 0, Math.PI * 2);
        ctx.fill();

        // Icône
        ctx.font = 'bold 30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUp.config.icon, powerUp.x, powerUp.y);

        // Label
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 5;
        ctx.fillText(powerUp.config.label, powerUp.x, powerUp.y + 30);

        ctx.restore();
    });
}

// Mettre à jour les power-ups avec delta time
function updatePowerUps(deltaMultiplier = 1) {
    // Déplacer les power-ups
    for (let i = gameState.powerUps.length - 1; i >= 0; i--) {
        const powerUp = gameState.powerUps[i];
        powerUp.x -= gameState.pipeSpeed * deltaMultiplier;

        // Vérifier collision avec l'oiseau
        const distance = Math.hypot(
            gameState.bird.x + gameState.bird.width / 2 - powerUp.x,
            gameState.bird.y + gameState.bird.height / 2 - powerUp.y
        );

        if (distance < gameState.bird.width / 2 + powerUp.size / 2) {
            // Collecter le power-up
            powerUp.config.effect();

            // Effet visuel
            for (let j = 0; j < 20; j++) {
                createParticle(powerUp.x, powerUp.y, powerUp.config.color);
            }

            // Son
            playScoreSound();

            gameState.powerUps.splice(i, 1);
            continue;
        }

        // Supprimer si hors écran
        if (powerUp.x + powerUp.size < 0) {
            gameState.powerUps.splice(i, 1);
        }
    }

    // Gérer les effets des power-ups actifs
    if (gameState.activePowerUp && gameState.powerUpTimer > 0) {
        gameState.powerUpTimer -= deltaMultiplier;

        if (gameState.powerUpTimer <= 0) {
            // Désactiver le power-up
            if (gameState.activePowerUp === 'WIDE') {
                gameState.pipeGap = GAME_CONFIG.BASE_PIPE_GAP;
            }
            gameState.activePowerUp = null;
        }
    }
    // Note: Les powerups sont créés dans game.js tous les 5 tuyaux
}

// Afficher le power-up actif
function drawActivePowerUp() {
    if (gameState.activePowerUp && gameState.powerUpTimer > 0) {
        ctx.save();

        const powerUpConfig = POWERUP_TYPES[gameState.activePowerUp];
        const timeLeft = (gameState.powerUpTimer / 60).toFixed(1);

        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'right';
        ctx.fillStyle = powerUpConfig.color;
        ctx.shadowColor = powerUpConfig.color;
        ctx.shadowBlur = 15;
        ctx.fillText(
            `${powerUpConfig.icon} ${powerUpConfig.label} ${timeLeft}s`,
            canvas.width - 150,
            50
        );

        ctx.restore();
    }
}