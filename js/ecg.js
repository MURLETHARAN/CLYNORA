// CLYNORA ECG Canvas Monitor Engine
// Renders calibrated clinical Lead II ECG with authentic P-Q-R-S-T wave physiology,
// sweep erase bar, medical grid paper, and direct AD8232 serial data support.

class CLYNORA_ECGMonitor {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.options = Object.assign({
      grid: true,
      sweepSpeed: 1.5,
      gain: 1.0,
      color: '#f2545b', // CLYNORA pulse coral
      glow: true
    }, options);

    this.points = [];
    this.sweepX = 0;
    this.running = true;
    this.phase = 0;
    this.animationId = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.animate();
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width || 600;
    this.height = 160;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);

    // Initialize point buffer
    this.buffer = new Float32Array(Math.floor(this.width));
    this.buffer.fill(this.height / 2);
  }

  // Authentic Lead II P-Q-R-S-T physiological wave function
  getWaveSample(t, hr = 72) {
    const cycleTime = 60 / hr; // Seconds per beat
    const phase = (t % cycleTime) / cycleTime; // 0 to 1

    let amp = 0;

    // P wave (Atrial Depolarization): 0.10 - 0.20
    if (phase > 0.10 && phase < 0.22) {
      const pProgress = (phase - 0.10) / 0.12;
      amp = Math.sin(pProgress * Math.PI) * 0.18;
    }
    // PR Segment: baseline 0.22 - 0.32
    else if (phase >= 0.22 && phase < 0.32) {
      amp = 0;
    }
    // Q wave (Septal Depolarization): 0.32 - 0.35
    else if (phase >= 0.32 && phase < 0.35) {
      const qProgress = (phase - 0.32) / 0.03;
      amp = -Math.sin(qProgress * Math.PI) * 0.15;
    }
    // R wave (Ventricular Depolarization Spike): 0.35 - 0.41
    else if (phase >= 0.35 && phase < 0.41) {
      const rProgress = (phase - 0.35) / 0.06;
      amp = Math.sin(rProgress * Math.PI) * 1.0;
    }
    // S wave (Late Ventricular Depolarization): 0.41 - 0.46
    else if (phase >= 0.41 && phase < 0.46) {
      const sProgress = (phase - 0.41) / 0.05;
      amp = -Math.sin(sProgress * Math.PI) * 0.28;
    }
    // ST Segment: 0.46 - 0.54
    else if (phase >= 0.46 && phase < 0.54) {
      amp = 0.02;
    }
    // T wave (Ventricular Repolarization): 0.54 - 0.72
    else if (phase >= 0.54 && phase < 0.72) {
      const tProgress = (phase - 0.54) / 0.18;
      amp = Math.sin(tProgress * Math.PI) * 0.32;
    }
    // Isoelectric baseline until next beat
    else {
      amp = 0;
    }

    // Add minute physiological baseline wander
    const wander = Math.sin(t * 0.8) * 0.03;
    return amp + wander;
  }

  animate() {
    if (!this.running) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const midY = h / 2;

    // Get current patient's heart rate
    let hr = 72;
    if (typeof cur !== 'undefined' && typeof getPatient === 'function') {
      const p = getPatient(cur);
      if (p) {
        const vit = (typeof getLatestVital === 'function') ? getLatestVital(p.id, 'hr') : null;
        hr = vit ? vit.v : (p.base || 72);
      }
    }

    // Advance sweep
    const step = 2;
    for (let s = 0; s < step; s++) {
      this.phase += 0.005;
      let sampleY = 0;

      // Check if real AD8232 serial data is in L.ecg
      if (typeof L !== 'undefined' && L.ecg && L.ecg.length > 0) {
        const raw = L.ecg.shift();
        // AD8232 10-bit or 12-bit ADC normalizer
        const normalized = (raw - 512) / 300;
        sampleY = midY - (normalized * (h * 0.35) * this.options.gain);
      } else {
        // High fidelity physiological simulation
        const val = this.getWaveSample(this.phase, hr);
        sampleY = midY - (val * (h * 0.42) * this.options.gain);
      }

      const idx = Math.floor(this.sweepX);
      if (idx < this.buffer.length) {
        this.buffer[idx] = sampleY;
      }

      this.sweepX = (this.sweepX + 1) % w;
    }

    // Render Canvas Frame
    ctx.clearRect(0, 0, w, h);

    // Draw ECG Medical Grid
    if (this.options.grid) {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(58, 91, 217, 0.07)';
      // 10px minor grid
      for (let x = 0; x < w; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      // 50px major grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(58, 91, 217, 0.15)';
      for (let x = 0; x < w; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
    }

    // Draw ECG Waveform with glow
    ctx.save();
    if (this.options.glow) {
      ctx.shadowColor = 'rgba(242, 84, 91, 0.55)';
      ctx.shadowBlur = 6;
    }
    ctx.strokeStyle = this.options.color;
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    let gap = 24; // Erase bar width ahead of sweep
    let started = false;

    for (let x = 0; x < w; x++) {
      // Don't draw in the sweep gap
      const distFromSweep = (x - this.sweepX + w) % w;
      if (distFromSweep < gap) {
        started = false;
        continue;
      }

      const y = this.buffer[x] || midY;
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Draw Sweep Erase Bar Line & Glow
    const sweepGradient = ctx.createLinearGradient(this.sweepX - gap, 0, this.sweepX + 4, 0);
    sweepGradient.addColorStop(0, 'rgba(238, 240, 246, 0)');
    sweepGradient.addColorStop(0.7, 'rgba(238, 240, 246, 0.95)');
    sweepGradient.addColorStop(1, 'rgba(242, 84, 91, 0.8)');

    ctx.fillStyle = sweepGradient;
    ctx.fillRect(Math.max(0, this.sweepX - gap), 0, gap + 4, h);

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    this.running = false;
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}

// Global monitor reference
let globalECGMonitor = null;

function initECG(canvasId = 'ecgCanvas') {
  if (globalECGMonitor) {
    globalECGMonitor.destroy();
  }
  const el = document.getElementById(canvasId);
  if (el) {
    globalECGMonitor = new CLYNORA_ECGMonitor(canvasId);
  }
}
