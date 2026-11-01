// CLYNORA Application Core Engine
// Role-based routing, portal switching, clinical dashboards, and user actions.
// Full multilingual support (en, ta, hi) throughout every component.

const SESSION_KEY = 'CLYNORA_SESSION';

// Restore authenticated session
try {
  const savedSession = typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
  if (savedSession) {
    const parsed = JSON.parse(savedSession);
    U = parsed.user;
    activePortal = parsed.portal || (U ? U.role : 'doc');
    cur = parsed.cur || 101;
  }
} catch (e) {
  console.warn("Could not parse saved session:", e);
}

function saveSession() {
  try {
    if (typeof localStorage !== 'undefined') {
      if (U) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ user: U, portal: activePortal, cur }));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  } catch (e) {}
}

// Navigation structure definitions with translation keys
const PORTAL_MENUS = {
  doc: [
    ['nav_overview', 'ov'],
    ['nav_patients', 'pt'],
    ['nav_deterioration', 'dt_triage'],
    ['nav_alerts', 'al'],
    ['nav_concerns', 'cn'],
    ['nav_device', 'dv'],
    ['nav_audit', 'ar']
  ],
  nurse: [
    ['nav_nurse_triage', 'n_triage'],
    ['nav_nurse_alerts', 'n_alerts'],
    ['nav_nurse_complaints', 'n_complaints'],
    ['nav_nurse_meds', 'n_meds'],
    ['nav_nurse_vitals', 'n_vitals']
  ],
  pat: [
    ['nav_my_vitals', 'p_vitals'],
    ['nav_predicted_status', 'p_status'],
    ['nav_health_history', 'p_history'],
    ['nav_personal_health', 'p_health'],
    ['nav_ask_assistant', 'p_chat']
  ],
  att: [
    ['nav_att_status', 'a_status'],
    ['nav_att_readings', 'a_readings'],
    ['nav_att_submit', 'a_submit'],
    ['nav_att_concerns', 'a_concerns'],
    ['nav_att_history', 'a_history']
  ],
  admin: [
    ['nav_admin_users', 'adm_users'],
    ['nav_admin_wards', 'adm_wards'],
    ['nav_admin_devices', 'adm_devices'],
    ['nav_admin_audit', 'adm_audit'],
    ['nav_admin_system', 'adm_system']
  ]
};

function getRoleDisplayName(role) {
  return t('role_' + role) || role;
}

// UI Navigation Helpers
function go(screenId) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.scr').forEach(el => {
    el.classList.toggle('on', el.id === screenId);
  });
  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
  updateNavHeader();
}

function sc(sectionId) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(sectionId);
  if (el && typeof el.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

function showToast(msg) {
  if (typeof document === 'undefined') return;
  const tEl = document.getElementById('ts');
  if (!tEl) return;
  tEl.textContent = msg;
  tEl.style.display = 'block';
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => { tEl.style.display = 'none'; }, 2800);
}

function modal(html) {
  if (typeof document === 'undefined') return;
  const m = document.getElementById('md');
  if (!m) return;
  m.innerHTML = `<div class="box card">${html}<button class="x" onclick="closeModal()" aria-label="Close">&#x2715;</button></div>`;
  m.classList.add('on');
}

function closeModal() {
  if (typeof document === 'undefined') return;
  const m = document.getElementById('md');
  if (m) m.classList.remove('on');
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', e => {
    if (e.target.id === 'md') closeModal();
    
    // Close floating guide if clicked outside
    const gp = document.getElementById('gp');
    const gd = document.getElementById('gd');
    if (gp && gp.classList.contains('on') && !gp.contains(e.target) && gd && !gd.contains(e.target)) {
      gp.classList.remove('on');
    }

    // Close mobile sidebar if clicked on main content area
    const sd = document.getElementById('sd');
    const mb = document.getElementById('mb');
    if (sd && sd.classList.contains('on') && !sd.contains(e.target) && mb && !mb.contains(e.target)) {
      sd.classList.remove('on');
    }
  });
}

// Landing Page Explore Action
function explore() {
  go('loader');
  setTimeout(() => {
    go('home');
  }, 2200);
}

// Nav Header update
function updateNavHeader() {
  if (typeof document === 'undefined') return;
  const hn = document.getElementById('hn');
  if (!hn) return;
  if (U) {
    hn.innerHTML = `
      <button onclick="openApp()">${t('profileBtn')}: ${U.name}</button>
      <button class="red" onclick="logout()">${t('logoutBtn')}</button>
    `;
  } else {
    hn.innerHTML = `<button class="pri" onclick="login()">${t('loginBtn')}</button>`;
  }
}

// Authentication Modal
function login() {
  modal(`
    <h2 style="text-align:center;margin-bottom:6px">${t('choosePortal')}</h2>
    <p class="mut" style="text-align:center;margin-bottom:24px">${t('selectRoleDesc')}</p>
    
    <div class="role-grid">
      <!-- Doctor Card -->
      <div class="card role-card" onclick="openLoginCredentials('doc')">
        <div class="ic"><svg viewBox="0 0 24 24"><path d="M6 3v6a4 4 0 008 0V3M10 13v3a4 4 0 008 0"/><circle cx="18" cy="12" r="2"/></svg></div>
        <h3>${t('docRoleTitle')}</h3>
        <p class="mut" style="font-size:0.86rem;margin-top:6px">${t('docRoleDesc')}</p>
        <button class="pri" style="margin-top:14px;width:100%">${t('docRoleTitle')} ${t('loginBtn')}</button>
      </div>

      <!-- Nurse Card -->
      <div class="card role-card" onclick="openLoginCredentials('nurse')">
        <div class="ic"><svg viewBox="0 0 24 24"><path d="M12 2v20M2 12h20"/><circle cx="12" cy="12" r="9"/></svg></div>
        <h3>${t('nurseRoleTitle')}</h3>
        <p class="mut" style="font-size:0.86rem;margin-top:6px">${t('nurseRoleDesc')}</p>
        <button class="pri" style="margin-top:14px;width:100%">${t('nurseRoleTitle')} ${t('loginBtn')}</button>
      </div>

      <!-- Patient Card -->
      <div class="card role-card" onclick="openLoginCredentials('pat')">
        <div class="ic"><svg viewBox="0 0 24 24"><path d="M12 21s-8-5-8-11a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 6-8 11-8 11z"/></svg></div>
        <h3>${t('patRoleTitle')}</h3>
        <p class="mut" style="font-size:0.86rem;margin-top:6px">${t('patRoleDesc')}</p>
        <button class="pri" style="margin-top:14px;width:100%">${t('patRoleTitle')} ${t('loginBtn')}</button>
      </div>

      <!-- Attender Card -->
      <div class="card role-card" onclick="openLoginCredentials('att')">
        <div class="ic"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-4 3-6 6-6s6 2 6 6M15 15c3 0 6 1 6 5"/></svg></div>
        <h3>${t('attRoleTitle')}</h3>
        <p class="mut" style="font-size:0.86rem;margin-top:6px">${t('attRoleDesc')}</p>
        <button class="pri" style="margin-top:14px;width:100%">${t('attRoleTitle')} ${t('loginBtn')}</button>
      </div>

      <!-- Administrator Card -->
      <div class="card role-card" onclick="openLoginCredentials('admin')">
        <div class="ic"><svg viewBox="0 0 24 24"><path d="M12 15a3 3 0 100-6 3 3 0 000 6z"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg></div>
        <h3>${t('adminRoleTitle')}</h3>
        <p class="mut" style="font-size:0.86rem;margin-top:6px">${t('adminRoleDesc')}</p>
        <button class="pri" style="margin-top:14px;width:100%">${t('adminRoleTitle')} ${t('loginBtn')}</button>
      </div>
    </div>
  `);
}

function openLoginCredentials(role) {
  if (U && U.role === role) {
    activePortal = role;
    openApp();
    return;
  }
  const needsPatientLink = (role === 'pat' || role === 'att');

  modal(`
    <div class="fm">
      <h2 style="margin-bottom:6px">${getRoleDisplayName(role)} ${t('loginBtn')}</h2>
      <p class="mut" style="font-size:0.88rem">${t('guide_step2_desc')}</p>

      <label for="uid">${t('lbl_user_id')}</label>
      <input id="uid" autocomplete="off" placeholder="Enter User ID">

      <label for="pwd">${t('lbl_password')}</label>
      <input id="pwd" type="password" placeholder="Enter password">

      ${needsPatientLink ? `
        <label for="linkedPid">${t('authorized_patient_record')}</label>
        <select id="linkedPid">
          <option value="">No patient records available</option>
          ${S.p.map(p => `
            <option value="${p.id}">
              ${p.name} - Ward ${p.ward} / Bed ${p.bed}
            </option>
          `).join('')}
        </select>
      ` : ''}

      <button class="pri" onclick="submitLogin('${role}')">${t('authenticate_btn')}</button>
      <button style="margin-top:10px" onclick="login()">${t('back_to_role_selection')}</button>
    </div>
  `);
}
async function submitLogin(role) {
  const uid = document.getElementById('uid').value.trim();
  const pwd = document.getElementById('pwd').value;

  if (!uid || !pwd) {
    showToast("Please enter your User ID and password");
    return;
  }

  // Demo-only mapping: CLYNORA User ID -> Supabase Auth email.
  const demoAccounts = {
    DEMO_DOC_001: {
      email: 'm.roshini10440@gmail.com',
      role: 'doc'
    }
  };

  const account = demoAccounts[uid];
  if (!account || account.role !== role) {
    showToast("Invalid User ID or portal");
    return;
  }

  const supabase = window.supabaseClient;
  if (!supabase) {
    showToast("Authentication service is unavailable");
    return;
  }

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: account.email,
      password: pwd
    });

  if (authError || !authData.user) {
    showToast("Invalid User ID or password");
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, user_id, role, display_name, patient_id')
    .eq('id', authData.user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.user_id !== uid ||
    profile.role !== role
  ) {
    await supabase.auth.signOut();
    showToast("This account is not authorized for this portal");
    return;
  }

  U = {
    id: profile.user_id,
    name: profile.display_name || profile.user_id,
    role: profile.role,
    pid: profile.patient_id || null
  };

  activePortal = profile.role;
  if (U.pid) cur = U.pid;

  try {
    await loadSupabasePatients();
  } catch (error) {
    console.error("Could not load patients from Supabase:", error);
    showToast("Could not load patient records");
  }

  closeModal();
  saveSession();
  logAction(`User ${U.name} authenticated successfully`, "Auth");
  openApp();
  showToast(`Signed in to ${getRoleDisplayName(profile.role)}`);
}

async function logout() {
  const signedOutUser = U ? U.name : 'Unknown';

  try {
    if (window.supabaseClient) {
      const { error } = await window.supabaseClient.auth.signOut();
      if (error) {
        console.error("Supabase sign-out failed:", error.message);
        showToast("Could not sign out from the authentication service");
        return;
      }
    }
  } catch (error) {
    console.error("Supabase sign-out failed:", error);
    showToast("Could not sign out from the authentication service");
    return;
  }

  logAction(`User ${signedOutUser} signed out`, "Auth");
  U = null;
  saveSession();
  go('home');
  showToast(t('logoutBtn'));
}

async function loadSupabasePatients() {
  const supabase = window.supabaseClient;
  if (!supabase) throw new Error("Supabase client is unavailable");

  const { data, error } = await supabase
    .from('patients')
    .select('id, name, age, gender, ward, bed, status, is_active, baseline_hr, condition, doctor, nurse, bp, rr, motion, auto_alert, device_id')
    .order('id');

  if (error) throw error;

  S.p = (data || []).map(row => ({
    id: Number(row.id),
      dbBacked: true,
    name: row.name || "Unnamed patient",
    age: row.age ?? "—",
    gender: row.gender || "—",
    ward: row.ward || "—",
    bed: row.bed || "—",
    status: row.status === "unchecked" ? "unchecked" : "checked",
    on: row.is_active !== false,
    base: row.baseline_hr ?? null,
    condition: row.condition || "—",
    doctor: row.doctor || "—",
    nurse: row.nurse || "—",
    bp: row.bp || "—",
    rr: row.rr ?? null,
    motion: row.motion || "—",
    autoAlert: row.auto_alert === true,
    dev: row.device_id || "ESP32"
  }));

  // Restore saved vital readings from Supabase
  const { data: vitalRows, error: vitalError } = await supabase
    .from('vitals')
    .select('id, patient_id, recorded_at_ms, vital_type, value, source')
    .order('recorded_at_ms', { ascending: true });

  if (vitalError) {
    console.error("Could not load saved vitals from Supabase:", vitalError);
  } else {
    for (const row of (vitalRows || [])) {
      const pid = Number(row.patient_id);
      if (!S.v[pid]) S.v[pid] = [];

      // Avoid adding the same database row twice
      if (S.v[pid].some(v => v.dbId === row.id)) continue;

      S.v[pid].push({
        dbId: row.id,
        t: Number(row.recorded_at_ms),
        k: row.vital_type,
        v: Number(row.value),
        s: row.source || 'device'
      });
    }

    for (const records of Object.values(S.v)) {
      records.sort((a, b) => a.t - b.t);
    }
  }
  if (!U.pid && S.p.length) cur = S.p[0].id;
  D.pid = cur;
  window.cur = cur;
}
function openApp() {
  if (!U) {
    login();
    return;
  }
  go('app');

  // Enforce role restrictions
  if (U.role === 'pat') {
    activePortal = 'pat';
  } else if (U.role === 'att') {
    activePortal = 'att';
  }

  const defaultViews = {
    doc: 'ov',
    nurse: 'n_triage',
    pat: 'p_vitals',
    att: 'a_status',
    admin: 'adm_users'
  };

  nav(view || defaultViews[activePortal] || 'ov');
}

// Portal Switcher for Doctors & Nurses
function switchPortal(targetPortal) {
  if (U.role !== 'doc' && U.role !== 'nurse') {
    showToast("Access Restricted: Only clinical staff can switch portals");
    return;
  }

  activePortal = targetPortal;
  const defaultViews = {
    doc: 'ov',
    nurse: 'n_triage',
    pat: 'p_vitals',
    att: 'a_status',
    admin: 'adm_users'
  };

  view = defaultViews[targetPortal] || 'ov';
  saveSession();
  draw();
  showToast(`${t('portalSwitcherLabel')}: ${getRoleDisplayName(targetPortal)}`);
}

function nav(v) {
  // Access check: prevent Patient/Attender from accessing other routes
  if (U && (U.role === 'pat' || U.role === 'att')) {
    if (activePortal !== U.role) {
      activePortal = U.role;
      view = U.role === 'pat' ? 'p_vitals' : 'a_status';
      draw();
      showToast("Access Restricted to your assigned portal");
      return;
    }
  }

  view = v;
  draw();
  const side = document.getElementById('sd');
  if (side) side.classList.remove('on');
}

// Main UI Render Function
function draw() {
  if (!U) return;

  const currentMenu = PORTAL_MENUS[activePortal] || PORTAL_MENUS.doc;
  const activeItem = currentMenu.find(m => m[1] === view) || currentMenu[0];
  
  // Set title in top bar
  const titleEl = document.getElementById('ti');
  if (titleEl) {
    titleEl.innerHTML = `
      <span>${activeItem ? t(activeItem[0]) : t('appName')}</span>
      <span class="chip ${activePortal === 'doc' ? 'c-b' : activePortal === 'nurse' ? 'c-ok' : activePortal === 'admin' ? 'c-w' : 'c-n'}" style="font-size:0.75rem">
        ${getRoleDisplayName(activePortal)}
      </span>
    `;
  }

  // Render Sidebar
  renderSidebar();

  // Render Page Content
  const pageContainer = document.getElementById('pg');
  if (pageContainer) {
    pageContainer.innerHTML = renderPageContent();
  }

  // Initialize Canvas ECG if present
  setTimeout(() => {
    if (typeof initECG === 'function') {
      initECG('ecgCanvas');
    }
  }, 50);

  if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') window.scrollTo(0, 0);
}

function renderSidebar() {
  const sd = document.getElementById('sd');
  if (!sd) return;

  const canSwitch = (U.role === 'doc' || U.role === 'nurse');

  const switcherHtml = canSwitch ? `
    <div class="portal-switch-box">
      <span class="portal-switch-label">${t('portalSwitcherLabel')}</span>
      <select class="portal-switch-select" onchange="switchPortal(this.value)">
        <option value="doc" ${activePortal === 'doc' ? 'selected' : ''}>${t('docPortal')}</option>
        <option value="nurse" ${activePortal === 'nurse' ? 'selected' : ''}>${t('nursePortal')}</option>
        <option value="pat" ${activePortal === 'pat' ? 'selected' : ''}>${t('patientPortal')}</option>
        <option value="att" ${activePortal === 'att' ? 'selected' : ''}>${t('attenderPortal')}</option>
        <option value="admin" ${activePortal === 'admin' ? 'selected' : ''}>${t('adminPortal')}</option>
      </select>
    </div>
  ` : '';

  const currentMenu = PORTAL_MENUS[activePortal] || PORTAL_MENUS.doc;

  sd.innerHTML = `
    <div class="lg"><svg viewBox="0 0 100 100" style="fill:var(--pulse)"><use href="#pl"/></svg>CLYNORA</div>
    
    <div class="side-role-badge">
      <div class="role-icon">${U.role.substring(0, 2).toUpperCase()}</div>
      <div>
        <b style="font-size:0.9rem;display:block">${U.name}</b>
        <span class="mut" style="font-size:0.78rem">${getRoleDisplayName(U.role)}</span>
      </div>
    </div>

    ${switcherHtml}

    <div class="side-nav-group">
      ${currentMenu.map(m => `
        <button class="${view === m[1] ? 'a' : ''}" onclick="nav('${m[1]}')">
          ${t(m[0])}
        </button>
      `).join('')}
    </div>

    <div style="margin-top:auto;padding-top:16px;border-top:1px solid rgba(22,30,62,0.07)">
      <button onclick="openVoiceMode()" style="background:linear-gradient(145deg,rgba(56,189,248,0.2),rgba(58,91,217,0.2));color:var(--pri);border:1px solid rgba(56,189,248,0.4)">
        ${t('btn_voice_mode')}
      </button>
      <button onclick="go('home')">${t('homeBtn')}</button>
      <button class="red" onclick="logout()">${t('logoutBtn')}</button>
    </div>
  `;
}

// Render Top Patient Picker (For Doctors & Nurses viewing Patient/Attender views)
function renderPatientSelectorBar() {
  const canPick = (U.role === 'doc' || U.role === 'nurse');
  if (!canPick && (activePortal === 'pat' || activePortal === 'att')) return '';

  return `
    <div class="card ac" style="padding:14px 22px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <label for="patientSelector" style="margin:0;font-weight:800;color:var(--ink)">${t('viewing_patient_record')}</label>
        <select id="patientSelector" style="max-width:380px;margin:0" onchange="cur=+this.value;saveSession();draw()">
          ${S.p.map(p => `
            <option value="${p.id}" ${p.id === cur ? 'selected' : ''}>
              ${p.name} \u00B7 Ward ${p.ward}/Bed ${p.bed} (${p.status === 'checked' ? t('status_stable') : t('status_unchecked')})
            </option>
          `).join('')}
        </select>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="pri" onclick="openAddPatientModal()">+ ${t('btn_add_patient')}</button>
        <button onclick="toggleSimulation()">${D.simulating ? t('btn_stop_stream') : t('btn_simulate_stream')}</button>
      </div>
    </div>
  `;
}

// Page Content Dispatcher
function renderPageContent() {
  switch (view) {
    // Doctor Views
    case 'ov': return renderDoctorOverview();
    case 'pt': return renderPatientDirectory();
    case 'dt_detail': return renderPatientDetailView();
    case 'dt_triage': return renderDeteriorationTriage();
    case 'al': return renderAlertsManagement();
    case 'cn': return renderUnreviewedConcerns();
    case 'dv': return renderDeviceHub();
    case 'ar': return renderArchiveAndAudit();

    // Nurse Views
    case 'n_triage': return renderNurseBedsideTriage();
    case 'n_alerts': return renderNurseRapidAlerts();
    case 'n_complaints': return renderNurseComplaints();
    case 'n_meds': return renderNurseMedReviews();
    case 'n_vitals': return renderNurseQuickVitals();

    // Patient Views
    case 'p_vitals': return renderPatientPortalVitals();
    case 'p_status': return renderPatientPredictedStatus();
    case 'p_history': return renderPatientHealthHistory();
    case 'p_health': return renderPatientPersonalHealth();
    case 'p_chat': return renderPatientChatView();

    // Attender Views
    case 'a_status': return renderAttenderStatus();
    case 'a_readings': return renderAttenderReadings();
    case 'a_submit': return renderAttenderSubmitConcern();
    case 'a_concerns': return renderAttenderConcernsList();
    case 'a_history': return renderAttenderCaregiverLog();

    // Administrator Views
    case 'adm_users': return renderAdminUserManagement();
    case 'adm_wards': return renderAdminWards();
    case 'adm_devices': return renderAdminWearableFleet();
    case 'adm_audit': return renderAdminAuditLogs();
    case 'adm_system': return renderAdminSystemDiagnostics();

    default: return renderDoctorOverview();
  }
}

// --- DOCTOR VIEWS ---

function renderDoctorOverview() {
  const activePatients = S.p.filter(p => p.on);
  const unchecked = activePatients.filter(p => p.status === 'unchecked');
  const checked = activePatients.filter(p => p.status === 'checked');
  const openAlerts = S.al.filter(a => !a.res);

  return `
    <div class="row">
      <div class="card kpi">
        <span>${t('kpi_monitored_patients')}</span>
        <b>${activePatients.length}</b>
        <small class="mut">${t('kpi_monitored_sub')}</small>
      </div>
      <div class="card kpi">
        <span style="color:var(--pulse)">${t('status_unchecked')}</span>
        <b style="color:var(--pulse)">${unchecked.length}</b>
        <small class="mut">${t('kpi_unchecked_sub')}</small>
      </div>
      <div class="card kpi">
        <span style="color:var(--ok)">${t('status_checked')}</span>
        <b style="color:var(--ok)">${checked.length}</b>
        <small class="mut">${t('kpi_checked_sub')}</small>
      </div>
      <div class="card kpi">
        <span>${t('kpi_active_alerts')}</span>
        <b style="color:var(--warn)">${openAlerts.length}</b>
        <small class="mut">${t('kpi_pending_review')}</small>
      </div>
    </div>

    <div class="ac">
      <h3>${t('ward_census_title')}</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="pri" onclick="openAddPatientModal()">+ ${t('btn_add_patient')}</button>
        <button onclick="toggleSimulation()">${D.simulating ? t('btn_stop_stream') : t('btn_simulate_stream')}</button>
      </div>
    </div>

    <div class="row">
      ${activePatients.map(p => {
        const hr = getLatestVital(p.id, 'hr');
        const spo2 = getLatestVital(p.id, 'spo2');
        const temp = getLatestVital(p.id, 'temp');
        const ews = calcEWS(p);

        return `
          <div class="card" style="border-left: 6px solid ${p.status === 'unchecked' ? 'var(--pulse)' : 'var(--ok)'}">
            <div class="ac">
              <div>
                <h3 style="margin-bottom:2px">${p.name}</h3>
                <span class="mut" style="font-size:0.86rem">Ward ${p.ward} \u00B7 Bed ${p.bed} \u00B7 ${p.age}y ${p.gender}</span>
              </div>
              <span class="chip ${p.status === 'checked' ? 'c-ok' : 'c-bad'}">
                ${p.status === 'checked' ? t('status_stable') : t('status_unchecked')}
              </span>
            </div>

            <div style="margin:14px 0 10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
              <div style="background:rgba(22,30,62,0.03);padding:8px;border-radius:14px">
                <small class="mut" style="display:block;font-size:0.75rem">${t('vitals_hr')}</small>
                <b style="font-size:1.15rem">${hr ? hr.v : '\u2014'}</b> <small class="mut">bpm</small>
              </div>
              <div style="background:rgba(22,30,62,0.03);padding:8px;border-radius:14px">
                <small class="mut" style="display:block;font-size:0.75rem">SpO\u2082</small>
                <b style="font-size:1.15rem">${spo2 ? spo2.v : '\u2014'}</b> <small class="mut">%</small>
              </div>
              <div style="background:rgba(22,30,62,0.03);padding:8px;border-radius:14px">
                <small class="mut" style="display:block;font-size:0.75rem">${t('vitals_temp')}</small>
                <b style="font-size:1.15rem">${temp ? temp.v : '\u2014'}</b> <small class="mut">\u00B0C</small>
              </div>
            </div>

            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
              <span class="mut" style="font-size:0.82rem">EWS Score: <b>${ews.total}</b></span>
              <span class="mut" style="font-size:0.82rem">${p.dev || 'ESP32 patch'}</span>
            </div>

            <div class="ac">
              <button class="pri" style="flex:1" onclick="cur=${p.id};nav('dt_detail')">${t('btn_open_monitor')}</button>
              <button onclick="togglePatientChecked(${p.id})">
                ${p.status === 'checked' ? t('btn_flag_attention') : t('btn_mark_checked')}
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- Recent Alerts Banner -->
    <div class="card">
      <div class="ac" style="margin-bottom:14px">
        <h3>${t('alerts_banner_title')}</h3>
        <button onclick="nav('al')">${t('btn_view_all_alerts')} (${S.al.length})</button>
      </div>
      ${renderAlertsTable(S.al.slice(0, 5))}
    </div>
  `;
}

function renderPatientDirectory() {
  return renderDoctorOverview();
}

function renderPatientDetailView() {
  const p = getPatient(cur);
  if (!p) return `<div class="card empty"><h3>Patient not found</h3></div>`;

  const hr = getLatestVital(p.id, 'hr');
  const spo2 = getLatestVital(p.id, 'spo2');
  const temp = getLatestVital(p.id, 'temp');
  const ews = calcEWS(p);

  return `
    ${renderPatientSelectorBar()}

    <!-- Patient Banner -->
    <div class="patient-header-card">
      <div class="patient-info-left">
        <div class="patient-avatar">${p.name.substring(0, 1)}</div>
        <div>
          <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
            <h2>${p.name}</h2>
            <span class="chip ${p.status === 'checked' ? 'c-ok' : 'c-bad'}">
              ${p.status === 'checked' ? t('status_checked') : t('status_unchecked')}
            </span>
          </div>
          <div class="patient-meta-grid">
            <span class="patient-meta-item">${t('meta_age_sex')}: <b>${p.age} yrs \u00B7 ${p.gender}</b></span>
            <span class="patient-meta-item">${t('meta_ward_bed')}: <b>Ward ${p.ward} \u00B7 Bed ${p.bed}</b></span>
            <span class="patient-meta-item">${t('meta_condition')}: <b>${p.condition}</b></span>
            <span class="patient-meta-item">${t('meta_physician')}: <b>${p.doctor}</b></span>
            <span class="patient-meta-item">${t('meta_nurse')}: <b>${p.nurse}</b></span>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="${p.status === 'checked' ? '' : 'pri'}" onclick="togglePatientChecked(${p.id})">
          ${p.status === 'checked' ? t('btn_flag_attention') : t('btn_mark_checked_stable')}
        </button>
        <button onclick="openManualVitalsModal(${p.id})">+ ${t('btn_log_vitals')}</button>
        <button onclick="openBaselineModal(${p.id})">${t('btn_set_baseline')}</button>
      </div>
    </div>

    <!-- Live Calibrated ECG Canvas Monitor -->
    <div class="ecg-monitor-card">
      <div class="ecg-monitor-top">
        <div>
          <span class="ecg-lead-badge">${t('ecg_lead_ii_continuous')}</span>
          <span style="margin-left:14px;color:#94a3b8">${t('ecg_filter_info')}</span>
        </div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
          <span style="color:#38bdf8;font-weight:700">${t('vitals_hr')}: ${hr ? hr.v : (p.base || 72)} bpm</span>
          <span class="live"></span>
          <span style="font-size:0.8rem;color:#94a3b8">${D.on ? t('ecg_hardware_connected') : t('ecg_telemetry_feed')}</span>
        </div>
      </div>
      <div class="ecg-canvas-wrapper">
        <canvas id="ecgCanvas"></canvas>
      </div>
    </div>

    <!-- Vitals Cards Grid -->
    <div class="row">
      <!-- Heart Rate Card -->
      <div class="card vital-card">
        <div class="vital-top">
          <span class="mut" style="font-weight:700">${t('vitals_hr')}</span>
          <span class="chip ${hr && hr.v > 100 ? 'c-bad' : 'c-b'}">
            ${hr && hr.v > 100 ? 'Tachycardia' : 'Normal Sinus'}
          </span>
        </div>
        <div class="vital-val-row">
          <span class="big2">${hr ? hr.v : '\u2014'}</span>
          <small>bpm</small>
        </div>
        <span class="mut" style="font-size:0.84rem">
          ${p.base ? `Baseline: ${p.base} bpm (${Math.round(Math.abs(hr ? hr.v - p.base : 0) / p.base * 100)}% dev)` : 'Adult normal: 60-100 bpm'}
        </span>
        ${renderSparkline(getVitalHistory(p.id, 'hr').map(r => r.v), 'var(--pri)')}
        <small class="mut" style="margin-top:6px;display:block">${t('th_timestamp')}: ${hr ? tm(hr.t) : 'Never'}</small>
      </div>

      <!-- SpO2 Card -->
      <div class="card vital-card">
        <div class="vital-top">
          <span class="mut" style="font-weight:700">${t('vitals_spo2')}</span>
          <span class="chip ${spo2 && spo2.v < 94 ? 'c-bad' : 'c-ok'}">
            ${spo2 && spo2.v < 94 ? 'Hypoxemia' : 'Optimal'}
          </span>
        </div>
        <div class="vital-val-row">
          <span class="big2">${spo2 ? spo2.v : '\u2014'}</span>
          <small>%</small>
        </div>
        <span class="mut" style="font-size:0.84rem">Target: 95% - 100% on Room Air</span>
        ${renderSparkline(getVitalHistory(p.id, 'spo2').map(r => r.v), 'var(--ok)')}
        <small class="mut" style="margin-top:6px;display:block">${t('th_timestamp')}: ${spo2 ? tm(spo2.t) : 'Never'}</small>
      </div>

      <!-- Temperature Card -->
      <div class="card vital-card">
        <div class="vital-top">
          <span class="mut" style="font-weight:700">${t('vitals_temp')}</span>
          <span class="chip ${temp && temp.v > 38.0 ? 'c-w' : 'c-ok'}">
            ${temp && temp.v > 38.0 ? 'Pyrexia' : 'Normothermia'}
          </span>
        </div>
        <div class="vital-val-row">
          <span class="big2">${temp ? temp.v : '\u2014'}</span>
          <small>\u00B0C</small>
        </div>
        <span class="mut" style="font-size:0.84rem">Reference Range: 36.5 - 37.5 \u00B0C</span>
        ${renderSparkline(getVitalHistory(p.id, 'temp').map(r => r.v), 'var(--warn)')}
        <small class="mut" style="margin-top:6px;display:block">${t('th_timestamp')}: ${temp ? tm(temp.t) : 'Never'}</small>
      </div>

      <!-- Blood Pressure & Respiratory Rate -->
      <div class="card vital-card">
        <div class="vital-top">
          <span class="mut" style="font-weight:700">${t('hemodynamics_title')}</span>
          <span class="chip c-n">Clinical Rounds</span>
        </div>
        <div style="margin:12px 0">
          <div style="font-size:0.9rem" class="mut">${t('non_invasive_bp')}</div>
          <b style="font-size:1.3rem">${p.bp || '120/80 mmHg'}</b>
        </div>
        <div style="margin-bottom:8px">
          <div style="font-size:0.9rem" class="mut">${t('respiratory_rate_label')}</div>
          <b style="font-size:1.3rem">${p.rr || 18} <small style="font-size:0.85rem">breaths/min</small></b>
        </div>
        <span class="mut" style="font-size:0.84rem">${t('patient_mobility_label')} <b>${p.motion || 'Resting in bed'}</b></span>
      </div>
    </div>

    <!-- Early Warning Score Breakdown -->
    <div class="card">
      <div class="ac">
        <div>
          <h3>${t('ews_analysis_title')}</h3>
          <p class="mut" style="font-size:0.88rem">${t('ews_analysis_desc')}</p>
        </div>
        <div style="text-align:right">
          <span style="font-size:0.9rem" class="mut">${t('ews_aggregate_score')}</span>
          <b style="font-size:2rem;display:block;color:${ews.alert ? 'var(--pulse)' : 'var(--ok)'}">${ews.total}</b>
        </div>
      </div>

      <div class="ews-grid">
        ${ews.rows.map(r => `
          <div class="ews-box">
            <div class="ac" style="margin-bottom:6px">
              <b>${r.label}</b>
              <span class="ews-score-badge ${r.pts > 0 ? (r.pts >= 2 ? 'c-bad' : 'c-w') : 'c-ok'}">
                +${r.pts} pts
              </span>
            </div>
            <div style="font-size:1.15rem;font-weight:800">${r.val}</div>
            <small class="mut" style="display:block;margin-top:4px">${r.note}</small>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Historical Telemetry Table -->
    <div class="card">
      <div class="ac" style="margin-bottom:14px">
        <h3>${t('history_telemetry_title')}</h3>
        <span class="mut" style="font-size:0.85rem">${t('history_telemetry_sub')}</span>
      </div>
      <div class="tw">
        <table>
          <thead>
            <tr>
              <th>${t('th_timestamp')}</th>
              <th>${t('th_vital_param')}</th>
              <th>${t('th_value')}</th>
              <th>${t('th_source')}</th>
              <th>${t('th_status')}</th>
            </tr>
          </thead>
          <tbody>
            ${(S.v[p.id] || []).slice(-15).reverse().map(r => `
              <tr>
                <td>${tm(r.t)}</td>
                <td><b>${{ hr: t('vitals_hr'), spo2: t('vitals_spo2'), temp: t('vitals_temp') }[r.k] || r.k}</b></td>
                <td>${r.v} ${{ hr: 'bpm', spo2: '%', temp: '\u00B0C' }[r.k]}</td>
                <td><span class="chip ${r.s === 'device' ? 'c-b' : 'c-n'}">${r.s === 'device' ? 'ESP32 Wearable' : 'Bedside Entry'}</span></td>
                <td><span class="mut">${timeAgo(r.t)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDeteriorationTriage() {
  return `
    ${renderPatientSelectorBar()}
    <div class="card">
      <div class="ac" style="margin-bottom:16px">
        <div>
          <h2>${t('nav_deterioration')}</h2>
          <p class="mut">${t('device_working_desc')}</p>
        </div>
      </div>

      <div class="tw">
        <table>
          <thead>
            <tr>
              <th>${t('th_patient')}</th>
              <th>${t('th_location')}</th>
              <th>${t('vitals_hr')}</th>
              <th>SpO\u2082</th>
              <th>${t('vitals_temp')}</th>
              <th>EWS Score</th>
              <th>${t('th_status')}</th>
              <th>${t('th_action')}</th>
            </tr>
          </thead>
          <tbody>
            ${S.p.map(p => {
              const hr = getLatestVital(p.id, 'hr');
              const spo2 = getLatestVital(p.id, 'spo2');
              const temp = getLatestVital(p.id, 'temp');
              const ews = calcEWS(p);
              return `
                <tr style="background:${p.status === 'unchecked' ? 'rgba(242,84,91,0.04)' : 'transparent'}">
                  <td><b>${p.name}</b><br><small class="mut">${p.age}y ${p.gender}</small></td>
                  <td>Ward ${p.ward} / Bed ${p.bed}</td>
                  <td>${hr ? hr.v + ' bpm' : '\u2014'}</td>
                  <td>${spo2 ? spo2.v + ' %' : '\u2014'}</td>
                  <td>${temp ? temp.v + ' \u00B0C' : '\u2014'}</td>
                  <td><b style="font-size:1.15rem;color:${ews.total >= 3 ? 'var(--pulse)' : 'var(--ok)'}">${ews.total}</b></td>
                  <td>
                    <span class="chip ${p.status === 'checked' ? 'c-ok' : 'c-bad'}">
                      ${p.status === 'checked' ? t('status_checked') : t('status_unchecked')}
                    </span>
                  </td>
                  <td>
                    <button class="pri" style="padding:6px 12px;font-size:0.84rem" onclick="cur=${p.id};nav('dt_detail')">${t('btn_open_monitor')}</button>
                    <button style="padding:6px 12px;font-size:0.84rem" onclick="togglePatientChecked(${p.id})">${p.status === 'checked' ? t('btn_flag_attention') : t('btn_mark_checked')}</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAlertsManagement() {
  return `
    <div class="card">
      <div class="ac" style="margin-bottom:18px">
        <div>
          <h2>${t('nav_alerts')}</h2>
          <p class="mut">${t('alerts_banner_title')}</p>
        </div>
      </div>
      ${renderAlertsTable(S.al)}
    </div>
  `;
}

function renderAlertsTable(alerts) {
  if (!alerts || alerts.length === 0) {
    return `<div class="empty"><p class="mut">${t('kpi_active_alerts')}: 0</p></div>`;
  }

  return `
    <div class="tw">
      <table>
        <thead>
          <tr>
            <th>${t('th_level')}</th>
            <th>${t('th_patient')}</th>
            <th>${t('th_category_desc')}</th>
            <th>${t('th_triggered')}</th>
            <th>${t('th_assigned')}</th>
            <th>${t('th_status')}</th>
            <th>${t('th_action')}</th>
          </tr>
        </thead>
        <tbody>
          ${alerts.map(a => {
            const p = getPatient(a.pid);
            const isResolved = !!a.res;
            const levelClass = a.level === 'critical' ? 'c-crit' : a.level === 'high' ? 'c-bad' : a.level === 'moderate' ? 'c-w' : 'c-n';
            return `
              <tr>
                <td><span class="chip ${levelClass}">${(a.level || 'alert').toUpperCase()}</span></td>
                <td><b>${p ? p.name : 'Unknown'}</b><br><small class="mut">${p ? `Ward ${p.ward}/Bed ${p.bed}` : '\u2014'}</small></td>
                <td>
                  <b>${a.cat}</b>
                  <div style="font-size:0.86rem;color:var(--mut);margin-top:2px">${a.desc}</div>
                </td>
                <td>${tm(a.t)}<br><small class="mut">${timeAgo(a.t)}</small></td>
                <td>${a.assigned || 'On-duty Staff'}</td>
                <td>
                  <span class="chip ${isResolved ? 'c-ok' : 'c-bad'}">
                    ${isResolved ? t('status_checked') : t('status_unchecked')}
                  </span>
                </td>
                <td>
                  ${isResolved ? `
                    <small class="mut">By ${a.res.by}<br>${tm(a.res.t)}</small>
                  ` : `
                    <button class="pri" style="padding:6px 12px;font-size:0.84rem" onclick="openAcknowledgeModal(${a.id})">
                      ${t('btn_acknowledge')}
                    </button>
                  `}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function renderUnreviewedConcerns() {
  const concerns = S.concerns || [];
  return `
    <div class="card">
      <div class="ac" style="margin-bottom:18px">
        <div>
          <h2>${t('nav_concerns')}</h2>
          <p class="mut">${t('attRoleDesc')}</p>
        </div>
      </div>

      <div class="tw">
        <table>
          <thead>
            <tr>
              <th>${t('th_status')}</th>
              <th>${t('th_patient')}</th>
              <th>${t('th_attender')}</th>
              <th>${t('th_category')}</th>
              <th>${t('th_observation')}</th>
              <th>${t('th_submitted')}</th>
              <th>${t('th_action')}</th>
            </tr>
          </thead>
          <tbody>
            ${concerns.map(c => {
              const p = getPatient(c.pid);
              const isReviewed = c.status === 'reviewed';
              return `
                <tr style="background:${!isReviewed ? 'rgba(58,91,217,0.03)' : 'transparent'}">
                  <td>
                    <span class="chip ${isReviewed ? 'c-ok' : 'c-w'}">
                      ${isReviewed ? t('status_checked') : t('status_unchecked')}
                    </span>
                  </td>
                  <td><b>${p ? p.name : 'Unknown'}</b><br><small class="mut">${p ? `Ward ${p.ward}/Bed ${p.bed}` : '\u2014'}</small></td>
                  <td><b>${c.attender}</b></td>
                  <td><span class="chip c-b">${c.type}</span></td>
                  <td style="max-width:320px">
                    ${c.text}
                    ${c.reviewNote ? `<div style="font-size:0.82rem;color:var(--ok);margin-top:4px"><b>Note:</b> ${c.reviewNote} (${c.reviewedBy})</div>` : ''}
                  </td>
                  <td>${tm(c.t)}<br><small class="mut">${timeAgo(c.t)}</small></td>
                  <td>
                    ${!isReviewed ? `
                      <button class="pri" style="padding:6px 12px;font-size:0.84rem" onclick="openReviewConcernModal(${c.id})">
                        ${t('btn_acknowledge')}
                      </button>
                    ` : `
                      <small class="mut">Attended by<br>${c.reviewedBy}</small>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderDeviceHub() {
  return `
    <div class="card">
      <div class="ac">
        <div>
          <h2>${t('nav_device')}</h2>
          <p class="mut">${t('device_section_subtitle')}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="pri" onclick="connectSerial()">\u{1F50C} ${t('btn_connect_serial')}</button>
          <button onclick="toggleSimulation()">${D.simulating ? t('btn_stop_stream') : t('btn_simulate_stream')}</button>
        </div>
      </div>

      <div style="margin:20px 0;background:rgba(22,30,62,0.03);padding:18px;border-radius:20px">
        <b>Hardware Connection Protocol:</b>
        <p class="mut" style="font-size:0.88rem;margin-top:6px">
          Connect your ESP32 board to your computer via USB (Baud 115200). Stream JSON telemetry lines:<br>
          <code>{"hr": 74, "spo2": 98, "temp": 36.9, "ecg": 512}</code>
        </p>
        <div style="margin-top:12px">
          <span>${t('th_status')}: </span>
          <b>${D.on ? '<span class="chip c-ok">' + t('status_live') + '</span>' : (D.simulating ? '<span class="chip c-b">' + t('btn_simulate_stream') + '</span>' : '<span class="chip c-n">' + t('status_disconnected') + '</span>')}</b>
        </div>
      </div>
    </div>

    <!-- Wearable Devices Fleet Status -->
    <div class="card">
      <h3 style="margin-bottom:14px">${t('nav_admin_devices')}</h3>
      <div class="tw">
        <table>
          <thead>
            <tr>
              <th>${t('th_device_id')}</th>
              <th>${t('th_patient')}</th>
              <th>${t('th_firmware')}</th>
              <th>${t('th_battery')}</th>
              <th>${t('th_signal')}</th>
              <th>${t('th_status')}</th>
              <th>${t('th_last_ping')}</th>
            </tr>
          </thead>
          <tbody>
            ${(S.devices || []).map(d => {
              const p = getPatient(d.pid);
              return `
                <tr>
                  <td><b>${d.id}</b></td>
                  <td>${p ? `${p.name} (Ward ${p.ward}/Bed ${p.bed})` : 'Unassigned'}</td>
                  <td><code>${d.fw}</code></td>
                  <td>
                    <b style="color:${d.battery < 20 ? 'var(--pulse)' : 'var(--ok)'}">${d.battery}%</b>
                  </td>
                  <td>${d.signal} dBm</td>
                  <td><span class="chip ${d.status === 'linked' ? 'c-ok' : 'c-w'}">${d.status}</span></td>
                  <td>${timeAgo(d.lastPing)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderArchiveAndAudit() {
  return `
    <div class="card">
      <div class="ac" style="margin-bottom:16px">
        <h2>${t('nav_admin_audit')}</h2>
        <button onclick="exportAuditLog()">${t('btn_export_csv')}</button>
      </div>
      <div class="tw">
        <table>
          <thead>
            <tr>
              <th>${t('th_timestamp')}</th>
              <th>${t('th_user')}</th>
              <th>${t('th_role')}</th>
              <th>${t('th_category')}</th>
              <th>${t('th_action_details')}</th>
            </tr>
          </thead>
          <tbody>
            ${S.au.map(a => `
              <tr>
                <td>${tm(a.t)}</td>
                <td><b>${a.u}</b></td>
                <td><span class="chip c-b">${a.role || 'STAFF'}</span></td>
                <td><span class="chip c-n">${a.cat || 'Clinical'}</span></td>
                <td>${a.a}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// --- NURSE VIEWS ---

function renderNurseBedsideTriage() {
  const activePatients = S.p.filter(p => p.on);
  const priorityList = activePatients.filter(p => p.status === 'unchecked');
  const stableList = activePatients.filter(p => p.status === 'checked');

  return `
    <div class="row">
      <div class="card kpi">
        <span>${t('status_unchecked')}</span>
        <b style="color:var(--pulse)">${priorityList.length}</b>
        <small class="mut">${t('kpi_unchecked_sub')}</small>
      </div>
      <div class="card kpi">
        <span>${t('kpi_active_alerts')}</span>
        <b style="color:var(--warn)">${S.al.filter(a => !a.res).length}</b>
        <small class="mut">${t('kpi_pending_review')}</small>
      </div>
      <div class="card kpi">
        <span>${t('nav_nurse_complaints')}</span>
        <b style="color:var(--pri)">${(S.concerns || []).filter(c => c.status === 'unreviewed').length}</b>
        <small class="mut">${t('attRoleDesc')}</small>
      </div>
    </div>

    <!-- High Priority Bedside Cards -->
    <div class="ac">
      <h3>${t('nav_nurse_triage')}</h3>
      <button class="pri" onclick="openQuickVitalModal()">+ ${t('btn_quick_bedside_vital')}</button>
    </div>

    <div class="row">
      ${priorityList.map(p => {
        const hr = getLatestVital(p.id, 'hr');
        const spo2 = getLatestVital(p.id, 'spo2');
        const temp = getLatestVital(p.id, 'temp');
        const ews = calcEWS(p);

        return `
          <div class="card" style="border: 2px solid var(--pulse); box-shadow: 0 0 20px rgba(242,84,91,0.25)">
            <div class="ac">
              <div>
                <h3 style="color:var(--pulse)">${p.name}</h3>
                <span class="mut" style="font-size:0.88rem">Ward ${p.ward} \u00B7 Bed ${p.bed}</span>
              </div>
              <span class="chip c-bad">${t('status_unchecked')}</span>
            </div>

            <div style="margin:14px 0;background:rgba(242,84,91,0.06);padding:10px;border-radius:14px">
              <b>EWS Score: ${ews.total}</b>
              <div style="font-size:0.86rem;margin-top:4px" class="mut">
                ${t('vitals_hr')}: ${hr ? hr.v + ' bpm' : 'N/A'} | SpO\u2082: ${spo2 ? spo2.v + ' %' : 'N/A'} | ${t('vitals_temp')}: ${temp ? temp.v + ' \u00B0C' : 'N/A'}
              </div>
            </div>

            <div class="ac">
              <button class="pri" style="flex:1" onclick="acknowledgeBedsidePatient(${p.id})">
                ${t('btn_mark_checked_stable')}
              </button>
              <button onclick="cur=${p.id};nav('dt_detail')">${t('btn_open_monitor')}</button>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- All Assigned Patients -->
    <div class="card">
      <h3 style="margin-bottom:14px">${t('ward_census_title')}</h3>
      <div class="tw">
        <table>
          <thead>
            <tr>
              <th>${t('th_patient')}</th>
              <th>${t('meta_ward_bed')}</th>
              <th>${t('th_vital_param')}</th>
              <th>${t('meta_condition')}</th>
              <th>${t('th_status')}</th>
              <th>${t('th_action')}</th>
            </tr>
          </thead>
          <tbody>
            ${activePatients.map(p => {
              const hr = getLatestVital(p.id, 'hr');
              const spo2 = getLatestVital(p.id, 'spo2');
              const temp = getLatestVital(p.id, 'temp');
              return `
                <tr>
                  <td><b>${p.name}</b></td>
                  <td>Ward ${p.ward} / Bed ${p.bed}</td>
                  <td>HR: ${hr ? hr.v : '\u2014'} | SpO\u2082: ${spo2 ? spo2.v + '%' : '\u2014'} | T: ${temp ? temp.v + '\u00B0C' : '\u2014'}</td>
                  <td>${p.condition}</td>
                  <td><span class="chip ${p.status === 'checked' ? 'c-ok' : 'c-bad'}">${p.status === 'checked' ? t('status_checked') : t('status_unchecked')}</span></td>
                  <td>
                    <button class="pri" style="padding:5px 10px;font-size:0.82rem" onclick="togglePatientChecked(${p.id})">
                      ${p.status === 'checked' ? t('btn_flag_attention') : t('btn_mark_checked')}
                    </button>
                    <button style="padding:5px 10px;font-size:0.82rem" onclick="cur=${p.id};nav('dt_detail')">${t('btn_open_monitor')}</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderNurseRapidAlerts() {
  return renderAlertsManagement();
}

function renderNurseComplaints() {
  return renderUnreviewedConcerns();
}

function renderNurseMedReviews() {
  const meds = S.medReviews || [];
  return `
    <div class="card">
      <div class="ac" style="margin-bottom:16px">
        <div>
          <h2>${t('nav_nurse_meds')}</h2>
          <p class="mut">${t('nurseRoleDesc')}</p>
        </div>
      </div>

      <div class="tw">
        <table>
          <thead>
            <tr>
              <th>${t('th_patient')}</th>
              <th>${t('th_medication')}</th>
              <th>${t('th_dose_route')}</th>
              <th>${t('th_scheduled_due')}</th>
              <th>${t('th_prescribed_by')}</th>
              <th>${t('th_status')}</th>
              <th>${t('th_action')}</th>
            </tr>
          </thead>
          <tbody>
            ${meds.map(m => {
              const p = getPatient(m.pid);
              const isVerified = m.status === 'verified';
              return `
                <tr>
                  <td><b>${p ? p.name : 'Unknown'}</b><br><small class="mut">${p ? `Ward ${p.ward}/Bed ${p.bed}` : '\u2014'}</small></td>
                  <td><b>${m.med}</b></td>
                  <td>${m.dose}</td>
                  <td>${m.due}</td>
                  <td>${m.prescriber}</td>
                  <td>
                    <span class="chip ${isVerified ? 'c-ok' : 'c-w'}">
                      ${isVerified ? 'Verified & Given' : 'Pending Verification'}
                    </span>
                  </td>
                  <td>
                    ${!isVerified ? `
                      <button class="pri" style="padding:6px 12px;font-size:0.84rem" onclick="markMedVerified(${m.id})">
                        ${t('btn_verify_administer')}
                      </button>
                    ` : `
                      <small class="mut">Completed</small>
                    `}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderNurseQuickVitals() {
  return `
    <div class="card fm">
      <h2>${t('modal_quick_vital_title')}</h2>
      <p class="mut">${t('device_working_desc')}</p>
      
      <label for="qv_pid">${t('th_patient')}</label>
      <select id="qv_pid">
        ${S.p.map(p => `<option value="${p.id}">${p.name} \u00B7 Ward ${p.ward}/Bed ${p.bed}</option>`).join('')}
      </select>

      <label for="qv_hr">${t('vitals_hr')} (bpm)</label>
      <input id="qv_hr" type="number" placeholder="e.g. 74">

      <label for="qv_spo2">${t('vitals_spo2')} (%)</label>
      <input id="qv_spo2" type="number" placeholder="e.g. 98">

      <label for="qv_temp">${t('vitals_temp')} (\u00B0C)</label>
      <input id="qv_temp" type="number" step="0.1" placeholder="e.g. 36.8">

      <button class="pri" onclick="saveQuickVitals()">${t('btn_save')}</button>
    </div>
  `;
}

// --- PATIENT VIEWS ---

function renderPatientPortalVitals() {
  const pid = (U && U.pid) ? U.pid : cur;
  const p = getPatient(pid) || S.p[0];
  const hr = getLatestVital(p.id, 'hr');
  const spo2 = getLatestVital(p.id, 'spo2');
  const temp = getLatestVital(p.id, 'temp');

  return `
    ${renderPatientSelectorBar()}
    <!-- Patient Welcome Card -->
    <div class="card ac">
      <div>
        <h2>${t('nav_my_vitals')}: ${p.name}</h2>
        <p class="mut">${t('patRoleDesc')}</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="pri" onclick="openVoiceMode()">${t('btn_ask_voice')}</button>
        <button class="red" onclick="reportPatientSymptom(${p.id})">\u{1F514} ${t('btn_call_nurse')}</button>
      </div>
    </div>

    <!-- Live ECG Monitor -->
    <div class="ecg-monitor-card">
      <div class="ecg-monitor-top">
        <span class="ecg-lead-badge">${t('ecg_lead_ii_continuous')}</span>
        <span style="color:#38bdf8;font-weight:700">${t('vitals_hr')}: ${hr ? hr.v : 72} bpm</span>
      </div>
      <div class="ecg-canvas-wrapper">
        <canvas id="ecgCanvas"></canvas>
      </div>
    </div>

    <!-- Personal Vitals Cards -->
    <div class="row">
      <div class="card vital-card">
        <div class="vital-top">
          <b>${t('vitals_hr')}</b>
          <span class="chip c-b">${t('status_stable')}</span>
        </div>
        <div class="vital-val-row">
          <span class="big2">${hr ? hr.v : '\u2014'}</span>
          <small>bpm</small>
        </div>
        <p class="mut" style="font-size:0.86rem">Your resting baseline is ${p.base || 72} bpm.</p>
        ${renderSparkline(getVitalHistory(p.id, 'hr').map(r => r.v), 'var(--pri)')}
      </div>

      <div class="card vital-card">
        <div class="vital-top">
          <b>${t('vitals_spo2')}</b>
          <span class="chip c-ok">${t('status_stable')}</span>
        </div>
        <div class="vital-val-row">
          <span class="big2">${spo2 ? spo2.v : '\u2014'}</span>
          <small>%</small>
        </div>
        <p class="mut" style="font-size:0.86rem">Healthy oxygenation level.</p>
        ${renderSparkline(getVitalHistory(p.id, 'spo2').map(r => r.v), 'var(--ok)')}
      </div>

      <div class="card vital-card">
        <div class="vital-top">
          <b>${t('vitals_temp')}</b>
          <span class="chip c-ok">${t('status_stable')}</span>
        </div>
        <div class="vital-val-row">
          <span class="big2">${temp ? temp.v : '\u2014'}</span>
          <small>\u00B0C</small>
        </div>
        <p class="mut" style="font-size:0.86rem">Normal body temperature range.</p>
        ${renderSparkline(getVitalHistory(p.id, 'temp').map(r => r.v), 'var(--warn)')}
      </div>
    </div>
  `;
}

function renderPatientPredictedStatus() {
  const pid = (U && U.pid) ? U.pid : cur;
  const p = getPatient(pid) || S.p[0];
  const ews = calcEWS(p);

  return `
    ${renderPatientSelectorBar()}
    <div class="card">
      <h2>${t('nav_predicted_status')}</h2>
      <p style="font-size:1.15rem;margin:16px 0">
        ${ews.alert ?
          "\u{26A0}\u{FE0F} A change was noticed in your latest readings. Your nursing team has been alerted for a bedside review." :
          "Ã¢Å“â€¦ Your latest vital readings are stable and within your expected recovery range."}
      </p>

      <div class="ews-grid">
        ${ews.rows.map(r => `
          <div class="ews-box">
            <b>${r.label}</b>
            <div style="font-size:1.3rem;font-weight:800;margin:4px 0">${r.val}</div>
            <span class="mut" style="font-size:0.82rem">${r.note}</span>
          </div>
        `).join('')}
      </div>

      <p class="mut" style="font-size:0.85rem;margin-top:20px">
        ${t('ews_analysis_desc')}
      </p>
    </div>
  `;
}

function renderPatientHealthHistory() {
  const pid = (U && U.pid) ? U.pid : cur;
  const p = getPatient(pid) || S.p[0];

  return `
    ${renderPatientSelectorBar()}
    <div class="card">
      <h2>${t('nav_health_history')}</h2>
      <div class="tw" style="margin-top:14px">
        <table>
          <thead>
            <tr>
              <th>${t('th_timestamp')}</th>
              <th>${t('th_vital_param')}</th>
              <th>${t('th_value')}</th>
              <th>${t('th_source')}</th>
            </tr>
          </thead>
          <tbody>
            ${(S.v[p.id] || []).slice(-20).reverse().map(r => `
              <tr>
                <td>${tm(r.t)}</td>
                <td>${{ hr: t('vitals_hr'), spo2: t('vitals_spo2'), temp: t('vitals_temp') }[r.k] || r.k}</td>
                <td><b>${r.v} ${{ hr: 'bpm', spo2: '%', temp: '\u00B0C' }[r.k]}</b></td>
                <td><span class="chip c-b">${r.s === 'device' ? 'CLYNORA Wearable' : 'Manual Entry'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderPatientPersonalHealth() {
  return `
    <div class="card ac">
      <div>
        <h2>${t('nav_personal_health')}</h2>
        <p class="mut">Connect external personal health wearables.</p>
      </div>
      <span class="chip c-n">Google Health: Simulated Ready</span>
    </div>

    <div class="card" style="margin-top:20px">
      <h3>Normal Resting Pattern</h3>
      <p class="mut">In-hospital baseline tracking is active. You can simulate syncing 30-day historical resting vital patterns below.</p>
      <button class="pri" style="margin-top:14px" onclick="openGoogleHealthModal()">
        Connect Google Health (Simulation)
      </button>
    </div>
  `;
}

function openGoogleHealthModal() {
  modal(`
    <div class="fm">
      <h2>External Wearable Integration (Preview)</h2>
      <p class="mut">${t('disclaimer')}</p>
      <div style="background:rgba(58,91,217,0.06);padding:16px;border-radius:18px;margin:14px 0">
        <b>Personal Wearable Health Sync</b>
        <p class="mut" style="font-size:0.86rem;margin-top:6px">
          This feature simulates importing 30-day historical baseline data from smartwatches or fitness trackers to enhance early warning personalization.
        </p>
      </div>
      <button class="pri" onclick="simulateHealthSync()">${t('btn_simulate_stream')}</button>
      <button onclick="closeModal()">${t('btn_close')}</button>
    </div>
  `);
}

function simulateHealthSync() {
  showToast("Simulated wearable baseline synced successfully");
  closeModal();
  draw();
}

function renderPatientChatView() {
  return `
    <div class="card">
      <div class="ac" style="margin-bottom:14px">
        <div>
          <h2>${t('nav_ask_assistant')}</h2>
          <p class="mut">${t('assistant_subtitle')}</p>
        </div>
        <button class="pri" onclick="openVoiceMode()">${t('btn_voice_mode')}</button>
      </div>

      <div style="background:rgba(22,30,62,0.03);border-radius:20px;padding:20px;margin-bottom:20px">
        <h4 style="margin-bottom:10px">${t('voice_prompts_title')}</h4>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="prompt-chip" onclick="executeInPagePrompt(t('prompt_pat_1'))">${t('prompt_pat_1')}</button>
          <button class="prompt-chip" onclick="executeInPagePrompt(t('prompt_pat_2'))">${t('prompt_pat_2')}</button>
        </div>
      </div>

      <div id="inPageChatBox" style="min-height:160px;background:#fff;border-radius:18px;padding:16px;margin-bottom:14px;box-shadow:var(--nb)">
        <p class="mut" id="inPageChatOutput">${t('assistant_placeholder')}</p>
      </div>

      <div style="display:flex;gap:10px">
        <input id="inPageChatInput" style="flex:1" placeholder="${t('assistant_placeholder')}" onkeydown="if(event.key==='Enter')executeInPagePrompt(this.value)">
        <button class="pri" onclick="executeInPagePrompt(document.getElementById('inPageChatInput').value)">${t('btn_save')}</button>
      </div>
    </div>
  `;
}

function executeInPagePrompt(text) {
  if (!text || !text.trim()) return;
  const out = document.getElementById('inPageChatOutput');
  const inp = document.getElementById('inPageChatInput');
  if (inp) inp.value = '';
  if (out) {
    out.innerHTML = `<div style="color:var(--pri);margin-bottom:8px"><b>Q:</b> ${text}</div><div style="color:var(--ink)"><b>A:</b> ${generateAIAnswer(text)}</div>`;
  }
}

// --- ATTENDER VIEWS ---

function renderAttenderStatus() {
  const pid = (U && U.pid) ? U.pid : cur;
  const p = getPatient(pid) || S.p[0];

  return `
    ${renderPatientSelectorBar()}
    <div class="card">
      <div class="ac">
        <div>
          <h2>${p.name} - ${t('nav_att_status')}</h2>
          <p class="mut">Ward ${p.ward} \u00B7 Bed ${p.bed} \u00B7 Attending Doctor: ${p.doctor}</p>
        </div>
        <span class="chip ${p.status === 'checked' ? 'c-ok' : 'c-bad'}">
          ${p.status === 'checked' ? t('status_checked') : t('status_unchecked')}
        </span>
      </div>

      <div style="margin:24px 0;background:rgba(22,30,62,0.03);padding:20px;border-radius:20px">
        <h3 style="font-size:1.15rem;margin-bottom:8px">Current Ward Update</h3>
        <p style="font-size:1.05rem">
          ${p.status === 'checked' ?
            "Patient is currently resting comfortably. Vitals are within expected limits." :
            "The nursing team has been alerted regarding a recent vital change and is attending to the patient."}
        </p>
      </div>

      <div class="ac">
        <button class="pri" onclick="nav('a_submit')">\u{1F4E4}Â ${t('nav_att_submit')}</button>
        <button onclick="nav('a_readings')">${t('nav_att_readings')}</button>
      </div>
    </div>
  `;
}

function renderAttenderReadings() {
  return renderPatientPortalVitals();
}

function renderAttenderSubmitConcern() {
  const pid = (U && U.pid) ? U.pid : cur;
  const p = getPatient(pid) || S.p[0];

  return `
    <div class="card fm">
      <h2>${t('nav_att_submit')}</h2>
      <p class="mut">${t('attRoleDesc')}</p>

      <label>${t('th_patient')}</label>
      <input value="${p.name} (Ward ${p.ward} / Bed ${p.bed})" disabled>

      <label for="att_name">${t('th_attender')}</label>
      <input id="att_name" value="${U ? U.name : 'Attender'}">

      <label for="att_type">${t('th_category')}</label>
      <select id="att_type">
        <option>Discomfort or Pain</option>
        <option>Shivering / Chills</option>
        <option>Mobility / Washroom Assistance</option>
        <option>Medication Question</option>
        <option>Water / Blanket Request</option>
      </select>

      <label for="att_msg">${t('th_observation')}</label>
      <textarea id="att_msg" rows="4" placeholder="Describe what you noticed..."></textarea>

      <button class="pri" onclick="submitAttenderConcern(${p.id})">${t('btn_submit_concern')}</button>
    </div>
  `;
}

function renderAttenderConcernsList() {
  return renderUnreviewedConcerns();
}

function renderAttenderCaregiverLog() {
  const pid = (U && U.pid) ? U.pid : cur;
  const p = getPatient(pid) || S.p[0];
  const patientLogs = S.au.filter(a => a.a.includes(p.name) || a.a.includes(`patient #${p.id}`));

  return `
    <div class="card">
      <div class="ac">
        <div>
          <h2>${t('nav_att_history')}</h2>
          <p class="mut">Timeline of bedside visits, nurse checks, and caregiver communications for ${p.name}.</p>
        </div>
        <button class="pri" onclick="openAddCaregiverNoteModal(${p.id})">+ Add Note</button>
      </div>

      <div class="tw" style="margin-top:16px">
        <table>
          <thead>
            <tr>
              <th>${t('th_timestamp')}</th>
              <th>${t('th_user')}</th>
              <th>${t('th_category')}</th>
              <th>${t('th_action_details')}</th>
            </tr>
          </thead>
          <tbody>
            ${(patientLogs.length > 0 ? patientLogs : S.au.slice(0, 8)).map(a => `
              <tr>
                <td>${tm(a.t)}</td>
                <td><b>${a.u}</b></td>
                <td><span class="chip c-b">${a.role || 'STAFF'}</span></td>
                <td>${a.a}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddCaregiverNoteModal(pid) {
  const p = getPatient(pid);
  modal(`
    <div class="fm">
      <h2>Add Caregiver Bedside Note</h2>
      <p class="mut">Recording note for ${p.name}</p>
      <label for="cgn_text">Note Details</label>
      <textarea id="cgn_text" rows="3" placeholder="e.g. Visited at bedside. Patient had lunch and is resting."></textarea>
      <button class="pri" onclick="saveCaregiverNote(${pid})">${t('btn_save')}</button>
      <button onclick="closeModal()">${t('btn_cancel')}</button>
    </div>
  `);
}

function saveCaregiverNote(pid) {
  const note = document.getElementById('cgn_text').value.trim();
  if (!note) return;
  const p = getPatient(pid);
  logAction(`Caregiver note recorded for ${p.name}: ${note}`, "Caregiver");
  saveState();
  closeModal();
  draw();
  showToast(t('btn_save'));
}

// --- ADMINISTRATOR VIEWS ---

function renderAdminUserManagement() {
  const users = S.users || [];

  return `
    <div class="card">
      <div class="ac" style="margin-bottom:16px">
        <div>
          <h2>${t('nav_admin_users')}</h2>
          <p class="mut">Authorized clinical personnel, patients, and attender credentials.</p>
        </div>
        <button class="pri" onclick="openAddUserModal()">${t('btn_add_clinical_user')}</button>
      </div>

      <div class="tw">
        <table>
          <thead>
            <tr>
              <th>${t('lbl_patient_name')}</th>
              <th>${t('lbl_user_id')}</th>
              <th>${t('th_role')}</th>
              <th>${t('lbl_department')}</th>
              <th>${t('lbl_access_level')}</th>
              <th>${t('th_status')}</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><b>${u.name}</b></td>
                <td><code>${u.id}</code></td>
                <td><span class="chip ${u.role === 'doc' ? 'c-b' : u.role === 'nurse' ? 'c-ok' : u.role === 'admin' ? 'c-w' : 'c-n'}">${getRoleDisplayName(u.role)}</span></td>
                <td>${u.dept}</td>
                <td>${u.access}</td>
                <td><span class="chip c-ok">${u.status || 'Active'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openAddUserModal() {
  modal(`
    <div class="fm">
      <h2>${t('modal_add_user_title')}</h2>
      
      <label for="nu_name">${t('lbl_patient_name')}</label>
      <input id="nu_name" placeholder="e.g. Dr. Meera Nambiar">

      <label for="nu_id">${t('lbl_user_id')}</label>
      <input id="nu_id" placeholder="e.g. doc.meera">

      <label for="nu_role">${t('th_role')}</label>
      <select id="nu_role">
        <option value="doc">${t('docPortal')}</option>
        <option value="nurse">${t('nursePortal')}</option>
        <option value="pat">${t('patientPortal')}</option>
        <option value="att">${t('attenderPortal')}</option>
        <option value="admin">${t('adminPortal')}</option>
      </select>

      <label for="nu_dept">${t('lbl_department')}</label>
      <input id="nu_dept" placeholder="e.g. Ward 2 Cardiology">

      <label for="nu_access">${t('lbl_access_level')}</label>
      <input id="nu_access" placeholder="e.g. Clinical Rounds & Vitals Entry">

      <button class="pri" onclick="saveNewUser()">${t('btn_save_user')}</button>
      <button onclick="closeModal()">${t('btn_cancel')}</button>
    </div>
  `);
}

function saveNewUser() {
  const name = document.getElementById('nu_name').value.trim();
  const id = document.getElementById('nu_id').value.trim();
  const role = document.getElementById('nu_role').value;
  const dept = document.getElementById('nu_dept').value.trim() || 'General Ward';
  const access = document.getElementById('nu_access').value.trim() || 'Standard Access';

  if (!name || !id) {
    showToast("Name and User ID are required");
    return;
  }

  if (!S.users) S.users = [];
  S.users.push({ id, name, role, dept, access, status: 'Active' });
  logAction(`Created new clinical user ${name} (${id}, ${role})`, "Admin");
  saveState();
  closeModal();
  draw();
  showToast(`User ${name} registered`);
}

function renderAdminWards() {
  const wards = S.wards || [
    { id: 'w1', name: 'Ward 1 (Observation)', total: 12, occupied: 8 },
    { id: 'w2', name: 'Ward 2 (Medical)', total: 14, occupied: 10 },
    { id: 'w3', name: 'Ward 3 (Post-Surgical)', total: 16, occupied: 14 }
  ];

  return `
    <div class="card">
      <div class="ac">
        <h2>${t('nav_admin_wards')}</h2>
        <button class="pri" onclick="openAddWardModal()">${t('btn_add_ward_bed')}</button>
      </div>
      <div class="row" style="margin-top:16px">
        ${wards.map(w => {
          const pct = Math.round((w.occupied / w.total) * 100);
          return `
            <div class="card kpi">
              <span>${w.name}</span>
              <b>${w.occupied} / ${w.total}</b>
              <small class="mut">${pct}% Occupancy</small>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function openAddWardModal() {
  modal(`
    <div class="fm">
      <h2>${t('btn_add_ward_bed')}</h2>
      <label for="nw_name">${t('meta_ward_bed')}</label>
      <input id="nw_name" placeholder="e.g. Ward 4 (Step-down ICU)">

      <label for="nw_total">Total Bed Capacity</label>
      <input id="nw_total" type="number" value="12">

      <label for="nw_occ">Current Occupied Beds</label>
      <input id="nw_occ" type="number" value="6">

      <button class="pri" onclick="saveNewWard()">${t('btn_save')}</button>
      <button onclick="closeModal()">${t('btn_cancel')}</button>
    </div>
  `);
}

function saveNewWard() {
  const name = document.getElementById('nw_name').value.trim();
  const total = +document.getElementById('nw_total').value || 10;
  const occ = +document.getElementById('nw_occ').value || 0;

  if (!name) {
    showToast("Ward name is required");
    return;
  }

  if (!S.wards) S.wards = [];
  S.wards.push({ id: 'w_' + Date.now(), name, total, occupied: occ });
  logAction(`Added hospital ward: ${name} (${total} beds)`, "Admin");
  saveState();
  closeModal();
  draw();
  showToast(`Ward ${name} added`);
}

function renderAdminWearableFleet() {
  return renderDeviceHub();
}

function renderAdminAuditLogs() {
  return renderArchiveAndAudit();
}

function renderAdminSystemDiagnostics() {
  const hasSerial = typeof navigator !== 'undefined' && 'serial' in navigator;
  const hasAudio = typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext);
  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return `
    <div class="card">
      <h2>${t('nav_admin_system')}</h2>
      <div class="tw" style="margin-top:14px">
        <table>
          <thead>
            <tr>
              <th>${t('th_subsystem')}</th>
              <th>${t('th_diagnostic_status')}</th>
              <th>${t('th_capability')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Web Serial API</b></td>
              <td>${hasSerial ? '<span class="chip c-ok">Supported</span>' : '<span class="chip c-w">Unsupported / Needs Chrome</span>'}</td>
              <td>Hardware USB ESP32 chest-patch streaming</td>
            </tr>
            <tr>
              <td><b>Web Audio API</b></td>
              <td>${hasAudio ? '<span class="chip c-ok">Operational</span>' : '<span class="chip c-bad">Unavailable</span>'}</td>
              <td>Real-time voice orb frequency and amplitude analysis</td>
            </tr>
            <tr>
              <td><b>Web Speech Synthesis</b></td>
              <td>${hasSpeech ? '<span class="chip c-ok">Available</span>' : '<span class="chip c-n">Unavailable</span>'}</td>
              <td>Spoken clinical response generation</td>
            </tr>
            <tr>
              <td><b>Persistent Local Storage</b></td>
              <td><span class="chip c-ok">Active (v2)</span></td>
              <td>Local ward state, history & audit persistence</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Sparkline SVG generator
function renderSparkline(values, color = 'var(--pri)') {
  if (!values || values.length < 2) {
    return `<div class="sp mut" style="display:grid;place-items:center;font-size:0.8rem">Insufficient historical points</div>`;
  }
  const slice = values.slice(-30);
  const max = Math.max(...slice);
  const min = Math.min(...slice);
  const range = max - min || 1;

  const points = slice.map((y, i) => {
    const x = (i * 300) / (slice.length - 1);
    const normalizedY = 80 - ((y - min) / range) * 60;
    return `${x},${normalizedY}`;
  }).join(' ');

  return `
    <svg class="sp" viewBox="0 0 300 90" preserveAspectRatio="none">
      <polyline stroke="${color}" points="${points}" />
    </svg>
  `;
}

// User Actions & Modals

function togglePatientChecked(pid) {
  const p = getPatient(pid);
  if (!p) return;
  p.status = p.status === 'checked' ? 'unchecked' : 'checked';
  p.autoAlert = false;
  if (p.status === 'checked') {
    S.al.filter(a => a.pid === pid && !a.res).forEach(a => {
      a.res = { t: Date.now(), by: U.name };
    });
  }
  logAction(`Patient ${p.name} status updated to ${p.status} by ${U.name}`, "Clinical");
  saveState();
  draw();
  showToast(`${p.name}: ${p.status === 'checked' ? t('status_checked') : t('status_unchecked')}`);
}

function acknowledgeBedsidePatient(pid) {
  togglePatientChecked(pid);
}

function openAddPatientModal() {
  modal(`
    <div class="fm">
      <h2>${t('modal_add_patient_title')}</h2>
      <label for="np_name">${t('lbl_patient_name')}</label>
      <input id="np_name" placeholder="e.g. Anandha Krishnan">

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label for="np_age">${t('lbl_age')}</label>
          <input id="np_age" type="number" placeholder="e.g. 52">
        </div>
        <div>
          <label for="np_gen">${t('lbl_gender')}</label>
          <select id="np_gen">
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label for="np_ward">${t('lbl_ward')}</label>
          <input id="np_ward" placeholder="e.g. 3">
        </div>
        <div>
          <label for="np_bed">${t('lbl_bed')}</label>
          <input id="np_bed" placeholder="e.g. 16">
        </div>
      </div>

      <label for="np_cond">${t('lbl_diagnosis')}</label>
      <input id="np_cond" placeholder="e.g. Post-appendectomy Day 1">

      <label for="np_base">${t('lbl_baseline_hr')}</label>
      <input id="np_base" type="number" value="72">

      <label for="np_dev">${t('lbl_assigned_device')}</label>
      <input id="np_dev" value="ESP32-CLY-05">

      <button class="pri" onclick="saveNewPatient()">${t('btn_save_patient')}</button>
      <button onclick="closeModal()">${t('btn_cancel')}</button>
    </div>
  `);
}

function saveNewPatient() {
  const name = document.getElementById('np_name').value.trim();
  const ward = document.getElementById('np_ward').value.trim();
  const bed = document.getElementById('np_bed').value.trim();
  if (!name || !ward || !bed) {
    showToast("Name, Ward, and Bed are mandatory");
    return;
  }

  const newPatient = {
    id: Date.now(),
    name,
    age: +document.getElementById('np_age').value || 45,
    gender: document.getElementById('np_gen').value,
    ward,
    bed,
    adm: Date.now(),
    dev: document.getElementById('np_dev').value.trim(),
    status: 'checked',
    on: true,
    base: +document.getElementById('np_base').value || 72,
    condition: document.getElementById('np_cond').value.trim() || 'General Admission',
    doctor: U.name,
    nurse: ''
  };

  S.p.push(newPatient);
  cur = newPatient.id;
  pushVital(newPatient.id, 'hr', newPatient.base, 'manual');
  pushVital(newPatient.id, 'spo2', 98, 'manual');
  pushVital(newPatient.id, 'temp', 36.8, 'manual');

  logAction(`Admitted new patient ${name} to Ward ${ward}/Bed ${bed}`, "Clinical");
  saveState();
  closeModal();
  draw();
  showToast(`Patient ${name} added successfully`);
}

function openManualVitalsModal(pid) {
  const p = getPatient(pid);
  modal(`
    <div class="fm">
      <h2>${t('modal_spot_check_title')} ${p.name}</h2>
      <label for="mv_hr">${t('vitals_hr')} (bpm)</label>
      <input id="mv_hr" type="number" placeholder="e.g. 78">

      <label for="mv_spo2">${t('vitals_spo2')} (%)</label>
      <input id="mv_spo2" type="number" placeholder="e.g. 97">

      <label for="mv_temp">${t('vitals_temp')} (\u00B0C)</label>
      <input id="mv_temp" type="number" step="0.1" placeholder="e.g. 37.0">

      <button class="pri" onclick="saveManualVitals(${pid})">${t('btn_save')}</button>
      <button onclick="closeModal()">${t('btn_cancel')}</button>
    </div>
  `);
}

function saveManualVitals(pid) {
  const hr = document.getElementById('mv_hr').value;
  const spo2 = document.getElementById('mv_spo2').value;
  const temp = document.getElementById('mv_temp').value;

  if (hr) pushVital(pid, 'hr', hr, 'manual');
  if (spo2) pushVital(pid, 'spo2', spo2, 'manual');
  if (temp) pushVital(pid, 'temp', temp, 'manual');

  const p = getPatient(pid);
  evaluatePatient(p);
  logAction(`Manual vital spot-check logged for ${p.name}`, "Clinical");
  closeModal();
  draw();
  showToast(t('btn_save'));
}

function openQuickVitalModal(defaultPid) {
  const pid = defaultPid || cur || (S.p[0] && S.p[0].id);
  modal(`
    <div class="fm">
      <h2>${t('modal_quick_vital_title')}</h2>
      
      <label for="qvm_pid">${t('th_patient')}</label>
      <select id="qvm_pid">
        ${S.p.map(p => `<option value="${p.id}" ${p.id === pid ? 'selected' : ''}>${p.name} \u00B7 Ward ${p.ward}/Bed ${p.bed}</option>`).join('')}
      </select>

      <label for="qvm_hr">${t('vitals_hr')} (bpm)</label>
      <input id="qvm_hr" type="number" placeholder="e.g. 78">

      <label for="qvm_spo2">${t('vitals_spo2')} (%)</label>
      <input id="qvm_spo2" type="number" placeholder="e.g. 98">

      <label for="qvm_temp">${t('vitals_temp')} (\u00B0C)</label>
      <input id="qvm_temp" type="number" step="0.1" placeholder="e.g. 36.8">

      <button class="pri" onclick="submitQuickVitalModal()">${t('btn_save')}</button>
      <button onclick="closeModal()">${t('btn_cancel')}</button>
    </div>
  `);
}

function submitQuickVitalModal() {
  const pid = +document.getElementById('qvm_pid').value;
  const hr = document.getElementById('qvm_hr').value;
  const spo2 = document.getElementById('qvm_spo2').value;
  const temp = document.getElementById('qvm_temp').value;

  if (!hr && !spo2 && !temp) {
    showToast("Please enter at least one vital parameter");
    return;
  }

  if (hr) pushVital(pid, 'hr', hr, 'manual');
  if (spo2) pushVital(pid, 'spo2', spo2, 'manual');
  if (temp) pushVital(pid, 'temp', temp, 'manual');

  const p = getPatient(pid);
  evaluatePatient(p);
  logAction(`Quick bedside vitals entered for patient #${pid} (${p ? p.name : ''}) by ${U ? U.name : 'Staff'}`, "Clinical");
  closeModal();
  draw();
  showToast(`${t('btn_save')}: ${p ? p.name : ''}`);
}

function openBaselineModal(pid) {
  const p = getPatient(pid);
  modal(`
    <div class="fm">
      <h2>${t('modal_baseline_title')} ${p.name}</h2>
      <p class="mut">${t('modal_baseline_desc')}</p>
      
      <label for="base_hr">${t('lbl_baseline_hr')}</label>
      <input id="base_hr" type="number" value="${p.base || 72}">

      <button class="pri" onclick="saveBaseline(${pid})">${t('btn_set_baseline')}</button>
      <button style="margin-top:10px" onclick="clearBaseline(${pid})">Reset to Default Standard</button>
    </div>
  `);
}

function saveBaseline(pid) {
  const val = +document.getElementById('base_hr').value;
  if (!val || val < 40 || val > 160) {
    showToast("Enter a realistic baseline heart rate (40-160)");
    return;
  }
  const p = getPatient(pid);
  p.base = val;
  evaluatePatient(p);
  logAction(`Baseline heart rate for ${p.name} set to ${val} bpm`, "Clinical");
  closeModal();
  draw();
  showToast(`Baseline updated to ${val} bpm`);
}

function clearBaseline(pid) {
  const p = getPatient(pid);
  p.base = null;
  evaluatePatient(p);
  logAction(`Baseline heart rate cleared for ${p.name}`, "Clinical");
  closeModal();
  draw();
  showToast("Baseline reset to standard range");
}

function openAcknowledgeModal(alertId) {
  const alert = S.al.find(a => a.id === alertId);
  if (!alert) return;

  modal(`
    <div class="fm">
      <h2>${t('modal_ack_alert_title')}</h2>
      <p class="mut">Alert: <b>${alert.cat}</b> \u2014 ${alert.desc}</p>
      
      <label for="ack_note">${t('lbl_resolution_note')}</label>
      <textarea id="ack_note" rows="3" placeholder="e.g. Bedside assessment completed; oxygen administered at 2L/min..."></textarea>

      <button class="pri" onclick="confirmAcknowledgeAlert(${alertId})">${t('btn_confirm_resolve')}</button>
      <button onclick="closeModal()">${t('btn_cancel')}</button>
    </div>
  `);
}

function confirmAcknowledgeAlert(alertId) {
  const alert = S.al.find(a => a.id === alertId);
  if (!alert) return;
  const note = document.getElementById('ack_note').value.trim() || 'Bedside evaluation conducted';

  alert.res = {
    t: Date.now(),
    by: U.name,
    note
  };

  logAction(`Alert resolved for patient #${alert.pid} by ${U.name}: ${note}`, "Alert");
  saveState();
  closeModal();
  draw();
  showToast(t('status_checked'));
}

function openReviewConcernModal(concernId) {
  const c = S.concerns.find(x => x.id === concernId);
  if (!c) return;

  modal(`
    <div class="fm">
      <h2>${t('modal_review_concern_title')}</h2>
      <p class="mut">Submitted by: <b>${c.attender}</b><br>Message: "${c.text}"</p>

      <label for="rev_note">${t('lbl_staff_note')}</label>
      <textarea id="rev_note" rows="3" placeholder="e.g. Checked on patient; warm blanket provided and temperature rechecked..."></textarea>

      <button class="pri" onclick="confirmReviewConcern(${concernId})">${t('btn_acknowledge')}</button>
      <button onclick="closeModal()">${t('btn_cancel')}</button>
    </div>
  `);
}

function confirmReviewConcern(concernId) {
  const c = S.concerns.find(x => x.id === concernId);
  if (!c) return;
  const note = document.getElementById('rev_note').value.trim() || 'Attended bedside';

  c.status = 'reviewed';
  c.reviewedBy = U.name;
  c.reviewNote = note;

  logAction(`Attender concern #${concernId} reviewed by ${U.name}`, "Clinical");
  saveState();
  closeModal();
  draw();
  showToast(t('status_checked'));
}

function submitAttenderConcern(pid) {
  const name = document.getElementById('att_name').value.trim() || 'Attender';
  const type = document.getElementById('att_type').value;
  const msg = document.getElementById('att_msg').value.trim();
  if (!msg) {
    showToast("Please describe your concern before submitting");
    return;
  }

  const newConcern = {
    id: Date.now(),
    pid,
    attender: name,
    t: Date.now(),
    type,
    text: msg,
    status: 'unreviewed',
    reviewedBy: null,
    reviewNote: null
  };

  S.concerns.unshift(newConcern);
  logAction(`New attender concern submitted by ${name}`, "Attender");
  saveState();
  nav('a_concerns');
  showToast(t('btn_submit_concern'));
}

function markMedVerified(medId) {
  const m = S.medReviews.find(x => x.id === medId);
  if (!m) return;
  m.status = 'verified';
  logAction(`Medication ${m.med} verified & administered by ${U.name}`, "Clinical");
  saveState();
  draw();
  showToast(`Verified: ${m.med}`);
}

function saveQuickVitals() {
  const pid = +document.getElementById('qv_pid').value;
  const hr = document.getElementById('qv_hr').value;
  const spo2 = document.getElementById('qv_spo2').value;
  const temp = document.getElementById('qv_temp').value;

  if (hr) pushVital(pid, 'hr', hr, 'manual');
  if (spo2) pushVital(pid, 'spo2', spo2, 'manual');
  if (temp) pushVital(pid, 'temp', temp, 'manual');

  evaluatePatient(getPatient(pid));
  logAction(`Quick bedside vitals entered for patient #${pid} by ${U.name}`, "Clinical");
  nav('n_triage');
  showToast(t('btn_save'));
}

function reportPatientSymptom(pid) {
  const p = getPatient(pid);
  p.status = 'unchecked';
  S.al.unshift({
    id: Date.now(),
    pid,
    score: 4,
    t: Date.now(),
    level: 'high',
    cat: 'Bedside Call Alert',
    desc: `Bedside call assistance requested by ${p.name} from patient portal`,
    res: null,
    assigned: p.nurse || 'Nurse'
  });
  logAction(`Bedside call assistance triggered by patient ${p.name}`, "Alert");
  saveState();
  draw();
  showToast(t('btn_call_nurse') + ": " + t('status_unchecked'));
}

function exportAuditLog() {
  const rows = [
    ['Timestamp', 'User', 'Role', 'Category', 'Action'],
    ...S.au.map(a => [tm(a.t), a.u, a.role || 'STAFF', a.cat || 'Clinical', `"${a.a.replace(/"/g, '""')}"`])
  ];
  const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `CLYNORA_Audit_Trail_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("Audit trail exported to CSV");
}

// Mouse Follower Init (with safe checks)
const cd = (typeof document !== 'undefined') ? document.getElementById('cd') : null;
const cr = (typeof document !== 'undefined') ? document.getElementById('cr') : null;
let mx = 0, my = 0, rx = 0, ry = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (cd && cd.style) {
      cd.style.left = `${mx}px`;
      cd.style.top = `${my}px`;
    }
    if (cr && cr.classList) {
      cr.classList.toggle('h', !!e.target.closest('button, select, input, .role-card, a, [onclick], .prompt-chip, .voice-prompt-chip'));
    }
  });

  (function animateCursor() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    if (cr && cr.style) {
      cr.style.left = `${rx}px`;
      cr.style.top = `${ry}px`;
    }
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(animateCursor);
    }
  })();
}

// Initialize Navigation and Session on Load
updateNavHeader();
if (U) {
  openApp();
}














