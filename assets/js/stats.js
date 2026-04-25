/* =============================================
   stats.js — Statistiche
   ============================================= */

import { getActivitiesByDateRange, getAllActivities } from './db.js';
import { ACTIVITIES, MUSCLE_GROUPS, activitySummary, formatDate } from './activities.js';
import { lastNDays } from './utils.js';

let currentPeriod = '30';

export async function renderStats() {
  const el = document.getElementById('view-stats');
  if (!el) return;

  el.innerHTML = `
    <div class="section-header mb-16">
      <span class="section-title">Statistiche</span>
    </div>

    <div class="filter-row" id="stats-period-filters">
      <div class="filter-chip ${currentPeriod==='7'?'active':''}"   onclick="statsPeriod('7',this)">7 giorni</div>
      <div class="filter-chip ${currentPeriod==='30'?'active':''}"  onclick="statsPeriod('30',this)">30 giorni</div>
      <div class="filter-chip ${currentPeriod==='90'?'active':''}"  onclick="statsPeriod('90',this)">3 mesi</div>
      <div class="filter-chip ${currentPeriod==='365'?'active':''}" onclick="statsPeriod('365',this)">Anno</div>
      <div class="filter-chip ${currentPeriod==='all'?'active':''}" onclick="statsPeriod('all',this)">Tutto</div>
    </div>

    <div id="stats-content"></div>
  `;

  await loadStatsContent();
}

async function loadStatsContent() {
  const container = document.getElementById('stats-content');
  if (!container) return;

  let activities;
  if (currentPeriod === 'all') {
    activities = await getAllActivities();
  } else {
    const { from, to } = lastNDays(Number(currentPeriod));
    activities = await getActivitiesByDateRange(from, to);
  }

  if (!activities.length) {
    container.innerHTML = `<div class="empty-state"><p>Nessuna attività nel periodo selezionato.</p></div>`;
    return;
  }

  // KPI
  const totalMin = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);
  const totalKm  = activities.reduce((s, a) => s + (a.distanceKm || 0), 0);
  const gymSess  = activities.filter(a => a.activityType === 'palestra').length;

  // Sport più frequente
  const sportCount = {};
  activities.forEach(a => { sportCount[a.activityType] = (sportCount[a.activityType] || 0) + 1; });
  const topSport = Object.entries(sportCount).sort((a,b) => b[1]-a[1])[0];
  const topSportLabel = ACTIVITIES.find(a => a.key === topSport?.[0])?.label || topSport?.[0] || '—';

  // Giorno settimana più attivo
  const dowCount = [0,0,0,0,0,0,0];
  const dowLabels = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  activities.forEach(a => {
    if (a.date) {
      const [y,m,d] = a.date.split('-').map(Number);
      const dow = new Date(y, m-1, d).getDay();
      dowCount[dow]++;
    }
  });
  const topDow = dowCount.indexOf(Math.max(...dowCount));

  // Frequenza muscoli
  const muscleCount = {};
  activities.filter(a => a.activityType === 'palestra').forEach(a => {
    (a.muscleGroups || []).forEach(m => { muscleCount[m] = (muscleCount[m] || 0) + 1; });
  });

  // Attività per settimana (ultimi periodi)
  const weeklyData = buildWeeklyData(activities, currentPeriod === 'all' ? 52 : Math.min(Math.ceil(Number(currentPeriod)/7), 52));

  container.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card accent-card">
        <div class="kpi-value">${activities.length}</div>
        <div class="kpi-label">Attività totali</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${totalMin > 0 ? Math.round(totalMin) : '—'}</div>
        <div class="kpi-label">Minuti totali</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${totalKm > 0 ? totalKm.toFixed(1) : '—'}</div>
        <div class="kpi-label">Km totali</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-value">${gymSess}</div>
        <div class="kpi-label">Sessioni palestra</div>
      </div>
    </div>

    <div class="card mt-16">
      <div class="card-title">Sport più praticato</div>
      <div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">
        ${topSportLabel} <span style="color:var(--muted);font-size:0.85rem;font-weight:400">${topSport?.[1] || 0} sessioni</span>
      </div>
      <div class="mt-8" style="color:var(--muted);font-size:0.85rem">
        Giorno più attivo: <strong style="color:var(--text)">${dowLabels[topDow]}</strong>
      </div>
    </div>

    <div class="card mt-16">
      <div class="card-title">Attività per settimana</div>
      <div class="chart-wrap">
        <canvas id="chart-weekly"></canvas>
      </div>
    </div>

    <div class="card mt-16">
      <div class="card-title">Distribuzione sport</div>
      <div class="chart-wrap" style="height:220px">
        <canvas id="chart-sport"></canvas>
      </div>
    </div>

    ${gymSess > 0 ? `
    <div class="card mt-16">
      <div class="card-title">Frequenza gruppi muscolari</div>
      <div class="chart-wrap" style="height:${Math.max(160, MUSCLE_GROUPS.length * 28)}px">
        <canvas id="chart-muscles"></canvas>
      </div>
    </div>
    ` : ''}

    <div class="card mt-16">
      <div class="card-title">Attività per giorno della settimana</div>
      <div class="chart-wrap">
        <canvas id="chart-dow"></canvas>
      </div>
    </div>
  `;

  // Carica Chart.js e disegna
  await loadChartJS();

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#a0aab8' : '#7a8494';
  const primary   = isDark ? '#00d4e0' : '#0d6b6f';

  Chart.defaults.font.family = "'Space Grotesk', system-ui, sans-serif";
  Chart.defaults.color = textColor;

  // Grafico settimanale
  const wCtx = document.getElementById('chart-weekly')?.getContext('2d');
  if (wCtx && weeklyData.labels.length) {
    new Chart(wCtx, {
      type: 'bar',
      data: {
        labels: weeklyData.labels,
        datasets: [{
          label: 'Attività',
          data: weeklyData.counts,
          backgroundColor: primary + '66',
          borderColor: primary,
          borderWidth: 1.5,
          borderRadius: 6,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { color: gridColor } }, y: { grid: { color: gridColor }, beginAtZero: true, ticks: { precision: 0 } } } }
    });
  }

  // Distribuzione sport
  const sCtx = document.getElementById('chart-sport')?.getContext('2d');
  if (sCtx) {
    const sportEntries = Object.entries(sportCount).sort((a,b) => b[1]-a[1]);
    const colors = ACTIVITIES.map(a => a.color);
    const actColors = sportEntries.map(([key]) => ACTIVITIES.find(a => a.key === key)?.color || '#888');
    new Chart(sCtx, {
      type: 'doughnut',
      data: {
        labels: sportEntries.map(([k]) => ACTIVITIES.find(a => a.key === k)?.label || k),
        datasets: [{ data: sportEntries.map(([,v]) => v), backgroundColor: actColors, borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }

  // Muscoli
  if (gymSess > 0) {
    const mCtx = document.getElementById('chart-muscles')?.getContext('2d');
    if (mCtx) {
      const mEntries = MUSCLE_GROUPS.filter(m => m.minPerWeek > 0).map(m => ({
        label: m.label,
        count: muscleCount[m.key] || 0,
      })).sort((a,b) => b.count - a.count);

      new Chart(mCtx, {
        type: 'bar',
        data: {
          labels: mEntries.map(m => m.label),
          datasets: [{
            label: 'Sessioni',
            data: mEntries.map(m => m.count),
            backgroundColor: primary + '66',
            borderColor: primary,
            borderWidth: 1.5,
            borderRadius: 4,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { x: { grid: { color: gridColor }, beginAtZero: true, ticks: { precision: 0 } }, y: { grid: { display: false } } }
        }
      });
    }
  }

  // Giorno settimana
  const dCtx = document.getElementById('chart-dow')?.getContext('2d');
  if (dCtx) {
    new Chart(dCtx, {
      type: 'bar',
      data: {
        labels: dowLabels,
        datasets: [{
          label: 'Attività',
          data: dowCount,
          backgroundColor: dowCount.map((v,i) => i === topDow ? primary : primary + '44'),
          borderRadius: 6,
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: gridColor }, beginAtZero: true, ticks: { precision: 0 } } } }
    });
  }
}

function buildWeeklyData(activities, maxWeeks = 12) {
  const weeks = {};
  activities.forEach(a => {
    if (!a.date) return;
    const [y,m,d] = a.date.split('-').map(Number);
    const dt = new Date(y, m-1, d);
    const dow = (dt.getDay() + 6) % 7;
    const mon = new Date(dt);
    mon.setDate(dt.getDate() - dow);
    const key = mon.toISOString().slice(0, 10);
    weeks[key] = (weeks[key] || 0) + 1;
  });

  const sorted = Object.entries(weeks).sort((a,b) => a[0].localeCompare(b[0])).slice(-maxWeeks);
  return {
    labels: sorted.map(([k]) => {
      const [y,m,d] = k.split('-').map(Number);
      return new Date(y,m-1,d).toLocaleDateString('it-IT', { day:'numeric', month:'short' });
    }),
    counts: sorted.map(([,v]) => v),
  };
}

let chartJSLoaded = false;
function loadChartJS() {
  if (chartJSLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    s.onload  = () => { chartJSLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

window.statsPeriod = function(period, el) {
  currentPeriod = period;
  document.querySelectorAll('#stats-period-filters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  // Distruggi chart esistenti
  Chart?.getChart && document.querySelectorAll('#stats-content canvas').forEach(c => {
    const ch = Chart.getChart(c);
    if (ch) ch.destroy();
  });

  loadStatsContent();
};
