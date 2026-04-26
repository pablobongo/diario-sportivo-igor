/* =============================================
   settings.js — Impostazioni v1.1
   ============================================= */

import { exportAllActivities, importActivities, clearAllActivities } from './db.js';
import { showToast } from './utils.js';
import { renderHome } from './home.js';
import { renderLog } from './log.js';

const DRIVE_FILENAME = 'diario-sportivo-igor-backup.json';
const SCOPES         = 'https://www.googleapis.com/auth/drive.file';
let   _accessToken   = null;

// Carica client ID salvato
window.GOOGLE_CLIENT_ID = localStorage.getItem('google_client_id') || '';

export function renderSettings() {
  const el = document.getElementById('view-settings');
  if (!el) return;

  const lastBackup  = localStorage.getItem('drive_last_backup');
  const lastBackupStr = lastBackup
    ? `Ultimo backup: ${new Date(lastBackup).toLocaleString('it-IT')}`
    : 'Nessun backup ancora effettuato';

  el.innerHTML = `
    <div class="section-header mb-16">
      <span class="section-title">Impostazioni</span>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Profilo</div>
      <div class="card" style="padding:16px 18px">
        <div style="font-weight:700;font-family:var(--font-display);font-size:1.05rem">Igor</div>
        <div class="text-muted mt-8">Diario Sportivo Personale v1.1</div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Backup Google Drive</div>

      <div class="settings-item" onclick="backupToDrive()">
        <div>
          <div class="settings-item-label">Salva su Google Drive</div>
          <div class="settings-item-sub" id="drive-last-backup">${lastBackupStr}</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
        </svg>
      </div>

      <div class="settings-item" onclick="restoreFromDrive()">
        <div>
          <div class="settings-item-label">Ripristina da Google Drive</div>
          <div class="settings-item-sub">Scarica e importa l'ultimo backup</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="8 16 12 20 16 16"/><line x1="12" y1="20" x2="12" y2="11"/>
          <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3"/>
        </svg>
      </div>

      <div class="settings-item" onclick="showDriveSetupInstructions()">
        <div>
          <div class="settings-item-label">Configura Client ID Google</div>
          <div class="settings-item-sub">${window.GOOGLE_CLIENT_ID ? '✅ Configurato' : '⚠️ Non configurato'}</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </div>

      <div id="drive-status" style="padding:8px 16px;font-size:0.8rem;color:var(--muted);display:none"></div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Dati locali</div>
      <div class="settings-item" onclick="exportJSON()">
        <div>
          <div class="settings-item-label">Esporta dati (JSON)</div>
          <div class="settings-item-sub">Scarica backup sul dispositivo</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </div>
      <div class="settings-item" onclick="importJSONTrigger()">
        <div>
          <div class="settings-item-label">Importa dati (JSON)</div>
          <div class="settings-item-sub">Ripristina da backup locale</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </div>
      <input type="file" id="import-file-input" accept=".json" style="display:none" onchange="importJSONFile(this)">
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Export PDF</div>
      <div class="settings-item" onclick="exportPDF('month')">
        <div>
          <div class="settings-item-label">PDF mese corrente</div>
          <div class="settings-item-sub">Report del mese in corso</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
      <div class="settings-item" onclick="exportPDF('all')">
        <div>
          <div class="settings-item-label">PDF completo</div>
          <div class="settings-item-sub">Tutte le attività registrate</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">App</div>
      <div class="settings-item" id="install-item" style="display:none" onclick="triggerInstall()">
        <div>
          <div class="settings-item-label">Installa app</div>
          <div class="settings-item-sub">Aggiungi alla schermata Home</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20"/></svg>
      </div>
      <div class="settings-item" style="cursor:default">
        <div>
          <div class="settings-item-label">Service Worker</div>
          <div class="settings-item-sub" id="sw-status">Controllo…</div>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title" style="color:#ef4444">Zona pericolosa</div>
      <div class="settings-item" onclick="clearData()" style="border-color:#ef444433">
        <div>
          <div class="settings-item-label" style="color:#ef4444">Cancella tutti i dati</div>
          <div class="settings-item-sub">Azione irreversibile</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
      </div>
    </div>

    <div class="text-center text-muted mt-24" style="font-size:0.75rem">
      Diario Sportivo di Igor · v1.1.0
    </div>
  `;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      const s = document.getElementById('sw-status');
      if (s) s.textContent = '✅ Attivo — offline disponibile';
    });
  }
  if (window._deferredInstall) {
    const item = document.getElementById('install-item');
    if (item) item.style.display = 'flex';
  }
}

/* ---- GOOGLE DRIVE ---- */

function loadGsi() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function getAccessToken() {
  if (_accessToken) return _accessToken;
  const clientId = window.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Client ID non configurato');
  await loadGsi();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) return reject(new Error(resp.error));
        _accessToken = resp.access_token;
        setTimeout(() => { _accessToken = null; }, (resp.expires_in - 60) * 1000);
        resolve(_accessToken);
      },
    });
    client.requestAccessToken();
  });
}

async function driveUpload(jsonStr) {
  const token = await getAccessToken();
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILENAME}' and trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const { files } = await searchRes.json();
  const existingId = files?.[0]?.id;

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name: DRIVE_FILENAME, mimeType: 'application/json' })], { type: 'application/json' }));
  form.append('file', new Blob([jsonStr], { type: 'application/json' }));

  const url    = existingId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  const res = await fetch(url, {
    method: existingId ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Drive error ${res.status}`);
  return res.json();
}

async function driveDownload() {
  const token = await getAccessToken();
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='${DRIVE_FILENAME}' and trashed=false&fields=files(id)`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const { files } = await searchRes.json();
  if (!files?.length) throw new Error('Nessun backup trovato su Drive');
  const dlRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${files[0].id}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!dlRes.ok) throw new Error(`Download error ${dlRes.status}`);
  return dlRes.text();
}

window.backupToDrive = async function() {
  if (!window.GOOGLE_CLIENT_ID) { showDriveSetupInstructions(); return; }
  showDriveStatus('Connessione a Google Drive…', 'info');
  try {
    const data = await exportAllActivities();
    await driveUpload(JSON.stringify(data, null, 2));
    const now = new Date().toISOString();
    localStorage.setItem('drive_last_backup', now);
    const el = document.getElementById('drive-last-backup');
    if (el) el.textContent = `Ultimo backup: ${new Date(now).toLocaleString('it-IT')}`;
    showDriveStatus(`✅ ${data.length} attività salvate su Drive`, 'ok');
    showToast('Backup Drive completato ✓');
  } catch (e) {
    showDriveStatus(`❌ ${e.message}`, 'error');
    showToast('Errore backup Drive');
  }
};

window.restoreFromDrive = async function() {
  if (!window.GOOGLE_CLIENT_ID) { showDriveSetupInstructions(); return; }
  if (!window.confirm('Ripristinare da Drive? I dati attuali verranno sostituiti.')) return;
  showDriveStatus('Download da Drive…', 'info');
  try {
    const jsonStr = await driveDownload();
    const data    = JSON.parse(jsonStr);
    if (!Array.isArray(data)) throw new Error('Formato non valido');
    await clearAllActivities();
    const count = await importActivities(data);
    showDriveStatus(`✅ ${count} attività ripristinate`, 'ok');
    showToast(`${count} attività ripristinate ✓`);
    await renderHome();
  } catch (e) {
    showDriveStatus(`❌ ${e.message}`, 'error');
    showToast('Errore ripristino Drive');
  }
};

function showDriveStatus(msg, type) {
  const el = document.getElementById('drive-status');
  if (!el) return;
  el.style.display = 'block';
  el.textContent   = msg;
  el.style.color   = type === 'ok' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warn' ? '#f59e0b' : 'var(--muted)';
}

window.showDriveSetupInstructions = function() {
  let overlay = document.getElementById('drive-setup-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id        = 'drive-setup-modal';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Configura Google Drive</div>
      <p style="font-size:0.88rem;color:var(--text2);line-height:1.7;margin-bottom:14px">
        Serve un <strong>Google OAuth Client ID</strong> gratuito. Segui questi passi:
      </p>
      <ol style="font-size:0.83rem;color:var(--text2);line-height:2;padding-left:18px;margin-bottom:16px">
        <li>Vai su <strong>console.cloud.google.com</strong></li>
        <li>Crea progetto → abilita <strong>Google Drive API</strong></li>
        <li>Credenziali → OAuth 2.0 → tipo <strong>Web application</strong></li>
        <li>Origin autorizzata: <code style="background:var(--card2);padding:2px 6px;border-radius:4px;font-size:0.8rem">https://pablobongo.github.io</code></li>
        <li>Copia il <strong>Client ID</strong> e incollalo qui sotto</li>
      </ol>
      <div class="form-group">
        <label class="form-label">Client ID Google</label>
        <input type="text" class="form-input" id="google-client-id-input" placeholder="123456789-xxx.apps.googleusercontent.com" value="${window.GOOGLE_CLIENT_ID || ''}">
      </div>
      <div class="flex-between" style="gap:12px;margin-top:20px">
        <button class="btn btn-ghost" style="flex:1" onclick="document.getElementById('drive-setup-modal').classList.remove('open')">Annulla</button>
        <button class="btn btn-primary" style="flex:2" onclick="saveGoogleClientId()">Salva</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');
  overlay.onclick = (e) => { if (e.target === overlay) overlay.classList.remove('open'); };
};

window.saveGoogleClientId = function() {
  const val = document.getElementById('google-client-id-input')?.value.trim();
  if (!val) { showToast('Inserisci un Client ID valido'); return; }
  localStorage.setItem('google_client_id', val);
  window.GOOGLE_CLIENT_ID = val;
  _accessToken = null;
  document.getElementById('drive-setup-modal')?.classList.remove('open');
  showToast('Client ID salvato ✓');
  renderSettings();
};

/* ---- JSON LOCALE ---- */
window.exportJSON = async function() {
  const data = await exportAllActivities();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `diario-sportivo-igor-${new Date().toISOString().slice(0,10)}.json`;
  a.click(); URL.revokeObjectURL(url);
  showToast('Backup esportato ✓');
};

window.importJSONTrigger = function() { document.getElementById('import-file-input')?.click(); };

window.importJSONFile = async function(input) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error();
    const count = await importActivities(data);
    showToast(`${count} attività importate ✓`);
    await renderHome(); await renderLog();
  } catch { showToast('Errore nel file JSON'); }
  input.value = '';
};

window.clearData = async function() {
  if (!window.confirm('ATTENZIONE: cancellare TUTTI i dati? Irreversibile.')) return;
  if (!window.confirm('Sei sicuro?')) return;
  await clearAllActivities();
  showToast('Dati eliminati');
  await renderHome(); await renderLog();
};

window.triggerInstall = async function() {
  if (!window._deferredInstall) return;
  window._deferredInstall.prompt();
  const r = await window._deferredInstall.userChoice;
  if (r.outcome === 'accepted') {
    window._deferredInstall = null;
    showToast('App installata ✓');
    document.getElementById('install-item').style.display = 'none';
  }
};

window.exportPDF = async function(type) {
  const { getAllActivities, getActivitiesByDateRange } = await import('./db.js');
  const { activitySummary, formatDate, getActivity } = await import('./activities.js');
  let activities;
  if (type === 'month') {
    const now  = new Date();
    const from = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const to   = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
    activities = await getActivitiesByDateRange(from, to);
  } else { activities = await getAllActivities(); }
  if (!activities.length) { showToast('Nessuna attività'); return; }
  const label = type === 'month'
    ? new Date().toLocaleDateString('it-IT', { month:'long', year:'numeric' })
    : 'Storico completo';
  const rows = activities.map(a => {
    const act = getActivity(a.activityType);
    return `<tr><td>${formatDate(a.date)}</td><td>${act?.label||a.activityType}</td><td>${a.durationMinutes?a.durationMinutes+' min':'—'}</td><td>${a.distanceKm?a.distanceKm+' km':'—'}</td><td>${(a.muscleGroups||[]).join(', ')||'—'}</td><td>${a.notes||'—'}</td></tr>`;
  }).join('');
  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Diario Sportivo Igor — ${label}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{color:#0d6b6f;margin-bottom:4px}.sub{color:#666;margin-bottom:24px;font-size:.9rem}table{width:100%;border-collapse:collapse;font-size:.88rem}th{background:#0d6b6f;color:white;padding:8px 12px;text-align:left}td{padding:7px 12px;border-bottom:1px solid #eee}tr:nth-child(even) td{background:#f9f9f9}@media print{body{padding:0}}</style></head><body><h1>Diario Sportivo di Igor</h1><div class="sub">${label} · ${activities.length} attività · ${new Date().toLocaleDateString('it-IT')}</div><table><thead><tr><th>Data</th><th>Sport</th><th>Durata</th><th>Km</th><th>Muscoli</th><th>Note</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
};
