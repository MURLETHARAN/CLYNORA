// CLYNORA AI Assistant (Text & Voice Launcher)
// Role-aware bedside clinical decision support engine
// Multilingual support: English (en), Tamil (ta), Hindi (hi)

let assistantOpen = false;
let assistantMessages = [];

function initAssistant() {
  const container = document.getElementById('assistantDrawer');
  if (!container) return;

  // Initial welcome message if empty
  if (assistantMessages.length === 0) {
    assistantMessages.push({
      sender: 'bot',
      text: getWelcomeMessage(),
      time: Date.now()
    });
  }

  renderAssistantMessages();
  renderRolePrompts();
}

function getWelcomeMessage() {
  const role = window.U ? window.U.role : 'doc';

  if (role === 'doc') {
    return "Welcome. I can summarize patient deterioration, review concerns, or analyze telemetry. Select a prompt or type below.";
  }
  if (role === 'nurse') {
    return "Welcome. I can help review triage alerts, patient concerns, and medication verification requests.";
  }
  if (role === 'pat') {
    return "Welcome to your CLYNORA health assistant. I can explain your recorded vital signs or guide you on requesting assistance.";
  }
  if (role === 'att') {
    return "Welcome. I can help you review the patient’s available monitoring updates and submitted concerns.";
  }
  return "CLYNORA Assistant ready. How can I assist?";
}

function toggleAssistantDrawer(forceOpen) {
  assistantOpen = forceOpen !== undefined ? forceOpen : !assistantOpen;
  const drawer = document.getElementById('assistantDrawer');
  const fab = document.getElementById('assistantFab');
  if (!drawer || !fab) return;

  if (assistantOpen) {
    drawer.classList.add('open');
    fab.classList.add('active');
    initAssistant();
    const input = document.getElementById('assistantInput');
    if (input) setTimeout(() => input.focus(), 200);
  } else {
    drawer.classList.remove('open');
    fab.classList.remove('active');
  }
}

function renderRolePrompts() {
  const container = document.getElementById('assistantPrompts');
  if (!container) return;

  const role = window.U ? window.U.role : 'doc';
  let prompts = [];

  if (role === 'doc') {
    prompts = [
      t('prompt_doc_1'),
      t('prompt_doc_2'),
      t('prompt_doc_3')
    ];
  } else if (role === 'nurse') {
    prompts = [
      t('prompt_nurse_1'),
      t('prompt_nurse_2'),
      t('prompt_nurse_3')
    ];
  } else if (role === 'pat') {
    prompts = [
      t('prompt_pat_1'),
      t('prompt_pat_2')
    ];
  } else if (role === 'att') {
    prompts = [
      t('prompt_att_1'),
      t('prompt_att_2')
    ];
  } else {
    prompts = [
      t('prompt_doc_1'),
      t('prompt_nurse_1')
    ];
  }

  container.innerHTML = prompts.map(p => `
    <button class="prompt-chip" onclick="sendAssistantPrompt('${p.replace(/'/g, "\\'")}')">
      ${p}
    </button>
  `).join('');
}

function renderAssistantMessages() {
  const container = document.getElementById('assistantMessages');
  if (!container) return;

  container.innerHTML = assistantMessages.map(m => `
    <div class="assistant-msg ${m.sender === 'user' ? 'user-msg' : 'bot-msg'}">
      <div class="msg-content">${m.text}</div>
      <div class="msg-time">${tm(m.time, 'timeOnly')}</div>
    </div>
  `).join('');

  container.scrollTop = container.scrollHeight;
}

function sendAssistantPrompt(text) {
  const input = document.getElementById('assistantInput');
  if (input) input.value = text;
  handleAssistantSubmit();
}

function handleAssistantSubmit() {
  const input = document.getElementById('assistantInput');
  if (!input) return;
  const q = input.value.trim();
  if (!q) return;

  input.value = '';

  // Append user message
  assistantMessages.push({
    sender: 'user',
    text: q,
    time: Date.now()
  });
  renderAssistantMessages();

  // Show typing indicator
  const container = document.getElementById('assistantMessages');
  const typingEl = document.createElement('div');
  typingEl.className = 'assistant-msg bot-msg typing';
  typingEl.id = 'botTyping';
  typingEl.innerHTML = '<div class="typing-dots"><span></span><span></span><span></span></div>';
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;

  // Process response
  setTimeout(() => {
    const typing = document.getElementById('botTyping');
    if (typing) typing.remove();

    const answer = generateAIAnswer(q);
    assistantMessages.push({
      sender: 'bot',
      text: answer,
      time: Date.now()
    });
    renderAssistantMessages();
  }, 650);
}

// Context-aware Clinical Rules Engine with multilingual support
function generateAIAnswer(query) {
  const q = (query || '').toLowerCase();
  const activePid = (window.U && window.U.pid) ? window.U.pid : (window.cur || 101);
  const patient = (typeof getPatient === 'function') ? (getPatient(activePid) || (window.S && window.S.p && window.S.p[0])) : null;
  const lang = (typeof currentLang !== 'undefined') ? currentLang : 'en';

  // Helper check for multilingual query keywords
  const isVitalsQuery = q.includes('summar') || q.includes('recent reading') || q.includes('vitals') || 
                       q.includes('heart rate') || q.includes('oxygen') || q.includes('spo2') ||
                       q.includes('à®šà¯à®°à¯à®•à¯à®•à®¿') || q.includes('à®…à®³à®µà¯€à®Ÿà¯') || q.includes('à®‡à®¤à®¯à®¤à¯à®¤à¯à®Ÿà®¿à®ªà¯à®ªà¯') ||
                       q.includes('à¤¸à¤¾à¤°à¤¾à¤‚à¤¶') || q.includes('à¤°à¥€à¤¡à¤¿à¤‚à¤—') || q.includes('à¤¹à¥ƒà¤¦à¤¯ à¤—à¤¤à¤¿') || q.includes('à¤µà¤¾à¤‡à¤Ÿà¤²');

  const isConcernsQuery = q.includes('concern') || q.includes('unreviewed') || q.includes('complaint') ||
                          q.includes('à®•à®µà®²à¯ˆ') || q.includes('à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆ') || q.includes('à®ªà¯à®•à®¾à®°à¯') ||
                          q.includes('à¤šà¤¿à¤‚à¤¤à¤¾') || q.includes('à¤¶à¤¿à¤•à¤¾à¤¯à¤¤') || q.includes('à¤…à¤¨à¤¸à¥à¤²à¤à¥€');

  const isDeteriorationQuery = q.includes('deteriorat') || q.includes('require attention') || q.includes('immediate') || q.includes('crossed') ||
                               q.includes('à®†à®ªà®¤à¯à®¤à¯') || q.includes('à®Žà®šà¯à®šà®°à®¿à®•à¯à®•à¯ˆ à®¨à®¿à®²à¯ˆ') || q.includes('à®‰à®Ÿà®©à®Ÿà®¿ à®•à®µà®©à®®à¯') ||
                               q.includes('à¤—à¤¿à¤°à¤¾à¤µà¤Ÿ') || q.includes('à¤šà¥‡à¤¤à¤¾à¤µà¤¨à¥€ à¤¸à¥€à¤®à¤¾') || q.includes('à¤¤à¥à¤°à¤‚à¤¤ à¤§à¥à¤¯à¤¾à¤¨');

  const isAlertsQuery = q.includes('alert') || q.includes('unacknowledged') || q.includes('ward 3') ||
                        q.includes('à®Žà®šà¯à®šà®°à®¿à®•à¯à®•à¯ˆ') || q.includes('à®¨à®¿à®²à¯à®µà¯ˆ') ||
                        q.includes('à¤…à¤²à¤°à¥à¤Ÿ') || q.includes('à¤…à¤¨à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤');

  const isMedsQuery = q.includes('medication') || q.includes('prescription') || q.includes('drug') ||
                      q.includes('à®®à®°à¯à®¨à¯à®¤à¯') || q.includes('à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯') ||
                      q.includes('à¤¦à¤µà¤¾') || q.includes('à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨');

  const isHelpQuery = q.includes('contact') || q.includes('nurse') || q.includes('help') || q.includes('call') ||
                      q.includes('à®¤à¯Šà®Ÿà®°à¯à®ªà¯') || q.includes('à®šà¯†à®µà®¿à®²à®¿à®¯à®°à¯') || q.includes('à®…à®´à¯ˆà®•à¯à®•') ||
                      q.includes('à¤¨à¤°à¥à¤¸') || q.includes('à¤®à¤¦à¤¦') || q.includes('à¤¬à¥à¤²à¤¾à¤à¤‚') || q.includes('à¤¸à¤‚à¤ªà¤°à¥à¤•');

  // 1. Patient Summarization / Vitals
  if (isVitalsQuery) {
    if (!patient) return lang === 'ta' ? "à®¨à¯‹à®¯à®¾à®³à®¿ à®¤à¯‡à®°à¯à®¨à¯à®¤à¯†à®Ÿà¯à®•à¯à®•à®ªà¯à®ªà®Ÿà®µà®¿à®²à¯à®²à¯ˆ." : lang === 'hi' ? "à¤•à¥‹à¤ˆ à¤®à¤°à¥€à¤œ à¤šà¤¯à¤¨à¤¿à¤¤ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¥¤" : "No active patient selected for vital sign analysis.";
    const hr = (typeof getLatestVital === 'function') ? getLatestVital(patient.id, 'hr') : null;
    const spo2 = (typeof getLatestVital === 'function') ? getLatestVital(patient.id, 'spo2') : null;
    const temp = (typeof getLatestVital === 'function') ? getLatestVital(patient.id, 'temp') : null;
    const ews = (typeof calcEWS === 'function') ? calcEWS(patient) : { total: 0, alert: false };

    if (lang === 'ta') {
      return `<strong>${patient.name} (à®µà®¾à®°à¯à®Ÿà¯ ${patient.ward}/à®ªà®Ÿà¯à®•à¯à®•à¯ˆ ${patient.bed}) à®®à®°à¯à®¤à¯à®¤à¯à®µ à®šà¯à®°à¯à®•à¯à®•à®®à¯:</strong><br>` +
        `â€¢ à®‡à®¤à®¯à®¤à¯ à®¤à¯à®Ÿà®¿à®ªà¯à®ªà¯: ${hr ? hr.v + ' bpm' : 'N/A'} (à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆ à®…à®³à®µà¯: ${patient.base || 'à®¨à®¿à®°à¯à®£à®¯à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà®µà®¿à®²à¯à®²à¯ˆ'} bpm)<br>` +
        `â€¢ SpOâ‚‚ à®†à®•à¯à®šà®¿à®œà®©à¯: ${spo2 ? spo2.v + ' %' : 'N/A'}<br>` +
        `â€¢ à®‰à®Ÿà®²à¯ à®µà¯†à®ªà¯à®ªà®¨à®¿à®²à¯ˆ: ${temp ? temp.v + ' Â°C' : 'N/A'}<br>` +
        `â€¢ à®†à®°à®®à¯à®ª à®Žà®šà¯à®šà®°à®¿à®•à¯à®•à¯ˆ à®®à®¤à®¿à®ªà¯à®ªà¯†à®£à¯: <strong>${ews.total}</strong> (${ews.alert ? 'âš ï¸ à®†à®ªà®¤à¯à®¤à¯ à®µà®°à®®à¯à®ªà¯ à®¤à®¾à®£à¯à®Ÿà®¿à®¯à®¤à¯ - à®ªà®Ÿà¯à®•à¯à®•à¯ˆ à®µà®´à®¿ à®šà¯‹à®¤à®©à¯ˆ à®¤à¯‡à®µà¯ˆ' : 'âœ… à®ªà®¾à®¤à¯à®•à®¾à®ªà¯à®ªà®¾à®© à®µà®°à®®à¯à®ªà®¿à®±à¯à®•à¯à®³à¯ à®‰à®³à¯à®³à®¤à¯'})<br>` +
        `<small class="mut">à®¤à®•à®µà®²à¯ à®šà¯†à®©à¯à®šà®¾à®°à¯ à®®à®¾à®¤à®¿à®°à®¿à®¤à¯ à®¤à®°à®µà¯ˆ à®…à®Ÿà®¿à®ªà¯à®ªà®Ÿà¯ˆà®¯à®¾à®•à®•à¯ à®•à¯Šà®£à¯à®Ÿà®¤à¯. à®®à¯à®Ÿà®¿à®µà¯ à®†à®¤à®°à®µà¯ à®•à®°à¯à®µà®¿ à®®à®Ÿà¯à®Ÿà¯à®®à¯‡.</small>`;
    } else if (lang === 'hi') {
      return `<strong>${patient.name} (à¤µà¤¾à¤°à¥à¤¡ ${patient.ward}/à¤¬à¥‡à¤¡ ${patient.bed}) à¤•à¤¾ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•à¤² à¤¸à¤¾à¤°à¤¾à¤‚à¤¶:</strong><br>` +
        `â€¢ à¤¹à¥ƒà¤¦à¤¯ à¤—à¤¤à¤¿: ${hr ? hr.v + ' bpm' : 'N/A'} (à¤¬à¥‡à¤¸à¤²à¤¾à¤‡à¤¨: ${patient.base || 'à¤¸à¥‡à¤Ÿ à¤¨à¤¹à¥€à¤‚'} bpm)<br>` +
        `â€¢ SpOâ‚‚ à¤‘à¤•à¥à¤¸à¥€à¤œà¤¨: ${spo2 ? spo2.v + ' %' : 'N/A'}<br>` +
        `â€¢ à¤¶à¤°à¥€à¤° à¤•à¤¾ à¤¤à¤¾à¤ªà¤®à¤¾à¤¨: ${temp ? temp.v + ' Â°C' : 'N/A'}<br>` +
        `â€¢ à¤ªà¥à¤°à¤¾à¤°à¤‚à¤­à¤¿à¤• à¤šà¥‡à¤¤à¤¾à¤µà¤¨à¥€ à¤¸à¥à¤•à¥‹à¤°: <strong>${ews.total}</strong> (${ews.alert ? 'âš ï¸ à¤—à¤¿à¤°à¤¾à¤µà¤Ÿ à¤¸à¥€à¤®à¤¾ à¤ªà¤¾à¤° à¤¹à¥à¤ˆ - à¤¤à¥à¤°à¤‚à¤¤ à¤¬à¥‡à¤¡à¤¸à¤¾à¤‡à¤¡ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¤°à¥‡à¤‚' : 'âœ… à¤¸à¥à¤°à¤•à¥à¤·à¤¿à¤¤ à¤¸à¥€à¤®à¤¾à¤“à¤‚ à¤•à¥‡ à¤­à¥€à¤¤à¤°'})<br>` +
        `<small class="mut">à¤¯à¤¹ à¤†à¤‰à¤Ÿà¤ªà¥à¤Ÿ à¤Ÿà¥‡à¤²à¥€à¤®à¥‡à¤Ÿà¥à¤°à¥€ à¤¨à¤®à¥‚à¤¨à¤¾ à¤¡à¥‡à¤Ÿà¤¾ à¤ªà¤° à¤†à¤§à¤¾à¤°à¤¿à¤¤ à¤¹à¥ˆà¥¤ à¤•à¥‡à¤µà¤² à¤¨à¤¿à¤°à¥à¤£à¤¯ à¤¸à¤®à¤°à¥à¤¥à¤¨ à¤•à¥‡ à¤²à¤¿à¤à¥¤</small>`;
    }

    return `<strong>Clinical Summary for ${patient.name} (Ward ${patient.ward}/Bed ${patient.bed}):</strong><br>` +
      `â€¢ Heart Rate: ${hr ? hr.v + ' bpm' : 'N/A'} (Baseline: ${patient.base || 'Not set'} bpm)<br>` +
      `â€¢ SpOâ‚‚: ${spo2 ? spo2.v + ' %' : 'N/A'}<br>` +
      `â€¢ Core Temperature: ${temp ? temp.v + ' Â°C' : 'N/A'}<br>` +
      `â€¢ Early Warning Score: <strong>${ews.total}</strong> (${ews.alert ? 'âš ï¸ Deterioration Threshold Crossed' : 'âœ… Within safe parameters'})<br>` +
      `<small class="mut">Decision support output based on wearable telemetry. Last updated: ${hr ? tm(hr.t) : 'Never'}.</small>`;
  }

  // 2. Unreviewed Clinical Concerns
  if (isConcernsQuery) {
    const unrev = (window.S && window.S.concerns) ? window.S.concerns.filter(c => c.status === 'unreviewed') : [];
    if (unrev.length === 0) {
      if (lang === 'ta') return "âœ… à®¤à®±à¯à®ªà¯‹à®¤à¯ à®¨à®¿à®²à¯à®µà¯ˆà®¯à®¿à®²à¯ à®‰à®³à¯à®³ à®•à®µà®²à¯ˆà®•à®³à¯ à®à®¤à¯à®®à®¿à®²à¯à®²à¯ˆ. à®…à®©à¯ˆà®¤à¯à®¤à¯ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆà®•à®³à¯à®®à¯ à®šà¯†à®µà®¿à®²à®¿à®¯à®°à®¾à®²à¯ à®ªà®°à®¿à®šà¯€à®²à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯à®³à¯à®³à®©.";
      if (lang === 'hi') return "âœ… à¤µà¤°à¥à¤¤à¤®à¤¾à¤¨ à¤®à¥‡à¤‚ à¤•à¥‹à¤ˆ à¤…à¤¨à¤¸à¥à¤²à¤à¥€ à¤šà¤¿à¤‚à¤¤à¤¾à¤à¤‚ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆà¤‚à¥¤ à¤¸à¤­à¥€ à¤¤à¥€à¤®à¤¾à¤°à¤¦à¤¾à¤° à¤…à¤¨à¥à¤°à¥‹à¤§à¥‹à¤‚ à¤ªà¤° à¤§à¥à¤¯à¤¾à¤¨ à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾ à¤¹à¥ˆà¥¤";
      return "âœ… There are currently no unreviewed concerns. All submitted attender requests have been attended by nursing staff.";
    }

    if (lang === 'ta') {
      const list = unrev.map(c => {
        const p = getPatient(c.pid);
        return `â€¢ <strong>${p ? p.name : 'à®¨à¯‹à®¯à®¾à®³à®¿'} (à®µà®¾à®°à¯à®Ÿà¯ ${p ? p.ward + '/' + p.bed : 'â€”'}):</strong> ${c.type} â€” "${c.text}" (à®…à®©à¯à®ªà¯à®ªà®¿à®¯à®µà®°à¯: ${c.attender})`;
      }).join('<br>');
      return `<strong>à®ªà®°à®¿à®šà¯€à®²à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà®¾à®¤ à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆà®•à®³à¯ (${unrev.length}):</strong><br>${list}<br><small class="mut">à®µà®¾à®°à¯à®Ÿà¯ à®•à®µà®²à¯ˆà®•à®³à¯ à®ªà®•à¯à®•à®¤à¯à®¤à®¿à®²à¯ à®‡à®¤à®©à¯ˆ à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®µà¯à®®à¯.</small>`;
    } else if (lang === 'hi') {
      const list = unrev.map(c => {
        const p = getPatient(c.pid);
        return `â€¢ <strong>${p ? p.name : 'à¤®à¤°à¥€à¤œ'} (à¤µà¤¾à¤°à¥à¤¡ ${p ? p.ward + '/' + p.bed : 'â€”'}):</strong> ${c.type} â€” "${c.text}" (à¤ªà¥à¤°à¤¸à¥à¤¤à¥à¤¤à¤•à¤°à¥à¤¤à¤¾: ${c.attender})`;
      }).join('<br>');
      return `<strong>à¤…à¤¨à¤¸à¥à¤²à¤à¥€ à¤¤à¥€à¤®à¤¾à¤°à¤¦à¤¾à¤° à¤šà¤¿à¤‚à¤¤à¤¾à¤à¤‚ (${unrev.length}):</strong><br>${list}<br><small class="mut">à¤•à¥ƒà¤ªà¤¯à¤¾ à¤µà¤¾à¤°à¥à¤¡ à¤šà¤¿à¤‚à¤¤à¤¾à¤à¤‚ à¤Ÿà¥ˆà¤¬ à¤®à¥‡à¤‚ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¤°à¥‡à¤‚à¥¤</small>`;
    }

    const list = unrev.map(c => {
      const p = getPatient(c.pid);
      return `â€¢ <strong>${p ? p.name : 'Unknown'} (${p ? p.ward + '/' + p.bed : 'N/A'}):</strong> ${c.type} â€” "${c.text}" (Submitted by ${c.attender}, ${timeAgo(c.t)})`;
    }).join('<br>');
    return `<strong>Unreviewed Attender & Patient Concerns (${unrev.length}):</strong><br>${list}<br><small class="mut">Please review and mark acknowledged in the Ward Concerns tab.</small>`;
  }

  // 3. Deterioration & Immediate Attention
  if (isDeteriorationQuery) {
    const attentionList = (window.S && window.S.p) ? window.S.p.filter(p => p.on && p.status === 'unchecked') : [];
    if (attentionList.length === 0) {
      if (lang === 'ta') return "à®…à®©à¯ˆà®¤à¯à®¤à¯ à®¨à¯‹à®¯à®¾à®³à®¿à®•à®³à¯à®®à¯ à®¤à®±à¯à®ªà¯‹à®¤à¯ à®¨à®¿à®²à¯ˆà®¯à®¾à®© à®¨à®¿à®²à¯ˆà®¯à®¿à®²à¯ à®‰à®³à¯à®³à®©à®°à¯.";
      if (lang === 'hi') return "à¤¸à¤­à¥€ à¤¨à¤¿à¤—à¤°à¤¾à¤¨à¥€ à¤®à¥‡à¤‚ à¤®à¤°à¥€à¤œ à¤µà¤°à¥à¤¤à¤®à¤¾à¤¨ à¤®à¥‡à¤‚ à¤¸à¥à¤¥à¤¿à¤° à¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤®à¥‡à¤‚ à¤¹à¥ˆà¤‚à¥¤";
      return "All monitored patients are currently stable with checked status.";
    }

    if (lang === 'ta') {
      const details = attentionList.map(p => {
        const ews = calcEWS(p);
        const hr = getLatestVital(p.id, 'hr');
        return `â€¢ <strong>${p.name}</strong> Â· à®µà®¾à®°à¯à®Ÿà¯ ${p.ward} à®ªà®Ÿà¯à®•à¯à®•à¯ˆ ${p.bed} (EWS à®®à®¤à®¿à®ªà¯à®ªà¯†à®£à¯: ${ews.total}) â€” ${hr ? hr.v + ' bpm' : ''}`;
      }).join('<br>');
      return `<strong>à®‰à®Ÿà®©à®Ÿà®¿ à®ªà®Ÿà¯à®•à¯à®•à¯ˆ à®µà®´à®¿ à®•à®µà®©à®®à¯ à®¤à¯‡à®µà¯ˆà®ªà¯à®ªà®Ÿà¯à®®à¯ à®¨à¯‹à®¯à®¾à®³à®¿à®•à®³à¯ (${attentionList.length}):</strong><br>${details}<br><small class="mut">à®ªà®°à®¿à®¨à¯à®¤à¯à®°à¯ˆ: à®‰à®Ÿà®©à®Ÿà®¿ à®ªà®Ÿà¯à®•à¯à®•à¯ˆ à®µà®´à®¿ à®šà¯‹à®¤à®©à¯ˆ à®®à®±à¯à®±à¯à®®à¯ à®…à®³à®µà¯€à®Ÿà¯ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯.</small>`;
    } else if (lang === 'hi') {
      const details = attentionList.map(p => {
        const ews = calcEWS(p);
        const hr = getLatestVital(p.id, 'hr');
        return `â€¢ <strong>${p.name}</strong> Â· à¤µà¤¾à¤°à¥à¤¡ ${p.ward} à¤¬à¥‡à¤¡ ${p.bed} (EWS à¤¸à¥à¤•à¥‹à¤°: ${ews.total}) â€” ${hr ? hr.v + ' bpm' : ''}`;
      }).join('<br>');
      return `<strong>à¤¤à¥à¤°à¤‚à¤¤ à¤¬à¥‡à¤¡à¤¸à¤¾à¤‡à¤¡ à¤§à¥à¤¯à¤¾à¤¨ à¤¦à¥‡à¤¨à¥‡ à¤¯à¥‹à¤—à¥à¤¯ à¤®à¤°à¥€à¤œ (${attentionList.length}):</strong><br>${details}<br><small class="mut">à¤…à¤¨à¥à¤¶à¤‚à¤¸à¤¿à¤¤ à¤•à¤¾à¤°à¥à¤°à¤µà¤¾à¤ˆ: à¤¤à¥à¤°à¤‚à¤¤ à¤¬à¥‡à¤¡à¤¸à¤¾à¤‡à¤¡ à¤Ÿà¥à¤°à¤¾à¤‡à¤à¤œ à¤”à¤° à¤µà¤¾à¤‡à¤Ÿà¤² à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¨à¥¤</small>`;
    }

    const details = attentionList.map(p => {
      const ews = calcEWS(p);
      const hr = getLatestVital(p.id, 'hr');
      return `â€¢ <strong>${p.name}</strong> Â· Ward ${p.ward} Bed ${p.bed} (EWS Score: ${ews.total}) â€” ${hr ? hr.v + ' bpm' : ''}`;
    }).join('<br>');
    return `<strong>Patients Requiring Immediate Bedside Attention (${attentionList.length}):</strong><br>${details}<br><small class="mut">Recommended action: Immediate bedside triage check and vital sign verification.</small>`;
  }

  // 4. Alerts Queue
  if (isAlertsQuery) {
    const openAlerts = (window.S && window.S.al) ? window.S.al.filter(a => !a.res) : [];
    if (openAlerts.length === 0) {
      if (lang === 'ta') return "à®…à®©à¯ˆà®¤à¯à®¤à¯ à®®à®°à¯à®¤à¯à®¤à¯à®µ à®Žà®šà¯à®šà®°à®¿à®•à¯à®•à¯ˆà®•à®³à¯à®®à¯ à®ªà®°à®¿à®šà¯€à®²à®¿à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯ à®à®±à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯à®³à¯à®³à®©.";
      if (lang === 'hi') return "à¤¸à¤­à¥€ à¤•à¥à¤²à¤¿à¤¨à¤¿à¤•à¤² à¤…à¤²à¤°à¥à¤Ÿ à¤•à¥€ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥€ à¤œà¤¾ à¤šà¥à¤•à¥€ à¤¹à¥ˆ à¤”à¤° à¤¸à¥à¤µà¥€à¤•à¤¾à¤° à¤•à¤° à¤²à¤¿à¤ à¤—à¤ à¤¹à¥ˆà¤‚à¥¤";
      return "All clinical alerts have been reviewed and acknowledged.";
    }

    if (lang === 'ta') {
      const list = openAlerts.map(a => {
        const p = getPatient(a.pid);
        return `â€¢ <strong>[${(a.level || 'alert').toUpperCase()}] ${p ? p.name : 'à®¨à¯‹à®¯à®¾à®³à®¿'}:</strong> ${a.cat} â€” ${a.desc}`;
      }).join('<br>');
      return `<strong>à®šà¯†à®¯à®²à®¿à®²à¯ à®‰à®³à¯à®³ à®à®±à¯à®•à®ªà¯à®ªà®Ÿà®¾à®¤ à®Žà®šà¯à®šà®°à®¿à®•à¯à®•à¯ˆà®•à®³à¯ (${openAlerts.length}):</strong><br>${list}`;
    } else if (lang === 'hi') {
      const list = openAlerts.map(a => {
        const p = getPatient(a.pid);
        return `â€¢ <strong>[${(a.level || 'alert').toUpperCase()}] ${p ? p.name : 'à¤®à¤°à¥€à¤œ'}:</strong> ${a.cat} â€” ${a.desc}`;
      }).join('<br>');
      return `<strong>à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤…à¤¨à¤¸à¥à¤µà¥€à¤•à¥ƒà¤¤ à¤…à¤²à¤°à¥à¤Ÿ (${openAlerts.length}):</strong><br>${list}`;
    }

    const list = openAlerts.map(a => {
      const p = getPatient(a.pid);
      return `â€¢ <strong>[${a.level.toUpperCase()}] ${p ? p.name : 'Patient'}:</strong> ${a.cat} â€” ${a.desc} (${timeAgo(a.t)})`;
    }).join('<br>');
    return `<strong>Active Unacknowledged Alerts (${openAlerts.length}):</strong><br>${list}`;
  }

  // 5. Medication Review
  if (isMedsQuery) {
    const pendingMeds = (window.S && window.S.medReviews) ? window.S.medReviews.filter(m => m.status === 'pending') : [];
    if (pendingMeds.length === 0) {
      if (lang === 'ta') return "à®…à®©à¯ˆà®¤à¯à®¤à¯ à®·à®¿à®ªà¯à®Ÿà¯ à®®à®°à¯à®¨à¯à®¤à¯à®•à®³à¯à®®à¯ à®šà®°à®¿à®ªà®¾à®°à¯à®•à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯ à®µà®´à®™à¯à®•à®ªà¯à®ªà®Ÿà¯à®Ÿà¯à®³à¯à®³à®©.";
      if (lang === 'hi') return "à¤‡à¤¸ à¤¶à¤¿à¤«à¥à¤Ÿ à¤•à¥€ à¤¸à¤­à¥€ à¤¦à¤µà¤¾à¤à¤‚ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤¹à¥ˆà¤‚ à¤”à¤° à¤¸à¤®à¤¯ à¤ªà¤° à¤¦à¥€ à¤œà¤¾ à¤šà¥à¤•à¥€ à¤¹à¥ˆà¤‚à¥¤";
      return "All shift medications are verified and up to date.";
    }

    if (lang === 'ta') {
      const list = pendingMeds.map(m => {
        const p = getPatient(m.pid);
        return `â€¢ <strong>${m.med}</strong> - ${p ? p.name : 'à®¨à¯‹à®¯à®¾à®³à®¿'} (à®¨à¯‡à®°à®®à¯: ${m.due}) â€” ${m.notes}`;
      }).join('<br>');
      return `<strong>à®¨à®¿à®²à¯à®µà¯ˆà®¯à®¿à®²à¯ à®‰à®³à¯à®³ à®®à®°à¯à®¨à¯à®¤à¯ à®šà®°à®¿à®ªà®¾à®°à¯à®ªà¯à®ªà¯à®•à®³à¯ (${pendingMeds.length}):</strong><br>${list}`;
    } else if (lang === 'hi') {
      const list = pendingMeds.map(m => {
        const p = getPatient(m.pid);
        return `â€¢ <strong>${m.med}</strong> - ${p ? p.name : 'à¤®à¤°à¥€à¤œ'} (à¤¸à¤®à¤¯: ${m.due}) â€” ${m.notes}`;
      }).join('<br>');
      return `<strong>à¤²à¤‚à¤¬à¤¿à¤¤ à¤¦à¤µà¤¾ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾à¤à¤‚ (${pendingMeds.length}):</strong><br>${list}`;
    }

    const list = pendingMeds.map(m => {
      const p = getPatient(m.pid);
      return `â€¢ <strong>${m.med}</strong> for ${p ? p.name : 'Patient'} (Due: ${m.due}) â€” ${m.notes}`;
    }).join('<br>');
    return `<strong>Pending Medication Reviews (${pendingMeds.length}):</strong><br>${list}`;
  }

  // 6. Patient / Attender Help
  if (isHelpQuery) {
    if (lang === 'ta') {
      return "à®‰à®™à¯à®•à®³à¯ à®šà¯†à®µà®¿à®²à®¿à®¯à®°à¯ <strong>à®šà¯†à®µà®¿à®²à®¿à®¯à®°à¯ à®ªà®¿à®°à®¿à®¯à®¾ à®¨à®¾à®¯à®°à¯</strong> (à®¨à®°à¯à®šà®¿à®™à¯ à®¨à®¿à®²à¯ˆà®¯à®®à¯ 3). à®ªà®Ÿà¯à®•à¯à®•à¯ˆ à®…à®´à¯ˆà®ªà¯à®ªà¯ à®ªà¯Šà®¤à¯à®¤à®¾à®©à¯ˆ à®…à®´à¯à®¤à¯à®¤à®²à®¾à®®à¯ à®…à®²à¯à®²à®¤à¯ à®‰à®¤à®µà®¿à®¯à®¾à®³à®°à¯ à®¤à®³à®®à¯ à®µà®´à®¿à®¯à®¾à®• à®•à¯‹à®°à®¿à®•à¯à®•à¯ˆà®¯à¯ˆ à®…à®©à¯à®ªà¯à®ªà®²à®¾à®®à¯.";
    } else if (lang === 'hi') {
      return "à¤†à¤ªà¤•à¥€ à¤‰à¤ªà¤¸à¥à¤¥à¤¿à¤¤ à¤¨à¤°à¥à¤¸ <strong>à¤¨à¤°à¥à¤¸ à¤ªà¥à¤°à¤¿à¤¯à¤¾ à¤¨à¤¾à¤¯à¤°</strong> (à¤¨à¤°à¥à¤¸à¤¿à¤‚à¤— à¤¸à¥à¤Ÿà¥‡à¤¶à¤¨ 3) à¤¹à¥ˆà¤‚à¥¤ à¤†à¤ª à¤¬à¥‡à¤¡à¤¸à¤¾à¤‡à¤¡ à¤•à¥‰à¤² à¤¬à¤Ÿà¤¨ à¤¦à¤¬à¤¾ à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚ à¤¯à¤¾ à¤¸à¥€à¤§à¥‡ à¤…à¤¨à¥à¤°à¥‹à¤§ à¤¦à¤°à¥à¤œ à¤•à¤° à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤";
    }
    return "You can press the physical bedside call button or submit a concern in your Attender Portal to notify the nursing station.";
  }

  // Default response
  if (lang === 'ta') {
    return "à®¨à®¾à®©à¯ à®¤à®±à¯à®ªà¯‹à®¤à¯ˆà®¯ à®µà®¾à®°à¯à®Ÿà¯ à®¤à®°à®µà¯ˆ à®†à®¯à¯à®µà¯ à®šà¯†à®¯à¯à®¤à¯à®³à¯à®³à¯‡à®©à¯. à®…à®³à®µà¯€à®Ÿà¯à®•à®³à¯ˆ à®šà¯à®°à¯à®•à¯à®•à®¿ à®•à¯‚à®±à®µà¯à®®à¯, à®†à®ªà®¤à¯à®¤à¯ à®¨à¯‹à®¯à®¾à®³à®¿à®•à®³à¯ˆà®ªà¯ à®ªà®Ÿà¯à®Ÿà®¿à®¯à®²à®¿à®Ÿà®µà¯à®®à¯ à®…à®²à¯à®²à®¤à¯ à®Žà®šà¯à®šà®°à®¿à®•à¯à®•à¯ˆà®•à®³à¯ˆ à®†à®¯à¯à®µà¯ à®šà¯†à®¯à¯à®¯à®µà¯à®®à¯ à®Žà®©à¯à®©à®¿à®Ÿà®®à¯ à®•à¯‡à®Ÿà¯à®•à®²à®¾à®®à¯.";
  } else if (lang === 'hi') {
    return "à¤®à¥ˆà¤‚à¤¨à¥‡ à¤µà¤¾à¤°à¥à¤¡ à¤°à¤¿à¤•à¥‰à¤°à¥à¤¡à¥à¤¸ à¤•à¥€ à¤œà¤¾à¤‚à¤š à¤•à¤° à¤²à¥€ à¤¹à¥ˆà¥¤ à¤†à¤ª à¤®à¥à¤à¤¸à¥‡ à¤µà¤¾à¤‡à¤Ÿà¤² à¤•à¤¾ à¤¸à¤¾à¤°à¤¾à¤‚à¤¶, à¤§à¥à¤¯à¤¾à¤¨ à¤¦à¥‡à¤¨à¥‡ à¤¯à¥‹à¤—à¥à¤¯ à¤®à¤°à¥€à¤œ à¤¯à¤¾ à¤…à¤²à¤°à¥à¤Ÿà¥à¤¸ à¤•à¥€ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤ªà¥‚à¤› à¤¸à¤•à¤¤à¥‡ à¤¹à¥ˆà¤‚à¥¤";
  }
  return "I have checked the current ward telemetry records. You can ask me to summarize vitals, list unreviewed concerns, or check which patients require attention.";
}


