/* =============================================
   settings.js — Impostazioni
   ============================================= */

import { exportAllActivities, importActivities, clearAllActivities } from './db.js';
import { showToast } from './utils.js';
import { renderHome } from './home.js';
import { renderLog } from './log.js';

export function renderSettings() {
  const el = document.getElementById('view-settings');
  if (!el) return;

  el.innerHTML = `
    <div class="section-header mb-16">
      <span class="section-title">Impostazioni</span>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Profilo</div>
      <div class="card" style="padding:16px 18px">
        <div style="font-weight:700;font-family:var(--font-display);font-size:1.05rem">Igor</div>
        <div class="text-muted mt-8">Diario Sportivo Personale v1.0</div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">Dati</div>

      <div class="settings-item" onclick="exportJSON()">
        <div>
          <div class="settings-item-label">Esporta dati (JSON)</div>
          <div class="settings-item-sub">Backup completo di tutte le attività</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      </div>

      <div class="settings-item" onclick="importJSONTrigger()">
        <div>
          <div class="settings-item-label">Importa dati (JSON)</div>
          <div class="settings-item-sub">Ripristina da backup precedente</div>
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
          <div class="settings-item-sub">Report attività del mese in corso</div>
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
          <div class="settings-item-sub" id="sw-status">Controllo in corso…</div>
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
      Diario Sportivo di Igor · v1.0.0
    </div>
  `;

  // SW status
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(() => {
      const el = document.getElementById('sw-status');
      if (el) el.textContent = '✅ Attivo — modalità offline disponibile';
    });
  }

  // Install btn
  if (window._deferredInstall) {
    const item = document.getElementById('install-item');
    if (item) item.style.display = 'flex';
  }
}

window.exportJSON = async function() {
  const data = await exportAllActivities();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `diario-sportivo-igor-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Backup esportato ✓');
};

window.importJSONTrigger = function() {
  document.getElementById('import-file-input')?.click();
};

window.importJSONFile = async function(input) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!Array.isArray(data)) throw new Error('Formato non valido');
    const count = await importActivities(data);
    showToast(`${count} attività importate ✓`);
    await renderHome();
    await renderLog();
  } catch (e) {
    showToast('Errore nel file JSON');
  }
  input.value = '';
};

window.clearData = async function() {
  if (!window.confirm('ATTENZIONE: cancellare TUTTI i dati? Questa azione è irreversibile.')) return;
  if (!window.confirm('Sei sicuro? Non si può annullare.')) return;
  await clearAllActivities();
  showToast('Tutti i dati eliminati');
  await renderHome();
  await renderLog();
};

window.triggerInstall = async function() {
  if (!window._deferredInstall) return;
  window._deferredInstall.prompt();
  const result = await window._deferredInstall.userChoice;
  if (result.outcome === 'accepted') {
    window._deferredInstall = null;
    showToast('App installata ✓');
    document.getElementById('install-item').style.display = 'none';
  }
};

// PDF export (semplice, via print)
window.exportPDF = async function(type) {
  const { getAllActivities, getActivitiesByDateRange } = await import('./db.js');
  const { activitySummary, formatDate, getActivity } = await import('./activities.js');

  let activities;
  if (type === 'month') {
    const now   = new Date();
    const from  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
    const to    = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().slice(0,10);
    activities = await getActivitiesByDateRange(from, to);
  } else {
    activities = await getAllActivities();
  }

  if (!activities.length) { showToast('Nessuna attività da esportare'); return; }

  const label = type === 'month'
    ? new Date().toLocaleDateString('it-IT', { month:'long', year:'numeric' })
    : 'Storico completo';

  const rows = activities.map(a => {
    const act = getActivity(a.activityType);
    return `<tr>
      <td>${formatDate(a.date)}</td>
      <td>${act?.label || a.activityType}</td>
      <td>${a.durationMinutes ? a.durationMinutes + ' min' : '—'}</td>
      <td>${a.distanceKm ? a.distanceKm + ' km' : '—'}</td>
      <td>${(a.muscleGroups || []).join(', ') || '—'}</td>
      <td>${a.notes || '—'}</td>
    </tr>`;
  }).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Diario Sportivo Igor — ${label}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
      h1 { color: #0d6b6f; margin-bottom: 4px; }
      .sub { color: #666; margin-bottom: 24px; font-size: 0.9rem; }
      table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
      th { background: #0d6b6f; color: white; padding: 8px 12px; text-align: left; }
      td { padding: 7px 12px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) td { background: #f9f9f9; }
      @media print { body { padding: 0; } }
    </style>
  </head><body>
    <h1>Diario Sportivo di Igor</h1>
    <div class="sub">${label} · ${activities.length} attività · Generato il ${new Date().toLocaleDateString('it-IT')}</div>
    <table>
      <thead><tr><th>Data</th><th>Sport</th><th>Durata</th><th>Km</th><th>Muscoli</th><th>Note</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 500);
};
