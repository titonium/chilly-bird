// ===== INITIALISATION DU JEU =====

// Récupérer les éléments du DOM
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// ✅ RÉSOLUTION FIXE - Identique pour tous
const FIXED_WIDTH = 1920;
const FIXED_HEIGHT = 1080;

// Redimensionner le canvas avec résolution fixe
function resizeCanvas() {
    // ✅ Taille logique fixe (ne change jamais)
    canvas.width = FIXED_WIDTH;
    canvas.height = FIXED_HEIGHT;
    
    // ✅ Calcul du ratio pour garder les proportions
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
    
    // ✅ Appliquer le scaling CSS (visuel uniquement)
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    
    // Centrer le canvas
    const gameContainer = document.getElementById('gameContainer');
    gameContainer.style.display = 'flex';
    gameContainer.style.justifyContent = 'center';
    gameContainer.style.alignItems = 'center';
    
    // Position initiale de l'oiseau
    gameState.bird.y = FIXED_HEIGHT / 2;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

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

// Initialiser Firebase
initFirebase();

// Créer les étoiles
createStars();

// Créer les particules de fond
function createBackgroundParticles() {
    const particlesContainer = document.getElementById('particles');
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's';
        particle.style.animationDelay = Math.random() * 2 + 's';
        particle.style.opacity = Math.random() * 0.5 + 0.3;
        particlesContainer.appendChild(particle);
    }
}

createBackgroundParticles();

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
if (firebaseInitialized) {
    console.log('%c🌐 Scores mondiaux actifs', 'font-size: 14px; color: #00ff88;');
} else {
    console.log('%c📱 Mode local (Firebase indisponible)', 'font-size: 14px; color: #ffaa00;');
}