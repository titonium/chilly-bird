// ===== GESTION FIREBASE =====

let database = null;
let firebaseInitialized = false;

// Initialiser Firebase
function initFirebase() {
    try {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        database = firebase.database();
        firebaseInitialized = true;
        console.log('✅ Firebase initialisé avec succès');
    } catch (error) {
        console.error('❌ Erreur Firebase:', error);
        console.log('📱 Utilisation du localStorage en fallback');
    }
}

// Récupérer les high scores
async function getHighScores() {
    if (!firebaseInitialized) {
        // Fallback localStorage
        const scores = localStorage.getItem('chillyBirdScores');
        return scores ? JSON.parse(scores) : [
            { name: '---', score: 0 },
            { name: '---', score: 0 },
            { name: '---', score: 0 }
        ];
    }

    try {
        const snapshot = await database.ref('highscores')
            .orderByChild('score')
            .limitToLast(5)
            .once('value');
        
        const scores = [];
        snapshot.forEach(childSnapshot => {
            scores.push(childSnapshot.val());
        });

        // Inverser pour avoir du plus grand au plus petit
        scores.reverse();

        // Remplir avec des scores vides si moins de 5
        while (scores.length < 5) {
            scores.push({ name: '---', score: 0 });
        }

        return scores;
    } catch (error) {
        console.error('Erreur lors de la récupération des scores:', error);
        // Fallback localStorage
        const scores = localStorage.getItem('chillyBirdScores');
        return scores ? JSON.parse(scores) : [
            { name: '---', score: 0 },
            { name: '---', score: 0 },
            { name: '---', score: 0 }
        ];
    }
}

// Sauvegarder les high scores
async function saveHighScores(scores) {
    // Toujours sauvegarder en local aussi
    localStorage.setItem('chillyBirdScores', JSON.stringify(scores));

    if (!firebaseInitialized) return;

    try {
        // Ne garder que les 10 meilleurs scores dans Firebase
        const updates = {};
        scores.slice(0, 10).forEach((scoreEntry, index) => {
            updates[`highscores/${Date.now()}_${index}`] = scoreEntry;
        });

        await database.ref().update(updates);
        console.log('✅ Score sauvegardé dans Firebase');
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

// Vérifier si c'est un high score
async function isHighScore(score) {
    const highScores = await getHighScores();
    // Accepter tout score > 0 si les scores sont vides
    if (highScores[2].score === 0 && score > 0) {
        return true;
    }
    return score > highScores[2].score;
}

// Ajouter un high score
async function addHighScore(name, score) {
    const highScores = await getHighScores();
    highScores.push({ name: name.toUpperCase(), score: score });
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(10); // Garder top 10
    await saveHighScores(highScores);
    await showHighScores(); // Rafraîchir l'affichage
}

// Afficher les high scores
async function showHighScores() {
    const highScores = await getHighScores();
    const scoresList = document.getElementById('scoresList');
    const statusEl = document.getElementById('firebaseStatus');

    if (!scoresList) return;

    scoresList.innerHTML = '';

    highScores.slice(0, 5).forEach((entry, index) => {
        const div = document.createElement('div');
        div.className = 'scoreEntry';
        div.innerHTML = `
            <span class="rank">#${index + 1}</span>
            <span class="name">${entry.name}</span>
            <span class="scoreValue">${entry.score}</span>
        `;
        scoresList.appendChild(div);
    });

    // Mettre à jour le statut
    if (statusEl) {
        if (firebaseInitialized) {
            statusEl.textContent = '🌐 Scores mondiaux en temps réel';
            statusEl.style.color = '#00ff88';
        } else {
            statusEl.textContent = '📱 Scores locaux (Firebase indisponible)';
            statusEl.style.color = '#ffaa00';
        }
    }
}

// Sauvegarder le score en cours
function saveCurrentScore() {
    if (gameState.started && !gameState.over) {
        localStorage.setItem('chillyBirdCurrentScore', gameState.score);
        localStorage.setItem('chillyBirdCurrentLives', gameState.lives);
    }
}

// Charger le score en cours
function loadCurrentScore() {
    const savedScore = localStorage.getItem('chillyBirdCurrentScore');
    const savedLives = localStorage.getItem('chillyBirdCurrentLives');
    if (savedScore !== null) {
        gameState.score = parseInt(savedScore);
        gameState.lives = parseInt(savedLives);
        document.getElementById('score').textContent = gameState.score;
        document.getElementById('lives').textContent = '❤️ ' + gameState.lives;
    }
}

// Effacer le score en cours
function clearCurrentScore() {
    localStorage.removeItem('chillyBirdCurrentScore');
    localStorage.removeItem('chillyBirdCurrentLives');
}

// Récupérer un message humoristique aléatoire
function getRandomFunnyMessage() {
    const message = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)];
    return message
        .replace(/{name}/g, gameState.playerName || 'Joueur')
        .replace(/{score}/g, gameState.score);
}