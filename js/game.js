// ===== GESTION DU JEU =====

// État global du jeu
const gameState = {
    bird: {
        x: 150,
        y: 0,
        width: 50,
        height: 40,
        velocity: 0
    },
    pipes: [],
    score: 0,
    started: false,
    over: false,
    frameCount: 0,
    particles: [],
    stars: [],
    explosionWaves: [],
    lives: 2,
    playerName: '',
    powerUps: [],
    activePowerUp: null,
    powerUpTimer: 0,
    pipeGap: 200,
    pipeSpeed: 8,
    // Delta time pour FPS constant
    lastTime: 0,
    deltaTime: 0,
    targetFPS: 60,
    frameInterval: 1000 / 60, // 16.67ms pour 60 FPS
    pipeCount: 0, // Compteur de tuyaux pour spawner les powerups tous les 5 tuyaux
    pipeSpawnAccumulator: 0, // Accumulateur pour spawn des tuyaux (indépendant du FPS)
    // Tracking du meilleur score pour l'effet de feu
    currentHighScore: 0,
    currentHighScoreHolder: '',
    isOnFire: false,
    fireMessageTimer: 0,
    topScores: [] // Top 10 scores pour les indicateurs sur tuyaux
};

// Mettre à jour les dimensions du jeu selon la résolution
function updateGameDimensions() {
    gameState.bird.width = GAME_CONFIG.BIRD_WIDTH;
    gameState.bird.height = GAME_CONFIG.BIRD_HEIGHT;
    gameState.bird.x = FIXED_WIDTH * 0.1; // 10% depuis la gauche
    gameState.pipeGap = GAME_CONFIG.BASE_PIPE_GAP;
    gameState.pipeSpeed = GAME_CONFIG.BASE_PIPE_SPEED;
}

// Démarrer le jeu avec le nom du joueur
function startWithName() {
    const nameInput = document.getElementById('playerNameStart');
    gameState.playerName = nameInput.value.trim() || 'JOUEUR';
    gameState.playerName = gameState.playerName.toUpperCase();

    // Sauvegarder le nom du joueur localement
    localStorage.setItem('chillyBirdPlayerName', gameState.playerName);

    // Cacher l'écran de bienvenue
    document.getElementById('welcomeScreen').style.display = 'none';

    // Démarrer le jeu selon le mode sélectionné
    if (typeof currentGameMode !== 'undefined' && currentGameMode === '3d') {
        start3DGame();
    } else {
        startGame();
    }
}

// Démarrer le jeu
async function startGame() {
    const messageEl = document.getElementById('message');
    const instructionsEl = document.getElementById('instructions');

    messageEl.style.display = 'none';
    instructionsEl.classList.add('show');

    gameState.started = true;
    gameState.over = false;
    gameState.bird.y = canvas.height / 2;
    gameState.bird.velocity = 0;
    gameState.pipes = [];
    gameState.powerUps = [];
    gameState.activePowerUp = null;
    gameState.powerUpTimer = 0;
    gameState.pipeGap = GAME_CONFIG.BASE_PIPE_GAP;
    gameState.lastTime = performance.now();
    gameState.powerUpSpawnAccumulator = 0;
    gameState.pipeSpawnAccumulator = 0;
    gameState.isOnFire = false;
    gameState.fireMessageTimer = 0;

    // Charger les meilleurs scores pour l'effet de feu et les indicateurs
    const highScores = await getHighScores('2d');
    gameState.topScores = highScores.filter(s => s.score > 0);
    gameState.currentHighScore = highScores[0] ? highScores[0].score : 0;
    gameState.currentHighScoreHolder = highScores[0] ? highScores[0].name : '';

    // Charger le score sauvegardé ou commencer à 0
    const savedScore = localStorage.getItem('chillyBirdCurrentScore');
    if (savedScore !== null) {
        loadCurrentScore();
    } else {
        gameState.score = 0;
        gameState.lives = GAME_CONFIG.STARTING_LIVES;
        document.getElementById('score').textContent = '0';
        document.getElementById('lives').textContent = '❤️ ' + gameState.lives;
    }

    gameState.frameCount = 0;
    gameState.particles = [];
    gameState.explosionWaves = [];
    gameState.pipeSpeed = GAME_CONFIG.BASE_PIPE_SPEED;
    gameState.pipeCount = 0; // Reset du compteur pour les powerups
    resetBackgroundTransition(); // Reset de la transition de fond
    resetLastPipeCenter(); // Reset de la position du dernier tuyau
    resetScoreMarkers(); // Reset des marqueurs de score

    // Démarrer la musique si le son est activé
    if (soundEnabled) {
        startMusic();
    }

    setTimeout(() => {
        instructionsEl.classList.remove('show');
    }, 3000);
}

// Afficher l'écran de game over
async function showGameOver() {
    const messageEl = document.getElementById('message');

    // Arrêter la musique
    stopMusic();

    // Son de crash
    playCrashSound();

    // Message humoristique aléatoire
    const funnyMsg = getRandomFunnyMessage();

    // Vérifier si c'est un high score (mode 2D)
    const isHigh = await isHighScore(gameState.score, '2d');

    // Obtenir la position globale (mode 2D)
    const rankInfo = await getGlobalRank(gameState.score, '2d');
    const rankText = rankInfo.rank
        ? `<p style="color: #00ffff; font-size: 18px;">📊 Position mondiale 2D : <strong>${rankInfo.rank}${rankInfo.rank === 1 ? 'er' : 'ème'}</strong> sur ${rankInfo.total} joueurs</p>`
        : '';

    if (isHigh) {
        messageEl.innerHTML = `
            <h2>🎉 NOUVEAU RECORD 2D! 🎉</h2>
            <p style="color: #ffbe0b; font-size: 20px; margin: 15px 0;">${funnyMsg}</p>
            <p>Félicitations ${gameState.playerName} !</p>
            <p style="font-size: 28px; color: #ff00ff;">🎯 Score Final: <strong>${gameState.score}</strong></p>
            ${rankText}
            <button onclick="submitScore()">✓ ENREGISTRER</button>
            <button onclick="restart()">🔄 MENU</button>
        `;
    } else {
        messageEl.innerHTML = `
            <h2>💥 GAME OVER 2D 💥</h2>
            <p style="color: #ffbe0b; font-size: 22px; margin: 20px 0; font-style: italic;">${funnyMsg}</p>
            <p style="font-size: 28px; color: #ff00ff;">🎯 Score Final: <strong>${gameState.score}</strong></p>
            ${rankText}
            ${gameState.score > 0 ? '<button onclick="submitScore()">✓ ENREGISTRER</button>' : ''}
            <button onclick="restart()">🔄 MENU</button>
        `;
    }

    messageEl.style.display = 'block';
}

// Soumettre le score (mode 2D)
async function submitScore() {
    await addHighScore(gameState.playerName, gameState.score, '2d');
    restart();
}

// Redémarrer le jeu
function restart() {
    // Réafficher l'écran de bienvenue
    document.getElementById('welcomeScreen').style.display = 'block';
    document.getElementById('message').style.display = 'none';

    // Réinitialiser le nom pour permettre de le changer
    document.getElementById('playerNameStart').value = gameState.playerName;

    showHighScores();
}

// Mettre à jour le jeu
function update(deltaMultiplier) {
    if (!gameState.started || gameState.over) return;

    gameState.frameCount++;

    // Physique de l'oiseau
    updateBird(deltaMultiplier);

    // Mettre à jour les tuyaux
    updatePipes(deltaMultiplier);

    // Mettre à jour les marqueurs de score
    updateScoreMarkers(deltaMultiplier);

    // Mettre à jour les power-ups
    updatePowerUps(deltaMultiplier);

    // Créer de nouveaux tuyaux (basé sur la DISTANCE parcourue, pas le temps)
    // Cela garantit un espacement constant même quand la vitesse change (powerups FAST/SLOW)
    gameState.pipeSpawnAccumulator += gameState.pipeSpeed * deltaMultiplier;
    const PIPE_SPAWN_DISTANCE = GAME_CONFIG.BASE_PIPE_SPEED * GAME_CONFIG.PIPE_SPAWN_INTERVAL;
    if (gameState.pipeSpawnAccumulator >= PIPE_SPAWN_DISTANCE) {
        gameState.pipeSpawnAccumulator -= PIPE_SPAWN_DISTANCE;
        createPipe();
        gameState.pipeCount++;

        // Créer un power-up tous les 5 tuyaux
        if (gameState.pipeCount >= 5 && gameState.pipes.length >= 2) {
            createPowerUp();
            gameState.pipeCount = 0;
        }
    }

    // Vérifier les collisions
    if (checkCollisions()) {
        // God Mode : +1 score au lieu de perdre une vie, pas de reset position
        if (cheatGodMode) {
            gameState.score++;
            document.getElementById('score').textContent = gameState.score;
            playScoreSound();
        } else {
            gameState.lives--;
            document.getElementById('lives').textContent = '❤️ ' + gameState.lives;

            if (gameState.lives <= 0) {
                gameState.over = true;
                // Créer une explosion spectaculaire
                createExplosion(gameState.bird.x + gameState.bird.width / 2, gameState.bird.y + gameState.bird.height / 2);
                clearCurrentScore(); // Effacer le score sauvegardé
                showGameOver();
            } else {
                // Perte d'une vie - faire clignoter et réinitialiser position
                createExplosion(gameState.bird.x + gameState.bird.width / 2, gameState.bird.y + gameState.bird.height / 2);
                gameState.bird.y = canvas.height / 2;
                gameState.bird.velocity = 0;

                // Retirer quelques tuyaux devant pour donner une chance
                gameState.pipes = gameState.pipes.filter(pipe => pipe.x > canvas.width / 2);
            }
        }
    }
}

// Dessiner le jeu
function draw() {
    drawBackground();
    gameState.pipes.forEach(drawPipe);
    drawGround();
    drawExplosionWaves();
    drawPowerUps();
    drawParticles();
    drawBird();
    drawActivePowerUp();
    drawFireMessage(); // Message de record battu
    // Barre de progression (seulement si le jeu est en cours)
    if (gameState.started && !gameState.over) {
        drawProgressBar();
    }
}

// Boucle principale du jeu avec Delta Time
function gameLoop(currentTime) {
    // Ne pas exécuter si le mode 3D est actif
    if (typeof game3DActive !== 'undefined' && game3DActive) {
        requestAnimationFrame(gameLoop);
        return;
    }

    // Calculer le delta time
    if (!gameState.lastTime) {
        gameState.lastTime = currentTime;
    }

    gameState.deltaTime = currentTime - gameState.lastTime;
    gameState.lastTime = currentTime;

    // Calculer le multiplicateur pour avoir 60 FPS constant
    // deltaMultiplier = 1.0 à 60 FPS, 0.5 à 120 FPS, 2.0 à 30 FPS
    const deltaMultiplier = gameState.deltaTime / gameState.frameInterval;

    // Mettre à jour et dessiner
    update(deltaMultiplier);
    draw();
    updateGameSpeed();
    
    requestAnimationFrame(gameLoop);
}

// Sauvegarder automatiquement toutes les 2 secondes
setInterval(() => {
    if (gameState.started && !gameState.over) {
        saveCurrentScore();
    }
}, 2000);