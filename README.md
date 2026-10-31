# CLYNORA — Continuous Patient Deterioration Monitoring Platform

**CLYNORA** is a wearable patient deterioration monitoring platform designed for general wards, rural hospitals, and semi-urban healthcare facilities. It captures chest-patch telemetry (ESP32 microcontroller with AD8232 Lead II ECG and MAX30102 pulse/SpO₂ sensors), calculates transparent early warning scores, and empowers clinical teams with rapid triage, alert management, and caregiver communication.

---

## 🚀 Quick Start (Running Locally)

### Option 1: Direct Browser Launch
Simply double-click `index.html` or double-click `start.bat` in Windows Explorer. It will immediately open in Google Chrome or Microsoft Edge with zero build steps or dependencies required.

### Option 2: Local HTTP Server (Python or Node.js) on Port 8081
```bash
# Using Python
cd clynora-frontend
python -m http.server 8081

# Or using Node.js
npx serve -l 8081 .
```
Then navigate to the development URL: `http://localhost:8081`

---

## 🩺 Five Role-Based Portals

| Portal | Intended Role | Access Permissions | Key Workflows |
|---|---|---|---|
| **Doctor Portal** | Physicians / Surgeons | Full access + Portal Switcher | Ward census, early warning triage, telemetry review, clinical alerts, unreviewed concerns, baseline override |
| **Nurse Portal** | Ward / Bedside Nurses | Full access + Portal Switcher | Bedside triage queue, 1-click alert acknowledgement, patient complaints, medication verification schedule, quick vitals entry |
| **Patient Portal** | In-ward Patients | Strictly restricted to own patient record | Live telemetry readings, transparent health status breakdown, vitals history, nurse call button, AI health assistant |
| **Attender Portal** | Family / Guardians | Strictly restricted to authorized patient record | Patient condition overview, non-jargon vitals summary, concern submission form, caregiver notification log |
| **Administrator Portal** | Hospital IT / Clinical Ops | Administrative management | User & role access directory, ward/bed occupancy, ESP32 wearable fleet inventory, full audit compliance log |

> **Note on Access Control:** Doctors and nurses have a dedicated **Portal Switcher** dropdown in the navigation and sidebar allowing them to inspect any portal experience or select individual patient charts. In contrast, patients and attenders are strictly confined to their own authorized records, with portal switching hidden and route restrictions enforced.

---

## ✨ AI Voice Assistant & Glowing Interactive AI Orb

CLYNORA features a ChatGPT-inspired full-screen immersive voice assistant interface:

- **Central Luminous Sphere (AI Voice Orb):** Multi-layer glowing canvas shader with cyan, electric teal, medical cobalt, and subtle violet lighting.
- **Dynamic Voice States:**
  - `Idle`: Harmonic floating drift and slow ambient breathing glow.
  - `Listening`: Responds directly to live microphone input using the browser's Web Audio API (`AudioContext` and `AnalyserNode`), expanding and rippling with real vocal volume.
  - `Processing`: Rotating vortex light filaments and spiral light patterns.
  - `Speaking`: Cadenced vocal undulations with browser Speech Synthesis (`SpeechSynthesisUtterance`).
  - `Muted`: Dimmed amber illumination with muted microphone indicator.
  - `Error / Disconnected`: Non-intrusive alert state with 1-click retry.
- **State Tester Bar:** Built-in one-click buttons (`Idle`, `Listening`, `Processing`, `Speaking`, `Muted`) enabling evaluators to inspect every visual state immediately.
- **Role-Aware Suggestions:** Clinical suggestions tailored for Doctors, Nurses, Patients, and Attenders.
- **Multilingual Support:** Instant UI and speech language switching between **English**, **Tamil (தமிழ்)**, and **Hindi (हिन्दी)**.

---

## 📊 Interactive Clinical Monitor & Telemetry

- **Calibrated Lead II ECG Canvas Monitor:** Real-time medical sweep display (25 mm/s, 10 mm/mV) rendering authentic P-Q-R-S-T cardiac cycles synchronized to the patient's live heart rate.
- **Early Warning Score (EWS):** Transparent multi-parameter scoring (Heart rate, SpO₂, Temperature) alerting care teams when deterioration thresholds are crossed.
- **Hardware Integration (Web Serial API):** Connects directly to physical ESP32 boards via USB (115200 baud) for live telemetry streaming.
- **Virtual Telemetry Simulator:** Built-in simulator generating organic physiological vitals for demonstrations when physical hardware is not plugged in.
- **Attender Concern Communication Loop:** Attenders can submit symptoms or requests; they immediately appear in the nurse's triage queue and doctor's unreviewed concerns, with real-time status tracking upon nurse review.

---

## 📁 File Structure

```
clynora-frontend/
├── index.html          # Main HTML5 application container
├── start.bat           # 1-click launch batch script for Windows
├── README.md           # Documentation and architecture guide
├── test-dom.js         # Automated verification test suite
├── css/
│   ├── style.css       # Neumorphic clinical design system & portal layouts
│   └── orb.css         # Voice chat overlay & glowing AI orb styling
└── js/
    ├── translations.js # Multilingual dictionary (English, Tamil, Hindi)
    ├── state.js        # Persistent state, pre-seeded ward data, EWS engine & Web Serial driver
    ├── ecg.js          # Calibrated clinical Lead II ECG canvas renderer
    ├── orb.js          # Glowing interactive AI voice orb & Web Audio API analyzer
    ├── assistant.js    # Floating assistant drawer & clinical rules engine
    └── app.js          # Portal router, role-based workflows & interactive modals
```

---

## 🔒 Clinical Disclaimer
CLYNORA is a clinical decision support tool designed for general wards and rural healthcare facilities. It supports care teams and does not replace professional clinical judgment or emergency response systems.
