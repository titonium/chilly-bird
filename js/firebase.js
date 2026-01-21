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

// Récupérer les high scores (mode = '2d' ou '3d')
async function getHighScores(mode = '2d') {
    const refPath = mode === '3d' ? 'highscores3d' : 'highscores';
    const localKey = mode === '3d' ? 'chillyBirdScores3D' : 'chillyBirdScores';

    if (!firebaseInitialized) {
        // Fallback localStorage
        const scores = localStorage.getItem(localKey);
        return scores ? JSON.parse(scores) : [
            { name: '---', score: 0 },
            { name: '---', score: 0 },
            { name: '---', score: 0 }
        ];
    }

    try {
        const snapshot = await database.ref(refPath)
            .orderByChild('score')
            .limitToLast(10)
            .once('value');

        const scores = [];
        snapshot.forEach(childSnapshot => {
            scores.push(childSnapshot.val());
        });

        // Inverser pour avoir du plus grand au plus petit
        scores.reverse();

        // Remplir avec des scores vides si moins de 10
        while (scores.length < 10) {
            scores.push({ name: '---', score: 0 });
        }

        return scores.slice(0, 10); // Retourner max 10 scores
    } catch (error) {
        console.error('Erreur lors de la récupération des scores:', error);
        // Fallback localStorage
        const scores = localStorage.getItem(localKey);
        return scores ? JSON.parse(scores) : [
            { name: '---', score: 0 },
            { name: '---', score: 0 },
            { name: '---', score: 0 }
        ];
    }
}

// Sauvegarder UN SEUL score dans Firebase (mode = '2d' ou '3d')
async function saveScoreToFirebase(name, score, mode = '2d') {
    if (!firebaseInitialized) return;

    const refPath = mode === '3d' ? 'highscores3d' : 'highscores';

    try {
        // Créer une clé unique pour ce score
        const newScoreRef = database.ref(refPath).push();

        // Sauvegarder le score
        await newScoreRef.set({
            name: name.toUpperCase(),
            score: score,
            mode: mode,
            timestamp: Date.now()
        });

        console.log(`✅ Score ${mode.toUpperCase()} sauvegardé dans Firebase`);

        // Nettoyer : ne garder que les 10 meilleurs scores
        await cleanupOldScores(mode);
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

// Nettoyer les anciens scores (garder seulement TOP 10)
async function cleanupOldScores(mode = '2d') {
    if (!firebaseInitialized) return;

    const refPath = mode === '3d' ? 'highscores3d' : 'highscores';

    try {
        const snapshot = await database.ref(refPath)
            .orderByChild('score')
            .once('value');

        const allScores = [];
        snapshot.forEach(childSnapshot => {
            allScores.push({
                key: childSnapshot.key,
                data: childSnapshot.val()
            });
        });

        // Trier par score décroissant
        allScores.sort((a, b) => b.data.score - a.data.score);

        // Supprimer tous les scores après le TOP 10
        const scoresToDelete = allScores.slice(10);

        for (const scoreItem of scoresToDelete) {
            await database.ref(`${refPath}/${scoreItem.key}`).remove();
        }

        if (scoresToDelete.length > 0) {
            console.log(`🗑️ ${scoresToDelete.length} ancien(s) score(s) ${mode.toUpperCase()} supprimé(s)`);
        }
    } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
    }
}

// Sauvegarder les high scores (localStorage uniquement)
function saveHighScoresToLocal(scores) {
    localStorage.setItem('chillyBirdScores', JSON.stringify(scores));
}

// Vérifier si c'est un high score
async function isHighScore(score) {
    const highScores = await getHighScores();
    // Accepter tout score > 0 si les scores sont vides
    if (highScores[2].score === 0 && score > 0) {
        return true;
    }
    // Accepter si meilleur que le 10ème score
    const tenthScore = highScores[9] ? highScores[9].score : 0;
    return score > tenthScore;
}

// Obtenir la position globale d'un score (parmi TOUS les scores)
async function getGlobalRank(score) {
    if (!firebaseInitialized) {
        // Fallback localStorage - pas de classement global disponible
        return { rank: null, total: 0 };
    }

    try {
        // Récupérer tous les scores supérieurs au score actuel
        const snapshot = await database.ref('highscores')
            .orderByChild('score')
            .once('value');

        let total = 0;
        let betterScores = 0;

        snapshot.forEach(childSnapshot => {
            total++;
            if (childSnapshot.val().score > score) {
                betterScores++;
            }
        });

        // La position est le nombre de scores supérieurs + 1
        return { rank: betterScores + 1, total: total };
    } catch (error) {
        console.error('Erreur lors du calcul du rang:', error);
        return { rank: null, total: 0 };
    }
}

// Ajouter un high score
async function addHighScore(name, score) {
    // Sauvegarder dans Firebase
    await saveScoreToFirebase(name, score);

    // Récupérer les scores à jour
    const highScores = await getHighScores();
    
    // Sauvegarder aussi en local
    saveHighScoresToLocal(highScores);
    
    // Rafraîchir l'affichage
    await showHighScores();
}

// Afficher les high scores
async function showHighScores() {
    const highScores = await getHighScores();
    const scoresList = document.getElementById('scoresList');
    const statusEl = document.getElementById('firebaseStatus');

    if (!scoresList) return;

    scoresList.innerHTML = '';

    highScores.slice(0, 10).forEach((entry, index) => {
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