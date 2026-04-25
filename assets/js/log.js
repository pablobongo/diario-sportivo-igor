/* =============================================
   log.js — Log attività
   ============================================= */

import { getAllActivities, deleteActivity, saveActivity } from './db.js';
import { ACTIVITIES, SPORT_ICONS, activitySummary, formatDate, getActivity, generateId, todayISO, MUSCLE_GROUPS, GYM_MODES, INTENSITY_LEVELS } from './activities.js';
import { showToast } from './utils.js';
import { renderHome } from './home.js';

let allActivities = [];
let filterSport   = 'all';
let searchQuery   = '';

export async function renderLog() {
  const el = document.getElementById('view-log');
  if (!el) return;

  allActivities = await getAllActivities();

  el.innerHTML = `
    <div class="section-header mb-16">
      <span class="section-title">Log attività</span>
      <span class="text-muted">${allActivities.length} totali</span>
    </div>

    <div class="form-group">
      <input type="search" class="form-input" id="log-search" placeholder="Cerca…" oninput="logSearch(this.value)">
    </div>

    <div class="filter-row" id="log-filters">
      <div class="filter-chip active" data-sport="all" onclick="logFilterSport('all', this)">Tutti</div>
      ${ACTIVITIES.map(a => `
        <div class="filter-chip" data-sport="${a.key}" onclick="logFilterSport('${a.key}', this)">${a.label}</div>
      `).join('')}
    </div>

    <div class="activity-list" id="log-list"></div>
  `;

  renderLogList();
}

function renderLogList() {
  const container = document.getElementById('log-list');
  if (!container) return;

  let items = allActivities;
  if (filterSport !== 'all') items = items.filter(a => a.activityType === filterSport);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(a =>
      a.activityType.includes(q) ||
      (a.notes || '').toLowerCase().includes(q) ||
      (a.muscleGroups || []).some(m => m.includes(q)) ||
      formatDate(a.date).toLowerCase().includes(q)
    );
  }

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
        <p>Nessuna attività trovata.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(a => {
    const act     = getActivity(a.activityType);
    const icon    = SPORT_ICONS[a.activityType] || '';
    const summary = activitySummary(a);
    return `
      <div class="activity-item" id="log-item-${a.id}">
        <div class="activity-icon" style="background:${act?.color}22; color:${act?.color}">${icon}</div>
        <div class="activity-body">
          <div class="activity-title">${act?.label || a.activityType}</div>
          <div class="activity-meta">${formatDate(a.date)}${summary ? ' · ' + summary : ''}</div>
          ${a.notes ? `<div class="activity-meta" style="font-style:italic">"${a.notes}"</div>` : ''}
        </div>
        <div class="activity-actions">
          <button class="icon-btn" onclick="editActivity('${a.id}')" title="Modifica">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn" onclick="deleteActivityUI('${a.id}')" title="Elimina" style="color:#ef4444">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.logSearch = function(val) {
  searchQuery = val;
  renderLogList();
};

window.logFilterSport = function(sport, el) {
  filterSport = sport;
  document.querySelectorAll('#log-filters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  renderLogList();
};

window.deleteActivityUI = async function(id) {
  if (!window.confirm('Eliminare questa attività?')) return;
  await deleteActivity(id);
  allActivities = allActivities.filter(a => a.id !== id);
  renderLogList();
  await renderHome();
  showToast('Attività eliminata');
};

window.editActivity = async function(id) {
  const a = allActivities.find(x => x.id === id);
  if (!a) return;
  openEditModal(a);
};

function openEditModal(a) {
  let overlay = document.getElementById('edit-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'edit-modal';
    overlay.className = 'modal-overlay';
    document.body.appendChild(overlay);
  }

  const act = getActivity(a.activityType);

  overlay.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <div class="modal-title">Modifica ${act?.label || a.activityType}</div>

      <div class="form-group">
        <label class="form-label">Data</label>
        <input type="date" class="form-input" id="edit-date" value="${a.date}">
      </div>

      ${act?.fields.includes('durationMinutes') ? `
      <div class="form-group">
        <label class="form-label">Durata (min)</label>
        <input type="number" class="form-input" id="edit-duration" value="${a.durationMinutes || ''}">
      </div>` : ''}

      ${act?.fields.includes('distanceKm') ? `
      <div class="form-group">
        <label class="form-label">Distanza (km)</label>
        <input type="number" class="form-input" id="edit-km" step="0.1" value="${a.distanceKm || ''}">
      </div>` : ''}

      ${act?.fields.includes('muscleGroups') ? `
      <div class="form-group">
        <label class="form-label">Gruppi muscolari</label>
        <div class="muscle-grid" id="edit-muscles">
          ${MUSCLE_GROUPS.map(m => `
            <div class="muscle-chip ${(a.muscleGroups || []).includes(m.key) ? 'selected' : ''}"
                 data-muscle="${m.key}"
                 onclick="this.classList.toggle('selected')">${m.label}</div>
          `).join('')}
        </div>
      </div>` : ''}

      ${act?.fields.includes('intensity') ? `
      <div class="form-group">
        <label class="form-label">Intensità</label>
        <select class="form-select" id="edit-intensity">
          <option value="">— non specificata —</option>
          ${INTENSITY_LEVELS.map(i => `<option value="${i.key}" ${a.intensity === i.key ? 'selected' : ''}>${i.label}</option>`).join('')}
        </select>
      </div>` : ''}

      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea class="form-textarea" id="edit-notes">${a.notes || ''}</textarea>
      </div>

      <div class="flex-between" style="gap:12px;margin-top:20px">
        <button class="btn btn-ghost" style="flex:1" onclick="closeEditModal()">Annulla</button>
        <button class="btn btn-primary" style="flex:2" onclick="saveEdit('${a.id}')">Salva modifiche</button>
      </div>
    </div>
  `;

  overlay.classList.add('open');
  overlay.onclick = (e) => { if (e.target === overlay) closeEditModal(); };
}

window.closeEditModal = function() {
  const overlay = document.getElementById('edit-modal');
  if (overlay) overlay.classList.remove('open');
};

window.saveEdit = async function(id) {
  const a = allActivities.find(x => x.id === id);
  if (!a) return;

  a.date          = document.getElementById('edit-date')?.value || a.date;
  a.durationMinutes = parseFloat(document.getElementById('edit-duration')?.value) || null;
  a.distanceKm    = parseFloat(document.getElementById('edit-km')?.value) || null;
  a.intensity     = document.getElementById('edit-intensity')?.value || null;
  a.notes         = document.getElementById('edit-notes')?.value.trim() || null;
  a.updatedAt     = new Date().toISOString();

  // muscoli
  const chips = document.querySelectorAll('#edit-muscles .muscle-chip.selected');
  if (chips.length) a.muscleGroups = [...chips].map(c => c.dataset.muscle);

  await saveActivity(a);
  closeEditModal();
  renderLogList();
  await renderHome();
  showToast('Attività aggiornata ✓');
};
