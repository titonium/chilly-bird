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

        // ✅ Utiliser le gap du tuyau pour calculer la position des flèches
        const arrowY = pipe.top + (pipe.gap / 2);
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