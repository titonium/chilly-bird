// ===== PHYSIQUE DU JEU =====

// Créer un tuyau
function createPipe() {
    // ✅ Utiliser canvas.height directement (qui est maintenant fixe)
    const minTop = 100;
    const maxTop = canvas.height - GAME_CONFIG.GROUND_HEIGHT - gameState.pipeGap - 100;
    const top = Math.random() * (maxTop - minTop) + minTop;

    // Calculer la probabilité de tuyaux mobiles selon le score
    let movingProbability = 0;

    if (gameState.score >= GAME_CONFIG.MOVING_PIPES_START_SCORE) {
        const bonusLevels = Math.floor((gameState.score - GAME_CONFIG.MOVING_PIPES_START_SCORE) / 5);
        movingProbability = GAME_CONFIG.MOVING_PIPES_BASE_PROBABILITY + (bonusLevels * GAME_CONFIG.MOVING_PIPES_INCREASE);
        movingProbability = Math.min(movingProbability, GAME_CONFIG.MOVING_PIPES_MAX_PROBABILITY);
    }

    const isMoving = Math.random() < movingProbability;

    // Calculer moveRange et moveSpeed proportionnellement à la hauteur de l'écran
    const baseMoveRange = 80; // valeur de référence pour 1080p
    const scaledMoveRange = Math.round(baseMoveRange * (canvas.height / 1080));
    const baseMoveSpeed = Math.random() * 2.5 + 1.5; // vitesse de référence pour 1080p
    const scaledMoveSpeed = baseMoveSpeed * (canvas.height / 1080);

    gameState.pipes.push({
        x: canvas.width,
        top: top,
        bottom: top + gameState.pipeGap,
        gap: gameState.pipeGap,
        passed: false,
        moving: isMoving,
        moveSpeed: isMoving ? scaledMoveSpeed * (Math.random() > 0.5 ? 1 : -1) : 0,
        originalTop: top,
        moveRange: scaledMoveRange
    });
}

// Mettre à jour l'oiseau avec delta time
function updateBird(deltaMultiplier = 1) {
    gameState.bird.velocity += GAME_CONFIG.BIRD_GRAVITY * deltaMultiplier;
    gameState.bird.y += gameState.bird.velocity * deltaMultiplier;
}

// Mettre à jour les tuyaux avec delta time
function updatePipes(deltaMultiplier = 1) {
    gameState.pipes.forEach((pipe, index) => {
        pipe.x -= gameState.pipeSpeed * deltaMultiplier;

        // Animer les tuyaux mobiles
        if (pipe.moving) {
            pipe.top += pipe.moveSpeed * deltaMultiplier;

            // Inverser la direction si on atteint les limites
            if (pipe.top <= pipe.originalTop - pipe.moveRange ||
                pipe.top >= pipe.originalTop + pipe.moveRange) {
                pipe.moveSpeed *= -1;
            }

            // Mettre à jour la position du bas en utilisant le GAP DU TUYAU
            pipe.bottom = pipe.top + pipe.gap;
        }

        // Vérifier si le tuyau est passé
        if (!pipe.passed && pipe.x + GAME_CONFIG.PIPE_WIDTH < gameState.bird.x) {
            pipe.passed = true;
            gameState.score++;
            document.getElementById('score').textContent = gameState.score;

            // Déclencher l'affichage du boost de vitesse si on passe un palier de 10
            if (gameState.score % 10 === 0) {
                triggerSpeedBoost();
            }

            // Son de point marqué
            playScoreSound();

            // Explosion de particules avec couleur du thème
            const theme = getCurrentTheme();
            for (let i = 0; i < 20; i++) {
                createParticle(
                    gameState.bird.x,
                    gameState.bird.y + gameState.bird.height / 2,
                    Math.random() > 0.5 ? theme.primary : theme.secondary
                );
            }
        }

        // Supprimer les tuyaux hors écran
        if (pipe.x + GAME_CONFIG.PIPE_WIDTH < 0) {
            gameState.pipes.splice(index, 1);
        }
    });
}

// Vérifier les collisions
function checkCollisions() {
    // Collision avec le sol
    if (gameState.bird.y + gameState.bird.height >= canvas.height - GAME_CONFIG.GROUND_HEIGHT) {
        return true;
    }

    // Collision avec le plafond
    if (gameState.bird.y <= 0) {
        return true;
    }

    // Collision avec les tuyaux
    for (let pipe of gameState.pipes) {
        if (gameState.bird.x + gameState.bird.width > pipe.x &&
            gameState.bird.x < pipe.x + GAME_CONFIG.PIPE_WIDTH) {
            if (gameState.bird.y < pipe.top ||
                gameState.bird.y + gameState.bird.height > pipe.bottom) {
                return true;
            }
        }
    }

    return false;
}

// Faire sauter l'oiseau
function jump() {
    if (!gameState.started || gameState.over) return;

    // Réduire le saut si le powerup SLOW est actif
    let jumpPower = GAME_CONFIG.BIRD_JUMP_POWER;
    if (gameState.activePowerUp === 'SLOW') {
        jumpPower = jumpPower * 0.7; // 30% moins puissant
    }
    gameState.bird.velocity = jumpPower;

    // Son de saut
    playJumpSound();

    // Particules de saut
    for (let i = 0; i < 10; i++) {
        createParticle(
            gameState.bird.x + gameState.bird.width / 2,
            gameState.bird.y + gameState.bird.height,
            '#00ffff'
        );
    }
}

// Mettre à jour la vitesse du jeu
function updateGameSpeed() {
    if (gameState.started && !gameState.over) {
        let baseSpeed = GAME_CONFIG.BASE_PIPE_SPEED + (gameState.score * GAME_CONFIG.SPEED_INCREASE_RATE);

        // Modifier la vitesse selon le power-up actif
        if (gameState.activePowerUp === 'SLOW') {
            gameState.pipeSpeed = baseSpeed * 0.5; // 50% plus lent
        } else if (gameState.activePowerUp === 'FAST') {
            gameState.pipeSpeed = baseSpeed * 1.5; // 50% plus rapide
        } else {
            gameState.pipeSpeed = baseSpeed;
        }
    }
}