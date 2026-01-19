// ===== INITIALISATION DU JEU =====

// Récupérer les éléments du DOM
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Redimensionner le canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gameState.bird.y = canvas.height / 2;
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

// Gestion des événements

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
if (firebaseInitialized) {
    console.log('%c🌐 Scores mondiaux actifs', 'font-size: 14px; color: #00ff88;');
} else {
    console.log('%c📱 Mode local (Firebase indisponible)', 'font-size: 14px; color: #ffaa00;');
}