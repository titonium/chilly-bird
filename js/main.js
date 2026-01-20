// ===== INITIALISATION DU JEU =====

// Récupérer les éléments du DOM
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Détecter si on est sur mobile
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
           || window.innerWidth <= 768;
}

// Détecter l'orientation
function isPortrait() {
    return window.innerHeight > window.innerWidth;
}

// Résolutions adaptatives
function getResolution() {
    if (isMobile()) {
        if (isPortrait()) {
            // Mobile portrait : résolution verticale
            return { width: 608, height: 1080 };
        } else {
            // Mobile paysage : résolution horizontale réduite
            return { width: 1280, height: 720 };
        }
    } else {
        // Desktop : résolution standard
        return { width: 1920, height: 1080 };
    }
}

let currentResolution = getResolution();
let FIXED_WIDTH = currentResolution.width;
let FIXED_HEIGHT = currentResolution.height;

// Redimensionner le canvas avec résolution adaptative
function resizeCanvas() {
    // Recalculer la résolution si l'orientation change
    const newResolution = getResolution();

    if (newResolution.width !== FIXED_WIDTH || newResolution.height !== FIXED_HEIGHT) {
        FIXED_WIDTH = newResolution.width;
        FIXED_HEIGHT = newResolution.height;

        // Recréer les étoiles pour la nouvelle résolution
        if (typeof createStars === 'function') {
            createStars();
        }
    }

    // Appliquer la résolution au canvas
    canvas.width = FIXED_WIDTH;
    canvas.height = FIXED_HEIGHT;

    // Calcul du ratio pour garder les proportions
    const windowRatio = window.innerWidth / window.innerHeight;
    const canvasRatio = FIXED_WIDTH / FIXED_HEIGHT;

    let width, height;

    if (windowRatio > canvasRatio) {
        // Fenêtre plus large : limiter par la hauteur
        height = window.innerHeight;
        width = height * canvasRatio;
    } else {
        // Fenêtre plus haute : limiter par la largeur
        width = window.innerWidth;
        height = width / canvasRatio;
    }

    // Appliquer le scaling CSS
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Centrer le canvas
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'flex';
    gameContainer.style.justifyContent = 'center';
    gameContainer.style.alignItems = 'center';

    // Mettre à jour les dimensions du jeu
    if (typeof updateGameDimensions === 'function') {
        updateGameDimensions();
    }

    // Position initiale de l'oiseau
    if (gameState && gameState.bird) {
        gameState.bird.y = FIXED_HEIGHT / 2;
    }

    console.log(`📱 Résolution: ${FIXED_WIDTH}x${FIXED_HEIGHT} (${isMobile() ? 'Mobile' : 'Desktop'} ${isPortrait() ? 'Portrait' : 'Paysage'})`);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', () => {
    setTimeout(resizeCanvas, 100); // Délai pour laisser l'orientation se stabiliser
});

// Empêcher le zoom sur mobile
document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

document.addEventListener('gesturechange', function(e) {
    e.preventDefault();
});

document.addEventListener('gestureend', function(e) {
    e.preventDefault();
});

// Empêcher le comportement par défaut du touch
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        e.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Empêcher le zoom avec Ctrl+Molette et pinch
document.addEventListener('wheel', function(e) {
    if (e.ctrlKey) {
        e.preventDefault();
    }
}, { passive: false });

// Charger la version depuis version.json
async function loadVersion() {
    try {
        const response = await fetch('version.json');
        const data = await response.json();
        document.getElementById('version').textContent = 'v' + data.version;
    } catch (error) {
        console.warn('Impossible de charger la version:', error);
    }
}

loadVersion();

// Initialiser Firebase
initFirebase();

// Créer les étoiles
createStars();

// Particules de fond désactivées (effet galaxie dans le canvas)

// Charger le nom du joueur sauvegardé
function loadSavedPlayerName() {
    const savedName = localStorage.getItem('chillyBirdPlayerName');
    if (savedName) {
        document.getElementById('playerNameStart').value = savedName;
    }
}

loadSavedPlayerName();

// Afficher les high scores au chargement
showHighScores();

// Gestion des événements avec conversion des coordonnées
function getCanvasCoordinates(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = FIXED_WIDTH / rect.width;
    const scaleY = FIXED_HEIGHT / rect.height;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// Clic sur le canvas
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    if (gameState.started && !gameState.over) {
        jump();
    }
});

// Touch sur le canvas (mobile)
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameState.started && !gameState.over) {
        jump();
    }
}, { passive: false });

// Touches du clavier
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (gameState.started && !gameState.over) {
            jump();
        }
    }

    if (e.code === 'Enter') {
        // Si on est sur l'écran de bienvenue
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen && welcomeScreen.style.display !== 'none') {
            startWithName();
        }
    }
});

// Démarrer la boucle de jeu
gameLoop();

// Log de démarrage
console.log('%c🎮 CHILLY BIRD 🐦', 'font-size: 24px; color: #00ffff; font-weight: bold;');
console.log('%c❄️ Jeu chargé avec succès!', 'font-size: 16px; color: #ff00ff;');
console.log(`%c📐 Résolution fixe: ${FIXED_WIDTH}x${FIXED_HEIGHT}`, 'font-size: 14px; color: #ffbe0b;');
console.log(`%c📦 Version: ${document.getElementById('version').textContent}`, 'font-size: 14px; color: #00ffff;');
if (firebaseInitialized) {
    console.log('%c🌐 Scores mondiaux actifs', 'font-size: 14px; color: #00ff88;');
} else {
    console.log('%c📱 Mode local (Firebase indisponible)', 'font-size: 14px; color: #ffaa00;');
}