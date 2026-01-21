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
    pipeSpawnAccumulator: 0 // Accumulateur pour spawn des tuyaux (indépendant du FPS)
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

    // Démarrer le jeu
    startGame();
}

// Démarrer le jeu
function startGame() {
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

    // Vérifier si c'est un high score
    const isHigh = await isHighScore(gameState.score);

    // Obtenir la position globale
    const rankInfo = await getGlobalRank(gameState.score);
    const rankText = rankInfo.rank
        ? `<p style="color: #00ffff; font-size: 18px;">📊 Position mondiale : <strong>${rankInfo.rank}${rankInfo.rank === 1 ? 'er' : 'ème'}</strong> sur ${rankInfo.total} joueurs</p>`
        : '';

    if (isHigh) {
        messageEl.innerHTML = `
            <h2>🎉 NOUVEAU RECORD! 🎉</h2>
            <p style="color: #ffbe0b; font-size: 20px; margin: 15px 0;">${funnyMsg}</p>
            <p>Félicitations ${gameState.playerName} !</p>
            <p style="font-size: 28px; color: #ff00ff;">🎯 Score Final: <strong>${gameState.score}</strong></p>
            ${rankText}
            <div id="highScoresTable">
                <h3>🏆 TOP 10 MONDIAL 🏆</h3>
                <div id="scoresList"></div>
            </div>
            <button onclick="submitScore()">✓ ENREGISTRER</button>
            <button onclick="restart()">🔄 REJOUER</button>
        `;
        await showHighScores();
    } else {
        messageEl.innerHTML = `
            <h2>💥 GAME OVER 💥</h2>
            <p style="color: #ffbe0b; font-size: 22px; margin: 20px 0; font-style: italic;">${funnyMsg}</p>
            <p style="font-size: 28px; color: #ff00ff;">🎯 Score Final: <strong>${gameState.score}</strong></p>
            ${rankText}
            <div id="highScoresTable">
                <h3>🏆 TOP 10 MONDIAL 🏆</h3>
                <div id="scoresList"></div>
            </div>
            <button onclick="restart()">🔄 REJOUER</button>
        `;
        await showHighScores();
    }

    messageEl.style.display = 'block';
}

// Soumettre le score
async function submitScore() {
    await addHighScore(gameState.playerName, gameState.score);
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

    // Mettre à jour les power-ups
    updatePowerUps(deltaMultiplier);

    // Créer de nouveaux tuyaux (basé sur l'accumulateur ajusté par deltaMultiplier)
    // Cela garantit un espacement constant indépendamment du FPS du navigateur
    gameState.pipeSpawnAccumulator += deltaMultiplier;
    if (gameState.pipeSpawnAccumulator >= GAME_CONFIG.PIPE_SPAWN_INTERVAL) {
        gameState.pipeSpawnAccumulator -= GAME_CONFIG.PIPE_SPAWN_INTERVAL;
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
    // Barre de progression (seulement si le jeu est en cours)
    if (gameState.started && !gameState.over) {
        drawProgressBar();
    }
}

// Boucle principale du jeu avec Delta Time
function gameLoop(currentTime) {
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