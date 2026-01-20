// ===== GESTION DES POWER-UPS =====

// Créer un power-up aléatoire À ÉGALE DISTANCE ENTRE DEUX TUYAUX
function createPowerUp() {
    // Ne créer un power-up que s'il y a au moins 2 tuyaux
    if (gameState.pipes.length < 2) return;
    
    const types = Object.keys(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWERUP_TYPES[type];

    // Trouver deux tuyaux consécutifs
    let pipe1 = null;
    let pipe2 = null;
    
    for (let i = 0; i < gameState.pipes.length - 1; i++) {
        const currentPipe = gameState.pipes[i];
        const nextPipe = gameState.pipes[i + 1];
        
        // Vérifier que les deux tuyaux sont devant l'oiseau
        if (currentPipe.x > gameState.bird.x + 100) {
            pipe1 = currentPipe;
            pipe2 = nextPipe;
            break;
        }
    }
    
    // Si on n'a pas trouvé deux tuyaux valides, on sort
    if (!pipe1 || !pipe2) return;
    
    // Position X : au milieu entre les deux tuyaux
    const x = pipe1.x + ((pipe2.x - pipe1.x) / 2);
    
    // Position Y : au centre de la zone de passage du premier tuyau
    const gapCenter1 = pipe1.top + (gameState.pipeGap / 2);
    const variationY = (Math.random() - 0.5) * (gameState.pipeGap * 0.3);
    const y = gapCenter1 + variationY;
    
    // S'assurer que le power-up reste dans une zone jouable
    const minY = 100;
    const maxY = canvas.height - GAME_CONFIG.GROUND_HEIGHT - 100;
    const safeY = Math.max(minY, Math.min(maxY, y));

    gameState.powerUps.push({
        x: x,
        y: safeY,
        size: 40,
        type: type,
        config: config,
        rotation: 0
    });
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

    // Créer un nouveau power-up aléatoirement
    if (gameState.frameCount % 60 === 0 && Math.random() < 0.05 && gameState.pipes.length >= 2) {
        createPowerUp();
    }
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