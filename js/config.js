// ===== CONFIGURATION DU JEU =====

// ⚠️ La configuration Firebase est maintenant dans firebase-config.js (non commité)

// Résolution de référence (desktop)
const REFERENCE_WIDTH = 1920;
const REFERENCE_HEIGHT = 1080;

// Ratios fixes pour le gameplay (basés sur la résolution de référence)
// Ces valeurs sont des PROPORTIONS pour garantir une difficulté identique sur tous les appareils
const GAMEPLAY_RATIOS = {
    PIPE_GAP_RATIO: 160 / 1080,        // 18.5% de la hauteur = espace entre les tuyaux
    PIPE_GAP_WIDE_RATIO: 280 / 1080,   // 26% de la hauteur = espace avec powerup WIDE
    PIPE_SPACING_RATIO: 500 / 1920     // 26% de la largeur = distance entre les paires de tuyaux
};

// Constantes de base du jeu (pour résolution de référence 1920x1080)
const BASE_CONFIG = {
    PIPE_WIDTH: 80,
    BASE_PIPE_GAP: 100,
    BASE_PIPE_SPEED: 3,
    GROUND_HEIGHT: 80,
    BIRD_WIDTH: 50,
    BIRD_HEIGHT: 40,
    BIRD_GRAVITY: 0.4,
    BIRD_JUMP_POWER: -8,
    STARTING_LIVES: 2,
    PIPE_SPAWN_INTERVAL: 150,
    SPEED_INCREASE_RATE: 0.05,
    MOVING_PIPES_START_SCORE: 5,
    MOVING_PIPES_BASE_PROBABILITY: 0.30,
    MOVING_PIPES_INCREASE: 0.15,
    MOVING_PIPES_MAX_PROBABILITY: 0.90
};

// Fonction pour obtenir le facteur d'échelle (pour les éléments visuels uniquement)
function getScaleFactor() {
    if (typeof FIXED_WIDTH === 'undefined' || typeof FIXED_HEIGHT === 'undefined') {
        return 1;
    }
    // Utiliser la plus petite dimension pour le scaling
    const widthScale = FIXED_WIDTH / REFERENCE_WIDTH;
    const heightScale = FIXED_HEIGHT / REFERENCE_HEIGHT;
    return Math.min(widthScale, heightScale);
}

// Configuration dynamique qui s'adapte à la résolution
const GAME_CONFIG = {
    get PIPE_WIDTH() { return Math.round(BASE_CONFIG.PIPE_WIDTH * getScaleFactor()); },
    // Gap vertical : proportion FIXE de la hauteur de l'écran (identique sur tous les appareils)
    get BASE_PIPE_GAP() {
        if (typeof FIXED_HEIGHT === 'undefined') return BASE_CONFIG.BASE_PIPE_GAP;
        return Math.round(FIXED_HEIGHT * GAMEPLAY_RATIOS.PIPE_GAP_RATIO);
    },
    // Gap élargi pour le powerup WIDE
    get WIDE_PIPE_GAP() {
        if (typeof FIXED_HEIGHT === 'undefined') return 280;
        return Math.round(FIXED_HEIGHT * GAMEPLAY_RATIOS.PIPE_GAP_WIDE_RATIO);
    },
    get BASE_PIPE_SPEED() {
        // Vitesse proportionnelle à la HAUTEUR (cohérent avec la physique de l'oiseau)
        // Ainsi desktop et mobile portrait ont la même vitesse car même hauteur (1080)
        if (typeof FIXED_HEIGHT === 'undefined') return BASE_CONFIG.BASE_PIPE_SPEED;
        return BASE_CONFIG.BASE_PIPE_SPEED * (FIXED_HEIGHT / REFERENCE_HEIGHT);
    },
    get GROUND_HEIGHT() { return Math.round(BASE_CONFIG.GROUND_HEIGHT * getScaleFactor()); },
    get BIRD_WIDTH() { return Math.round(BASE_CONFIG.BIRD_WIDTH * getScaleFactor()); },
    get BIRD_HEIGHT() { return Math.round(BASE_CONFIG.BIRD_HEIGHT * getScaleFactor()); },
    // Gravité et saut proportionnels à la HAUTEUR de l'écran (pas au scale factor minimum)
    // Cela permet à l'oiseau de couvrir la même proportion verticale sur tous les appareils
    get BIRD_GRAVITY() {
        if (typeof FIXED_HEIGHT === 'undefined') return BASE_CONFIG.BIRD_GRAVITY;
        return BASE_CONFIG.BIRD_GRAVITY * (FIXED_HEIGHT / REFERENCE_HEIGHT);
    },
    get BIRD_JUMP_POWER() {
        if (typeof FIXED_HEIGHT === 'undefined') return BASE_CONFIG.BIRD_JUMP_POWER;
        return BASE_CONFIG.BIRD_JUMP_POWER * (FIXED_HEIGHT / REFERENCE_HEIGHT);
    },
    get STARTING_LIVES() { return BASE_CONFIG.STARTING_LIVES; },
    // Intervalle FIXE en frames (ne dépend plus de la résolution)
    get PIPE_SPAWN_INTERVAL() { return BASE_CONFIG.PIPE_SPAWN_INTERVAL; },
    // L'augmentation de vitesse est proportionnelle à la hauteur (cohérent avec BASE_PIPE_SPEED)
    get SPEED_INCREASE_RATE() {
        if (typeof FIXED_HEIGHT === 'undefined') return BASE_CONFIG.SPEED_INCREASE_RATE;
        return BASE_CONFIG.SPEED_INCREASE_RATE * (FIXED_HEIGHT / REFERENCE_HEIGHT);
    },
    get MOVING_PIPES_START_SCORE() { return BASE_CONFIG.MOVING_PIPES_START_SCORE; },
    get MOVING_PIPES_BASE_PROBABILITY() { return BASE_CONFIG.MOVING_PIPES_BASE_PROBABILITY; },
    get MOVING_PIPES_INCREASE() { return BASE_CONFIG.MOVING_PIPES_INCREASE; },
    get MOVING_PIPES_MAX_PROBABILITY() { return BASE_CONFIG.MOVING_PIPES_MAX_PROBABILITY; }
};

// Messages humoristiques
const FUNNY_MESSAGES = [
    "{name}, tu voles comme une brique ! 🧱",
    "Même un pingouin ferait mieux que toi, {name} ! 🐧",
    "La gravité a gagné... encore, {name} ! 🪐",
    "{name}, barre espace cassée ou juste maladroit ? 🤔",
    "Mon grand-père ferait mieux, {name}... et il a 95 ans ! 👴",
    "{name}, c'était un vol ou une chute contrôlée ? 🛬",
    "Bravo {name} ! Tu as trouvé TOUS les obstacles ! 🎯",
    "{name}, la physique n'est pas ton fort... 📚",
    "Icarus 2.0 : Le retour de {name} ! ☀️",
    "{name}, peut-être essayer la marche à pied ? 🚶",
    "Les tuyaux te manquaient, {name} ? Tu les as tous touchés ! 🔧",
    "{name}, score : {score} | Talent : -999 😅",
    "NASA appelée, {name} : ils ne te veulent pas ! 🚀",
    "Nouveau record de {name}... de médiocrité ! 🏆",
    "Même un cactus volerait mieux que toi, {name} ! 🌵",
    "{name}, tu confonds 'voler' et 'plonger' ! 🤿",
    "{name}, Ctrl+Z ne marche pas dans la vraie vie ! ⌨️",
    "Les oiseaux pleurent en te regardant jouer, {name} ! 😭",
    "Félicitations {name} ! Tu es maintenant un pancake ! 🥞",
    "{name}, essaye avec les yeux ouverts la prochaine fois ! 👀"
];

// Configuration des power-ups
const POWERUP_TYPES = {
    LIFE: {
        color: '#ff0066',
        icon: '❤️',
        label: '+1 VIE',
        effect: () => {
            gameState.lives++;
            document.getElementById('lives').textContent = '❤️ ' + gameState.lives;
        }
    },
    SLOW: {
        color: '#00ccff',
        icon: '🐌',
        label: 'SLOW',
        duration: 300, // frames (5 secondes à 60fps)
        effect: () => {
            gameState.activePowerUp = 'SLOW';
            gameState.powerUpTimer = 300;
        }
    },
    FAST: {
        color: '#ffaa00',
        icon: '⚡',
        label: 'SPEED',
        duration: 180, // frames (3 secondes)
        effect: () => {
            gameState.activePowerUp = 'FAST';
            gameState.powerUpTimer = 180;
        }
    },
    WIDE: {
        color: '#00ff88',
        icon: '↔️',
        label: 'LARGE',
        duration: 300, // frames
        effect: () => {
            gameState.activePowerUp = 'WIDE';
            gameState.powerUpTimer = 300;
            gameState.pipeGap = GAME_CONFIG.WIDE_PIPE_GAP;
        }
    }
};