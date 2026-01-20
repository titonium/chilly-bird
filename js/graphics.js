// ===== GESTION GRAPHIQUE =====

// Palettes de couleurs pour les éléments du jeu (oiseau, tuyaux, sol)
const COLOR_THEMES = [
    { primary: '#00ffff', secondary: '#ff00ff', accent: '#ffff00' }, // 0-9
    { primary: '#ff6600', secondary: '#0066ff', accent: '#00ff66' }, // 10-19
    { primary: '#ff0066', secondary: '#66ff00', accent: '#0066ff' }, // 20-29
    { primary: '#ffff00', secondary: '#ff00ff', accent: '#00ffff' }, // 30-39
    { primary: '#00ff88', secondary: '#ff8800', accent: '#8800ff' }, // 40-49
    { primary: '#ff0000', secondary: '#00ff00', accent: '#0000ff' }, // 50-59
    { primary: '#ffffff', secondary: '#ff00ff', accent: '#00ffff' }, // 60+
];

// Obtenir le thème de couleur actuel selon le score
function getCurrentTheme() {
    const themeIndex = Math.min(Math.floor(gameState.score / 10), COLOR_THEMES.length - 1);
    return COLOR_THEMES[themeIndex];
}

// Variables pour l'affichage de l'augmentation de vitesse
let speedBoostTimer = 0;
let speedBoostLevel = 0;

// Déclencher l'affichage de l'augmentation de vitesse
function triggerSpeedBoost() {
    speedBoostTimer = 180; // 3 secondes à 60fps
    speedBoostLevel = Math.floor(gameState.score / 10);
}

// Réinitialiser (appelé au démarrage)
function resetBackgroundTransition() {
    speedBoostTimer = 0;
    speedBoostLevel = 0;
}

// Dessiner la barre de progression vers le prochain boost de vitesse
function drawProgressBar() {
    const theme = getCurrentTheme();
    const progressInTen = gameState.score % 10;
    const progress = progressInTen / 10;

    ctx.save();

    // Position de la barre (en haut au centre)
    const barWidth = 300;
    const barHeight = 12;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 20;

    // Fond de la barre
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Barre de progression avec dégradé
    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(1, '#ff0000');
    ctx.fillStyle = gradient;
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Bordure
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Label vitesse
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 5;
    ctx.fillText('VITESSE +', barX + barWidth / 2, barY - 8);

    // Indicateurs
    ctx.textAlign = 'left';
    ctx.fillText(`${Math.floor(gameState.score / 10) * 10}`, barX - 30, barY + 10);
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.floor(gameState.score / 10) * 10 + 10}`, barX + barWidth + 30, barY + 10);

    ctx.restore();

    // Afficher le message de boost de vitesse
    if (speedBoostTimer > 0) {
        speedBoostTimer--;

        ctx.save();
        const alpha = Math.min(1, speedBoostTimer / 60);
        const scale = 1 + (180 - speedBoostTimer) / 300;

        ctx.globalAlpha = alpha;
        ctx.font = `bold ${40 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 30;
        ctx.fillText(`VITESSE NIVEAU ${speedBoostLevel}!`, canvas.width / 2, 120);
        ctx.restore();
    }
}

// Étoiles, nébuleuses et galaxies pour l'effet spatial
let nebulaClouds = [];
let galaxies = [];
let shootingStars = [];

// Initialiser les étoiles avec effet galaxie
function createStars() {
    gameState.stars = [];

    // Étoiles de fond (petites, lentes, blanches) - poussière d'étoiles
    for (let i = 0; i < 150; i++) {
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 0.3 + 0.1,
            size: Math.random() * 1.2 + 0.3,
            brightness: Math.random() * 0.6 + 0.2,
            twinkleSpeed: Math.random() * 0.03 + 0.01,
            twinklePhase: Math.random() * Math.PI * 2,
            color: '#ffffff',
            layer: 0
        });
    }

    // Étoiles moyennes (colorées selon température stellaire)
    for (let i = 0; i < 80; i++) {
        // Couleurs réalistes d'étoiles selon leur température
        const starColors = [
            '#ffffff', // Blanc
            '#cad7ff', // Bleu-blanc (chaude)
            '#fff4e8', // Jaune-blanc (comme le soleil)
            '#ffd2a1', // Orange (géante)
            '#ffcccc', // Rouge (géante rouge)
            '#aaccff', // Bleu clair
        ];
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 1 + 0.3,
            size: Math.random() * 2 + 1,
            brightness: Math.random() * 0.5 + 0.4,
            twinkleSpeed: Math.random() * 0.06 + 0.02,
            twinklePhase: Math.random() * Math.PI * 2,
            color: starColors[Math.floor(Math.random() * starColors.length)],
            layer: 1
        });
    }

    // Étoiles proches (filantes, avec traînée)
    for (let i = 0; i < 25; i++) {
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 4 + 3,
            size: Math.random() * 2.5 + 1.5,
            brightness: 0.9 + Math.random() * 0.1,
            twinkleSpeed: 0,
            twinklePhase: 0,
            color: '#ffffff',
            layer: 2
        });
    }

    // Créer les nébuleuses (plus détaillées)
    nebulaClouds = [];
    const nebulaColors = [
        { inner: '#6b2d5c', outer: '#2d1b4e' }, // Rose/Violet (Nébuleuse d'Orion)
        { inner: '#1a4d6b', outer: '#0d2840' }, // Bleu profond
        { inner: '#4a1a4d', outer: '#1a0d26' }, // Violet sombre
        { inner: '#2d4a1a', outer: '#1a2d0d' }, // Vert cosmique
        { inner: '#4d3d1a', outer: '#26200d' }, // Or/Brun (poussière)
        { inner: '#6b1a2d', outer: '#40101a' }, // Rouge (région H-alpha)
    ];

    for (let i = 0; i < 8; i++) {
        const colorSet = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
        nebulaClouds.push({
            x: Math.random() * canvas.width * 1.5,
            y: Math.random() * canvas.height,
            radius: Math.random() * 300 + 150,
            innerColor: colorSet.inner,
            outerColor: colorSet.outer,
            speed: Math.random() * 0.2 + 0.05,
            alpha: Math.random() * 0.12 + 0.04,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.001
        });
    }

    // Créer les galaxies
    galaxies = [];
    for (let i = 0; i < 3; i++) {
        galaxies.push({
            x: Math.random() * canvas.width + canvas.width, // Commencent hors écran
            y: Math.random() * (canvas.height - 200) + 100,
            size: Math.random() * 80 + 40,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.002,
            speed: Math.random() * 0.15 + 0.05,
            type: Math.random() > 0.5 ? 'spiral' : 'elliptical',
            arms: Math.floor(Math.random() * 3) + 2,
            color: ['#ffeedd', '#ddddff', '#ffdddd'][Math.floor(Math.random() * 3)],
            alpha: Math.random() * 0.3 + 0.1
        });
    }

    // Étoiles filantes occasionnelles
    shootingStars = [];
}

// Créer une étoile filante
function createShootingStar() {
    if (shootingStars.length < 2 && Math.random() < 0.005) {
        shootingStars.push({
            x: canvas.width + 50,
            y: Math.random() * canvas.height * 0.6,
            speed: Math.random() * 15 + 10,
            length: Math.random() * 100 + 50,
            life: 1,
            angle: Math.PI + (Math.random() - 0.5) * 0.3 // Légèrement vers le bas
        });
    }
}

// Dessiner le fond galaxie
function drawBackground() {
    // Fond noir profond avec léger dégradé
    const bgGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width
    );
    bgGradient.addColorStop(0, '#0a0a15');
    bgGradient.addColorStop(1, '#000005');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Calculer le multiplicateur de vitesse
    let speedMultiplier = gameState.pipeSpeed / GAME_CONFIG.BASE_PIPE_SPEED;
    if (gameState.activePowerUp === 'SLOW') {
        speedMultiplier *= 0.5;
    } else if (gameState.activePowerUp === 'FAST') {
        speedMultiplier *= 1.5;
    }

    // Dessiner les nébuleuses (en arrière-plan)
    nebulaClouds.forEach(cloud => {
        cloud.x -= cloud.speed * speedMultiplier;
        cloud.rotation += cloud.rotationSpeed;

        if (cloud.x + cloud.radius < -100) {
            cloud.x = canvas.width + cloud.radius + Math.random() * 500;
            cloud.y = Math.random() * canvas.height;
        }

        ctx.save();
        ctx.translate(cloud.x, cloud.y);
        ctx.rotate(cloud.rotation);

        // Nébuleuse multi-couches pour plus de réalisme
        for (let layer = 3; layer >= 1; layer--) {
            const layerRadius = cloud.radius * (layer / 3);
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, layerRadius);
            gradient.addColorStop(0, cloud.innerColor);
            gradient.addColorStop(0.4, cloud.outerColor);
            gradient.addColorStop(1, 'transparent');

            ctx.globalAlpha = cloud.alpha * (layer / 3);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, layerRadius, layerRadius * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });

    // Dessiner les galaxies
    galaxies.forEach(galaxy => {
        galaxy.x -= galaxy.speed * speedMultiplier;
        galaxy.rotation += galaxy.rotationSpeed;

        if (galaxy.x + galaxy.size < -100) {
            galaxy.x = canvas.width + galaxy.size + Math.random() * 1000;
            galaxy.y = Math.random() * (canvas.height - 200) + 100;
        }

        ctx.save();
        ctx.translate(galaxy.x, galaxy.y);
        ctx.rotate(galaxy.rotation);
        ctx.globalAlpha = galaxy.alpha;

        if (galaxy.type === 'spiral') {
            // Galaxie spirale
            // Noyau brillant
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size * 0.3);
            coreGradient.addColorStop(0, '#ffffee');
            coreGradient.addColorStop(0.5, galaxy.color);
            coreGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(0, 0, galaxy.size * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Bras spiraux
            ctx.strokeStyle = galaxy.color;
            ctx.lineWidth = galaxy.size * 0.08;
            ctx.shadowColor = galaxy.color;
            ctx.shadowBlur = 15;

            for (let arm = 0; arm < galaxy.arms; arm++) {
                ctx.beginPath();
                const armOffset = (Math.PI * 2 / galaxy.arms) * arm;
                for (let t = 0; t < Math.PI * 2; t += 0.1) {
                    const r = galaxy.size * 0.15 * t;
                    const x = r * Math.cos(t + armOffset);
                    const y = r * Math.sin(t + armOffset) * 0.4; // Aplatir
                    if (t === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.globalAlpha = galaxy.alpha * 0.6;
                ctx.stroke();
            }
        } else {
            // Galaxie elliptique
            const ellipseGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, galaxy.size);
            ellipseGradient.addColorStop(0, '#ffffee');
            ellipseGradient.addColorStop(0.2, galaxy.color);
            ellipseGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = ellipseGradient;
            ctx.beginPath();
            ctx.ellipse(0, 0, galaxy.size, galaxy.size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    });

    ctx.globalAlpha = 1;

    // Dessiner les étoiles par couche
    gameState.stars.forEach(star => {
        star.x -= star.speed * speedMultiplier;

        if (star.x < -20) {
            star.x = canvas.width + 20;
            star.y = Math.random() * canvas.height;
        }

        star.twinklePhase += star.twinkleSpeed;
        const twinkle = star.twinkleSpeed > 0
            ? 0.6 + 0.4 * Math.sin(star.twinklePhase)
            : 1;

        const alpha = star.brightness * twinkle;
        ctx.globalAlpha = alpha;

        if (star.layer === 2) {
            // Étoiles filantes avec traînée réaliste
            const baseTrailLength = star.speed * speedMultiplier * 8;

            // Traînée principale (dégradé multi-étapes)
            ctx.save();

            // Lueur externe diffuse
            const glowGradient = ctx.createLinearGradient(
                star.x, star.y,
                star.x + baseTrailLength * 1.5, star.y
            );
            glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            glowGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = glowGradient;
            ctx.fillRect(star.x - star.size, star.y - star.size * 2, baseTrailLength * 1.5, star.size * 4);

            // Traînée centrale brillante
            const coreTrailGradient = ctx.createLinearGradient(
                star.x, star.y,
                star.x + baseTrailLength, star.y
            );
            coreTrailGradient.addColorStop(0, star.color);
            coreTrailGradient.addColorStop(0.3, 'rgba(255, 255, 200, 0.8)');
            coreTrailGradient.addColorStop(0.7, 'rgba(255, 200, 150, 0.4)');
            coreTrailGradient.addColorStop(1, 'transparent');
            ctx.fillStyle = coreTrailGradient;
            ctx.fillRect(star.x, star.y - star.size * 0.5, baseTrailLength, star.size);

            // Étoile elle-même avec halo
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Point central très brillant
            ctx.shadowBlur = 5;
            ctx.fillStyle = '#ffffee';
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        } else if (star.layer === 1) {
            // Étoiles moyennes avec léger halo
            ctx.shadowColor = star.color;
            ctx.shadowBlur = 3;
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Étoiles de fond - simples points
            ctx.fillStyle = star.color;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Étoiles filantes occasionnelles
    createShootingStar();
    drawShootingStars(speedMultiplier);

    ctx.globalAlpha = 1;
}

// Dessiner les étoiles filantes
function drawShootingStars(speedMultiplier) {
    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];

        // Mouvement
        star.x += Math.cos(star.angle) * star.speed * speedMultiplier;
        star.y += Math.sin(star.angle) * star.speed * speedMultiplier;
        star.life -= 0.015;

        if (star.life <= 0 || star.x < -100 || star.y > canvas.height) {
            shootingStars.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = star.life;

        // Traînée de l'étoile filante
        const trailEndX = star.x - Math.cos(star.angle) * star.length;
        const trailEndY = star.y - Math.sin(star.angle) * star.length;

        // Lueur externe
        const outerGlow = ctx.createLinearGradient(star.x, star.y, trailEndX, trailEndY);
        outerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        outerGlow.addColorStop(0.1, 'rgba(200, 220, 255, 0.5)');
        outerGlow.addColorStop(0.5, 'rgba(150, 180, 255, 0.2)');
        outerGlow.addColorStop(1, 'transparent');

        ctx.strokeStyle = outerGlow;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(trailEndX, trailEndY);
        ctx.stroke();

        // Traînée centrale
        const innerGlow = ctx.createLinearGradient(star.x, star.y, trailEndX, trailEndY);
        innerGlow.addColorStop(0, '#ffffff');
        innerGlow.addColorStop(0.2, '#aaccff');
        innerGlow.addColorStop(1, 'transparent');

        ctx.strokeStyle = innerGlow;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(trailEndX, trailEndY);
        ctx.stroke();

        // Tête brillante
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// Dessiner l'oiseau
function drawBird() {
    ctx.save();
    const theme = getCurrentTheme();

    const rotation = Math.min(Math.max(gameState.bird.velocity * 0.05, -0.5), 0.5);
    ctx.translate(gameState.bird.x + gameState.bird.width / 2, gameState.bird.y + gameState.bird.height / 2);
    ctx.rotate(rotation);
    ctx.translate(-gameState.bird.width / 2, -gameState.bird.height / 2);

    // Aura lumineuse
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 30;

    // Corps principal
    ctx.fillStyle = theme.primary;
    ctx.fillRect(0, 8, 40, 24);

    // Détails lumineux
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 12, 30, 4);
    ctx.fillRect(5, 20, 30, 4);

    // Aile animée
    const wingOffset = Math.sin(gameState.frameCount * 0.2) * 5;
    ctx.fillStyle = theme.secondary;
    ctx.shadowColor = theme.secondary;
    ctx.fillRect(12, 16 + wingOffset, 20, 8);

    // Tête
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.fillRect(35, 12, 15, 16);

    // Œil
    ctx.fillStyle = theme.secondary;
    ctx.fillRect(42, 16, 6, 6);

    // Traînée de particules
    if (gameState.frameCount % 3 === 0 && gameState.started && !gameState.over) {
        createParticle(gameState.bird.x, gameState.bird.y + gameState.bird.height / 2, theme.primary);
    }

    ctx.restore();
}

// Dessiner un tuyau
function drawPipe(pipe) {
    ctx.save();
    const theme = getCurrentTheme();

    ctx.shadowColor = theme.secondary;
    ctx.shadowBlur = 20;

    // Tuyau du haut
    const gradientTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + GAME_CONFIG.PIPE_WIDTH, 0);
    gradientTop.addColorStop(0, theme.secondary);
    gradientTop.addColorStop(0.5, theme.accent);
    gradientTop.addColorStop(1, theme.secondary);
    ctx.fillStyle = gradientTop;
    ctx.fillRect(pipe.x, 0, GAME_CONFIG.PIPE_WIDTH, pipe.top);

    // Lignes lumineuses
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    for (let i = 0; i < pipe.top; i += 40) {
        ctx.fillRect(pipe.x + 5, i, GAME_CONFIG.PIPE_WIDTH - 10, 3);
    }

    // Chapeau du haut
    ctx.fillStyle = theme.primary;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 30;
    ctx.fillRect(pipe.x - 10, pipe.top - 40, GAME_CONFIG.PIPE_WIDTH + 20, 40);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(pipe.x - 10, pipe.top - 40, GAME_CONFIG.PIPE_WIDTH + 20, 40);

    // Tuyau du bas
    const gradientBottom = ctx.createLinearGradient(pipe.x, pipe.bottom, pipe.x + GAME_CONFIG.PIPE_WIDTH, pipe.bottom);
    gradientBottom.addColorStop(0, theme.secondary);
    gradientBottom.addColorStop(0.5, theme.accent);
    gradientBottom.addColorStop(1, theme.secondary);
    ctx.fillStyle = gradientBottom;
    ctx.fillRect(pipe.x, pipe.bottom, GAME_CONFIG.PIPE_WIDTH, canvas.height - pipe.bottom - GAME_CONFIG.GROUND_HEIGHT);

    // Lignes lumineuses
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    for (let i = pipe.bottom; i < canvas.height - GAME_CONFIG.GROUND_HEIGHT; i += 40) {
        ctx.fillRect(pipe.x + 5, i, GAME_CONFIG.PIPE_WIDTH - 10, 3);
    }

    // Chapeau du bas
    ctx.fillStyle = theme.primary;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 30;
    ctx.fillRect(pipe.x - 10, pipe.bottom, GAME_CONFIG.PIPE_WIDTH + 20, 40);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(pipe.x - 10, pipe.bottom, GAME_CONFIG.PIPE_WIDTH + 20, 40);

    // Indicateur pour tuyaux mobiles
    if (pipe.moving) {
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ffff00';
        ctx.fillStyle = '#ffff00';

        const arrowY = pipe.top + (pipe.gap / 2);
        const arrowOffset = Math.sin(gameState.frameCount * 0.15) * 8;

        if (pipe.moveSpeed > 0) {
            ctx.beginPath();
            ctx.moveTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2, arrowY - 30 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 - 15, arrowY - 15 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 + 15, arrowY - 15 + arrowOffset);
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2, arrowY + 30 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 - 15, arrowY + 15 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 + 15, arrowY + 15 + arrowOffset);
            ctx.fill();
        }

        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 5;
        ctx.fillText('MOBILE', pipe.x + GAME_CONFIG.PIPE_WIDTH / 2, arrowY + 5);
    }

    ctx.restore();
}

// Dessiner le sol
function drawGround() {
    ctx.save();
    const theme = getCurrentTheme();

    const gradient = ctx.createLinearGradient(0, canvas.height - GAME_CONFIG.GROUND_HEIGHT, 0, canvas.height);
    gradient.addColorStop(0, theme.secondary);
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - GAME_CONFIG.GROUND_HEIGHT, canvas.width, GAME_CONFIG.GROUND_HEIGHT);

    // Ligne supérieure brillante
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 4;
    ctx.shadowColor = theme.primary;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - GAME_CONFIG.GROUND_HEIGHT);
    ctx.lineTo(canvas.width, canvas.height - GAME_CONFIG.GROUND_HEIGHT);
    ctx.stroke();

    // Grille animée
    for (let i = 0; i < canvas.width; i += 20) {
        const offset = (gameState.frameCount * 2) % 40;
        ctx.strokeStyle = theme.primary;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(i - offset, canvas.height - GAME_CONFIG.GROUND_HEIGHT);
        ctx.lineTo(i - offset, canvas.height);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
}

// Dessiner les particules
function drawParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
            continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
}

// Dessiner les ondes d'explosion
function drawExplosionWaves() {
    for (let i = gameState.explosionWaves.length - 1; i >= 0; i--) {
        const wave = gameState.explosionWaves[i];

        wave.radius += 8;
        wave.alpha -= 0.02;

        if (wave.alpha <= 0) {
            gameState.explosionWaves.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = wave.alpha;
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}

// Créer une particule
function createParticle(x, y, color) {
    gameState.particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 30,
        color: color,
        size: Math.random() * 4 + 2
    });
}

// Créer une explosion
function createExplosion(x, y) {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 100;
    ctx.beginPath();
    ctx.arc(x, y, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    gameState.explosionWaves.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: 300,
        alpha: 1
    });

    gameState.explosionWaves.push({
        x: x,
        y: y,
        radius: 20,
        maxRadius: 320,
        alpha: 0.8
    });

    for (let i = 0; i < 100; i++) {
        const angle = (Math.PI * 2 * i) / 100;
        const speed = Math.random() * 8 + 4;
        gameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 60,
            color: ['#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#ffffff'][Math.floor(Math.random() * 5)],
            size: Math.random() * 6 + 3
        });
    }

    for (let i = 0; i < 30; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 3,
            vy: -Math.random() * 5,
            life: 90,
            color: 'rgba(100, 100, 100, 0.5)',
            size: Math.random() * 15 + 10
        });
    }
}
