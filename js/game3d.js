// ===== JEU 3D AVEC THREE.JS =====

let scene3D, camera3D, renderer3D;
let bird3D, pipes3D = [];
let game3DActive = false;
let game3DAnimationId = null;

// État du jeu 3D
const game3DState = {
    started: false,
    over: false,
    score: 0,
    lives: 2,
    birdY: 0,
    birdVelocity: 0,
    pipeSpawnAccumulator: 0,
    lastTime: 0,
    playerName: ''
};

// Constantes 3D
const GAME3D_CONFIG = {
    BIRD_SIZE: 1,
    PIPE_WIDTH: 2,
    PIPE_GAP: 6,
    PIPE_SPEED: 0.08,
    GRAVITY: 0.008,
    JUMP_POWER: 0.2,
    SPAWN_INTERVAL: 150,
    WORLD_WIDTH: 30,
    WORLD_HEIGHT: 20
};

// Initialiser le jeu 3D
function init3DGame() {
    const container = document.getElementById('gameContainer');

    // Créer la scène
    scene3D = new THREE.Scene();
    scene3D.background = new THREE.Color(0x1a0033);

    // Créer la caméra
    camera3D = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera3D.position.z = 15;
    camera3D.position.y = 0;

    // Créer le renderer
    renderer3D = new THREE.WebGLRenderer({ antialias: true });
    renderer3D.setSize(window.innerWidth, window.innerHeight);
    renderer3D.domElement.id = 'canvas3D';
    renderer3D.domElement.style.position = 'absolute';
    renderer3D.domElement.style.top = '0';
    renderer3D.domElement.style.left = '0';
    renderer3D.domElement.style.zIndex = '5';
    container.appendChild(renderer3D.domElement);

    // Cacher le canvas 2D
    document.getElementById('canvas').style.display = 'none';

    // Ajouter des lumières
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene3D.add(ambientLight);

    const pointLight = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight.position.set(0, 10, 10);
    scene3D.add(pointLight);

    const pointLight2 = new THREE.PointLight(0xff00ff, 0.8, 100);
    pointLight2.position.set(0, -10, 10);
    scene3D.add(pointLight2);

    // Créer l'oiseau (sphère avec effet néon)
    const birdGeometry = new THREE.SphereGeometry(GAME3D_CONFIG.BIRD_SIZE, 32, 32);
    const birdMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    bird3D = new THREE.Mesh(birdGeometry, birdMaterial);
    bird3D.position.x = -8;
    bird3D.position.y = 0;
    scene3D.add(bird3D);

    // Ajouter un anneau autour de l'oiseau
    const ringGeometry = new THREE.TorusGeometry(1.3, 0.1, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.8
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    bird3D.add(ring);

    // Créer le sol (grille néon)
    const groundGeometry = new THREE.PlaneGeometry(100, 20, 50, 10);
    const groundMaterial = new THREE.MeshBasicMaterial({
        color: 0xff00ff,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -GAME3D_CONFIG.WORLD_HEIGHT / 2;
    scene3D.add(ground);

    // Créer le plafond (grille néon)
    const ceiling = new THREE.Mesh(groundGeometry, groundMaterial.clone());
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = GAME3D_CONFIG.WORLD_HEIGHT / 2;
    scene3D.add(ceiling);

    // Ajouter des particules de fond (étoiles)
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1000;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 100;
        positions[i + 2] = (Math.random() - 0.5) * 100 - 50;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2 });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene3D.add(stars);

    // Réinitialiser l'état
    reset3DGame();

    // Gérer le redimensionnement
    window.addEventListener('resize', on3DResize);

    // Gérer les inputs
    renderer3D.domElement.addEventListener('click', jump3D);
    renderer3D.domElement.addEventListener('touchstart', (e) => {
        e.preventDefault();
        jump3D();
    }, { passive: false });

    game3DActive = true;
}

// Redimensionner le renderer 3D
function on3DResize() {
    if (!renderer3D || !camera3D) return;
    camera3D.aspect = window.innerWidth / window.innerHeight;
    camera3D.updateProjectionMatrix();
    renderer3D.setSize(window.innerWidth, window.innerHeight);
}

// Réinitialiser le jeu 3D
function reset3DGame() {
    game3DState.started = false;
    game3DState.over = false;
    game3DState.score = 0;
    game3DState.lives = GAME_CONFIG.STARTING_LIVES;
    game3DState.birdY = 0;
    game3DState.birdVelocity = 0;
    game3DState.pipeSpawnAccumulator = 0;
    game3DState.lastTime = performance.now();

    if (bird3D) {
        bird3D.position.y = 0;
    }

    // Supprimer les anciens tuyaux
    pipes3D.forEach(pipe => {
        scene3D.remove(pipe.top);
        scene3D.remove(pipe.bottom);
    });
    pipes3D = [];

    document.getElementById('score').textContent = '0';
    document.getElementById('lives').textContent = '❤️ ' + game3DState.lives;
}

// Créer un tuyau 3D
function create3DPipe() {
    const pipeHeight = 15;
    const gapSize = GAME3D_CONFIG.PIPE_GAP;
    const gapCenter = (Math.random() - 0.5) * (GAME3D_CONFIG.WORLD_HEIGHT - gapSize - 4);

    // Tuyau du haut
    const topGeometry = new THREE.BoxGeometry(GAME3D_CONFIG.PIPE_WIDTH, pipeHeight, GAME3D_CONFIG.PIPE_WIDTH);
    const pipeMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
    });
    const topPipe = new THREE.Mesh(topGeometry, pipeMaterial);
    topPipe.position.x = 20;
    topPipe.position.y = gapCenter + gapSize / 2 + pipeHeight / 2;
    scene3D.add(topPipe);

    // Tuyau du bas
    const bottomPipe = new THREE.Mesh(topGeometry, pipeMaterial.clone());
    bottomPipe.position.x = 20;
    bottomPipe.position.y = gapCenter - gapSize / 2 - pipeHeight / 2;
    scene3D.add(bottomPipe);

    pipes3D.push({
        top: topPipe,
        bottom: bottomPipe,
        gapCenter: gapCenter,
        gapSize: gapSize,
        passed: false
    });
}

// Faire sauter l'oiseau 3D
function jump3D() {
    if (!game3DActive) return;

    if (!game3DState.started) {
        game3DState.started = true;
        game3DState.lastTime = performance.now();
        if (soundEnabled) startMusic();
    }

    if (game3DState.started && !game3DState.over) {
        game3DState.birdVelocity = GAME3D_CONFIG.JUMP_POWER;
        playJumpSound();
    }
}

// Vérifier les collisions 3D
function check3DCollisions() {
    const birdY = bird3D.position.y;
    const birdX = bird3D.position.x;
    const birdRadius = GAME3D_CONFIG.BIRD_SIZE;

    // Collision avec sol/plafond
    if (birdY <= -GAME3D_CONFIG.WORLD_HEIGHT / 2 + birdRadius ||
        birdY >= GAME3D_CONFIG.WORLD_HEIGHT / 2 - birdRadius) {
        return true;
    }

    // Collision avec les tuyaux
    for (let pipe of pipes3D) {
        const pipeX = pipe.top.position.x;
        if (Math.abs(birdX - pipeX) < (GAME3D_CONFIG.PIPE_WIDTH / 2 + birdRadius)) {
            // Vérifier si l'oiseau est dans le gap
            if (birdY > pipe.gapCenter + pipe.gapSize / 2 - birdRadius ||
                birdY < pipe.gapCenter - pipe.gapSize / 2 + birdRadius) {
                return true;
            }
        }
    }

    return false;
}

// Boucle de jeu 3D
function game3DLoop(currentTime) {
    if (!game3DActive) return;

    game3DAnimationId = requestAnimationFrame(game3DLoop);

    // Calculer delta time
    const deltaTime = currentTime - game3DState.lastTime;
    game3DState.lastTime = currentTime;
    const deltaMultiplier = deltaTime / (1000 / 60);

    if (game3DState.started && !game3DState.over) {
        // Physique de l'oiseau
        game3DState.birdVelocity -= GAME3D_CONFIG.GRAVITY * deltaMultiplier;
        game3DState.birdY += game3DState.birdVelocity * deltaMultiplier;
        bird3D.position.y = game3DState.birdY;

        // Rotation de l'oiseau selon la vélocité
        bird3D.rotation.z = game3DState.birdVelocity * 2;

        // Rotation de l'anneau
        if (bird3D.children[0]) {
            bird3D.children[0].rotation.z += 0.05 * deltaMultiplier;
        }

        // Spawn des tuyaux
        game3DState.pipeSpawnAccumulator += deltaMultiplier;
        if (game3DState.pipeSpawnAccumulator >= GAME3D_CONFIG.SPAWN_INTERVAL) {
            game3DState.pipeSpawnAccumulator = 0;
            create3DPipe();
        }

        // Mettre à jour les tuyaux
        const speed = GAME3D_CONFIG.PIPE_SPEED + (game3DState.score * 0.002);
        pipes3D.forEach((pipe, index) => {
            pipe.top.position.x -= speed * deltaMultiplier;
            pipe.bottom.position.x -= speed * deltaMultiplier;

            // Score
            if (!pipe.passed && pipe.top.position.x < bird3D.position.x) {
                pipe.passed = true;
                game3DState.score++;
                document.getElementById('score').textContent = game3DState.score;
                playScoreSound();
            }

            // Supprimer les tuyaux hors écran
            if (pipe.top.position.x < -25) {
                scene3D.remove(pipe.top);
                scene3D.remove(pipe.bottom);
                pipes3D.splice(index, 1);
            }
        });

        // Vérifier les collisions
        if (check3DCollisions()) {
            game3DState.lives--;
            document.getElementById('lives').textContent = '❤️ ' + game3DState.lives;

            if (game3DState.lives <= 0) {
                game3DState.over = true;
                playCrashSound();
                stopMusic();
                show3DGameOver();
            } else {
                // Reset position
                game3DState.birdY = 0;
                game3DState.birdVelocity = 0;
                bird3D.position.y = 0;
                playCrashSound();

                // Supprimer quelques tuyaux
                while (pipes3D.length > 0 && pipes3D[0].top.position.x < 10) {
                    scene3D.remove(pipes3D[0].top);
                    scene3D.remove(pipes3D[0].bottom);
                    pipes3D.shift();
                }
            }
        }
    }

    // Rendre la scène
    renderer3D.render(scene3D, camera3D);
}

// Afficher le game over 3D
async function show3DGameOver() {
    const messageEl = document.getElementById('message');

    // Utiliser gameState pour getRandomFunnyMessage
    gameState.score = game3DState.score;
    gameState.playerName = game3DState.playerName;

    const funnyMsg = getRandomFunnyMessage();
    const isHigh = await isHighScore(game3DState.score, '3d');

    // Obtenir la position globale (mode 3D)
    const rankInfo = await getGlobalRank(game3DState.score, '3d');
    const rankText = rankInfo.rank
        ? `<p style="color: #00ffff; font-size: 18px;">📊 Position mondiale 3D : <strong>${rankInfo.rank}${rankInfo.rank === 1 ? 'er' : 'ème'}</strong> sur ${rankInfo.total} joueurs</p>`
        : '';

    if (isHigh) {
        messageEl.innerHTML = `
            <h2>🎉 NOUVEAU RECORD 3D! 🎉</h2>
            <p style="color: #ffbe0b; font-size: 20px; margin: 15px 0;">${funnyMsg}</p>
            <p>Félicitations ${game3DState.playerName} !</p>
            <p style="font-size: 28px; color: #ff00ff;">🎯 Score Final: <strong>${game3DState.score}</strong></p>
            ${rankText}
            <button onclick="submit3DScore()">✓ ENREGISTRER</button>
            <button onclick="restart()">🔄 MENU</button>
        `;
    } else {
        messageEl.innerHTML = `
            <h2>💥 GAME OVER 3D 💥</h2>
            <p style="color: #ffbe0b; font-size: 22px; margin: 20px 0; font-style: italic;">${funnyMsg}</p>
            <p style="font-size: 28px; color: #ff00ff;">🎯 Score Final: <strong>${game3DState.score}</strong></p>
            ${rankText}
            <button onclick="restart()">🔄 MENU</button>
        `;
    }

    messageEl.style.display = 'block';
}

// Soumettre le score 3D
async function submit3DScore() {
    console.log('Submitting 3D score:', game3DState.playerName, game3DState.score);
    await addHighScore(game3DState.playerName, game3DState.score, '3d');
    restart();
}

// Démarrer le jeu 3D
function start3DGame() {
    // Sauvegarder le nom du joueur
    game3DState.playerName = document.getElementById('playerNameStart').value.trim().toUpperCase() || 'JOUEUR';
    init3DGame();
    game3DLoop(performance.now());
}

// Arrêter le jeu 3D
function stop3DGame() {
    game3DActive = false;

    if (game3DAnimationId) {
        cancelAnimationFrame(game3DAnimationId);
        game3DAnimationId = null;
    }

    // Supprimer le renderer 3D
    const canvas3D = document.getElementById('canvas3D');
    if (canvas3D) {
        canvas3D.remove();
    }

    // Réafficher le canvas 2D
    document.getElementById('canvas').style.display = 'block';

    // Nettoyer
    if (renderer3D) {
        renderer3D.dispose();
        renderer3D = null;
    }
    scene3D = null;
    camera3D = null;
    bird3D = null;
    pipes3D = [];

    window.removeEventListener('resize', on3DResize);
}
