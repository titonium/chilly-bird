// ===== GESTION AUDIO =====

const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let soundEnabled = true;
let isMusicPlaying = false;
let musicInterval = null;

// Toggle son
function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundToggle').textContent = soundEnabled ? '🔊' : '🔇';
    document.getElementById('soundToggle').classList.toggle('muted');

    if (!soundEnabled) {
        stopMusic();
    } else if (gameState.started && !gameState.over) {
        startMusic();
    }
}

// Démarrer la musique de fond (Canon de Pachelbel simplifié)
function startMusic() {
    if (isMusicPlaying) return;
    isMusicPlaying = true;

    // Mélodie simplifiée
    const melody = [
        587.33, 0, 659.25, 0, 587.33, 0, 523.25, 0,
        493.88, 0, 440.00, 0, 493.88, 0, 587.33, 0,
        523.25, 0, 587.33, 0, 523.25, 0, 493.88, 0,
        440.00, 0, 392.00, 0, 440.00, 0, 493.88, 0
    ];

    // Basse
    const bass = [
        196.00, 196.00, 146.83, 146.83,
        164.81, 164.81, 130.81, 130.81,
        196.00, 196.00, 146.83, 146.83,
        196.00, 196.00, 146.83, 146.83
    ];

    let noteIndex = 0;
    const noteDuration = 280; // millisecondes

    function playNote(frequency, type, gain, duration) {
        if (!isMusicPlaying || frequency === 0) return;

        const osc = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, audioContext.currentTime);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

        osc.connect(gainNode);
        gainNode.connect(audioContext.destination);

        osc.start(audioContext.currentTime);
        osc.stop(audioContext.currentTime + duration / 1000);
    }

    function playNextBeat() {
        if (!isMusicPlaying) return;

        // Mélodie
        playNote(melody[noteIndex], 'sine', 0.09, noteDuration * 0.95);

        // Basse
        playNote(bass[noteIndex % bass.length], 'sine', 0.12, noteDuration * 0.85);

        noteIndex = (noteIndex + 1) % melody.length;
    }

    musicInterval = setInterval(playNextBeat, noteDuration);
    playNextBeat();
}

// Arrêter la musique
function stopMusic() {
    isMusicPlaying = false;
    if (musicInterval) {
        clearInterval(musicInterval);
        musicInterval = null;
    }
}

// Son de saut
function playJumpSound() {
    if (!soundEnabled) return;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.frequency.setValueAtTime(400, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.1);
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(0.15, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.1);
}

// Son de point marqué
function playScoreSound() {
    if (!soundEnabled) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();

        osc.frequency.value = freq;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + i * 0.05 + 0.15);

        osc.connect(gain);
        gain.connect(audioContext.destination);

        osc.start(audioContext.currentTime + i * 0.05);
        osc.stop(audioContext.currentTime + i * 0.05 + 0.15);
    });
}

// Son de crash
function playCrashSound() {
    if (!soundEnabled) return;

    // Créer du bruit blanc
    const noise = audioContext.createBufferSource();
    const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.5, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }

    noise.buffer = buffer;

    const gain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    gain.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.5);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioContext.destination);

    noise.start(audioContext.currentTime);
    noise.stop(audioContext.currentTime + 0.5);
}