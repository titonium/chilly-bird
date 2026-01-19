// ===== GESTION GRAPHIQUE =====

// Dessiner le fond
function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a0033');
    grad.addColorStop(0.4, '#330066');
    grad.addColorStop(1, '#ff00ff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Étoiles défilantes
    gameState.stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }

        ctx.fillStyle = '#fff';
        ctx.globalAlpha = Math.random() * 0.5 + 0.5;
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });

    ctx.globalAlpha = 1;
}

// Dessiner l'oiseau
function drawBird() {
    ctx.save();

    const rotation = Math.min(Math.max(gameState.bird.velocity * 0.05, -0.5), 0.5);
    ctx.translate(gameState.bird.x + gameState.bird.width / 2, gameState.bird.y + gameState.bird.height / 2);
    ctx.rotate(rotation);
    ctx.translate(-gameState.bird.width / 2, -gameState.bird.height / 2);

    // Aura lumineuse
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;

    // Corps principal
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(0, 8, 40, 24);

    // Détails lumineux
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 12, 30, 4);
    ctx.fillRect(5, 20, 30, 4);

    // Aile animée
    const wingOffset = Math.sin(gameState.frameCount * 0.2) * 5;
    ctx.fillStyle = '#ff00ff';
    ctx.shadowColor = '#ff00ff';
    ctx.fillRect(12, 16 + wingOffset, 20, 8);

    // Tête
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.fillRect(35, 12, 15, 16);

    // Œil
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(42, 16, 6, 6);

    // Traînée de particules
    if (gameState.frameCount % 3 === 0 && gameState.started && !gameState.over) {
        createParticle(gameState.bird.x, gameState.bird.y + gameState.bird.height / 2, '#00ffff');
    }

    ctx.restore();
}

// Dessiner un tuyau
function drawPipe(pipe) {
    ctx.save();

    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;

    // Tuyau du haut
    const gradientTop = ctx.createLinearGradient(pipe.x, 0, pipe.x + GAME_CONFIG.PIPE_WIDTH, 0);
    gradientTop.addColorStop(0, '#ff00ff');
    gradientTop.addColorStop(0.5, '#ff0080');
    gradientTop.addColorStop(1, '#ff00ff');
    ctx.fillStyle = gradientTop;
    ctx.fillRect(pipe.x, 0, GAME_CONFIG.PIPE_WIDTH, pipe.top);

    // Lignes lumineuses
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    for (let i = 0; i < pipe.top; i += 40) {
        ctx.fillRect(pipe.x + 5, i, GAME_CONFIG.PIPE_WIDTH - 10, 3);
    }

    // Chapeau du haut
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.fillRect(pipe.x - 10, pipe.top - 40, GAME_CONFIG.PIPE_WIDTH + 20, 40);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(pipe.x - 10, pipe.top - 40, GAME_CONFIG.PIPE_WIDTH + 20, 40);

    // Tuyau du bas
    const gradientBottom = ctx.createLinearGradient(pipe.x, pipe.bottom, pipe.x + GAME_CONFIG.PIPE_WIDTH, pipe.bottom);
    gradientBottom.addColorStop(0, '#ff00ff');
    gradientBottom.addColorStop(0.5, '#ff0080');
    gradientBottom.addColorStop(1, '#ff00ff');
    ctx.fillStyle = gradientBottom;
    ctx.fillRect(pipe.x, pipe.bottom, GAME_CONFIG.PIPE_WIDTH, canvas.height - pipe.bottom - GAME_CONFIG.GROUND_HEIGHT);

    // Lignes lumineuses
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    for (let i = pipe.bottom; i < canvas.height - GAME_CONFIG.GROUND_HEIGHT; i += 40) {
        ctx.fillRect(pipe.x + 5, i, GAME_CONFIG.PIPE_WIDTH - 10, 3);
    }

    // Chapeau du bas
    ctx.fillStyle = '#00ffff';
    ctx.shadowColor = '#00ffff';
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

        const arrowY = pipe.top + gameState.pipeGap / 2;
        const arrowOffset = Math.sin(gameState.frameCount * 0.15) * 8;

        if (pipe.moveSpeed > 0) {
            // Flèche haut
            ctx.beginPath();
            ctx.moveTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2, arrowY - 30 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 - 15, arrowY - 15 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 + 15, arrowY - 15 + arrowOffset);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2, arrowY - 45 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 - 12, arrowY - 33 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 + 12, arrowY - 33 + arrowOffset);
            ctx.fill();
        } else {
            // Flèche bas
            ctx.beginPath();
            ctx.moveTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2, arrowY + 30 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 - 15, arrowY + 15 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 + 15, arrowY + 15 + arrowOffset);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2, arrowY + 45 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 - 12, arrowY + 33 + arrowOffset);
            ctx.lineTo(pipe.x + GAME_CONFIG.PIPE_WIDTH / 2 + 12, arrowY + 33 + arrowOffset);
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

    const gradient = ctx.createLinearGradient(0, canvas.height - GAME_CONFIG.GROUND_HEIGHT, 0, canvas.height);
    gradient.addColorStop(0, '#ff00ff');
    gradient.addColorStop(1, '#1a0033');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - GAME_CONFIG.GROUND_HEIGHT, canvas.width, GAME_CONFIG.GROUND_HEIGHT);

    // Ligne supérieure brillante
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - GAME_CONFIG.GROUND_HEIGHT);
    ctx.lineTo(canvas.width, canvas.height - GAME_CONFIG.GROUND_HEIGHT);
    ctx.stroke();

    // Grille animée
    for (let i = 0; i < canvas.width; i += 20) {
        const offset = (gameState.frameCount * 2) % 40;
        ctx.strokeStyle = '#00ffff';
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
    // Onde de choc
    gameState.explosionWaves.push({
        x: x,
        y: y,
        radius: 0,
        maxRadius: 300,
        alpha: 1
    });

    // Particules de débris
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

    // Particules de fumée
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

// Initialiser les étoiles
function createStars() {
    for (let i = 0; i < 100; i++) {
        gameState.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 2 + 1,
            size: Math.random() * 2 + 1
        });
    }
}