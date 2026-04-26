/* =============================================
   stats.js — Statistiche v1.1
   Aggiunto: filtro data personalizzato, record personali, heatmap annuale
   ============================================= */

import { getActivitiesByDateRange, getAllActivities } from './db.js';
import { ACTIVITIES, MUSCLE_GROUPS, formatDate } from './activities.js';
import { lastNDays } from './utils.js';

let currentPeriod = '30';
let customFrom    = '';
let customTo      = '';

export async function renderStats() {
  const el = document.getElementById('view-stats');
  if (!el) return;

  const today = new Date().toISOString().slice(0, 10);

  el.innerHTML = `
    <div class="section-header mb-16">
      <span class="section-title">Statistiche</span>
    </div>

    <div class="filter-row" id="stats-period-filters">
      <div class="filter-chip ${currentPeriod==='7'?'active':''}"      onclick="statsPeriod('7',this)">7 gg</div>
      <div class="filter-chip ${currentPeriod==='30'?'active':''}"     onclick="statsPeriod('30',this)">30 gg</div>
      <div class="filter-chip ${currentPeriod==='90'?'active':''}"     onclick="statsPeriod('90',this)">3 mesi</div>
      <div class="filter-chip ${currentPeriod==='365'?'active':''}"    onclick="statsPeriod('365',this)">Anno</div>
      <div class="filter-chip ${currentPeriod==='all'?'active':''}"    onclick="statsPeriod('all',this)">Tutto</div>
      <div class="filter-chip ${currentPeriod==='custom'?'active':''}" onclick="statsPeriod('custom',this)">Personalizzato</div>
    </div>

    <div id="stats-custom-range" style="display:${currentPeriod==='custom'?'block':'none'}">
      <div class="form-row mb-16">
        <div class="form-group">
          <label class="form-label">Dal</label>
          <input type="date" class="form-input" id="stats-from" value="${customFrom || lastNDays(30).from}" max="${today}">
        </div>
        <div class="form-group">
          <label class="form-label">Al</label>
          <input type="date" class="form-input" id="stats-to" value="${customTo || today}" max="${today}">
        </div>
      </div>
      <button class="btn btn-primary btn-full mb-16" onclick="applyCustomRange()">Applica filtro</button>
    </div>

    <div id="stats-content"></div>
  `;

  await loadStatsContent();
}

async function loadStatsContent() {
  const container = document.getElementById('stats-content');
  if (!container) return;

  container.innerHTML = `<div class="empty-state"><p>Caricamento…</p></div>`;

  let activities;
  if (currentPeriod === 'all') {
    activities = await getAllActivities();
  } else if (currentPeriod === 'custom') {
    const from = customFrom || lastNDays(30).from;
    const to   = customTo   || new Date().toISOString().slice(0, 10);
    activities = await getActivitiesByDateRange(from, to);
  } else {
    const { from, to } = lastNDays(Number(currentPeriod));
    activities = await getActivitiesByDateRange(from, to);
  }

  if (!activities.length) {
    container.innerHTML = `<div class="empty-state"><p>Nessuna attività nel periodo selezionato.</p></div>`;
    return;
  }

  // KPI base
  const totalMin  = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);
  const totalKm   = activities.reduce((s, a) => s + (a.distanceKm || 0), 0);
  const gymSess   = activities.filter(a => a.activityType === 'palestra').length;

  // Sport più frequente
  const sportCount = {};
  activities.forEach(a => { sportCount[a.activityType] = (sportCount[a.activityType] || 0) + 1; });
  const topSport      = Object.entries(sportCount).sort((a,b) => b[1]-a[1])[0];
  const topSportLabel = ACTIVITIES.find(a => a.key === topSport?.[0])?.label || topSport?.[0] || '—';

  // Giorno settimana più attivo
  const dowCount  = [0,0,0,0,0,0,0];
  const dowLabels = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  activities.forEach(a => {
    if (a.date) {
      const [y,m,d] = a.date.split('-').map(Number);
      dowCount[new Date(y, m-1, d).getDay()]++;
    }
  });
  const topDow = dowCount.indexOf(Math.max(...dowCount));

  // Frequenza muscoli
  const muscleCount = {};
  activities.filter(a => a.activityType === 'palestra').forEach(a => {
    (a.muscleGroups || []).forEach(m => { muscleCount[m] = (muscleCount[m] || 0) + 1; });
  });

  // Record personali
  const records = buildRecords(activities);

  // Dati settimanali
  const maxWeeks  = currentPeriod === 'all' ? 156 : Math.min(Math.ceil(Number(currentPeriod)/7) + 2, 156);
  const weeklyData = buildWeeklyData(activities, maxWeeks);

  // Anno per heatmap
  const heatmapYear = new Date().getFullYear();

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
      <div style="font-size:1.05rem;font-weight:700;font-family:var(--font-display)">
        ${topSportLabel}
        <span style="color:var(--muted);font-size:0.85rem;font-weight:400"> ${topSport?.[1]||0} sessioni</span>
      </div>
      <div class="mt-8" style="color:var(--muted);font-size:0.85rem">
        Giorno più attivo: <strong style="color:var(--text)">${dowLabels[topDow]}</strong>
      </div>
    </div>

    ${records ? `
    <div class="card mt-16">
      <div class="card-title">🏆 Record personali</div>
      <div id="records-content">${records}</div>
    </div>` : ''}

    <div class="card mt-16">
      <div class="card-title">Heatmap ${heatmapYear}</div>
      <div id="heatmap-wrap" style="overflow-x:auto;padding:4px 0"></div>
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
      <div class="chart-wrap" style="height:${Math.max(160, MUSCLE_GROUPS.filter(m=>m.minPerWeek>0).length * 28)}px">
        <canvas id="chart-muscles"></canvas>
      </div>
    </div>` : ''}

    <div class="card mt-16">
      <div class="card-title">Attività per giorno della settimana</div>
      <div class="chart-wrap">
        <canvas id="chart-dow"></canvas>
      </div>
    </div>
  `;

  // Heatmap
  renderHeatmap(activities, heatmapYear);

  // Grafici
  await loadChartJS();

  const isDark    = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const textColor = isDark ? '#a0aab8' : '#7a8494';
  const primary   = isDark ? '#00d4e0' : '#0d6b6f';

  Chart.defaults.font.family = "'Syne', system-ui, sans-serif";
  Chart.defaults.color       = textColor;

  // Settimanale
  const wCtx = document.getElementById('chart-weekly')?.getContext('2d');
  if (wCtx && weeklyData.labels.length) {
    new Chart(wCtx, {
      type: 'bar',
      data: {
        labels: weeklyData.labels,
        datasets: [{ label: 'Attività', data: weeklyData.counts, backgroundColor: primary+'66', borderColor: primary, borderWidth: 1.5, borderRadius: 6 }]
      },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:gridColor}}, y:{grid:{color:gridColor},beginAtZero:true,ticks:{precision:0}} } }
    });
  }

  // Distribuzione sport
  const sCtx = document.getElementById('chart-sport')?.getContext('2d');
  if (sCtx) {
    const sportEntries = Object.entries(sportCount).sort((a,b) => b[1]-a[1]);
    const actColors    = sportEntries.map(([k]) => ACTIVITIES.find(a => a.key===k)?.color || '#888');
    new Chart(sCtx, {
      type: 'doughnut',
      data: { labels: sportEntries.map(([k]) => ACTIVITIES.find(a=>a.key===k)?.label||k), datasets:[{ data: sportEntries.map(([,v])=>v), backgroundColor: actColors, borderWidth:0 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right'}} }
    });
  }

  // Muscoli
  if (gymSess > 0) {
    const mCtx = document.getElementById('chart-muscles')?.getContext('2d');
    if (mCtx) {
      const mEntries = MUSCLE_GROUPS.filter(m=>m.minPerWeek>0)
        .map(m => ({ label: m.label, count: muscleCount[m.key]||0 }))
        .sort((a,b) => b.count-a.count);
      new Chart(mCtx, {
        type: 'bar',
        data: { labels: mEntries.map(m=>m.label), datasets:[{ label:'Sessioni', data: mEntries.map(m=>m.count), backgroundColor: primary+'66', borderColor: primary, borderWidth:1.5, borderRadius:4 }] },
        options: { indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:gridColor},beginAtZero:true,ticks:{precision:0}}, y:{grid:{display:false}} } }
      });
    }
  }

  // Giorni settimana
  const dCtx = document.getElementById('chart-dow')?.getContext('2d');
  if (dCtx) {
    new Chart(dCtx, {
      type: 'bar',
      data: { labels: dowLabels, datasets:[{ label:'Attività', data: dowCount, backgroundColor: dowCount.map((_,i)=>i===topDow?primary:primary+'44'), borderRadius:6 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{display:false}}, y:{grid:{color:gridColor},beginAtZero:true,ticks:{precision:0}} } }
    });
  }
}

/* ---- HEATMAP ---- */
function renderHeatmap(activities, year) {
  const wrap = document.getElementById('heatmap-wrap');
  if (!wrap) return;

  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Conta attività per giorno
  const dayCount = {};
  activities.forEach(a => {
    if (a.date && a.date.startsWith(String(year))) {
      dayCount[a.date] = (dayCount[a.date] || 0) + 1;
    }
  });

  const maxVal = Math.max(1, ...Object.values(dayCount));

  // Genera griglia: 53 settimane x 7 giorni
  const jan1   = new Date(year, 0, 1);
  const startDow = jan1.getDay(); // 0=dom

  const months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const days   = ['D','L','M','M','G','V','S'];

  let cells = '';
  let monthLabels = '<div style="display:flex;gap:3px;margin-left:22px;margin-bottom:4px;font-size:0.65rem;color:var(--muted)">';
  let lastMonth = -1;
  let colCount  = 0;

  // Celle vuote iniziali
  const emptyCells = startDow;
  const totalCells = emptyCells + 365 + (new Date(year, 11, 31).getDay() === 6 ? 0 : 6 - new Date(year, 11, 31).getDay());

  let col = 0;
  let cellsInCol = 0;

  cells += '<div style="display:flex;gap:3px">';
  // Etichette giorni
  cells += `<div style="display:flex;flex-direction:column;gap:3px;margin-right:4px">
    ${days.map((d,i) => `<div style="height:11px;width:11px;font-size:0.55rem;color:var(--muted);line-height:11px;text-align:center">${i%2===1?d:''}</div>`).join('')}
  </div>`;

  const allDays = [];
  for (let i = 0; i < 371; i++) {
    const d = new Date(year, 0, 1 - startDow + i);
    allDays.push(d);
  }

  // Raggruppa per settimana
  const weeks = [];
  for (let w = 0; w < 53; w++) {
    weeks.push(allDays.slice(w*7, w*7+7));
  }

  weeks.forEach((week, wi) => {
    // Etichetta mese
    const firstDay = week.find(d => d.getFullYear() === year);
    if (firstDay && firstDay.getDate() <= 7 && firstDay.getMonth() !== lastMonth) {
      lastMonth = firstDay.getMonth();
    }

    cells += `<div style="display:flex;flex-direction:column;gap:3px">`;
    week.forEach(d => {
      if (d.getFullYear() !== year) {
        cells += `<div style="width:11px;height:11px;border-radius:2px;background:transparent"></div>`;
        return;
      }
      const dateStr = d.toISOString().slice(0, 10);
      const count   = dayCount[dateStr] || 0;
      const intensity = count === 0 ? 0 : Math.ceil((count / maxVal) * 4);
      const colors = isDark
        ? ['#1a2230', '#0d3d40', '#0a5a60', '#087a82', '#00d4e0']
        : ['#e8f5f5', '#b3e0e2', '#66bfc3', '#339fa5', '#0d6b6f'];
      const bg    = colors[intensity];
      const title = count > 0
        ? `${d.toLocaleDateString('it-IT',{day:'numeric',month:'short'})}: ${count} attività`
        : d.toLocaleDateString('it-IT',{day:'numeric',month:'short'});
      cells += `<div title="${title}" style="width:11px;height:11px;border-radius:2px;background:${bg};cursor:${count>0?'pointer':'default'}" ></div>`;
    });
    cells += `</div>`;
  });

  cells += '</div>';

  // Etichette mesi sopra
  let monthRow = '<div style="display:flex;gap:3px;margin-left:26px;margin-bottom:4px;font-size:0.65rem;color:var(--muted);overflow:hidden">';
  let lastM = -1;
  weeks.forEach((week, wi) => {
    const firstYearDay = week.find(d => d.getFullYear() === year);
    if (firstYearDay) {
      const m = firstYearDay.getMonth();
      if (m !== lastM && firstYearDay.getDate() <= 7) {
        lastM = m;
        monthRow += `<div style="min-width:${wi>0?'calc(4*14px)':'auto'};font-size:0.62rem">${months[m]}</div>`;
      } else {
        monthRow += `<div style="min-width:14px"></div>`;
      }
    } else {
      monthRow += `<div style="min-width:14px"></div>`;
    }
  });
  monthRow += '</div>';

  // Legenda
  const isDarkNow = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const legendColors = isDarkNow
    ? ['#1a2230', '#0d3d40', '#0a5a60', '#087a82', '#00d4e0']
    : ['#e8f5f5', '#b3e0e2', '#66bfc3', '#339fa5', '#0d6b6f'];
  const legend = `
    <div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:0.7rem;color:var(--muted)">
      <span>Meno</span>
      ${legendColors.map(c => `<div style="width:11px;height:11px;border-radius:2px;background:${c}"></div>`).join('')}
      <span>Di più</span>
    </div>
  `;

  wrap.innerHTML = monthRow + cells + legend;
}

/* ---- RECORD PERSONALI ---- */
function buildRecords(activities) {
  const records = [];

  // Sessione più lunga
  const maxMin = activities.reduce((m, a) => a.durationMinutes > (m?.durationMinutes||0) ? a : m, null);
  if (maxMin?.durationMinutes) {
    records.push({ icon: '⏱️', label: 'Sessione più lunga', value: `${maxMin.durationMinutes} min`, sub: `${formatDate(maxMin.date)} · ${ACTIVITIES.find(a=>a.key===maxMin.activityType)?.label||maxMin.activityType}` });
  }

  // Km più lungo
  const maxKm = activities.reduce((m, a) => (a.distanceKm||0) > (m?.distanceKm||0) ? a : m, null);
  if (maxKm?.distanceKm) {
    records.push({ icon: '📍', label: 'Percorso più lungo', value: `${maxKm.distanceKm} km`, sub: `${formatDate(maxKm.date)} · ${ACTIVITIES.find(a=>a.key===maxKm.activityType)?.label||maxKm.activityType}` });
  }

  // Settimana più intensa (più attività)
  const weekCount = {};
  activities.forEach(a => {
    if (!a.date) return;
    const [y,m,d] = a.date.split('-').map(Number);
    const dt  = new Date(y,m-1,d);
    const dow = (dt.getDay()+6)%7;
    const mon = new Date(dt); mon.setDate(dt.getDate()-dow);
    const key = mon.toISOString().slice(0,10);
    weekCount[key] = (weekCount[key]||0)+1;
  });
  const topWeek = Object.entries(weekCount).sort((a,b)=>b[1]-a[1])[0];
  if (topWeek) {
    const [y,m,d] = topWeek[0].split('-').map(Number);
    const weekLabel = new Date(y,m-1,d).toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'});
    records.push({ icon: '🔥', label: 'Settimana più intensa', value: `${topWeek[1]} attività`, sub: `Settimana del ${weekLabel}` });
  }

  // Mese record
  const monthCount = {};
  activities.forEach(a => {
    if (!a.date) return;
    const key = a.date.slice(0,7);
    monthCount[key] = (monthCount[key]||0)+1;
  });
  const topMonth = Object.entries(monthCount).sort((a,b)=>b[1]-a[1])[0];
  if (topMonth) {
    const [y,m] = topMonth[0].split('-').map(Number);
    const mLabel = new Date(y,m-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'});
    records.push({ icon: '📅', label: 'Mese record', value: `${topMonth[1]} attività`, sub: mLabel });
  }

  // Streak più lunga (giorni consecutivi con almeno 1 attività)
  const dates = [...new Set(activities.map(a=>a.date).filter(Boolean))].sort();
  let maxStreak = 0, curStreak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i-1]);
    const curr = new Date(dates[i]);
    const diff = (curr - prev) / 86400000;
    if (diff === 1) {
      curStreak++;
      maxStreak = Math.max(maxStreak, curStreak);
    } else {
      curStreak = 1;
    }
  }
  if (maxStreak > 1) {
    records.push({ icon: '⚡', label: 'Streak più lunga', value: `${maxStreak} giorni consecutivi`, sub: '' });
  }

  // Totale km corsa
  const totalRunKm = activities.filter(a=>a.activityType==='corsa').reduce((s,a)=>s+(a.distanceKm||0),0);
  if (totalRunKm > 0) {
    records.push({ icon: '🏃', label: 'Km totali corsa', value: `${totalRunKm.toFixed(1)} km`, sub: `${activities.filter(a=>a.activityType==='corsa').length} uscite` });
  }

  // Totale km bici
  const totalBikeKm = activities.filter(a=>a.activityType==='bici').reduce((s,a)=>s+(a.distanceKm||0),0);
  if (totalBikeKm > 0) {
    records.push({ icon: '🚴', label: 'Km totali bici', value: `${totalBikeKm.toFixed(1)} km`, sub: `${activities.filter(a=>a.activityType==='bici').length} uscite` });
  }

  if (!records.length) return null;

  return records.map(r => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:1.4rem;width:32px;text-align:center;flex-shrink:0">${r.icon}</div>
      <div style="flex:1">
        <div style="font-size:0.78rem;color:var(--muted);font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em">${r.label}</div>
        <div style="font-weight:700;font-family:var(--font-display);font-size:1rem">${r.value}</div>
        ${r.sub ? `<div style="font-size:0.75rem;color:var(--muted)">${r.sub}</div>` : ''}
      </div>
    </div>
  `).join('');
}

/* ---- WEEKLY DATA ---- */
function buildWeeklyData(activities, maxWeeks = 12) {
  const weeks = {};
  activities.forEach(a => {
    if (!a.date) return;
    const [y,m,d] = a.date.split('-').map(Number);
    const dt  = new Date(y,m-1,d);
    const dow = (dt.getDay()+6)%7;
    const mon = new Date(dt); mon.setDate(dt.getDate()-dow);
    const key = mon.toISOString().slice(0,10);
    weeks[key] = (weeks[key]||0)+1;
  });
  const sorted = Object.entries(weeks).sort((a,b)=>a[0].localeCompare(b[0])).slice(-maxWeeks);
  return {
    labels: sorted.map(([k]) => { const [y,m,d]=k.split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('it-IT',{day:'numeric',month:'short'}); }),
    counts: sorted.map(([,v])=>v),
  };
}

/* ---- CHART.JS ---- */
let chartJSLoaded = false;
function loadChartJS() {
  if (chartJSLoaded) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src     = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    s.onload  = () => { chartJSLoaded = true; resolve(); };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/* ---- HANDLERS GLOBALI ---- */
window.statsPeriod = function(period, el) {
  currentPeriod = period;
  document.querySelectorAll('#stats-period-filters .filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  const customRange = document.getElementById('stats-custom-range');
  if (customRange) customRange.style.display = period === 'custom' ? 'block' : 'none';

  if (period !== 'custom') {
    destroyCharts();
    loadStatsContent();
  }
};

window.applyCustomRange = function() {
  customFrom = document.getElementById('stats-from')?.value;
  customTo   = document.getElementById('stats-to')?.value;
  if (!customFrom || !customTo) { return; }
  if (customFrom > customTo) { customFrom = customTo; }
  destroyCharts();
  loadStatsContent();
};

function destroyCharts() {
  if (typeof Chart === 'undefined') return;
  document.querySelectorAll('#stats-content canvas').forEach(c => {
    const ch = Chart.getChart(c);
    if (ch) ch.destroy();
  });
}
