/* =============================================
   register.js — Registra attività
   ============================================= */

import { saveActivity } from './db.js';
import { ACTIVITIES, MUSCLE_GROUPS, GYM_MODES, INTENSITY_LEVELS, SPORT_ICONS, generateId, todayISO } from './activities.js';
import { showToast, navigateTo } from './utils.js';
import { renderHome } from './home.js';

let selectedSport = null;
let selectedMuscles = [];

export function renderRegister() {
  selectedSport   = null;
  selectedMuscles = [];

  const el = document.getElementById('view-register');
  if (!el) return;

  el.innerHTML = `
    <div id="reg-sport-select" class="form-section active">
      <div class="section-header mb-16">
        <span class="section-title">Quale sport?</span>
      </div>
      <div class="sport-grid">
        ${ACTIVITIES.map(a => `
          <button class="sport-btn" data-sport="${a.key}" onclick="selectSport('${a.key}')">
            <div class="sport-icon" style="background:${a.color}22; color:${a.color}">
              ${SPORT_ICONS[a.key] || ''}
            </div>
            <span class="sport-label">${a.label}</span>
          </button>
        `).join('')}
      </div>
    </div>

    <div id="reg-form" class="form-section">
      <div class="flex-between mb-16">
        <button class="btn btn-sm btn-ghost" onclick="backToSportSelect()">← Indietro</button>
        <span class="section-title" id="reg-sport-title"></span>
      </div>
      <div id="reg-form-fields"></div>
      <div class="flex-between mt-24" style="gap:12px">
        <button class="btn btn-ghost" style="flex:1" onclick="backToSportSelect()">Annulla</button>
        <button class="btn btn-primary" style="flex:2" onclick="submitActivity()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
          Salva
        </button>
      </div>
    </div>
  `;
}

window.selectSport = function(key) {
  selectedSport   = key;
  selectedMuscles = [];

  const act = ACTIVITIES.find(a => a.key === key);
  if (!act) return;

  document.getElementById('reg-sport-select').classList.remove('active');
  document.getElementById('reg-form').classList.add('active');
  document.getElementById('reg-sport-title').textContent = act.label;

  buildForm(act);
};

window.backToSportSelect = function() {
  document.getElementById('reg-form').classList.remove('active');
  document.getElementById('reg-sport-select').classList.add('active');
  selectedSport   = null;
  selectedMuscles = [];
};

function buildForm(act) {
  const container = document.getElementById('reg-form-fields');
  let html = '';

  // Data
  html += `
    <div class="form-group">
      <label class="form-label">Data</label>
      <input type="date" class="form-input" id="f-date" value="${todayISO()}">
    </div>
  `;

  // Palestra: gym mode
  if (act.fields.includes('gymMode')) {
    html += `
      <div class="form-group">
        <label class="form-label">Tipo sessione</label>
        <select class="form-select" id="f-gymMode" onchange="onGymModeChange()">
          ${GYM_MODES.map(m => `<option value="${m.key}">${m.label}</option>`).join('')}
        </select>
      </div>
    `;
  }

  // Gruppi muscolari
  if (act.fields.includes('muscleGroups')) {
    html += `
      <div class="form-group" id="f-group-muscleGroups">
        <label class="form-label">Gruppi muscolari</label>
        <div class="muscle-grid">
          ${MUSCLE_GROUPS.map(m => `
            <div class="muscle-chip" data-muscle="${m.key}" onclick="toggleMuscle('${m.key}', this)">${m.label}</div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Durata
  if (act.fields.includes('durationMinutes')) {
    html += `
      <div class="form-group">
        <label class="form-label">Durata (minuti)</label>
        <input type="number" class="form-input" id="f-durationMinutes" min="1" max="600" placeholder="es. 60">
      </div>
    `;
  }

  // Distanza e cardio minuti
  const hasKm = act.fields.includes('distanceKm');
  const hasCardioMin = act.fields.includes('cardioMinutes');

  if (hasKm || hasCardioMin) {
    html += `<div class="form-row">`;
    if (hasKm) {
      html += `
        <div class="form-group">
          <label class="form-label">Distanza (km)</label>
          <input type="number" class="form-input" id="f-distanceKm" min="0" step="0.1" placeholder="es. 5.5">
        </div>
      `;
    }
    if (hasCardioMin) {
      html += `
        <div class="form-group" id="f-group-cardioMinutes" style="display:none">
          <label class="form-label">Min. cardio</label>
          <input type="number" class="form-input" id="f-cardioMinutes" min="0" placeholder="es. 20">
        </div>
      `;
    }
    html += `</div>`;
  }

  // Dislivello
  if (act.fields.includes('elevationGain')) {
    html += `
      <div class="form-group">
        <label class="form-label">Dislivello (m) — opzionale</label>
        <input type="number" class="form-input" id="f-elevationGain" min="0" placeholder="es. 300">
      </div>
    `;
  }

  // Intensità
  if (act.fields.includes('intensity')) {
    html += `
      <div class="form-group">
        <label class="form-label">Intensità</label>
        <select class="form-select" id="f-intensity">
          <option value="">— non specificata —</option>
          ${INTENSITY_LEVELS.map(i => `<option value="${i.key}">${i.label}</option>`).join('')}
        </select>
      </div>
    `;
  }

  // Note
  html += `
    <div class="form-group">
      <label class="form-label">Note — opzionale</label>
      <textarea class="form-textarea" id="f-notes" placeholder="Sensazioni, dettagli…"></textarea>
    </div>
  `;

  container.innerHTML = html;
}

window.onGymModeChange = function() {
  const mode = document.getElementById('f-gymMode')?.value;
  const cardioGroup   = document.getElementById('f-group-cardioMinutes');
  const muscleGroup   = document.getElementById('f-group-muscleGroups');
  if (cardioGroup) cardioGroup.style.display = (mode === 'misto') ? 'block' : 'none';
  if (muscleGroup) muscleGroup.style.display = (mode === 'cardio') ? 'none' : 'block';
};

window.toggleMuscle = function(key, el) {
  const idx = selectedMuscles.indexOf(key);
  if (idx === -1) {
    selectedMuscles.push(key);
    el.classList.add('selected');
  } else {
    selectedMuscles.splice(idx, 1);
    el.classList.remove('selected');
  }
};

window.submitActivity = async function() {
  const act = ACTIVITIES.find(a => a.key === selectedSport);
  if (!act) return;

  const date = document.getElementById('f-date')?.value;
  if (!date) { showToast('Inserisci la data'); return; }

  // Palestra: verifica gruppi muscolari
  const gymMode = document.getElementById('f-gymMode')?.value;
  if (act.key === 'palestra' && gymMode !== 'cardio' && selectedMuscles.length === 0) {
    showToast('Seleziona almeno un gruppo muscolare');
    return;
  }

  const activity = {
    id:           generateId(),
    activityType: selectedSport,
    date,
    gymMode:      document.getElementById('f-gymMode')?.value || null,
    muscleGroups: selectedMuscles.length ? [...selectedMuscles] : null,
    durationMinutes: parseFloat(document.getElementById('f-durationMinutes')?.value) || null,
    distanceKm:      parseFloat(document.getElementById('f-distanceKm')?.value) || null,
    cardioMinutes:   parseFloat(document.getElementById('f-cardioMinutes')?.value) || null,
    elevationGain:   parseFloat(document.getElementById('f-elevationGain')?.value) || null,
    intensity:    document.getElementById('f-intensity')?.value || null,
    notes:        document.getElementById('f-notes')?.value.trim() || null,
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
    deleted:      false,
  };

  await saveActivity(activity);
  showToast(`${act.label} salvata ✓`);
  renderRegister();
  await renderHome();
  navigateTo('home');
};
