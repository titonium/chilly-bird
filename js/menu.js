// ===== GESTION DU MENU =====

// Mode de jeu actuel ('2d' ou '3d')
let currentGameMode = '2d';

// Afficher l'écran de sélection du mode de jeu
function showGameModeScreen(mode) {
    currentGameMode = mode;

    // Mettre à jour le label du mode
    document.getElementById('gameModeLabel').textContent = mode.toUpperCase();

    // Cacher le menu principal
    document.getElementById('mainMenu').style.display = 'none';

    // Afficher l'écran de bienvenue avec saisie du nom
    document.getElementById('welcomeScreen').style.display = 'block';
}

// Afficher l'écran des scores
function showScoresScreen() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('scoresScreen').style.display = 'block';
    showHighScores();
}

// Retourner au menu principal
function backToMainMenu() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('scoresScreen').style.display = 'none';
    document.getElementById('message').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'block';

    // Arrêter le jeu 3D si actif
    if (typeof stop3DGame === 'function') {
        stop3DGame();
    }

    // Réinitialiser l'état du jeu 2D
    gameState.started = false;
    gameState.over = false;
}

// Surcharger la fonction restart pour retourner au menu
const originalRestart = typeof restart === 'function' ? restart : null;

function restart() {
    // Réafficher le menu principal au lieu de l'écran de bienvenue
    document.getElementById('message').style.display = 'none';

    // Arrêter le jeu 3D si actif
    if (typeof stop3DGame === 'function') {
        stop3DGame();
    }

    backToMainMenu();
}
