---
name: Chilly Bird - Workflow de développement
description: Processus de modification, test, versioning et déploiement du projet
---

# Skill: Workflow de développement Chilly Bird

## Objectif
Ce skill décrit le processus complet pour modifier, tester et déployer des changements dans Chilly Bird.

## Processus de Modification

### 1. Avant de Commencer

**Identifier le bon fichier**:

| Fonctionnalité | Fichier(s) |
|----------------|------------|
| Configuration (vitesses, gaps, ratios) | `config.js` |
| Physique, collisions, tuyaux | `physics.js` |
| Rendu 2D (fond, oiseau, particules) | `graphics.js` |
| Rendu 3D (scène, meshes) | `game3d.js` |
| Power-ups | `powerups.js` |
| Sons et musique | `audio.js` |
| Logique de jeu 2D | `game.js` |
| Navigation, menus | `menu.js` |
| Scores en ligne | `firebase.js` |
| Initialisation, résolution | `main.js` |
| Styles CSS | `css/styles.css` |

### 2. Faire les Modifications

**Règles importantes**:

1. **Respecter l'ordre de chargement** des scripts (voir `index.html`)
2. **Ne pas casser les dépendances** entre modules
3. **Utiliser les constantes** de `GAME_CONFIG` plutôt que des valeurs en dur
4. **Tester en 2D ET 3D** si la modification affecte les deux modes

**Exemple - Modifier la gravité**:

```javascript
// ❌ MAUVAIS - Valeur en dur
BIRD_GRAVITY: 0.4

// ✅ BON - Proportionnel à la résolution
get BIRD_GRAVITY() {
    if (typeof FIXED_HEIGHT === 'undefined') return BASE_CONFIG.BIRD_GRAVITY;
    return BASE_CONFIG.BIRD_GRAVITY * (FIXED_HEIGHT / REFERENCE_HEIGHT);
}
```

### 3. Incrémenter la Version

**OBLIGATOIRE** après chaque modification!

Éditer `version.json`:

```json
{
  "version": "2.6.4",    // Sémantique: major.minor.patch
  "build": 33,           // +1 à chaque modification
  "date": "2026-01-28"   // Date du jour (YYYY-MM-DD)
}
```

**Règles de versioning**:

- **Patch** (2.6.4 → 2.6.5): Bugfix, petite modification
- **Minor** (2.6.4 → 2.7.0): Nouvelle fonctionnalité
- **Major** (2.6.4 → 3.0.0): Changement majeur, breaking change

### 4. Tester le Jeu

```bash
# Ouvrir dans le navigateur
start index.html
```

**Checklist de test**:

- [ ] Le jeu démarre correctement
- [ ] Mode 2D fonctionne
- [ ] Mode 3D fonctionne
- [ ] Les contrôles répondent (clic, espace, touch)
- [ ] Les power-ups apparaissent et fonctionnent
- [ ] Les collisions sont détectées
- [ ] Le score s'incrémente
- [ ] Les sons fonctionnent
- [ ] Le menu fonctionne (retour, navigation)
- [ ] Responsive (tester différentes tailles de fenêtre)
- [ ] Mobile (si possible)

**Tests spécifiques selon modification**:

| Modification | Tests supplémentaires |
|--------------|----------------------|
| Physique | Vérifier sensation de jeu, difficulté |
| Graphismes | Vérifier performance, rendu |
| Power-ups | Tester chaque type, durée, effets |
| Scores | Vérifier sauvegarde, Firebase, localStorage |
| Audio | Vérifier tous les sons, musique |

### 5. Mettre à Jour le CHANGELOG

Si la modification est significative, ajouter une entrée dans `CHANGELOG.md`:

```markdown
## [2.6.5] - 2026-01-28
### Fixed
- Correction du bug de collision avec les tuyaux mobiles

### Changed
- Augmentation de la vitesse de base de 10%

### Added
- Nouveau power-up SHIELD
```

Catégories:
- **Added**: Nouvelles fonctionnalités
- **Changed**: Modifications de fonctionnalités existantes
- **Fixed**: Corrections de bugs
- **Removed**: Fonctionnalités supprimées

## Configuration Firebase

### Fichier firebase-config.js

Ce fichier est **gitignored** et doit être créé manuellement:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

**Obtenir les credentials**:
1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner le projet
3. Paramètres du projet → Applications web
4. Copier la configuration

### Fallback localStorage

Si Firebase n'est pas configuré, le jeu utilise automatiquement `localStorage`:

```javascript
if (!firebaseInitialized) {
    // Sauvegarder en local
    const scores = JSON.parse(localStorage.getItem('chillyBirdScores') || '[]');
    scores.push({ name, score, timestamp: Date.now() });
    localStorage.setItem('chillyBirdScores', JSON.stringify(scores));
}
```

## Débogage

### Console Logs Utiles

Le jeu affiche des logs au démarrage:

```
🎮 CHILLY BIRD 🐦
❄️ Jeu chargé avec succès!
📐 Résolution fixe: 1920x1080
📦 Version: v2.6.4
🌐 Scores mondiaux actifs
```

### Variables Globales Accessibles

Dans la console du navigateur:

```javascript
// État du jeu 2D
gameState.score
gameState.lives
gameState.pipes
gameState.powerUps

// État du jeu 3D
game3DState.score
game3DState.lives

// Configuration
GAME_CONFIG.BIRD_GRAVITY
GAME_CONFIG.BASE_PIPE_SPEED

// Activer God Mode
cheatGodMode = true
```

### Problèmes Courants

**Le jeu ne démarre pas**:
- Vérifier la console pour les erreurs
- Vérifier l'ordre de chargement des scripts
- Vérifier que `firebase-config.js` existe

**Les tuyaux sont trop proches/éloignés**:
- Vérifier `PIPE_SPAWN_INTERVAL` dans `config.js`
- Vérifier le système de spawn basé sur distance dans `game.js`

**Les collisions ne fonctionnent pas**:
- Vérifier les dimensions de l'oiseau et des tuyaux
- Vérifier que `GAME_CONFIG` est bien initialisé
- Logger les positions dans `checkCollisions()`

**Firebase ne fonctionne pas**:
- Vérifier que `firebase-config.js` existe
- Vérifier les credentials Firebase
- Le jeu devrait fonctionner en mode local (localStorage)

## Bonnes Pratiques

### Code

1. **Commenter les modifications importantes**
2. **Utiliser des noms de variables descriptifs**
3. **Respecter le style de code existant**
4. **Éviter les valeurs magiques** (utiliser des constantes)
5. **Tester sur plusieurs résolutions**

### Performance

1. **Limiter les particules** (max 100-200)
2. **Nettoyer les objets hors écran**
3. **Utiliser BufferGeometry** pour les étoiles (3D)
4. **Éviter les calculs lourds** dans la boucle de jeu

### Responsive

1. **Toujours utiliser les ratios** de `GAMEPLAY_RATIOS`
2. **Tester en mode portrait et paysage**
3. **Vérifier le scaling CSS**
4. **Tester sur mobile si possible**

## Déploiement

### Hébergement Simple

Le jeu est **statique** (pas de build nécessaire):

1. Copier tous les fichiers sur un serveur web
2. S'assurer que `firebase-config.js` est présent
3. Ouvrir `index.html`

### GitHub Pages

```bash
# Créer une branche gh-pages
git checkout -b gh-pages

# Pousser
git push origin gh-pages
```

Le jeu sera accessible sur `https://USERNAME.github.io/chilly-bird/`

### Netlify / Vercel

1. Connecter le repo GitHub
2. Pas de build command nécessaire
3. Publish directory: `.` (racine)

## Quand utiliser ce skill

- Avant de faire une modification
- Pour comprendre le processus de test
- Pour configurer Firebase
- Pour débugger un problème
- Pour déployer le jeu

## Fichiers concernés

- `version.json`: Versioning
- `CHANGELOG.md`: Historique
- `firebase-config.js`: Configuration Firebase
- Tous les fichiers `.js` pour modifications
