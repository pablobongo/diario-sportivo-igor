/* =============================================
   home.js — Home view
   ============================================= */

import { getActivitiesByDateRange, getAllActivities } from './db.js';
import { MUSCLE_GROUPS, ACTIVITIES, SPORT_ICONS, activitySummary, formatDate, getActivity } from './activities.js';
import { lastNDays, currentWeekRange } from './utils.js';
import { navigateTo } from './utils.js';

export async function renderHome() {
  const el = document.getElementById('view-home');
  if (!el) return;

  const { from: w7from, to: w7to } = lastNDays(7);
  const week = currentWeekRange();

  const [recent, week7] = await Promise.all([
    getAllActivities(),
    getActivitiesByDateRange(w7from, w7to),
  ]);

  // KPI
  const totalMin   = week7.reduce((s, a) => s + (a.durationMinutes || 0), 0);
  const totalKm    = week7.reduce((s, a) => s + (a.distanceKm || 0), 0);
  const gymSess    = week7.filter(a => a.activityType === 'palestra').length;

  // Suggerimento muscoli
  const weekActivities = await getActivitiesByDateRange(week.from, week.to);
  const muscleCount = {};
  weekActivities.forEach(a => {
    if (a.muscleGroups) a.muscleGroups.forEach(m => {
      muscleCount[m] = (muscleCount[m] || 0) + 1;
    });
  });

  const muscleStatus = MUSCLE_GROUPS
    .filter(m => m.minPerWeek > 0)
    .map(m => ({
      ...m,
      count: muscleCount[m.key] || 0,
      status: (muscleCount[m.key] || 0) >= m.minPerWeek ? 'ok'
              : (muscleCount[m.key] || 0) > 0 ? 'warn' : 'crit',
    }));

  const missing = muscleStatus.filter(m => m.status === 'crit');
  const partial = muscleStatus.filter(m => m.status === 'warn');

  let suggestionText = '✅ Ottimo! Tutti i gruppi muscolari coperti questa settimana.';
  if (missing.length) {
    suggestionText = `Oggi allena: <strong>${missing.slice(0, 3).map(m => m.label).join(', ')}</strong>`;
  } else if (partial.length) {
    suggestionText = `Quasi completo — mancano sessioni per: <strong>${partial.map(m => m.label).join(', ')}</strong>`;
  }

  // Ultime 5 attività
  const last5 = recent.slice(0, 5);

  el.innerHTML = `
    <div class="suggestion-box">
      <div class="suggestion-title">💡 Suggerimento di oggi</div>
      <div class="suggestion-text">${suggestionText}</div>
      <div class="muscle-status-list">
        ${muscleStatus.map(m => `
          <span class="muscle-status-chip muscle-status-${m.status}">${m.label} ${m.count}/${m.minPerWeek}</span>
        `).join('')}
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card accent-card">
        <div class="kpi-value">${week7.length}</div>
        <div class="kpi-label">Attività (7 giorni)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${totalMin > 0 ? Math.round(totalMin) : '—'}</div>
        <div class="kpi-label">Minuti totali</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${totalKm > 0 ? totalKm.toFixed(1) : '—'}</div>
        <div class="kpi-label">Km percorsi</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${gymSess}</div>
        <div class="kpi-label">Sessioni palestra</div>
      </div>
    </div>

    <div class="section-header mt-16">
      <span class="section-title">Ultime attività</span>
      <button class="btn btn-sm btn-ghost" onclick="navigateTo('log')">Vedi tutto</button>
    </div>

    <div class="activity-list" id="home-recent">
      ${last5.length ? last5.map(a => renderActivityItem(a)).join('') : `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M2 12h20"/></svg>
          <p>Nessuna attività registrata.<br>Inizia ora!</p>
        </div>
      `}
    </div>


  `;
}

function renderActivityItem(a) {
  const act = getActivity(a.activityType);
  const icon = SPORT_ICONS[a.activityType] || SPORT_ICONS.palestra;
  const summary = activitySummary(a);
  return `
    <div class="activity-item">
      <div class="activity-icon" style="background:${act?.color}22; color:${act?.color}">${icon}</div>
      <div class="activity-body">
        <div class="activity-title">${act?.label || a.activityType}</div>
        <div class="activity-meta">${formatDate(a.date)}${summary ? ' · ' + summary : ''}</div>
      </div>
    </div>
  `;
}
