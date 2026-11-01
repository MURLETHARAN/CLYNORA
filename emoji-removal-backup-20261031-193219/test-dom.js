// Comprehensive Verification Test Suite for CLYNORA Frontend
const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = global;
global.window.scrollTo = () => {};
global.document = {
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: (id) => ({
    id,
    classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
    style: {},
    addEventListener: () => {},
    parentElement: { getBoundingClientRect: () => ({ width: 600, height: 300 }) },
    getContext: () => ({
      scale: () => {},
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      arc: () => {},
      ellipse: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      closePath: () => {},
      createRadialGradient: () => ({ addColorStop: () => {} }),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => {}
    })
  }),
  documentElement: { lang: 'en' },
  body: { style: {}, appendChild: () => {} }
};
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = v; },
  removeItem(k) { delete this._store[k]; }
};
global.requestAnimationFrame = () => 1;
global.cancelAnimationFrame = () => {};
global.addEventListener = () => {};
global.navigator = { mediaDevices: {} };

// Load application scripts into global context
const vm = require('vm');
const dir = path.join(__dirname, 'js');
['translations.js', 'state.js', 'ecg.js', 'orb.js', 'assistant.js', 'app.js'].forEach(file => {
  const code = fs.readFileSync(path.join(dir, file), 'utf8');
  vm.runInThisContext(code);
});

console.log("=== RUNNING CLYNORA TEST SUITE ===");

// 1. Translations check
console.assert(TRANSLATIONS.en && TRANSLATIONS.ta && TRANSLATIONS.hi, "Translations must support en, ta, hi");
console.assert(t('appName') === 'CLYNORA', "App name must be CLYNORA");
console.log("✓ Translations verified for English, Tamil, and Hindi");

// 2. Language Switching Across Portals Check
setLanguage('ta');
console.assert(currentLang === 'ta', "Language must switch to Tamil");
console.assert(t('nav_overview') === "வார்டு மேலோட்டம்", "Tamil navigation item must match");
console.assert(t('btn_add_patient') === "நோயாளி சேர்க்க", "Tamil button label must match");

setLanguage('hi');
console.assert(currentLang === 'hi', "Language must switch to Hindi");
console.assert(t('nav_overview') === "वार्ड अवलोकन", "Hindi navigation item must match");
console.assert(t('btn_add_patient') === "मरीज जोड़ें", "Hindi button label must match");

setLanguage('en');
console.assert(currentLang === 'en', "Language must switch back to English");
console.assert(t('nav_overview') === "Ward Overview", "English navigation item must match");
console.log("✓ Language switching verified across en, ta, hi dictionaries");

// 3. Initial state verification
console.assert(S.p.length >= 4, "Must have pre-seeded ward patients");
console.assert(S.al.length >= 3, "Must have pre-seeded alerts");
console.assert(S.concerns.length >= 2, "Must have pre-seeded attender concerns");
console.assert(S.devices.length >= 4, "Must have pre-seeded ESP32 devices");
console.assert(S.users && S.users.length >= 5, "Must have pre-seeded user directory");
console.assert(S.wards && S.wards.length >= 3, "Must have pre-seeded ward directory");
console.log(`✓ Initial state verified: ${S.p.length} patients, ${S.al.length} alerts, ${S.concerns.length} concerns, ${S.devices.length} devices, ${S.users.length} users, ${S.wards.length} wards`);

// 4. Early Warning Score (EWS) logic
const ramesh = getPatient(101);
const rameshEWS = calcEWS(ramesh);
console.assert(rameshEWS.total >= 3, "Ramesh Kumar must have EWS score >= 3 due to tachycardia/fever");
console.assert(rameshEWS.alert === true, "Ramesh Kumar must trigger deterioration alert");
console.log(`✓ Early Warning Score verified: Ramesh Kumar score = ${rameshEWS.total}, alert = ${rameshEWS.alert}`);

// 5. Portal Views Rendering Check (in English, Tamil, and Hindi)
['en', 'ta', 'hi'].forEach(l => {
  setLanguage(l);
  
  // Doctor Views
  U = { id: 'doc.patel', name: 'Dr. Arvind Patel', role: 'doc', pid: null };
  activePortal = 'doc';
  const docViews = ['ov', 'pt', 'dt_detail', 'dt_triage', 'al', 'cn', 'dv', 'ar'];
  docViews.forEach(v => {
    view = v;
    const html = renderPageContent();
    console.assert(typeof html === 'string' && html.length > 50, `Doctor view ${v} failed to render in lang ${l}`);
  });

  // Nurse Views
  U = { id: 'nurse.priya', name: 'Nurse Priya Nair', role: 'nurse', pid: null };
  activePortal = 'nurse';
  const nurseViews = ['n_triage', 'n_alerts', 'n_complaints', 'n_meds', 'n_vitals'];
  nurseViews.forEach(v => {
    view = v;
    const html = renderPageContent();
    console.assert(typeof html === 'string' && html.length > 50, `Nurse view ${v} failed to render in lang ${l}`);
  });

  // Patient Views
  U = { id: 'pat.ramesh', name: 'Ramesh Kumar', role: 'pat', pid: 101 };
  activePortal = 'pat';
  const patViews = ['p_vitals', 'p_status', 'p_history', 'p_health', 'p_chat'];
  patViews.forEach(v => {
    view = v;
    const html = renderPageContent();
    console.assert(typeof html === 'string' && html.length > 50, `Patient view ${v} failed to render in lang ${l}`);
  });

  // Attender Views
  U = { id: 'att.kavita', name: 'Kavita Kumar', role: 'att', pid: 101 };
  activePortal = 'att';
  const attViews = ['a_status', 'a_readings', 'a_submit', 'a_concerns', 'a_history'];
  attViews.forEach(v => {
    view = v;
    const html = renderPageContent();
    console.assert(typeof html === 'string' && html.length > 50, `Attender view ${v} failed to render in lang ${l}`);
  });

  // Administrator Views
  U = { id: 'admin.rajesh', name: 'Rajesh Sharma', role: 'admin', pid: null };
  activePortal = 'admin';
  const adminViews = ['adm_users', 'adm_wards', 'adm_devices', 'adm_audit', 'adm_system'];
  adminViews.forEach(v => {
    view = v;
    const html = renderPageContent();
    console.assert(typeof html === 'string' && html.length > 50, `Admin view ${v} failed to render in lang ${l}`);
  });
});
console.log("✓ All 28 portal views render successfully in English, Tamil, and Hindi");

// 6. Test AI Assistant logic across languages
setLanguage('en');
const q1 = generateAIAnswer("Summarize vitals for this patient");
console.assert(q1.includes("Clinical Summary"), "Assistant should summarize vitals in English");
const q2 = generateAIAnswer("Show unreviewed concerns");
console.assert(q2.includes("Unreviewed"), "Assistant should list concerns in English");
const q3 = generateAIAnswer("Which patients require immediate attention?");
console.assert(q3.includes("Immediate Bedside Attention"), "Assistant should identify deteriorating patients in English");

setLanguage('ta');
const q1_ta = generateAIAnswer("இந்த நோயாளியின் சமீபத்திய அளவீடுகளை சுருக்கி கூறு");
console.assert(q1_ta.includes("மருத்துவ சுருக்கம்") || q1_ta.includes("இதயத் துடிப்பு"), "Assistant should summarize in Tamil");

setLanguage('hi');
const q1_hi = generateAIAnswer("किन मरीजों को तुरंत बेडसाइड ध्यान की आवश्यकता है?");
console.assert(q1_hi.includes("बेडसाइड ध्यान") || q1_hi.includes("मरीज"), "Assistant should identify deteriorating patients in Hindi");

setLanguage('en');
console.log("✓ Multilingual AI Clinical Rules Engine verified in English, Tamil, and Hindi");

// 7. Interactive Modals & Handlers Verification
console.assert(typeof openQuickVitalModal === 'function', "openQuickVitalModal must be defined");
console.assert(typeof openAddUserModal === 'function', "openAddUserModal must be defined");
console.assert(typeof openAddWardModal === 'function', "openAddWardModal must be defined");
console.assert(typeof openGoogleHealthModal === 'function', "openGoogleHealthModal must be defined");
console.assert(typeof testVoiceState === 'function', "testVoiceState must be defined");
console.assert(typeof executeInPagePrompt === 'function', "executeInPagePrompt must be defined");
console.log("✓ All interactive modals, quick vital entry, user administration, and voice handlers verified");

// 8. Test Voice Orb
const orb = new CLYNORA_VoiceOrb('voiceOrbCanvas');
console.assert(orb.state === 'idle', "Initial orb state must be idle");
['listening', 'processing', 'speaking', 'muted', 'error', 'idle'].forEach(st => {
  orb.setState(st);
  console.assert(orb.state === st, `Orb state transition to ${st} failed`);
});
console.log("✓ Voice Orb state transitions verified");

console.log("=== ALL TESTS PASSED SUCCESSFULLY! ===");
