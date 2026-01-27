// ===== GESTION DU MENU =====

// Mode de jeu actuel ('2d' ou '3d')
let currentGameMode = '2d';

// Cheat code : God Mode (vies infinies)
let cheatGodMode = false;
let cheatKeyCount = 0;
let cheatKeyTimer = null;

// Détecter le cheat code (H H H dans le menu)
document.addEventListener('keydown', function(e) {
    // Seulement dans le menu principal
    const mainMenu = document.getElementById('mainMenu');
    if (mainMenu.style.display === 'none') {
        return;
    }

    if (e.key.toLowerCase() === 'h') {
        cheatKeyCount++;

        // Reset le timer
        if (cheatKeyTimer) clearTimeout(cheatKeyTimer);
        cheatKeyTimer = setTimeout(() => { cheatKeyCount = 0; }, 1000);

        // 3 pressions = activation/désactivation
        if (cheatKeyCount >= 3) {
            cheatGodMode = !cheatGodMode;
            cheatKeyCount = 0;

            // Feedback visuel
            const mainMenuTitle = mainMenu.querySelector('h2');
            if (cheatGodMode) {
                mainMenuTitle.style.color = '#ff0000';
                mainMenuTitle.textContent = 'CHILLY BIRD [GOD MODE]';
                console.log('🔥 GOD MODE ACTIVATED');
            } else {
                mainMenuTitle.style.color = '';
                mainMenuTitle.textContent = 'CHILLY BIRD';
                console.log('❄️ GOD MODE DEACTIVATED');
            }
        }
    }
});

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
