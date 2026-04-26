/* =============================================
   stats.js — Statistiche v1.2
   Aggiunto: filtro per sport, ritmo min/km, statistiche ritmo
   ============================================= */

import { getActivitiesByDateRange, getAllActivities } from './db.js';
import { ACTIVITIES, MUSCLE_GROUPS, formatDate } from './activities.js';
import { lastNDays } from './utils.js';

let currentPeriod = '30';
let customFrom    = '';
let customTo      = '';
let currentSport  = 'all';

// Sport che hanno ritmo/velocità
const PACE_SPORTS  = ['corsa', 'trekking', 'camminata'];
const SPEED_SPORTS = ['bici'];
const KM_SPORTS    = ['corsa', 'bici', 'camminata', 'trekking'];

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

    <div class="card-title mb-8" style="margin-top:4px">Filtra per sport</div>
    <div class="filter-row mb-16" id="stats-sport-filters">
      <div class="filter-chip ${currentSport==='all'?'active':''}" onclick="statsSport('all',this)">Tutti</div>
      ${ACTIVITIES.map(a => `
        <div class="filter-chip ${currentSport===a.key?'active':''}" onclick="statsSport('${a.key}',this)">${a.label}</div>
      `).join('')}
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

  // Filtro sport
  if (currentSport !== 'all') {
    activities = activities.filter(a => a.activityType === currentSport);
  }

  if (!activities.length) {
    container.innerHTML = `<div class="empty-state"><p>Nessuna attività nel periodo selezionato.</p></div>`;
    return;
  }

  // KPI base
  const totalMin = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);
  const totalKm  = activities.reduce((s, a) => s + (a.distanceKm || 0), 0);
  const gymSess  = activities.filter(a => a.activityType === 'palestra').length;

  // Sport più frequente (solo se filtro = tutti)
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

  // Statistiche ritmo
  const paceStats  = buildPaceStats(activities);
  const records    = buildRecords(activities);
  const weeklyData = buildWeeklyData(activities, currentPeriod === 'all' ? 156 : Math.min(Math.ceil(Number(currentPeriod)/7) + 2, 156));
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
        <div class="kpi-value">${gymSess > 0 ? gymSess : activities.length}</div>
        <div class="kpi-label">${gymSess > 0 ? 'Sessioni palestra' : 'Sessioni'}</div>
      </div>
    </div>

    ${currentSport === 'all' ? `
    <div class="card mt-16">
      <div class="card-title">Sport più praticato</div>
      <div style="font-size:1.05rem;font-weight:700;font-family:var(--font-display)">
        ${topSportLabel}
        <span style="color:var(--muted);font-size:0.85rem;font-weight:400"> ${topSport?.[1]||0} sessioni</span>
      </div>
      <div class="mt-8" style="color:var(--muted);font-size:0.85rem">
        Giorno più attivo: <strong style="color:var(--text)">${dowLabels[topDow]}</strong>
      </div>
    </div>` : ''}

    ${paceStats ? `
    <div class="card mt-16">
      <div class="card-title">⚡ Ritmo e velocità</div>
      ${paceStats}
    </div>` : ''}

    ${records ? `
    <div class="card mt-16">
      <div class="card-title">🏆 Record personali</div>
      ${records}
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

    ${currentSport === 'all' ? `
    <div class="card mt-16">
      <div class="card-title">Distribuzione sport</div>
      <div class="chart-wrap" style="height:220px">
        <canvas id="chart-sport"></canvas>
      </div>
    </div>` : ''}

    ${gymSess > 0 ? `
    <div class="card mt-16">
      <div class="card-title">Frequenza gruppi muscolari</div>
      <div class="chart-wrap" style="height:${Math.max(160, MUSCLE_GROUPS.filter(m=>m.minPerWeek>0).length * 28)}px">
        <canvas id="chart-muscles"></canvas>
      </div>
    </div>` : ''}

    ${KM_SPORTS.includes(currentSport) && activities.some(a => a.distanceKm && a.durationMinutes) ? `
    <div class="card mt-16">
      <div class="card-title">Andamento ritmo nel tempo</div>
      <div class="chart-wrap">
        <canvas id="chart-pace"></canvas>
      </div>
    </div>` : ''}

    <div class="card mt-16">
      <div class="card-title">Attività per giorno della settimana</div>
      <div class="chart-wrap">
        <canvas id="chart-dow"></canvas>
      </div>
    </div>
  `;

  renderHeatmap(activities, heatmapYear);
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
      data: { labels: weeklyData.labels, datasets:[{ label:'Attività', data: weeklyData.counts, backgroundColor: primary+'66', borderColor: primary, borderWidth:1.5, borderRadius:6 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{grid:{color:gridColor}}, y:{grid:{color:gridColor},beginAtZero:true,ticks:{precision:0}} } }
    });
  }

  // Distribuzione sport
  if (currentSport === 'all') {
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

  // Grafico ritmo nel tempo
  const pCtx = document.getElementById('chart-pace')?.getContext('2d');
  if (pCtx && KM_SPORTS.includes(currentSport)) {
    const paceData = activities
      .filter(a => a.distanceKm && a.durationMinutes && a.distanceKm > 0)
      .sort((a,b) => a.date.localeCompare(b.date))
      .map(a => ({
        x: formatDate(a.date),
        y: SPEED_SPORTS.includes(a.activityType)
          ? parseFloat(((a.distanceKm / a.durationMinutes) * 60).toFixed(1))
          : parseFloat((a.durationMinutes / a.distanceKm).toFixed(2)),
      }));

    const isSpeed = SPEED_SPORTS.includes(currentSport);
    new Chart(pCtx, {
      type: 'line',
      data: {
        labels: paceData.map(p => p.x),
        datasets:[{
          label: isSpeed ? 'Velocità media (km/h)' : 'Ritmo medio (min/km)',
          data: paceData.map(p => p.y),
          borderColor: primary,
          backgroundColor: primary+'22',
          borderWidth: 2,
          pointRadius: 3,
          fill: true,
          tension: 0.3,
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ display:true, position:'top' } },
        scales:{
          x:{ grid:{color:gridColor}, ticks:{maxTicksLimit:8} },
          y:{ grid:{color:gridColor}, beginAtZero:false,
              title:{ display:true, text: isSpeed ? 'km/h' : 'min/km' }
          }
        }
      }
    });
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

/* ---- PACE STATS ---- */
function buildPaceStats(activities) {
  const rows = [];

  // Corsa
  const corse = activities.filter(a => a.activityType === 'corsa' && a.distanceKm && a.durationMinutes);
  if (corse.length) {
    const totalKm  = corse.reduce((s,a) => s + a.distanceKm, 0);
    const totalMin = corse.reduce((s,a) => s + a.durationMinutes, 0);
    const avgPace  = formatPace(totalMin / totalKm);
    const bestRun  = corse.reduce((best, a) => (a.durationMinutes/a.distanceKm) < (best.durationMinutes/best.distanceKm) ? a : best);
    const bestPace = formatPace(bestRun.durationMinutes / bestRun.distanceKm);
    rows.push(`
      <div style="border-bottom:1px solid var(--border);padding:10px 0">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--primary);font-family:var(--font-display);margin-bottom:8px">🏃 Corsa</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${avgPace}</div><div style="font-size:0.72rem;color:var(--muted)">Ritmo medio</div></div>
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${bestPace}</div><div style="font-size:0.72rem;color:var(--muted)">Ritmo migliore</div></div>
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${totalKm.toFixed(1)} km</div><div style="font-size:0.72rem;color:var(--muted)">Km totali</div></div>
        </div>
      </div>
    `);
  }

  // Bici
  const bici = activities.filter(a => a.activityType === 'bici' && a.distanceKm && a.durationMinutes);
  if (bici.length) {
    const totalKm  = bici.reduce((s,a) => s + a.distanceKm, 0);
    const totalMin = bici.reduce((s,a) => s + a.durationMinutes, 0);
    const avgSpeed = ((totalKm / totalMin) * 60).toFixed(1);
    const bestRide = bici.reduce((best, a) => (a.distanceKm/a.durationMinutes) > (best.distanceKm/best.durationMinutes) ? a : best);
    const bestSpeed = ((bestRide.distanceKm / bestRide.durationMinutes) * 60).toFixed(1);
    rows.push(`
      <div style="border-bottom:1px solid var(--border);padding:10px 0">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--primary);font-family:var(--font-display);margin-bottom:8px">🚴 Bici</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${avgSpeed} km/h</div><div style="font-size:0.72rem;color:var(--muted)">Velocità media</div></div>
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${bestSpeed} km/h</div><div style="font-size:0.72rem;color:var(--muted)">Velocità massima</div></div>
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${totalKm.toFixed(1)} km</div><div style="font-size:0.72rem;color:var(--muted)">Km totali</div></div>
        </div>
      </div>
    `);
  }

  // Camminata
  const camm = activities.filter(a => a.activityType === 'camminata' && a.distanceKm && a.durationMinutes);
  if (camm.length) {
    const totalKm  = camm.reduce((s,a) => s + a.distanceKm, 0);
    const totalMin = camm.reduce((s,a) => s + a.durationMinutes, 0);
    const avgPace  = formatPace(totalMin / totalKm);
    rows.push(`
      <div style="border-bottom:1px solid var(--border);padding:10px 0">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--primary);font-family:var(--font-display);margin-bottom:8px">🚶 Camminata</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${avgPace}</div><div style="font-size:0.72rem;color:var(--muted)">Ritmo medio</div></div>
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${camm.length}</div><div style="font-size:0.72rem;color:var(--muted)">Uscite</div></div>
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${totalKm.toFixed(1)} km</div><div style="font-size:0.72rem;color:var(--muted)">Km totali</div></div>
        </div>
      </div>
    `);
  }

  // Trekking
  const trek = activities.filter(a => a.activityType === 'trekking' && a.distanceKm && a.durationMinutes);
  if (trek.length) {
    const totalKm  = trek.reduce((s,a) => s + a.distanceKm, 0);
    const totalMin = trek.reduce((s,a) => s + a.durationMinutes, 0);
    const avgPace  = formatPace(totalMin / totalKm);
    rows.push(`
      <div style="padding:10px 0">
        <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:var(--primary);font-family:var(--font-display);margin-bottom:8px">🥾 Trekking</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${avgPace}</div><div style="font-size:0.72rem;color:var(--muted)">Ritmo medio</div></div>
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${trek.length}</div><div style="font-size:0.72rem;color:var(--muted)">Uscite</div></div>
          <div><div style="font-size:1.1rem;font-weight:700;font-family:var(--font-display)">${totalKm.toFixed(1)} km</div><div style="font-size:0.72rem;color:var(--muted)">Km totali</div></div>
        </div>
      </div>
    `);
  }

  return rows.length ? rows.join('') : null;
}

function formatPace(minPerKm) {
  if (!minPerKm || !isFinite(minPerKm)) return '—';
  const m = Math.floor(minPerKm);
  const s = Math.round((minPerKm - m) * 60);
  return `${m}:${s.toString().padStart(2,'0')} min/km`;
}

/* ---- RECORD PERSONALI ---- */
function buildRecords(activities) {
  const records = [];

  const maxMin = activities.reduce((m, a) => (a.durationMinutes||0) > (m?.durationMinutes||0) ? a : m, null);
  if (maxMin?.durationMinutes) {
    records.push({ icon:'⏱️', label:'Sessione più lunga', value:`${maxMin.durationMinutes} min`, sub:`${formatDate(maxMin.date)} · ${ACTIVITIES.find(a=>a.key===maxMin.activityType)?.label||maxMin.activityType}` });
  }

  const maxKm = activities.reduce((m, a) => (a.distanceKm||0) > (m?.distanceKm||0) ? a : m, null);
  if (maxKm?.distanceKm) {
    records.push({ icon:'📍', label:'Percorso più lungo', value:`${maxKm.distanceKm} km`, sub:`${formatDate(maxKm.date)} · ${ACTIVITIES.find(a=>a.key===maxKm.activityType)?.label||maxKm.activityType}` });
  }

  // Ritmo migliore corsa
  const corse = activities.filter(a => a.activityType==='corsa' && a.distanceKm && a.durationMinutes);
  if (corse.length) {
    const best = corse.reduce((b,a) => (a.durationMinutes/a.distanceKm) < (b.durationMinutes/b.distanceKm) ? a : b);
    records.push({ icon:'🏃', label:'Ritmo migliore corsa', value:formatPace(best.durationMinutes/best.distanceKm), sub:`${formatDate(best.date)} · ${best.distanceKm} km` });
  }

  // Velocità massima bici
  const bici = activities.filter(a => a.activityType==='bici' && a.distanceKm && a.durationMinutes);
  if (bici.length) {
    const best = bici.reduce((b,a) => (a.distanceKm/a.durationMinutes) > (b.distanceKm/b.durationMinutes) ? a : b);
    records.push({ icon:'🚴', label:'Velocità massima bici', value:`${((best.distanceKm/best.durationMinutes)*60).toFixed(1)} km/h`, sub:`${formatDate(best.date)} · ${best.distanceKm} km` });
  }

  const weekCount = {};
  activities.forEach(a => {
    if (!a.date) return;
    const [y,m,d] = a.date.split('-').map(Number);
    const dt = new Date(y,m-1,d);
    const dow = (dt.getDay()+6)%7;
    const mon = new Date(dt); mon.setDate(dt.getDate()-dow);
    const key = mon.toISOString().slice(0,10);
    weekCount[key] = (weekCount[key]||0)+1;
  });
  const topWeek = Object.entries(weekCount).sort((a,b)=>b[1]-a[1])[0];
  if (topWeek) {
    const [y,m,d] = topWeek[0].split('-').map(Number);
    records.push({ icon:'🔥', label:'Settimana più intensa', value:`${topWeek[1]} attività`, sub:`Settimana del ${new Date(y,m-1,d).toLocaleDateString('it-IT',{day:'numeric',month:'short',year:'numeric'})}` });
  }

  const monthCount = {};
  activities.forEach(a => { if (a.date) { const k=a.date.slice(0,7); monthCount[k]=(monthCount[k]||0)+1; } });
  const topMonth = Object.entries(monthCount).sort((a,b)=>b[1]-a[1])[0];
  if (topMonth) {
    const [y,m] = topMonth[0].split('-').map(Number);
    records.push({ icon:'📅', label:'Mese record', value:`${topMonth[1]} attività`, sub:new Date(y,m-1,1).toLocaleDateString('it-IT',{month:'long',year:'numeric'}) });
  }

  const dates = [...new Set(activities.map(a=>a.date).filter(Boolean))].sort();
  let maxStreak=0, curStreak=1;
  for (let i=1;i<dates.length;i++) {
    const diff = (new Date(dates[i]) - new Date(dates[i-1])) / 86400000;
    if (diff===1) { curStreak++; maxStreak=Math.max(maxStreak,curStreak); } else { curStreak=1; }
  }
  if (maxStreak>1) records.push({ icon:'⚡', label:'Streak più lunga', value:`${maxStreak} giorni consecutivi`, sub:'' });

  if (!records.length) return null;
  return records.map(r => `
    <div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border)">
      <div style="font-size:1.4rem;width:32px;text-align:center;flex-shrink:0">${r.icon}</div>
      <div style="flex:1">
        <div style="font-size:0.78rem;color:var(--muted);font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.05em">${r.label}</div>
        <div style="font-weight:700;font-family:var(--font-display);font-size:1rem">${r.value}</div>
        ${r.sub?`<div style="font-size:0.75rem;color:var(--muted)">${r.sub}</div>`:''}
      </div>
    </div>
  `).join('');
}

/* ---- HEATMAP ---- */
function renderHeatmap(activities, year) {
  const wrap = document.getElementById('heatmap-wrap');
  if (!wrap) return;
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dayCount = {};
  activities.forEach(a => { if (a.date?.startsWith(String(year))) dayCount[a.date]=(dayCount[a.date]||0)+1; });
  const maxVal = Math.max(1, ...Object.values(dayCount));
  const months  = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  const days    = ['D','L','M','M','G','V','S'];
  const jan1    = new Date(year,0,1);
  const startDow = jan1.getDay();
  const allDays = [];
  for (let i=0;i<371;i++) allDays.push(new Date(year,0,1-startDow+i));
  const weeks = [];
  for (let w=0;w<53;w++) weeks.push(allDays.slice(w*7,w*7+7));
  let cells = '<div style="display:flex;gap:3px">';
  cells += `<div style="display:flex;flex-direction:column;gap:3px;margin-right:4px">${days.map((d,i)=>`<div style="height:11px;width:11px;font-size:0.55rem;color:var(--muted);line-height:11px;text-align:center">${i%2===1?d:''}</div>`).join('')}</div>`;
  weeks.forEach(week => {
    cells += `<div style="display:flex;flex-direction:column;gap:3px">`;
    week.forEach(d => {
      if (d.getFullYear()!==year) { cells+=`<div style="width:11px;height:11px;border-radius:2px;background:transparent"></div>`; return; }
      const dateStr = d.toISOString().slice(0,10);
      const count   = dayCount[dateStr]||0;
      const intensity = count===0?0:Math.ceil((count/maxVal)*4);
      const colors = isDark?['#1a2230','#0d3d40','#0a5a60','#087a82','#00d4e0']:['#e8f5f5','#b3e0e2','#66bfc3','#339fa5','#0d6b6f'];
      const title = count>0?`${d.toLocaleDateString('it-IT',{day:'numeric',month:'short'})}: ${count} attività`:d.toLocaleDateString('it-IT',{day:'numeric',month:'short'});
      cells+=`<div title="${title}" style="width:11px;height:11px;border-radius:2px;background:${colors[intensity]}"></div>`;
    });
    cells+=`</div>`;
  });
  cells+='</div>';
  let lastM=-1;
  let monthRow='<div style="display:flex;gap:3px;margin-left:26px;margin-bottom:4px;font-size:0.65rem;color:var(--muted);overflow:hidden">';
  weeks.forEach(week => {
    const first = week.find(d=>d.getFullYear()===year);
    if (first&&first.getDate()<=7&&first.getMonth()!==lastM) { lastM=first.getMonth(); monthRow+=`<div style="min-width:calc(4*14px);font-size:0.62rem">${months[lastM]}</div>`; }
    else monthRow+=`<div style="min-width:14px"></div>`;
  });
  monthRow+='</div>';
  const legendColors = isDark?['#1a2230','#0d3d40','#0a5a60','#087a82','#00d4e0']:['#e8f5f5','#b3e0e2','#66bfc3','#339fa5','#0d6b6f'];
  const legend=`<div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:0.7rem;color:var(--muted)"><span>Meno</span>${legendColors.map(c=>`<div style="width:11px;height:11px;border-radius:2px;background:${c}"></div>`).join('')}<span>Di più</span></div>`;
  wrap.innerHTML = monthRow+cells+legend;
}

/* ---- WEEKLY DATA ---- */
function buildWeeklyData(activities, maxWeeks=12) {
  const weeks={};
  activities.forEach(a=>{
    if (!a.date) return;
    const [y,m,d]=a.date.split('-').map(Number);
    const dt=new Date(y,m-1,d);
    const dow=(dt.getDay()+6)%7;
    const mon=new Date(dt); mon.setDate(dt.getDate()-dow);
    const key=mon.toISOString().slice(0,10);
    weeks[key]=(weeks[key]||0)+1;
  });
  const sorted=Object.entries(weeks).sort((a,b)=>a[0].localeCompare(b[0])).slice(-maxWeeks);
  return {
    labels: sorted.map(([k])=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('it-IT',{day:'numeric',month:'short'});}),
    counts: sorted.map(([,v])=>v),
  };
}

/* ---- CHART.JS ---- */
let chartJSLoaded=false;
function loadChartJS() {
  if (chartJSLoaded) return Promise.resolve();
  return new Promise((resolve,reject)=>{
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/chart.js@4.4.3/dist/chart.umd.min.js';
    s.onload=()=>{chartJSLoaded=true;resolve();}; s.onerror=reject;
    document.head.appendChild(s);
  });
}

/* ---- HANDLERS GLOBALI ---- */
window.statsPeriod = function(period, el) {
  currentPeriod = period;
  document.querySelectorAll('#stats-period-filters .filter-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  const cr=document.getElementById('stats-custom-range');
  if (cr) cr.style.display=period==='custom'?'block':'none';
  if (period!=='custom') { destroyCharts(); loadStatsContent(); }
};

window.statsSport = function(sport, el) {
  currentSport = sport;
  document.querySelectorAll('#stats-sport-filters .filter-chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  destroyCharts();
  loadStatsContent();
};

window.applyCustomRange = function() {
  customFrom = document.getElementById('stats-from')?.value;
  customTo   = document.getElementById('stats-to')?.value;
  if (!customFrom||!customTo) return;
  if (customFrom>customTo) customFrom=customTo;
  destroyCharts(); loadStatsContent();
};

function destroyCharts() {
  if (typeof Chart==='undefined') return;
  document.querySelectorAll('#stats-content canvas').forEach(c=>{const ch=Chart.getChart(c);if(ch)ch.destroy();});
}
