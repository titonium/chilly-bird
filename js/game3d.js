// ===== JEU 3D AVEC THREE.JS =====

let scene3D, camera3D, renderer3D;
let bird3D, pipes3D = [];
let powerUps3D = [];
let shootingStars3D = [];
let movingStars3D = []; // Étoiles permanentes avec traînée
let backgroundStars3D; // Points statiques de fond
let game3DActive = false;
let game3DAnimationId = null;
let caveWalls = { ground: [], ceiling: [] }; // Décor de grotte
let lastPipeCenter3D = null; // Position du centre du dernier tuyau (pour limiter la distance verticale)

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
    currentPipeGap: 6,
    // Tracking du meilleur score pour l'effet de feu
    currentHighScore: 0,
    currentHighScoreHolder: '',
    isOnFire: false,
    fireMessageTimer: 0,
    topScores: [] // Top 10 scores pour les indicateurs sur tuyaux
};

// Constantes 3D
const GAME3D_CONFIG = {
    BIRD_SIZE: 0.6,          // Taille réduite (était 1)
    PIPE_WIDTH: 2,
    PIPE_GAP: 6,
    PIPE_SPEED: 0.12,        // Vitesse augmentée (était 0.08)
    GRAVITY: 0.008,
    JUMP_POWER: 0.2,
    SPAWN_INTERVAL: 90,      // Fréquence de base (sera ajustée dynamiquement)
    WORLD_WIDTH: 30,
    WORLD_HEIGHT: 20,
    MAX_VERTICAL_DISTANCE_RATIO: 0.66,  // 66% de la hauteur (comme en 2D)
    SPEED_INCREASE_RATE: 0.005  // Augmentation de vitesse par point
};

// Créer le décor simple (sol et ciel) avec défilement
function createCaveWalls() {
    caveWalls = { ground: [], ceiling: [] };
    const segmentWidth = 50;
    const numSegments = 4;

    // Créer les segments de sol
    for (let i = 0; i < numSegments; i++) {
        const startX = -30 + i * segmentWidth;
        createSimpleSegment(startX, segmentWidth, true);  // Sol
        createSimpleSegment(startX, segmentWidth, false); // Ciel
    }
}

// Créer un segment avec bordure ondulée
function createSimpleSegment(startX, width, isGround) {
    const segment = new THREE.Group();
    const baseY = isGround ? -GAME3D_CONFIG.WORLD_HEIGHT / 2 : GAME3D_CONFIG.WORLD_HEIGHT / 2;

    // Couleur selon sol ou ciel
    const color = isGround ? 0x2d5a27 : 0x1a3a5c;
    const lineColor = isGround ? 0x44ff44 : 0x4488ff;

    // Créer une forme ondulée avec Shape
    const shape = new THREE.Shape();
    const waveHeight = 1.2;
    const waveFreq = 0.4;
    const depth = 10;

    // Point de départ
    shape.moveTo(startX, isGround ? -depth : depth);

    // Tracer la bordure ondulée
    const steps = 40;
    for (let i = 0; i <= steps; i++) {
        const x = startX + (i / steps) * width;
        const wave = Math.sin((startX * 0.1 + i * 0.5) * waveFreq) * waveHeight;
        const y = isGround ? wave : -wave;
        shape.lineTo(x, y);
    }

    // Fermer la forme
    shape.lineTo(startX + width, isGround ? -depth : depth);
    shape.lineTo(startX, isGround ? -depth : depth);

    // Créer la géométrie extrudée
    const extrudeSettings = { depth: 15, bevelEnabled: false };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -7.5;
    segment.add(mesh);

    // Ligne lumineuse qui suit la vague
    const linePoints = [];
    for (let i = 0; i <= steps; i++) {
        const x = startX + (i / steps) * width;
        const wave = Math.sin((startX * 0.1 + i * 0.5) * waveFreq) * waveHeight;
        const y = isGround ? wave : -wave;
        linePoints.push(new THREE.Vector3(x, y, 0));
    }

    const lineCurve = new THREE.CatmullRomCurve3(linePoints);
    const tubeGeom = new THREE.TubeGeometry(lineCurve, 50, 0.12, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color: lineColor });
    const tube = new THREE.Mesh(tubeGeom, tubeMat);
    segment.add(tube);

    segment.position.y = baseY;
    segment.userData.startX = startX;
    segment.userData.width = width;

    scene3D.add(segment);

    if (isGround) {
        caveWalls.ground.push(segment);
    } else {
        caveWalls.ceiling.push(segment);
    }
}

// Mettre à jour le défilement du décor
function updateCaveWalls(speed, deltaMultiplier) {
    const moveAmount = speed * deltaMultiplier;

    ['ground', 'ceiling'].forEach(type => {
        caveWalls[type].forEach(segment => {
            segment.position.x -= moveAmount;

            // Recycler le segment s'il sort de l'écran
            if (segment.position.x + segment.userData.startX + segment.userData.width < -40) {
                let maxX = -Infinity;
                caveWalls[type].forEach(s => {
                    const rightEdge = s.position.x + s.userData.startX + s.userData.width;
                    if (rightEdge > maxX) maxX = rightEdge;
                });
                segment.position.x = maxX - segment.userData.startX;
            }
        });
    });
}

// Initialiser le jeu 3D
function init3DGame() {
    const container = document.getElementById('gameContainer');

    // Créer la scène (ambiance grotte sombre)
    scene3D = new THREE.Scene();
    scene3D.background = new THREE.Color(0x0a0a12);

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

    // Aile droite (forme de plume stylisée)
    const wingRightGroup = new THREE.Group();
    wingRightGroup.name = 'wingRight';
    wingRightGroup.position.set(-0.1, 0.2, 0.5);

    // Plumes principales de l'aile droite
    const featherGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
    const wingMaterial = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.7,
        transparent: true,
        opacity: 0.95
    });

    for (let i = 0; i < 4; i++) {
        const feather = new THREE.Mesh(featherGeometry, wingMaterial.clone());
        feather.rotation.x = Math.PI / 2;
        feather.rotation.z = -0.2 * i;
        feather.position.set(-0.15 * i, 0, 0.2 * i);
        feather.scale.set(1 - i * 0.1, 1 - i * 0.15, 1);
        wingRightGroup.add(feather);
    }

    // Base de l'aile droite
    const wingBaseGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    wingBaseGeometry.scale(1.2, 0.5, 0.8);
    const wingBase = new THREE.Mesh(wingBaseGeometry, wingMaterial);
    wingRightGroup.add(wingBase);

    bird3D.add(wingRightGroup);

    // Aile gauche (miroir de l'aile droite)
    const wingLeftGroup = new THREE.Group();
    wingLeftGroup.name = 'wingLeft';
    wingLeftGroup.position.set(-0.1, 0.2, -0.5);

    for (let i = 0; i < 4; i++) {
        const feather = new THREE.Mesh(featherGeometry.clone(), wingMaterial.clone());
        feather.rotation.x = -Math.PI / 2;
        feather.rotation.z = -0.2 * i;
        feather.position.set(-0.15 * i, 0, -0.2 * i);
        feather.scale.set(1 - i * 0.1, 1 - i * 0.15, 1);
        wingLeftGroup.add(feather);
    }

    const wingBaseLeft = new THREE.Mesh(wingBaseGeometry.clone(), wingMaterial.clone());
    wingLeftGroup.add(wingBaseLeft);

    bird3D.add(wingLeftGroup);

    // Queue (plumes multiples)
    const tailGroup = new THREE.Group();
    tailGroup.position.set(-1.1, 0, 0);

    const tailFeatherGeometry = new THREE.ConeGeometry(0.12, 0.7, 4);
    const tailMaterial = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        emissive: 0xff00ff,
        emissiveIntensity: 0.6
    });

    for (let i = 0; i < 3; i++) {
        const tailFeather = new THREE.Mesh(tailFeatherGeometry, tailMaterial.clone());
        tailFeather.rotation.z = Math.PI / 2 + (i - 1) * 0.2;
        tailFeather.position.set(-0.2, (i - 1) * 0.15, 0);
        tailGroup.add(tailFeather);
    }

    bird3D.add(tailGroup);

    // Traînée lumineuse derrière l'oiseau (remplace le halo)
    const trailGeometry = new THREE.ConeGeometry(0.3, 1.5, 8);
    const trailMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4
    });
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.rotation.z = Math.PI / 2;
    trail.position.set(-1.8, 0, 0);
    trail.name = 'trail';
    bird3D.add(trail);

    scene3D.add(bird3D);

    // Créer les parois rocheuses de la grotte
    createCaveWalls();

    // Ajouter des particules de fond statiques (étoiles lointaines)
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 500;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 100;
        positions[i + 2] = (Math.random() - 0.5) * 100 - 50;
    }
    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15 });
    backgroundStars3D = new THREE.Points(starsGeometry, starsMaterial);
    scene3D.add(backgroundStars3D);

    // Créer les étoiles mobiles avec traînée (comme en 2D)
    create3DMovingStars();

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

// Activer l'effet de feu sur l'oiseau 3D
function activateFireEffect3D() {
    if (!bird3D) return;

    // Changer les couleurs de l'oiseau en orange/rouge
    bird3D.traverse((child) => {
        if (child.isMesh && child.material) {
            if (child.material.color) {
                // Corps et tête -> orange
                if (child.material.color.getHex() === 0x00ffff) {
                    child.material.color.setHex(0xff6600);
                    child.material.emissive.setHex(0xff4400);
                }
                // Ailes -> rouge
                if (child.material.color.getHex() === 0xff00ff) {
                    child.material.color.setHex(0xff2200);
                    child.material.emissive.setHex(0xff0000);
                }
            }
        }
    });

    // Ajouter des flammes derrière l'oiseau
    const flameGroup = new THREE.Group();
    flameGroup.name = 'fireEffect';

    for (let i = 0; i < 5; i++) {
        const flameGeometry = new THREE.ConeGeometry(0.15 + i * 0.05, 0.8 + i * 0.3, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({
            color: i < 2 ? 0xffff00 : (i < 4 ? 0xff8800 : 0xff4400),
            transparent: true,
            opacity: 0.8 - i * 0.1
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.rotation.z = Math.PI / 2;
        flame.position.set(-1.5 - i * 0.4, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3);
        flame.name = `flame${i}`;
        flameGroup.add(flame);
    }

    bird3D.add(flameGroup);

    // Ajouter une lumière de feu
    const fireLight = new THREE.PointLight(0xff4400, 2, 10);
    fireLight.position.set(-1, 0, 0);
    fireLight.name = 'fireLight';
    bird3D.add(fireLight);
}

// Mettre à jour l'effet de feu (animation des flammes)
function updateFireEffect3D(currentTime) {
    if (!game3DState.isOnFire || !bird3D) return;

    const fireEffect = bird3D.getObjectByName('fireEffect');
    if (fireEffect) {
        fireEffect.children.forEach((flame, i) => {
            // Animation des flammes
            flame.position.y = Math.sin(currentTime * 0.01 + i) * 0.2;
            flame.position.z = Math.cos(currentTime * 0.015 + i * 0.5) * 0.15;
            flame.scale.x = 1 + Math.sin(currentTime * 0.02 + i) * 0.3;
            flame.scale.y = 1 + Math.sin(currentTime * 0.025 + i) * 0.2;
        });
    }

    // Pulsation de la lumière
    const fireLight = bird3D.getObjectByName('fireLight');
    if (fireLight) {
        fireLight.intensity = 1.5 + Math.sin(currentTime * 0.01) * 0.5;
    }
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
    game3DState.isOnFire = false;
    game3DState.fireMessageTimer = 0;
    lastPipeCenter3D = null; // Réinitialiser la position du dernier tuyau

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

    // Supprimer les anciennes étoiles filantes
    shootingStars3D.forEach(star => {
        scene3D.remove(star.mesh);
    });
    shootingStars3D = [];

    // Réinitialiser les positions des étoiles mobiles
    movingStars3D.forEach(star => {
        star.mesh.position.x = (Math.random() - 0.5) * 80;
    });

    document.getElementById('score').textContent = '0';
    document.getElementById('lives').textContent = '❤️ ' + game3DState.lives;
}

// Créer un tuyau 3D amélioré (style portail néon)
function create3DPipe() {
    const pipeHeight = 15;
    const gapSize = game3DState.currentPipeGap;

    // Calculer la distance verticale maximale autorisée entre deux portes
    const maxVerticalDistance = GAME3D_CONFIG.WORLD_HEIGHT * GAME3D_CONFIG.MAX_VERTICAL_DISTANCE_RATIO;

    let gapCenter;
    const minGapCenter = -GAME3D_CONFIG.WORLD_HEIGHT / 2 + gapSize / 2 + 2;
    const maxGapCenter = GAME3D_CONFIG.WORLD_HEIGHT / 2 - gapSize / 2 - 2;

    if (lastPipeCenter3D === null) {
        // Premier tuyau : position aléatoire
        gapCenter = (Math.random() - 0.5) * (GAME3D_CONFIG.WORLD_HEIGHT - gapSize - 4);
    } else {
        // Tuyaux suivants : limiter la distance par rapport au précédent
        const minCenter = Math.max(minGapCenter, lastPipeCenter3D - maxVerticalDistance);
        const maxCenter = Math.min(maxGapCenter, lastPipeCenter3D + maxVerticalDistance);

        // Position aléatoire dans cette plage
        gapCenter = Math.random() * (maxCenter - minCenter) + minCenter;

        // S'assurer que gapCenter reste dans les limites absolues
        gapCenter = Math.max(minGapCenter, Math.min(maxGapCenter, gapCenter));
    }

    // Sauvegarder le centre de ce tuyau pour le prochain
    lastPipeCenter3D = gapCenter;

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
    // Corps principal avec dégradé horizontal (secondary → accent → secondary)
    const topPipeGroup = new THREE.Group();

    // Cylindre principal avec couleur secondary
    const topGeometry = new THREE.CylinderGeometry(
        GAME3D_CONFIG.PIPE_WIDTH / 2,
        GAME3D_CONFIG.PIPE_WIDTH / 2,
        pipeHeight,
        12
    );

    // Appliquer le dégradé horizontal via vertex colors
    const topColors = [];
    const positionAttribute = topGeometry.getAttribute('position');
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);
        // Calculer l'angle autour du cylindre
        const angle = Math.atan2(z, x);
        // Dégradé: accent au "centre" (face caméra), secondary sur les côtés
        const t = (Math.cos(angle) + 1) / 2; // 0 à 1, max face caméra

        const r1 = (colorScheme.secondary >> 16) & 255;
        const g1 = (colorScheme.secondary >> 8) & 255;
        const b1 = colorScheme.secondary & 255;
        const r2 = (colorScheme.accent >> 16) & 255;
        const g2 = (colorScheme.accent >> 8) & 255;
        const b2 = colorScheme.accent & 255;

        const r = (r1 + (r2 - r1) * t) / 255;
        const g = (g1 + (g2 - g1) * t) / 255;
        const b = (b1 + (b2 - b1) * t) / 255;

        topColors.push(r, g, b);
    }
    topGeometry.setAttribute('color', new THREE.Float32BufferAttribute(topColors, 3));

    const pipeMaterial = new THREE.MeshPhongMaterial({
        vertexColors: true,
        emissive: colorScheme.main,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
        shininess: 80
    });

    const topPipeMesh = new THREE.Mesh(topGeometry, pipeMaterial);
    topPipeGroup.add(topPipeMesh);

    // Lignes lumineuses horizontales
    for (let i = 0; i < 4; i++) {
        const lineGeometry = new THREE.TorusGeometry(GAME3D_CONFIG.PIPE_WIDTH / 2 + 0.02, 0.03, 8, 24);
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = Math.PI / 2;
        line.position.y = -pipeHeight / 2 + pipeHeight * (i + 1) / 5;
        topPipeGroup.add(line);
    }

    topPipeGroup.position.x = 20;
    topPipeGroup.position.y = gapCenter + gapSize / 2 + pipeHeight / 2;
    scene3D.add(topPipeGroup);
    const topPipe = topPipeGroup;

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

    // === TUYAU DU BAS ===
    const bottomPipeGroup = new THREE.Group();

    // Cylindre principal avec dégradé horizontal
    const bottomGeometry = new THREE.CylinderGeometry(
        GAME3D_CONFIG.PIPE_WIDTH / 2,
        GAME3D_CONFIG.PIPE_WIDTH / 2,
        pipeHeight,
        12
    );

    // Appliquer le dégradé horizontal via vertex colors
    const bottomColors = [];
    const bottomPosAttr = bottomGeometry.getAttribute('position');
    for (let i = 0; i < bottomPosAttr.count; i++) {
        const x = bottomPosAttr.getX(i);
        const z = bottomPosAttr.getZ(i);
        const angle = Math.atan2(z, x);
        const t = (Math.cos(angle) + 1) / 2;

        const r1 = (colorScheme.secondary >> 16) & 255;
        const g1 = (colorScheme.secondary >> 8) & 255;
        const b1 = colorScheme.secondary & 255;
        const r2 = (colorScheme.accent >> 16) & 255;
        const g2 = (colorScheme.accent >> 8) & 255;
        const b2 = colorScheme.accent & 255;

        const r = (r1 + (r2 - r1) * t) / 255;
        const g = (g1 + (g2 - g1) * t) / 255;
        const b = (b1 + (b2 - b1) * t) / 255;

        bottomColors.push(r, g, b);
    }
    bottomGeometry.setAttribute('color', new THREE.Float32BufferAttribute(bottomColors, 3));

    const bottomPipeMaterial = new THREE.MeshPhongMaterial({
        vertexColors: true,
        emissive: colorScheme.main,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9,
        shininess: 80
    });

    const bottomPipeMesh = new THREE.Mesh(bottomGeometry, bottomPipeMaterial);
    bottomPipeGroup.add(bottomPipeMesh);

    // Lignes lumineuses horizontales
    for (let i = 0; i < 4; i++) {
        const lineGeometry = new THREE.TorusGeometry(GAME3D_CONFIG.PIPE_WIDTH / 2 + 0.02, 0.03, 8, 24);
        const lineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = Math.PI / 2;
        line.position.y = -pipeHeight / 2 + pipeHeight * (i + 1) / 5;
        bottomPipeGroup.add(line);
    }

    bottomPipeGroup.position.x = 20;
    bottomPipeGroup.position.y = gapCenter - gapSize / 2 - pipeHeight / 2;
    scene3D.add(bottomPipeGroup);
    const bottomPipe = bottomPipeGroup;

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

    game3DState.pipeCount++;

    // Créer un power-up tous les 5 tuyaux
    if (game3DState.pipeCount % 5 === 0 && pipes3D.length >= 1) {
        create3DPowerUp(pipes3D[pipes3D.length - 1], {
            x: 20,
            gapCenter: gapCenter,
            gapSize: gapSize
        });
    }

    // Calculer le score que ce tuyau représente
    const pipesNotPassed = pipes3D.filter(p => !p.passed).length;
    const pipeScore = game3DState.score + pipesNotPassed + 1;

    // Vérifier si ce score correspond à un score du top 10
    let scoreIndicator = null;
    let indicatorMesh = null;
    if (game3DState.topScores && game3DState.topScores.length > 0) {
        for (let i = 0; i < game3DState.topScores.length; i++) {
            if (game3DState.topScores[i].score === pipeScore) {
                scoreIndicator = {
                    name: game3DState.topScores[i].name,
                    score: game3DState.topScores[i].score,
                    rank: i + 1
                };
                // Créer un indicateur 3D
                indicatorMesh = create3DScoreIndicator(20, gapCenter, scoreIndicator);
                break;
            }
        }
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
        passed: false,
        scoreIndicator: scoreIndicator,
        indicatorMesh: indicatorMesh
    });
}

// Créer une texture de texte pour 3D
function createTextTexture(text, options = {}) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const fontSize = options.fontSize || 32;
    const fontFamily = options.fontFamily || 'Arial';
    const textColor = options.textColor || '#ffffff';
    const bgColor = options.bgColor || 'transparent';

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    const textWidth = ctx.measureText(text).width;

    canvas.width = Math.max(128, Math.pow(2, Math.ceil(Math.log2(textWidth + 20))));
    canvas.height = 64;

    if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return { texture, width: canvas.width, height: canvas.height };
}

// Créer un indicateur de score 3D (ligne verticale avec nom en bas)
function create3DScoreIndicator(x, y, scoreInfo) {
    const indicatorGroup = new THREE.Group();
    indicatorGroup.position.set(x + 3, 0, 0);

    // Ligne verticale dorée (du haut vers le bas)
    const linePoints = [];
    const topY = 12; // Haut de l'écran
    const bottomY = -8; // Juste au-dessus du sol
    for (let i = 0; i <= 20; i++) {
        linePoints.push(new THREE.Vector3(0, topY - (i * (topY - bottomY) / 20), 0));
    }
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lineMaterial = new THREE.LineDashedMaterial({
        color: 0xffdd00,
        dashSize: 0.5,
        gapSize: 0.25,
        linewidth: 2
    });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances();
    indicatorGroup.add(line);

    // Badge en bas avec nom
    const badgeY = bottomY - 0.8;

    // Fond du badge
    const badgeGeometry = new THREE.PlaneGeometry(2.5, 1);
    const badgeMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide
    });
    const badge = new THREE.Mesh(badgeGeometry, badgeMaterial);
    badge.position.set(0, badgeY, 0);
    indicatorGroup.add(badge);

    // Bordure dorée du badge
    const borderPoints = [
        new THREE.Vector3(-1.25, 0.5, 0.01),
        new THREE.Vector3(1.25, 0.5, 0.01),
        new THREE.Vector3(1.25, -0.5, 0.01),
        new THREE.Vector3(-1.25, -0.5, 0.01),
        new THREE.Vector3(-1.25, 0.5, 0.01)
    ];
    const borderGeometry = new THREE.BufferGeometry().setFromPoints(borderPoints);
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xffdd00 });
    const border = new THREE.Line(borderGeometry, borderMaterial);
    border.position.set(0, badgeY, 0);
    indicatorGroup.add(border);

    // Texte du rang
    const rankText = createTextTexture(`#${scoreInfo.rank}`, { textColor: '#ffdd00', fontSize: 28 });
    const rankMaterial = new THREE.SpriteMaterial({ map: rankText.texture, transparent: true });
    const rankSprite = new THREE.Sprite(rankMaterial);
    rankSprite.position.set(0, badgeY + 0.25, 0.1);
    rankSprite.scale.set(1.2, 0.4, 1);
    indicatorGroup.add(rankSprite);

    // Texte du nom
    const nameText = createTextTexture(scoreInfo.name.substring(0, 8), { textColor: '#ffffff', fontSize: 24 });
    const nameMaterial = new THREE.SpriteMaterial({ map: nameText.texture, transparent: true });
    const nameSprite = new THREE.Sprite(nameMaterial);
    nameSprite.position.set(0, badgeY - 0.25, 0.1);
    nameSprite.scale.set(1.5, 0.4, 1);
    indicatorGroup.add(nameSprite);

    // Lumière dorée subtile
    const light = new THREE.PointLight(0xffaa00, 0.3, 8);
    light.position.set(0, 0, 2);
    indicatorGroup.add(light);

    scene3D.add(indicatorGroup);

    // Stocker les infos
    indicatorGroup.userData = {
        name: scoreInfo.name,
        rank: scoreInfo.rank,
        score: scoreInfo.score
    };

    return indicatorGroup;
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
        // Saut constant (comme en 2D)
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

        // Animation des ailes (battement)
        const wingRight = bird3D.getObjectByName('wingRight');
        const wingLeft = bird3D.getObjectByName('wingLeft');
        const wingAngle = Math.sin(currentTime * 0.02) * 0.6;

        if (wingRight) {
            wingRight.rotation.x = wingAngle;
            wingRight.position.y = 0.2 + Math.sin(currentTime * 0.02) * 0.15;
        }
        if (wingLeft) {
            wingLeft.rotation.x = -wingAngle;
            wingLeft.position.y = 0.2 + Math.sin(currentTime * 0.02) * 0.15;
        }

        // Animation de la traînée
        const trail = bird3D.getObjectByName('trail');
        if (trail) {
            trail.material.opacity = 0.3 + Math.abs(game3DState.birdVelocity) * 0.5;
            trail.scale.x = 1 + Math.abs(game3DState.birdVelocity) * 2;
        }

        // Animation de l'effet de feu si actif
        updateFireEffect3D(currentTime);

        // Calculer la vitesse avec modificateurs de power-up
        let speedMultiplier = 1;
        if (game3DState.activePowerUp === 'SLOW') {
            speedMultiplier = 0.5;
        } else if (game3DState.activePowerUp === 'FAST') {
            speedMultiplier = 1.5;
        }

        // God Mode : vitesse x2
        if (cheatGodMode) {
            speedMultiplier *= 2;
        }

        const speed = (GAME3D_CONFIG.PIPE_SPEED + (game3DState.score * GAME3D_CONFIG.SPEED_INCREASE_RATE)) * speedMultiplier;

        // Spawn des tuyaux (basé sur la DISTANCE parcourue, pas le temps)
        // L'espacement augmente avec la vitesse pour garder le jeu jouable
        game3DState.pipeSpawnAccumulator += speed * deltaMultiplier;

        // Espacement dynamique : augmente avec la vitesse actuelle
        // Plus c'est rapide, plus les tuyaux sont espacés
        const speedRatio = speed / GAME3D_CONFIG.PIPE_SPEED; // 1.0 au début, augmente avec le score
        const dynamicInterval = GAME3D_CONFIG.SPAWN_INTERVAL * speedRatio;
        const PIPE_SPAWN_DISTANCE_3D = GAME3D_CONFIG.PIPE_SPEED * dynamicInterval;

        if (game3DState.pipeSpawnAccumulator >= PIPE_SPAWN_DISTANCE_3D) {
            game3DState.pipeSpawnAccumulator -= PIPE_SPAWN_DISTANCE_3D;
            create3DPipe();
        }

        // Mettre à jour les tuyaux
        pipes3D.forEach((pipe, index) => {
            pipe.top.position.x -= speed * deltaMultiplier;
            pipe.bottom.position.x -= speed * deltaMultiplier;

            // Déplacer les éléments décoratifs
            if (pipe.topRing) pipe.topRing.position.x -= speed * deltaMultiplier;
            if (pipe.bottomRing) pipe.bottomRing.position.x -= speed * deltaMultiplier;
            if (pipe.topGlow) pipe.topGlow.position.x -= speed * deltaMultiplier;
            if (pipe.bottomGlow) pipe.bottomGlow.position.x -= speed * deltaMultiplier;
            if (pipe.indicatorMesh) pipe.indicatorMesh.position.x -= speed * deltaMultiplier;

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

                // Vérifier si on dépasse le meilleur score (effet de feu)
                if (!game3DState.isOnFire && game3DState.score > game3DState.currentHighScore && game3DState.currentHighScore > 0) {
                    game3DState.isOnFire = true;
                    game3DState.fireMessageTimer = 90; // 1.5 secondes
                    activateFireEffect3D();
                    console.log('🔥 ON FIRE 3D! Nouveau record de', game3DState.currentHighScoreHolder, 'battu!');
                }
            }

            // Supprimer les tuyaux hors écran
            if (pipe.top.position.x < -25) {
                scene3D.remove(pipe.top);
                scene3D.remove(pipe.bottom);
                if (pipe.topRing) scene3D.remove(pipe.topRing);
                if (pipe.bottomRing) scene3D.remove(pipe.bottomRing);
                if (pipe.topGlow) scene3D.remove(pipe.topGlow);
                if (pipe.bottomGlow) scene3D.remove(pipe.bottomGlow);
                if (pipe.indicatorMesh) scene3D.remove(pipe.indicatorMesh);
                pipes3D.splice(index, 1);
            }
        });

        // Mettre à jour les power-ups
        update3DPowerUps(speed, deltaMultiplier);

        // Mettre à jour le décor de la grotte
        updateCaveWalls(speed, deltaMultiplier);

        // Mettre à jour les étoiles mobiles avec traînée
        update3DMovingStars(deltaMultiplier, speed);

        // Mettre à jour les étoiles filantes occasionnelles
        update3DShootingStars(deltaMultiplier, speed);

        // Créer de nouvelles étoiles filantes occasionnellement
        if (Math.random() < 0.008) {
            create3DShootingStar();
        }

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
            // God Mode : +1 score au lieu de perdre une vie, pas de reset position
            if (cheatGodMode) {
                game3DState.score++;
                document.getElementById('score').textContent = game3DState.score;
                playScoreSound();
            } else {
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
    }

    // Afficher le HUD du power-up actif
    draw3DActivePowerUp();

    // Afficher le message de record battu
    draw3DFireMessage();

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
            ${game3DState.score > 0 ? '<button onclick="submit3DScore()">✓ ENREGISTRER</button>' : ''}
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
async function start3DGame() {
    // Sauvegarder le nom du joueur
    game3DState.playerName = document.getElementById('playerNameStart').value.trim().toUpperCase() || 'JOUEUR';

    // Charger les meilleurs scores pour l'effet de feu et les indicateurs
    const highScores = await getHighScores('3d');
    game3DState.topScores = highScores.filter(s => s.score > 0);
    game3DState.currentHighScore = highScores[0] ? highScores[0].score : 0;
    game3DState.currentHighScoreHolder = highScores[0] ? highScores[0].name : '';

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

// Afficher le message de record battu en 3D
function draw3DFireMessage() {
    if (game3DState.fireMessageTimer <= 0) return;

    game3DState.fireMessageTimer--;

    let messageElement = document.getElementById('fire-message-3d');
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'fire-message-3d';
        messageElement.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 100;
            pointer-events: none;
        `;
        document.getElementById('gameContainer').appendChild(messageElement);
    }

    const alpha = Math.min(1, game3DState.fireMessageTimer / 30);
    const scale = 1 + (180 - game3DState.fireMessageTimer) / 500;

    messageElement.innerHTML = `
        <div style="font-size: ${36 * scale}px; font-weight: bold; color: #ff6600;
                    text-shadow: 0 0 20px #ff4400, 0 0 40px #ff0000; opacity: ${alpha};">
            RECORD DE ${game3DState.currentHighScoreHolder} BATTU!
        </div>
        <div style="font-size: ${24 * scale}px; color: #ffffff;
                    text-shadow: 0 0 10px #ffaa00; margin-top: 10px; opacity: ${alpha};">
            Ancien record: ${game3DState.currentHighScore} points
        </div>
    `;
    messageElement.style.display = 'block';

    if (game3DState.fireMessageTimer <= 0) {
        messageElement.style.display = 'none';
    }
}

// Créer les étoiles mobiles avec traînée (3 couches comme en 2D)
function create3DMovingStars() {
    movingStars3D = [];

    // Couleurs réalistes d'étoiles
    const starColors = [0xffffff, 0xcad7ff, 0xfff4e8, 0xffd2a1, 0xffcccc, 0xaaccff];

    // Layer 0: Étoiles de fond lentes (petites)
    for (let i = 0; i < 80; i++) {
        const starGroup = new THREE.Group();
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * GAME3D_CONFIG.WORLD_HEIGHT * 1.5;
        const z = -10 - Math.random() * 40;

        starGroup.position.set(x, y, z);

        const starGeometry = new THREE.SphereGeometry(0.05, 6, 6);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4 + Math.random() * 0.3
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        starGroup.add(star);

        scene3D.add(starGroup);
        movingStars3D.push({
            mesh: starGroup,
            speed: 0.02 + Math.random() * 0.03,
            layer: 0,
            baseOpacity: 0.4 + Math.random() * 0.3,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.02 + Math.random() * 0.02
        });
    }

    // Layer 1: Étoiles moyennes colorées
    for (let i = 0; i < 50; i++) {
        const starGroup = new THREE.Group();
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * GAME3D_CONFIG.WORLD_HEIGHT * 1.5;
        const z = -5 - Math.random() * 25;

        starGroup.position.set(x, y, z);

        const color = starColors[Math.floor(Math.random() * starColors.length)];
        const starGeometry = new THREE.SphereGeometry(0.08, 8, 8);
        const starMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.5 + Math.random() * 0.3
        });
        const star = new THREE.Mesh(starGeometry, starMaterial);
        starGroup.add(star);

        scene3D.add(starGroup);
        movingStars3D.push({
            mesh: starGroup,
            speed: 0.04 + Math.random() * 0.06,
            layer: 1,
            baseOpacity: 0.5 + Math.random() * 0.3,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.04 + Math.random() * 0.04
        });
    }

    // Layer 2: Étoiles rapides avec traînée
    for (let i = 0; i < 25; i++) {
        const starGroup = new THREE.Group();
        const x = (Math.random() - 0.5) * 80;
        const y = (Math.random() - 0.5) * GAME3D_CONFIG.WORLD_HEIGHT * 1.2;
        const z = -2 - Math.random() * 15;

        starGroup.position.set(x, y, z);

        // Tête de l'étoile
        const headGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const headMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.95
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        starGroup.add(head);

        // Traînée de l'étoile (plusieurs segments)
        const trailLength = 0.8 + Math.random() * 0.6;
        for (let j = 1; j <= 6; j++) {
            const segmentGeometry = new THREE.SphereGeometry(0.08 * (1 - j * 0.12), 6, 6);
            const segmentMaterial = new THREE.MeshBasicMaterial({
                color: j < 3 ? 0xffffff : 0xaaccff,
                transparent: true,
                opacity: 0.8 - j * 0.12
            });
            const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
            segment.position.x = j * (trailLength / 6);
            starGroup.add(segment);
        }

        scene3D.add(starGroup);
        movingStars3D.push({
            mesh: starGroup,
            speed: 0.15 + Math.random() * 0.2,
            layer: 2,
            baseOpacity: 0.95,
            twinklePhase: 0,
            twinkleSpeed: 0
        });
    }
}

// Mettre à jour les étoiles mobiles
function update3DMovingStars(deltaMultiplier, gameSpeed) {
    const baseSpeed = gameSpeed || 0.08;

    movingStars3D.forEach(star => {
        // Déplacer l'étoile vers la gauche
        star.mesh.position.x -= star.speed * deltaMultiplier * (baseSpeed / 0.08);

        // Réapparaître à droite si sortie de l'écran
        if (star.mesh.position.x < -50) {
            star.mesh.position.x = 50 + Math.random() * 20;
            star.mesh.position.y = (Math.random() - 0.5) * GAME3D_CONFIG.WORLD_HEIGHT * 1.5;
        }

        // Scintillement pour les layers 0 et 1
        if (star.twinkleSpeed > 0) {
            star.twinklePhase += star.twinkleSpeed * deltaMultiplier;
            const twinkle = 0.7 + 0.3 * Math.sin(star.twinklePhase);
            if (star.mesh.children[0] && star.mesh.children[0].material) {
                star.mesh.children[0].material.opacity = star.baseOpacity * twinkle;
            }
        }
    });
}

// Créer une étoile filante 3D
function create3DShootingStar() {
    if (shootingStars3D.length >= 3) return; // Maximum 3 étoiles à la fois

    const starGroup = new THREE.Group();

    // Position de départ (côté droit, hauteur aléatoire)
    const startX = 30 + Math.random() * 20;
    const startY = (Math.random() - 0.3) * GAME3D_CONFIG.WORLD_HEIGHT;
    const startZ = -20 - Math.random() * 30;

    starGroup.position.set(startX, startY, startZ);

    // Tête de l'étoile (brillante)
    const headGeometry = new THREE.SphereGeometry(0.15, 8, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    starGroup.add(head);

    // Traînée de l'étoile (plusieurs segments)
    const trailLength = 8 + Math.random() * 6;
    for (let i = 1; i <= 10; i++) {
        const segmentGeometry = new THREE.SphereGeometry(0.12 * (1 - i * 0.08), 6, 6);
        const segmentMaterial = new THREE.MeshBasicMaterial({
            color: i < 4 ? 0xaaccff : 0x6688cc,
            transparent: true,
            opacity: 1 - i * 0.09
        });
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        segment.position.set(i * (trailLength / 10), i * 0.1, 0);
        starGroup.add(segment);
    }

    // Lueur autour de la tête
    const glowGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaddff,
        transparent: true,
        opacity: 0.4
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    starGroup.add(glow);

    scene3D.add(starGroup);

    shootingStars3D.push({
        mesh: starGroup,
        speed: 0.3 + Math.random() * 0.4,
        angle: Math.PI + (Math.random() - 0.5) * 0.4, // Vers la gauche avec légère variation
        life: 1.0
    });
}

// Mettre à jour les étoiles filantes 3D
function update3DShootingStars(deltaMultiplier, gameSpeed) {
    for (let i = shootingStars3D.length - 1; i >= 0; i--) {
        const star = shootingStars3D[i];

        // Mouvement
        const moveSpeed = star.speed * deltaMultiplier * 2;
        star.mesh.position.x += Math.cos(star.angle) * moveSpeed;
        star.mesh.position.y += Math.sin(star.angle) * moveSpeed * 0.3;

        // Diminuer la vie
        star.life -= 0.008 * deltaMultiplier;

        // Mettre à jour l'opacité de tous les enfants
        star.mesh.children.forEach((child, index) => {
            if (child.material) {
                child.material.opacity = star.life * (1 - index * 0.08);
            }
        });

        // Supprimer si hors écran ou vie épuisée
        if (star.life <= 0 || star.mesh.position.x < -50) {
            scene3D.remove(star.mesh);
            shootingStars3D.splice(i, 1);
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
    shootingStars3D = [];
    movingStars3D = [];
    backgroundStars3D = null;

    window.removeEventListener('resize', on3DResize);
}
