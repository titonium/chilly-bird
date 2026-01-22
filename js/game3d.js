// ===== JEU 3D AVEC THREE.JS =====

let scene3D, camera3D, renderer3D;
let bird3D, pipes3D = [];
let powerUps3D = [];
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
    playerName: '',
    pipeCount: 0,
    activePowerUp: null,
    powerUpTimer: 0,
    currentPipeGap: 6
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

    // Créer l'oiseau 3D reconnaissable
    bird3D = new THREE.Group();
    bird3D.position.x = -8;
    bird3D.position.y = 0;

    // Corps principal (ellipsoïde aplati)
    const bodyGeometry = new THREE.SphereGeometry(GAME3D_CONFIG.BIRD_SIZE, 32, 32);
    bodyGeometry.scale(1.2, 0.9, 0.8);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bird3D.add(body);

    // Tête
    const headGeometry = new THREE.SphereGeometry(GAME3D_CONFIG.BIRD_SIZE * 0.6, 32, 32);
    const headMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.6,
        shininess: 100
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.set(0.9, 0.4, 0);
    bird3D.add(head);

    // Œil droit
    const eyeGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const eyeWhiteMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
    });
    const eyeRight = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    eyeRight.position.set(1.2, 0.55, 0.35);
    bird3D.add(eyeRight);

    // Pupille droite
    const pupilGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const pupilMaterial = new THREE.MeshPhongMaterial({
        color: 0x000000
    });
    const pupilRight = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupilRight.position.set(1.35, 0.55, 0.4);
    bird3D.add(pupilRight);

    // Œil gauche
    const eyeLeft = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
    eyeLeft.position.set(1.2, 0.55, -0.35);
    bird3D.add(eyeLeft);

    // Pupille gauche
    const pupilLeft = new THREE.Mesh(pupilGeometry, pupilMaterial);
    pupilLeft.position.set(1.35, 0.55, -0.4);
    bird3D.add(pupilLeft);

    // Bec (cône)
    const beakGeometry = new THREE.ConeGeometry(0.2, 0.6, 8);
    const beakMaterial = new THREE.MeshPhongMaterial({
        color: 0xffaa00,
        emissive: 0xffaa00,
        emissiveIntensity: 0.4
    });
    const beak = new THREE.Mesh(beakGeometry, beakMaterial);
    beak.rotation.z = -Math.PI / 2;
    beak.position.set(1.6, 0.3, 0);
    bird3D.add(beak);

    // Aile principale (ellipsoïde aplati)
    const wingGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    wingGeometry.scale(1.5, 0.2, 1);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.9
    });
    const wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.set(-0.2, 0.3, 0);
    wing.name = 'wing';
    bird3D.add(wing);

    // Queue (triangles néon)
    const tailGeometry = new THREE.ConeGeometry(0.3, 0.8, 4);
    const tailMaterial = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.5
    });
    const tail = new THREE.Mesh(tailGeometry, tailMaterial);
    tail.rotation.z = Math.PI / 2;
    tail.position.set(-1.3, 0, 0);
    bird3D.add(tail);

    // Halo lumineux autour de l'oiseau
    const haloGeometry = new THREE.RingGeometry(1.5, 1.7, 32);
    const haloMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.name = 'halo';
    bird3D.add(halo);

    scene3D.add(bird3D);

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
    game3DState.pipeCount = 0;
    game3DState.activePowerUp = null;
    game3DState.powerUpTimer = 0;
    game3DState.currentPipeGap = GAME3D_CONFIG.PIPE_GAP;

    if (bird3D) {
        bird3D.position.y = 0;
    }

    // Supprimer les anciens tuyaux
    pipes3D.forEach(pipe => {
        scene3D.remove(pipe.top);
        scene3D.remove(pipe.bottom);
        if (pipe.topRing) scene3D.remove(pipe.topRing);
        if (pipe.bottomRing) scene3D.remove(pipe.bottomRing);
        if (pipe.topGlow) scene3D.remove(pipe.topGlow);
        if (pipe.bottomGlow) scene3D.remove(pipe.bottomGlow);
    });
    pipes3D = [];

    // Supprimer les anciens power-ups
    powerUps3D.forEach(powerUp => {
        scene3D.remove(powerUp.mesh);
    });
    powerUps3D = [];

    document.getElementById('score').textContent = '0';
    document.getElementById('lives').textContent = '❤️ ' + game3DState.lives;
}

// Créer un tuyau 3D amélioré (style portail néon)
function create3DPipe() {
    const pipeHeight = 15;
    const gapSize = game3DState.currentPipeGap;
    const gapCenter = (Math.random() - 0.5) * (GAME3D_CONFIG.WORLD_HEIGHT - gapSize - 4);

    // Couleurs selon le score (comme en 2D)
    const scoreLevel = Math.floor(game3DState.score / 10) % 7;
    const colors = [
        { main: 0x00ffff, accent: 0xff00ff, glow: 0x00ffff },
        { main: 0xff6600, accent: 0x0066ff, glow: 0xff6600 },
        { main: 0xff0066, accent: 0x66ff00, glow: 0xff0066 },
        { main: 0xffff00, accent: 0xff00ff, glow: 0xffff00 },
        { main: 0x00ff88, accent: 0xff8800, glow: 0x00ff88 },
        { main: 0xff0000, accent: 0x00ff00, glow: 0xff0000 },
        { main: 0xffffff, accent: 0xff00ff, glow: 0xffffff }
    ];
    const colorScheme = colors[scoreLevel];

    // === TUYAU DU HAUT ===
    // Corps principal (cylindre hexagonal pour effet tech)
    const topGeometry = new THREE.CylinderGeometry(
        GAME3D_CONFIG.PIPE_WIDTH / 2,
        GAME3D_CONFIG.PIPE_WIDTH / 2,
        pipeHeight,
        6
    );
    const pipeMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.main,
        emissive: colorScheme.main,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.85,
        flatShading: true
    });
    const topPipe = new THREE.Mesh(topGeometry, pipeMaterial);
    topPipe.position.x = 20;
    topPipe.position.y = gapCenter + gapSize / 2 + pipeHeight / 2;
    scene3D.add(topPipe);

    // Anneau lumineux en bas du tuyau du haut (entrée du portail)
    const topRingGeometry = new THREE.TorusGeometry(GAME3D_CONFIG.PIPE_WIDTH / 2 + 0.3, 0.15, 8, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: colorScheme.accent,
        emissive: colorScheme.accent,
        emissiveIntensity: 0.9
    });
    const topRing = new THREE.Mesh(topRingGeometry, ringMaterial);
    topRing.rotation.x = Math.PI / 2;
    topRing.position.x = 20;
    topRing.position.y = gapCenter + gapSize / 2;
    scene3D.add(topRing);

    // Effet de lueur pour le haut
    const topGlowGeometry = new THREE.RingGeometry(
        GAME3D_CONFIG.PIPE_WIDTH / 2 - 0.2,
        GAME3D_CONFIG.PIPE_WIDTH / 2 + 0.8,
        32
    );
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: colorScheme.glow,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const topGlow = new THREE.Mesh(topGlowGeometry, glowMaterial);
    topGlow.rotation.x = Math.PI / 2;
    topGlow.position.x = 20;
    topGlow.position.y = gapCenter + gapSize / 2 - 0.1;
    scene3D.add(topGlow);

    // Lignes décoratives sur le tuyau du haut
    const linesMaterialTop = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6
    });
    for (let i = 0; i < 3; i++) {
        const lineGeometry = new THREE.TorusGeometry(GAME3D_CONFIG.PIPE_WIDTH / 2 + 0.05, 0.05, 8, 32);
        const line = new THREE.Mesh(lineGeometry, linesMaterialTop);
        line.rotation.x = Math.PI / 2;
        line.position.x = 20;
        line.position.y = gapCenter + gapSize / 2 + 2 + i * 4;
        topPipe.add(line);
        line.position.set(0, -pipeHeight/2 + 2 + i * 4, 0);
    }

    // === TUYAU DU BAS ===
    const bottomPipe = new THREE.Mesh(topGeometry.clone(), pipeMaterial.clone());
    bottomPipe.position.x = 20;
    bottomPipe.position.y = gapCenter - gapSize / 2 - pipeHeight / 2;
    scene3D.add(bottomPipe);

    // Anneau lumineux en haut du tuyau du bas
    const bottomRing = new THREE.Mesh(topRingGeometry.clone(), ringMaterial.clone());
    bottomRing.rotation.x = Math.PI / 2;
    bottomRing.position.x = 20;
    bottomRing.position.y = gapCenter - gapSize / 2;
    scene3D.add(bottomRing);

    // Effet de lueur pour le bas
    const bottomGlow = new THREE.Mesh(topGlowGeometry.clone(), glowMaterial.clone());
    bottomGlow.rotation.x = Math.PI / 2;
    bottomGlow.position.x = 20;
    bottomGlow.position.y = gapCenter - gapSize / 2 + 0.1;
    scene3D.add(bottomGlow);

    // Lignes décoratives sur le tuyau du bas
    for (let i = 0; i < 3; i++) {
        const lineGeometry = new THREE.TorusGeometry(GAME3D_CONFIG.PIPE_WIDTH / 2 + 0.05, 0.05, 8, 32);
        const line = new THREE.Mesh(lineGeometry, linesMaterialTop.clone());
        line.rotation.x = Math.PI / 2;
        bottomPipe.add(line);
        line.position.set(0, pipeHeight/2 - 2 - i * 4, 0);
    }

    game3DState.pipeCount++;

    // Créer un power-up tous les 5 tuyaux
    if (game3DState.pipeCount % 5 === 0 && pipes3D.length >= 1) {
        create3DPowerUp(pipes3D[pipes3D.length - 1], {
            x: 20,
            gapCenter: gapCenter,
            gapSize: gapSize
        });
    }

    pipes3D.push({
        top: topPipe,
        bottom: bottomPipe,
        topRing: topRing,
        bottomRing: bottomRing,
        topGlow: topGlow,
        bottomGlow: bottomGlow,
        gapCenter: gapCenter,
        gapSize: gapSize,
        passed: false
    });
}

// Types de power-ups 3D (mêmes effets qu'en 2D)
const POWERUP_TYPES_3D = {
    LIFE: {
        color: 0xff0066,
        icon: '❤️',
        label: '+1 VIE',
        effect: () => {
            game3DState.lives++;
            document.getElementById('lives').textContent = '❤️ ' + game3DState.lives;
        }
    },
    SLOW: {
        color: 0x00ccff,
        icon: '🐌',
        label: 'SLOW',
        duration: 300,
        effect: () => {
            game3DState.activePowerUp = 'SLOW';
            game3DState.powerUpTimer = 300;
        }
    },
    FAST: {
        color: 0xffaa00,
        icon: '⚡',
        label: 'SPEED',
        duration: 180,
        effect: () => {
            game3DState.activePowerUp = 'FAST';
            game3DState.powerUpTimer = 180;
        }
    },
    WIDE: {
        color: 0x00ff88,
        icon: '↔️',
        label: 'LARGE',
        duration: 300,
        effect: () => {
            game3DState.activePowerUp = 'WIDE';
            game3DState.powerUpTimer = 300;
            game3DState.currentPipeGap = GAME3D_CONFIG.PIPE_GAP * 1.5;
        }
    }
};

// Créer un power-up 3D entre deux tuyaux
function create3DPowerUp(prevPipe, currentPipe) {
    const types = Object.keys(POWERUP_TYPES_3D);
    const type = types[Math.floor(Math.random() * types.length)];
    const config = POWERUP_TYPES_3D[type];

    // Position X : entre les deux tuyaux
    const x = prevPipe.top.position.x + (currentPipe.x - prevPipe.top.position.x) / 2;

    // Position Y : dans la zone du gap avec variation
    const variationY = (Math.random() - 0.5) * (currentPipe.gapSize * 0.4);
    const y = currentPipe.gapCenter + variationY;

    // Créer le groupe du power-up
    const powerUpGroup = new THREE.Group();
    powerUpGroup.position.set(x, y, 0);

    // Sphère externe (couleur du power-up)
    const outerGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const outerMaterial = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.8
    });
    const outerSphere = new THREE.Mesh(outerGeometry, outerMaterial);
    powerUpGroup.add(outerSphere);

    // Sphère interne blanche
    const innerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const innerMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.8
    });
    const innerSphere = new THREE.Mesh(innerGeometry, innerMaterial);
    powerUpGroup.add(innerSphere);

    // Anneaux orbitaux
    const ring1Geometry = new THREE.TorusGeometry(1.1, 0.05, 8, 32);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: config.color,
        emissive: config.color,
        emissiveIntensity: 0.9
    });
    const ring1 = new THREE.Mesh(ring1Geometry, ringMaterial);
    ring1.name = 'ring1';
    powerUpGroup.add(ring1);

    const ring2 = new THREE.Mesh(ring1Geometry.clone(), ringMaterial.clone());
    ring2.rotation.x = Math.PI / 2;
    ring2.name = 'ring2';
    powerUpGroup.add(ring2);

    // Point lumineux central
    const pointLight = new THREE.PointLight(config.color, 0.5, 5);
    powerUpGroup.add(pointLight);

    scene3D.add(powerUpGroup);

    powerUps3D.push({
        mesh: powerUpGroup,
        type: type,
        config: config,
        rotation: 0
    });

    console.log(`🎁 Power-up 3D créé: ${type} à x=${Math.round(x)}, y=${Math.round(y)}`);
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

        // Animation de l'aile
        const wing = bird3D.getObjectByName('wing');
        if (wing) {
            wing.rotation.z = Math.sin(currentTime * 0.015) * 0.5;
            wing.position.y = 0.3 + Math.sin(currentTime * 0.015) * 0.2;
        }

        // Rotation du halo
        const halo = bird3D.getObjectByName('halo');
        if (halo) {
            halo.rotation.z += 0.02 * deltaMultiplier;
        }

        // Spawn des tuyaux
        game3DState.pipeSpawnAccumulator += deltaMultiplier;
        if (game3DState.pipeSpawnAccumulator >= GAME3D_CONFIG.SPAWN_INTERVAL) {
            game3DState.pipeSpawnAccumulator = 0;
            create3DPipe();
        }

        // Calculer la vitesse avec modificateurs de power-up
        let speedMultiplier = 1;
        if (game3DState.activePowerUp === 'SLOW') {
            speedMultiplier = 0.5;
        } else if (game3DState.activePowerUp === 'FAST') {
            speedMultiplier = 1.5;
        }

        const speed = (GAME3D_CONFIG.PIPE_SPEED + (game3DState.score * 0.002)) * speedMultiplier;

        // Mettre à jour les tuyaux
        pipes3D.forEach((pipe, index) => {
            pipe.top.position.x -= speed * deltaMultiplier;
            pipe.bottom.position.x -= speed * deltaMultiplier;

            // Déplacer les éléments décoratifs
            if (pipe.topRing) pipe.topRing.position.x -= speed * deltaMultiplier;
            if (pipe.bottomRing) pipe.bottomRing.position.x -= speed * deltaMultiplier;
            if (pipe.topGlow) pipe.topGlow.position.x -= speed * deltaMultiplier;
            if (pipe.bottomGlow) pipe.bottomGlow.position.x -= speed * deltaMultiplier;

            // Animation des anneaux
            if (pipe.topRing) pipe.topRing.rotation.z += 0.02 * deltaMultiplier;
            if (pipe.bottomRing) pipe.bottomRing.rotation.z -= 0.02 * deltaMultiplier;

            // Pulsation des glow
            const pulse = Math.sin(currentTime * 0.005) * 0.1 + 0.3;
            if (pipe.topGlow) pipe.topGlow.material.opacity = pulse;
            if (pipe.bottomGlow) pipe.bottomGlow.material.opacity = pulse;

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
                if (pipe.topRing) scene3D.remove(pipe.topRing);
                if (pipe.bottomRing) scene3D.remove(pipe.bottomRing);
                if (pipe.topGlow) scene3D.remove(pipe.topGlow);
                if (pipe.bottomGlow) scene3D.remove(pipe.bottomGlow);
                pipes3D.splice(index, 1);
            }
        });

        // Mettre à jour les power-ups
        update3DPowerUps(speed, deltaMultiplier);

        // Gérer les effets des power-ups actifs
        if (game3DState.activePowerUp && game3DState.powerUpTimer > 0) {
            game3DState.powerUpTimer -= deltaMultiplier;

            if (game3DState.powerUpTimer <= 0) {
                // Désactiver le power-up
                if (game3DState.activePowerUp === 'WIDE') {
                    game3DState.currentPipeGap = GAME3D_CONFIG.PIPE_GAP;
                }
                game3DState.activePowerUp = null;
            }
        }

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
                    const pipe = pipes3D[0];
                    scene3D.remove(pipe.top);
                    scene3D.remove(pipe.bottom);
                    if (pipe.topRing) scene3D.remove(pipe.topRing);
                    if (pipe.bottomRing) scene3D.remove(pipe.bottomRing);
                    if (pipe.topGlow) scene3D.remove(pipe.topGlow);
                    if (pipe.bottomGlow) scene3D.remove(pipe.bottomGlow);
                    pipes3D.shift();
                }
            }
        }
    }

    // Afficher le HUD du power-up actif
    draw3DActivePowerUp();

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

// Mettre à jour les power-ups 3D
function update3DPowerUps(speed, deltaMultiplier) {
    for (let i = powerUps3D.length - 1; i >= 0; i--) {
        const powerUp = powerUps3D[i];

        // Déplacer
        powerUp.mesh.position.x -= speed * deltaMultiplier;

        // Animation de rotation
        powerUp.rotation += 0.03 * deltaMultiplier;
        powerUp.mesh.rotation.y = powerUp.rotation;

        // Animation des anneaux orbitaux
        const ring1 = powerUp.mesh.getObjectByName('ring1');
        const ring2 = powerUp.mesh.getObjectByName('ring2');
        if (ring1) ring1.rotation.z += 0.05 * deltaMultiplier;
        if (ring2) ring2.rotation.x += 0.05 * deltaMultiplier;

        // Pulsation de taille
        const pulse = 1 + Math.sin(powerUp.rotation * 2) * 0.1;
        powerUp.mesh.scale.set(pulse, pulse, pulse);

        // Vérifier collision avec l'oiseau
        const distance = Math.sqrt(
            Math.pow(bird3D.position.x - powerUp.mesh.position.x, 2) +
            Math.pow(bird3D.position.y - powerUp.mesh.position.y, 2)
        );

        if (distance < GAME3D_CONFIG.BIRD_SIZE + 0.8) {
            // Collecter le power-up
            powerUp.config.effect();

            // Effet visuel (flash)
            create3DPowerUpEffect(powerUp.mesh.position.x, powerUp.mesh.position.y, powerUp.config.color);

            // Son
            playScoreSound();

            // Supprimer
            scene3D.remove(powerUp.mesh);
            powerUps3D.splice(i, 1);
            continue;
        }

        // Supprimer si hors écran
        if (powerUp.mesh.position.x < -25) {
            scene3D.remove(powerUp.mesh);
            powerUps3D.splice(i, 1);
        }
    }
}

// Effet visuel lors de la collecte d'un power-up
function create3DPowerUpEffect(x, y, color) {
    // Créer des particules qui s'éloignent
    for (let i = 0; i < 12; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.15, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(x, y, 0);

        const angle = (Math.PI * 2 / 12) * i;
        particle.userData = {
            vx: Math.cos(angle) * 0.3,
            vy: Math.sin(angle) * 0.3,
            life: 30
        };

        scene3D.add(particle);

        // Animation de la particule (simplifiée)
        const animateParticle = () => {
            if (particle.userData.life > 0) {
                particle.position.x += particle.userData.vx;
                particle.position.y += particle.userData.vy;
                particle.userData.life--;
                particle.material.opacity = particle.userData.life / 30;
                particle.scale.multiplyScalar(0.95);
                requestAnimationFrame(animateParticle);
            } else {
                scene3D.remove(particle);
            }
        };
        animateParticle();
    }
}

// Afficher le power-up actif en 3D (HUD)
function draw3DActivePowerUp() {
    if (game3DState.activePowerUp && game3DState.powerUpTimer > 0) {
        const powerUpConfig = POWERUP_TYPES_3D[game3DState.activePowerUp];
        const timeLeft = (game3DState.powerUpTimer / 60).toFixed(1);

        // Afficher dans l'élément message existant ou créer un HUD
        let hudElement = document.getElementById('powerup-hud-3d');
        if (!hudElement) {
            hudElement = document.createElement('div');
            hudElement.id = 'powerup-hud-3d';
            hudElement.style.cssText = `
                position: absolute;
                top: 80px;
                right: 20px;
                font-size: 20px;
                font-weight: bold;
                color: #${powerUpConfig.color.toString(16).padStart(6, '0')};
                text-shadow: 0 0 10px #${powerUpConfig.color.toString(16).padStart(6, '0')};
                z-index: 100;
                font-family: Arial, sans-serif;
            `;
            document.getElementById('gameContainer').appendChild(hudElement);
        }

        hudElement.textContent = `${powerUpConfig.icon} ${powerUpConfig.label} ${timeLeft}s`;
        hudElement.style.color = `#${powerUpConfig.color.toString(16).padStart(6, '0')}`;
        hudElement.style.textShadow = `0 0 10px #${powerUpConfig.color.toString(16).padStart(6, '0')}`;
        hudElement.style.display = 'block';
    } else {
        const hudElement = document.getElementById('powerup-hud-3d');
        if (hudElement) {
            hudElement.style.display = 'none';
        }
    }
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

    // Supprimer le HUD power-up
    const hudElement = document.getElementById('powerup-hud-3d');
    if (hudElement) {
        hudElement.remove();
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
    powerUps3D = [];

    window.removeEventListener('resize', on3DResize);
}
