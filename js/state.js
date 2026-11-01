// CLYNORA State Management & Clinical Data Engine
// Preserves and upgrades original state with 5-portal data structures,
// real ESP32 Web Serial streaming, simulated live feed, and persistent storage.

const STORAGE_KEY = 'CLYNORA_STATE_V2';
const LEGACY_KEY = 'clinora.v1';

// Initial pre-seeded demo state
function getInitialState() {
  return {
    p: [],
    v: {},
    al: [],
    concerns: [],
    medReviews: [],
    devices: [],
    au: [],
    users: [],
    wards: []
  };
}

// Generate realistic 24-hour vitals curve
function generateVitalsHistory(hrStart, hrEnd, spo2Start, spo2End, tempStart, tempEnd, points) {
  const arr = [];
  const now = Date.now();
  const step = (24 * 3600000) / points;

  for (let i = points; i >= 0; i--) {
    const t = now - (i * step);
    const progress = (points - i) / points;
    
    // Add subtle organic noise
    const hrNoise = Math.sin(i * 1.5) * 2;
    const spo2Noise = (Math.cos(i * 2.1) > 0.5 ? 0 : -1);
    const tempNoise = Math.sin(i * 0.8) * 0.1;

    const hr = Math.round(hrStart + (hrEnd - hrStart) * progress + hrNoise);
    const spo2 = Math.min(100, Math.max(88, Math.round(spo2Start + (spo2End - spo2Start) * progress + spo2Noise)));
    const temp = +(tempStart + (tempEnd - tempStart) * progress + tempNoise).toFixed(1);

    arr.push({ t, k: 'hr', v: hr, s: 'device' });
    arr.push({ t, k: 'spo2', v: spo2, s: 'device' });
    arr.push({ t, k: 'temp', v: temp, s: 'device' });
  }
  return arr;
}

// Global State
var S = getInitialState();
if (typeof window !== 'undefined') window.S = S;

// Load persistent state
try {
  const saved = (typeof localStorage !== 'undefined') ? (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY)) : null;
  if (saved) {
    const parsed = JSON.parse(saved);
    // Merge existing patients and logs
    if (parsed.p && parsed.p.length) S.p = parsed.p;
    if (parsed.v && Object.keys(parsed.v).length) S.v = parsed.v;
    if (parsed.al && parsed.al.length) S.al = parsed.al;
    if (parsed.au && parsed.au.length) S.au = parsed.au;
    if (parsed.concerns) S.concerns = parsed.concerns;
    if (parsed.medReviews) S.medReviews = parsed.medReviews;
    if (parsed.devices) S.devices = parsed.devices;
    if (parsed.users) S.users = parsed.users;
    if (parsed.wards) S.wards = parsed.wards;
  }
} catch (e) {
  console.warn("Could not load stored CLYNORA state:", e);
}

function saveState() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
    }
  } catch (e) {
    console.warn("Error saving CLYNORA state:", e);
  }
}

// Active session variables
var U = null;       // Current authenticated user object: { id, name, role: 'doc'|'nurse'|'pat'|'att'|'admin', pid }
var activePortal = 'doc'; // Currently viewed portal: 'doc'|'nurse'|'pat'|'att'|'admin'
var view = '';      // Sub-view inside current portal
var cur = 101;      // Current active patient ID
var D = { pid: 101, last: {}, on: false, simulating: false };
var L = { ecg: [] };

if (typeof window !== 'undefined') {
  window.U = U;
  window.activePortal = activePortal;
  window.view = view;
  window.cur = cur;
  window.D = D;
  window.L = L;
}

// Logging action into audit trail
function logAction(action, category = "Clinical") {
  const entry = {
    t: Date.now(),
    u: U ? U.name : "System",
    role: U ? U.role.toUpperCase() : "SYSTEM",
    a: action,
    cat: category
  };
  S.au.unshift(entry);
  if (S.au.length > 300) S.au.pop();
  saveState();
}

// Time formatter
function tm(timestamp, format = 'short') {
  if (!timestamp) return '\u2014';
  const d = new Date(timestamp);
  if (format === 'timeOnly') {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  return d.toLocaleString([], {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function timeAgo(t) {
  if (!t) return '\u2014';
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

// Patient helpers
const getPatient = id => S.p.find(p => p.id === id);
const getLatestVital = (pid, key) => {
  const records = (S.v[pid] || []).filter(r => r.k === key);
  return records[records.length - 1];
};
const getVitalHistory = (pid, key, hours = 24) => {
  const cutoff = Date.now() - hours * 3600000;
  return (S.v[pid] || []).filter(r => r.k === key && r.t >= cutoff);
};

// Early Warning Score (NEWS2-inspired transparent calculation)
function calcEWS(patient) {
  if (!patient) return { rows: [], total: 0, max: 0, alert: false };
  const rows = [];
  const hr = getLatestVital(patient.id, 'hr');
  const sp = getLatestVital(patient.id, 'spo2');
  const tp = getLatestVital(patient.id, 'temp');

  if (hr) {
    let pts = 0;
    let comparison = 'General threshold';
    if (patient.base) {
      const dev = Math.abs(hr.v - patient.base) / patient.base;
      pts = dev <= 0.15 ? 0 : dev <= 0.25 ? 1 : dev <= 0.40 ? 2 : 3;
      comparison = `Compared to baseline ${patient.base} bpm (${Math.round(dev * 100)}% dev)`;
    } else {
      pts = hr.v <= 40 ? 3 : hr.v <= 50 ? 1 : hr.v <= 90 ? 0 : hr.v <= 110 ? 1 : hr.v <= 130 ? 2 : 3;
      comparison = 'Standard adult range';
    }
    rows.push({
      key: 'hr',
      label: typeof t === 'function' ? t('vitals_hr') : 'Heart Rate',
      val: `${hr.v} bpm`,
      pts,
      raw: hr.v,
      source: hr.s,
      note: comparison
    });
  }

  if (sp) {
    const pts = sp.v >= 96 ? 0 : sp.v >= 94 ? 1 : sp.v >= 92 ? 2 : 3;
    rows.push({
      key: 'spo2',
      label: typeof t === 'function' ? t('vitals_spo2') : 'SpO\u2082‚ Saturation',
      val: `${sp.v} %`,
      pts,
      raw: sp.v,
      source: sp.s,
      note: sp.v < 94 ? 'Hypoxemia warning' : 'Normal oxygenation'
    });
  }

  if (tp) {
    const pts = tp.v <= 35.0 ? 3 : tp.v <= 36.0 ? 1 : tp.v <= 38.0 ? 0 : tp.v <= 39.0 ? 1 : 2;
    rows.push({
      key: 'temp',
      label: typeof t === 'function' ? t('vitals_temp') : 'Temperature',
      val: `${tp.v} \u00B0C`,
      pts,
      raw: tp.v,
      source: tp.s,
      note: tp.v > 38.0 ? 'Elevated pyrexia' : 'Normothermia'
    });
  }

  const total = rows.reduce((acc, r) => acc + r.pts, 0);
  const max = Math.max(0, ...rows.map(r => r.pts));
  // Alert if aggregate score is >= 3 or any individual parameter score is 3 (severe deviation)
  const isAlert = rows.length > 0 && (total >= 3 || max === 3);

  return { rows, total, max, alert: isAlert };
}

// Ingest reading
function pushVital(pid, key, val, source = 'device') {
  if (!S.v[pid]) S.v[pid] = [];

  const recordedAt = Date.now();
  const numericValue = Number(val);

  S.v[pid].push({
    t: recordedAt,
    k: key,
    v: numericValue,
    s: source
  });

  // Maintain max 1000 readings per patient
  if (S.v[pid].length > 1000) S.v[pid].shift();

  // Persist only patients loaded from Supabase
  const patient = S.p.find(p => Number(p.id) === Number(pid));
  const supabase = window.supabaseClient;

  if (patient?.dbBacked && supabase && Number.isFinite(numericValue)) {
    supabase
      .from('vitals')
      .insert({
        patient_id: Number(pid),
        recorded_at_ms: recordedAt,
        vital_type: key,
        value: numericValue,
        source
      })
      .then(({ error }) => {
        if (error) console.error("Could not save vital to Supabase:", error);
      })
      .catch(error => {
        console.error("Vital save request failed:", error);
      });
  }
}
// Evaluate deterioration and update alert status
function evaluatePatient(patient) {
  const ews = calcEWS(patient);
  if (ews.alert && patient.status === 'checked') {
    patient.status = 'unchecked';
    patient.autoAlert = true;
    const newAlert = {
      id: Date.now(),
      pid: patient.id,
      score: ews.total,
      t: Date.now(),
      level: ews.total >= 5 ? 'critical' : 'high',
      cat: 'Deterioration Threshold',
      desc: `Automated alert triggered (Score ${ews.total}): ${ews.rows.map(r => `${r.label} ${r.val}`).join(', ')}`,
      res: null,
      assigned: patient.nurse || "On-duty Nurse"
    };
    S.al.unshift(newAlert);
    logAction(`Early Warning Alert triggered for ${patient.name} (Score ${ews.total})`, "Alert");
  } else if (!ews.alert && patient.status === 'unchecked' && patient.autoAlert) {
    patient.status = 'checked';
    patient.autoAlert = false;
    S.al.filter(a => a.pid === patient.id && !a.res).forEach(a => {
      a.res = { t: Date.now(), by: 'Automated Recovery' };
    });
    logAction(`Vitals returned to baseline/safe limits: ${patient.name}`, "Clinical");
  }
  saveState();
}

// Real-time Virtual Simulation Engine (for judges / demonstrations without physical ESP32)
let simTimer = null;
function toggleSimulation() {
  if (D.simulating) {
    clearInterval(simTimer);
    simTimer = null;
    D.simulating = false;
    logAction("Virtual ESP32 simulation stopped", "Device");
    if (typeof showToast === 'function') showToast("Simulation stopped");
  } else {
    D.simulating = true;
    logAction("Virtual ESP32 simulation started for active patient", "Device");
    if (typeof showToast === 'function') showToast("Virtual ESP32 streaming live data");
    
    simTimer = setInterval(() => {
      const pid = cur || (S.p[0] && S.p[0].id);
      const patient = getPatient(pid);
      if (!patient) return;
      
      const lastHR = getLatestVital(pid, 'hr')?.v || patient.base || 72;
      const lastSp = getLatestVital(pid, 'spo2')?.v || 98;
      const lastTp = getLatestVital(pid, 'temp')?.v || 36.8;

      // Realistic minor wander
      const newHR = Math.max(50, Math.min(130, Math.round(lastHR + (Math.random() - 0.49) * 2)));
      const newSp = Math.max(90, Math.min(100, Math.round(lastSp + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0))));
      const newTp = +(Math.max(35.5, Math.min(39.5, lastTp + (Math.random() - 0.5) * 0.05))).toFixed(1);

      pushVital(pid, 'hr', newHR, 'device');
      pushVital(pid, 'spo2', newSp, 'device');
      pushVital(pid, 'temp', newTp, 'device');
      
      D.last.hr = Date.now();
      D.last.spo2 = Date.now();
      D.last.temp = Date.now();
      D.last.ecg = Date.now();

      evaluatePatient(patient);
      
      if (typeof updateLiveVitalsDOM === 'function') {
        updateLiveVitalsDOM();
      }
    }, 2500);
  }
  if (typeof draw === 'function') draw();
}

// Web Serial API (ESP32 connection)
let serialPort = null;
let serialReader = null;

async function connectSerial() {
  const pid = D.pid || cur;
  const patient = getPatient(pid);
  if (!patient) {
    if (typeof showToast === 'function') showToast("Select a patient to link the device to first");
    return;
  }
  if (!('serial' in navigator)) {
    if (typeof showToast === 'function') showToast("Web Serial requires Google Chrome or Microsoft Edge");
    return;
  }

  try {
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 115200 });
    D.on = true;
    logAction(`ESP32 hardware serial connected for ${patient.name}`, "Device");
    if (typeof showToast === 'function') showToast(`ESP32 linked to ${patient.name}`);
    if (typeof draw === 'function') draw();

    const textDecoder = new TextDecoderStream();
    serialPort.readable.pipeTo(textDecoder.writable);
    serialReader = textDecoder.readable.getReader();
    let buffer = '';

    while (true) {
      const { value, done } = await serialReader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split('\n');
      buffer = lines.pop();

      lines.forEach(line => {
        try {
          const json = JSON.parse(line.trim());
          ingestSerialPacket(json, patient);
        } catch (err) {
          // Incomplete packet; ignore
        }
      });
    }
  } catch (err) {
    console.error("Web Serial connection error:", err);
    if (typeof showToast === 'function') showToast("Serial connection closed or cancelled");
    D.on = false;
    if (typeof draw === 'function') draw();
  }
}

function ingestSerialPacket(data, patient) {
  const now = Date.now();
  if (data.ecg !== undefined && isFinite(data.ecg)) {
    L.ecg.push(+data.ecg);
    if (L.ecg.length > 500) L.ecg.shift();
    D.last.ecg = now;
  }
  ['hr', 'spo2', 'temp'].forEach(k => {
    if (data[k] !== undefined && isFinite(data[k])) {
      pushVital(patient.id, k, data[k], 'device');
      D.last[k] = now;
    }
  });
  evaluatePatient(patient);
}


