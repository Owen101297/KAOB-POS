// Helper para emitir feedback sonoro (BEEP) y vibración en escaneos POS
export function playScanBeep(success = true) {
  if (typeof window === "undefined") return;

  // Vibración táctil si el dispositivo la soporta (Android / navegadores móviles)
  try {
    if ("vibrate" in navigator) {
      if (success) {
        navigator.vibrate([60]);
      } else {
        navigator.vibrate([100, 50, 100]);
      }
    }
  } catch {
    // Ignorar si el navegador bloquea vibración
  }

  // Síntesis de sonido con Web Audio API (no requiere archivos externos)
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    if (success) {
      // Beep agudo de confirmación POS (1800Hz -> 2400Hz)
      osc.frequency.setValueAtTime(1800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else {
      // Beep grave de error / producto no encontrado (350Hz)
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch {
    // AudioContext puede estar bloqueado antes del primer gesto del usuario
  }
}
