// CLYNORA AI Voice Assistant & Glowing Interactive Orb Engine
// Immersive voice interface featuring real Web Audio API microphone analysis,
// multi-layer luminous shader simulation on Canvas, and role-aware clinical dialogue.

class CLYNORA_VoiceOrb {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.state = 'idle'; // 'idle' | 'listening' | 'processing' | 'speaking' | 'muted' | 'error'
    this.audioLevel = 0; // 0 to 1 normalized volume
    this.targetAudioLevel = 0;
    this.time = 0;
    this.rotation = 0;
    this.active = false;
    this.micStream = null;
    this.audioCtx = null;
    this.analyser = null;
    this.dataArray = null;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.size = Math.min(rect.width, rect.height) || 300;
    this.canvas.width = this.size * dpr;
    this.canvas.height = this.size * dpr;
    this.ctx.scale(dpr, dpr);
  }

  start() {
    this.active = true;
    this.animate();
    this.initMicrophone();
  }

  stop() {
    this.active = false;
    this.releaseMicrophone();
  }

  async initMicrophone() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContext();
        const source = this.audioCtx.createMediaStreamSource(this.micStream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
        source.connect(this.analyser);
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      }
    } catch (err) {
      console.log("Microphone access not granted or unavailable; using simulated voice response:", err.message);
    }
  }

  releaseMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
  }

  setState(newState) {
    this.state = newState;
    updateOrbUIState(newState);
  }

  updateAudioSample() {
    if (this.state === 'muted' || this.state === 'error') {
      this.targetAudioLevel = 0;
    } else if (this.state === 'listening') {
      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
          sum += this.dataArray[i];
        }
        const avg = sum / this.dataArray.length;
        this.targetAudioLevel = Math.min(1.0, (avg / 128) * 1.5);
      } else {
        // Subtle ambient listening breathing
        this.targetAudioLevel = 0.2 + Math.sin(this.time * 4) * 0.15;
      }
    } else if (this.state === 'speaking') {
      // Natural speech cadence simulation
      const cad = Math.sin(this.time * 6) * Math.cos(this.time * 3);
      this.targetAudioLevel = Math.max(0.15, Math.abs(cad) * 0.85);
    } else if (this.state === 'processing') {
      this.targetAudioLevel = 0.25 + Math.sin(this.time * 8) * 0.1;
    } else {
      // Idle slow breathing
      this.targetAudioLevel = 0.08 + Math.sin(this.time * 1.8) * 0.05;
    }

    // Smooth lerp
    this.audioLevel += (this.targetAudioLevel - this.audioLevel) * 0.18;
  }

  animate() {
    if (!this.active) return;

    this.time += 0.02;
    this.updateAudioSample();

    const ctx = this.ctx;
    const w = this.size;
    const h = this.size;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Dynamic radius with audio expansion
    const baseRadius = (w * 0.28);
    const audioExpansion = this.audioLevel * (w * 0.14);
    const r = baseRadius + audioExpansion;

    // 1. Outer Ambient Glow Layer
    const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.6);
    if (this.state === 'muted') {
      outerGlow.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      outerGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    } else if (this.state === 'processing') {
      outerGlow.addColorStop(0, 'rgba(129, 140, 248, 0.4)');
      outerGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.2)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    } else {
      outerGlow.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      outerGlow.addColorStop(0.4, 'rgba(45, 212, 191, 0.25)');
      outerGlow.addColorStop(0.8, 'rgba(58, 91, 217, 0.15)');
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    }

    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Swirling Light Vortex for Processing State
    if (this.state === 'processing') {
      this.rotation += 0.04;
    } else {
      this.rotation += 0.008;
    }

    // 3. Deformed Fluid Outer Sphere Layer
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);

    const fluidGradient = ctx.createLinearGradient(-r, -r, r, r);
    if (this.state === 'muted') {
      fluidGradient.addColorStop(0, '#78350f');
      fluidGradient.addColorStop(1, '#d97706');
    } else {
      fluidGradient.addColorStop(0, '#0284c7');  // Deep Sky Blue
      fluidGradient.addColorStop(0.3, '#0d9488'); // Dark Teal
      fluidGradient.addColorStop(0.7, '#2563eb'); // Medical Cobalt
      fluidGradient.addColorStop(1, '#4f46e5');  // Violet
    }

    ctx.fillStyle = fluidGradient;
    ctx.beginPath();

    const points = 36;
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      // Fluid harmonic wave offset
      const wave = Math.sin(angle * 4 + this.time * 3) * (this.audioLevel * 14) +
                   Math.cos(angle * 2 - this.time * 2) * (this.audioLevel * 8);
      const curR = r + wave;
      const x = Math.cos(angle) * curR;
      const y = Math.sin(angle) * curR;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Luminous Inner Core Sphere
    const innerGradient = ctx.createRadialGradient(
      cx - r * 0.25, cy - r * 0.25, r * 0.1,
      cx, cy, r * 0.95
    );

    if (this.state === 'muted') {
      innerGradient.addColorStop(0, '#fde68a');
      innerGradient.addColorStop(0.4, '#f59e0b');
      innerGradient.addColorStop(1, '#92400e');
    } else if (this.state === 'processing') {
      innerGradient.addColorStop(0, '#e0e7ff');
      innerGradient.addColorStop(0.3, '#818cf8');
      innerGradient.addColorStop(0.7, '#38bdf8');
      innerGradient.addColorStop(1, '#1e1b4b');
    } else {
      innerGradient.addColorStop(0, '#e0f2fe'); // Crisp luminous white-cyan highlight
      innerGradient.addColorStop(0.2, '#38bdf8'); // Electric Cyan
      innerGradient.addColorStop(0.6, '#2dd4bf'); // Radiant Teal
      innerGradient.addColorStop(0.85, '#3a5bd9'); // Medical Blue
      innerGradient.addColorStop(1, '#182245'); // Deep Navy Depth
    }

    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.fill();

    // 5. Specular Reflection Arc (Glass / Luminous Sheen)
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.28, cy - r * 0.32, r * 0.45, r * 0.22, -Math.PI / 4, 0, Math.PI * 2);
    const sheen = ctx.createLinearGradient(
      cx - r * 0.5, cy - r * 0.5,
      cx, cy
    );
    sheen.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
    sheen.addColorStop(0.6, 'rgba(255, 255, 255, 0.15)');
    sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sheen;
    ctx.fill();
    ctx.restore();

    requestAnimationFrame(() => this.animate());
  }
}

// Global Voice Assistant Controller
let voiceOrbInstance = null;
let voiceMuted = false;

function openVoiceMode() {
  const overlay = document.getElementById('voiceOverlay');
  if (!overlay) return;

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  if (!voiceOrbInstance) {
    voiceOrbInstance = new CLYNORA_VoiceOrb('voiceOrbCanvas');
  }
  voiceOrbInstance.start();
  voiceOrbInstance.setState('idle');

  // Set greeting transcript based on user role and language
  showTranscript(getRoleGreeting());
  renderVoiceQuickPrompts();
  updateOrbLanguage();
}

function closeVoiceMode() {
  const overlay = document.getElementById('voiceOverlay');
  if (!overlay) return;

  overlay.classList.remove('active');
  document.body.style.overflow = '';

  if (voiceOrbInstance) {
    voiceOrbInstance.stop();
  }
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function toggleVoiceMute() {
  voiceMuted = !voiceMuted;
  const btn = document.getElementById('voiceMuteBtn');
  if (voiceMuted) {
    if (voiceOrbInstance) voiceOrbInstance.setState('muted');
    if (btn) {
      btn.classList.add('muted-mic');
      btn.classList.remove('active-mic');
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.14 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/></svg>`;
    }
    showTranscript(t('orb_muted'));
  } else {
    if (voiceOrbInstance) voiceOrbInstance.setState('listening');
    if (btn) {
      btn.classList.remove('muted-mic');
      btn.classList.add('active-mic');
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/></svg>`;
    }
    showTranscript(t('orb_listening'));
  }
}

function updateOrbUIState(state) {
  const pill = document.getElementById('voiceStatusPill');
  const text = document.getElementById('voiceStatusText');
  if (!pill || !text) return;

  pill.className = `voice-status-pill ${state}`;
  
  const stateLabels = {
    idle: t('orb_idle'),
    listening: t('orb_listening'),
    processing: t('orb_processing'),
    speaking: t('orb_speaking'),
    muted: t('orb_muted'),
    error: t('orb_error')
  };

  text.textContent = stateLabels[state] || state;

  // Update tester buttons highlight
  document.querySelectorAll('.state-test-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-state') === state);
  });
}

function testVoiceState(state) {
  if (!voiceOrbInstance) {
    voiceOrbInstance = new CLYNORA_VoiceOrb('voiceOrbCanvas');
    voiceOrbInstance.start();
  }
  voiceOrbInstance.setState(state);
  
  const sampleMessages = {
    idle: currentLang === 'ta' ? "தயார் · பேச மைக்ரோஃபோனைத் தொடவும்" : currentLang === 'hi' ? "तैयार · बोलने के लिए माइक्रोफ़ोन दबाएं" : "Ready · Tap microphone to speak or choose a question below",
    listening: currentLang === 'ta' ? "மைக்ரோஃபோன் செயலில் உள்ளது... குரல் கேட்கப்படுகிறது" : currentLang === 'hi' ? "माइक्रोफ़ोन सक्रिय है... आपकी आवाज़ सुनी जा रही है" : "Microphone active... Listening for vital sign or clinical questions",
    processing: currentLang === 'ta' ? "மருத்துவ அல்காரிதம் பகுப்பாய்வு செய்கிறது..." : currentLang === 'hi' ? "क्लिनिकल डेटा व स्कोर का विश्लेषण जारी है..." : "Analyzing latest telemetry, EWS score, and clinical logs...",
    speaking: currentLang === 'ta' ? "CLYNORA குரல் வழியே மருத்துவப் பதிலை வழங்குகிறது..." : currentLang === 'hi' ? "CLYNORA वॉयस उत्तर दे रहा है..." : "CLYNORA is responding: Telemetry is within safe monitoring parameters.",
    muted: currentLang === 'ta' ? "மைக்ரோஃபோன் அணைக்கப்பட்டுள்ளது" : currentLang === 'hi' ? "माइक्रोफ़ोन म्यूट किया गया है" : "Microphone is muted. Click mic to re-enable."
  };
  showTranscript(sampleMessages[state] || state);
}

function renderVoiceQuickPrompts() {
  const container = document.getElementById('voiceQuickPrompts');
  if (!container) return;

  const role = window.U ? window.U.role : 'doc';
  let prompts = [];

  if (role === 'doc') {
    prompts = [t('prompt_doc_1'), t('prompt_doc_2'), t('prompt_doc_3')];
  } else if (role === 'nurse') {
    prompts = [t('prompt_nurse_1'), t('prompt_nurse_2'), t('prompt_nurse_3')];
  } else if (role === 'pat') {
    prompts = [t('prompt_pat_1'), t('prompt_pat_2')];
  } else if (role === 'att') {
    prompts = [t('prompt_att_1'), t('prompt_att_2')];
  } else {
    prompts = [t('prompt_doc_1'), t('prompt_nurse_1')];
  }

  container.innerHTML = `
    <span style="width:100%;text-align:center;font-size:0.75rem;color:#94a3b8;margin-bottom:2px">
      ${t('voice_prompts_title')}
    </span>
    ${prompts.map(p => `
      <button class="voice-prompt-chip" onclick="triggerVoicePrompt('${p.replace(/'/g, "\\'")}')">
        ${p}
      </button>
    `).join('')}
  `;
}

function updateOrbLanguage() {
  const sel = document.getElementById('voiceLangSelect');
  if (sel && typeof currentLang !== 'undefined') {
    sel.value = currentLang;
  }
  renderVoiceQuickPrompts();
  if (voiceOrbInstance) {
    updateOrbUIState(voiceOrbInstance.state);
  }
}

function showTranscript(text) {
  const box = document.getElementById('voiceTranscriptBox');
  if (!box) return;
  box.innerHTML = text;
  box.classList.add('active');
}

function getRoleGreeting() {
  const role = window.U ? window.U.role : 'doc';
  const name = window.U ? window.U.name : 'Clinical Staff';

  if (currentLang === 'ta') {
    if (role === 'doc') return `வணக்கம் ${name}. வார்டு 3 நோயாளிகளின் நிலவரம் தயார். எவ்வாறு உதவ முடியும்?`;
    if (role === 'nurse') return `வணக்கம் செவிலியர் பிரியா. படுக்கை 12 நோயாளிக்கு கவனம் தேவை. உடனடி சோதனைக்கு தயார்.`;
    if (role === 'pat') return `வணக்கம். உங்கள் நேரலை அளவீடுகள் திரையில் உள்ளன. சந்தேகங்களை குரல் மூலம் கேட்கலாம்.`;
    if (role === 'att') return `வரவேற்கிறோம். நோயாளியின் சமீபத்திய நிலவரத்தை இங்கே கேட்கலாம்.`;
    return "CLYNORA குரல் உதவியாளர் தயார். மருத்துவக் கேள்விகளைக் கேட்கவும்.";
  } else if (currentLang === 'hi') {
    if (role === 'doc') return `नमस्ते ${name}। वार्ड 3 के रोगियों का विवरण तैयार है। मैं क्या सहायता कर सकता हूँ?`;
    if (role === 'nurse') return `नमस्ते नर्स प्रिया। बेड 12 के मरीज को ध्यान की आवश्यकता है। ट्राइएज के लिए तैयार।`;
    if (role === 'pat') return `नमस्ते। आपके नवीनतम वाइटल स्क्रीन पर हैं। कोई भी प्रश्न पूछ सकते हैं।`;
    if (role === 'att') return `स्वागत है। आप मरीज के हालिया अपडेट के बारे में पूछ सकते हैं।`;
    return "CLYNORA वॉयस असिस्टेंट सक्रिय है। प्रश्न पूछें या नीचे से चुनें।";
  }

  if (role === 'doc') {
    return `Hello ${name}. Ward 3 has continuous telemetry active. How may I assist your rounds?`;
  } else if (role === 'nurse') {
    return `Nurse Priya, patient in Bed 12 has an active alert (108 bpm). Ready for rapid triage.`;
  } else if (role === 'pat') {
    return "Hello. Your latest readings are on screen. Ask me about your heart rate, oxygen or care team.";
  } else if (role === 'att') {
    return "Welcome. You can ask for the latest clinical vital signs and ward updates.";
  }
  return "CLYNORA Assistant active. Ask a clinical question or select a prompt below.";
}

// Interactive prompt execution for Voice Mode
function triggerVoicePrompt(promptText) {
  if (!voiceOrbInstance) {
    voiceOrbInstance = new CLYNORA_VoiceOrb('voiceOrbCanvas');
    voiceOrbInstance.start();
  }

  // 1. User Speaks / Prompt selected
  voiceOrbInstance.setState('listening');
  const userPrefix = currentLang === 'ta' ? "நீங்கள் கேட்ட கேள்வி:" : currentLang === 'hi' ? "आपने पूछा:" : "You asked:";
  showTranscript(`<strong>${userPrefix}</strong> "${promptText}"`);

  // 2. Processing
  setTimeout(() => {
    voiceOrbInstance.setState('processing');
    const procMsg = currentLang === 'ta' ? "சமீபத்திய அளவீடுகள், EWS மதிப்பெண் மற்றும் பதிவுகள் பகுப்பாய்வு செய்யப்படுகின்றன..." : currentLang === 'hi' ? "हालिया टेलीमेट्री, EWS स्कोर और क्लिनिकल रिकॉर्ड का विश्लेषण..." : "Analyzing latest telemetry, EWS score, and clinical logs...";
    showTranscript(procMsg);

    // 3. Response Generation
    setTimeout(() => {
      const responseHtml = generateAIAnswer(promptText);
      voiceOrbInstance.setState('speaking');
      showTranscript(responseHtml);

      // Play vocal speech synthesis if supported
      const cleanText = responseHtml.replace(/<[^>]*>/g, ' ');
      speakText(cleanText, () => {
        // Return to idle after speech completes
        voiceOrbInstance.setState('idle');
      });
    }, 1100);
  }, 900);
}

function speakText(text, onComplete) {
  if (!('speechSynthesis' in window)) {
    setTimeout(onComplete, 3500);
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Language selection for voice
  if (typeof currentLang !== 'undefined') {
    if (currentLang === 'ta') utterance.lang = 'ta-IN';
    else if (currentLang === 'hi') utterance.lang = 'hi-IN';
    else utterance.lang = 'en-US';
  }

  utterance.onend = onComplete;
  utterance.onerror = onComplete;
  window.speechSynthesis.speak(utterance);
}

function transitionToTextChat() {
  closeVoiceMode();
  if (typeof toggleAssistantDrawer === 'function') {
    toggleAssistantDrawer(true);
  }
}
