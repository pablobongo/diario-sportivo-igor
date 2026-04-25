/* =============================================
   utils.js — utilità generali
   ============================================= */

// Mostra toast
export function showToast(msg, duration = 2800) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// Naviga a una view
export function navigateTo(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const view = document.getElementById(`view-${viewId}`);
  if (view) view.classList.add('active');

  const btn = document.querySelector(`.nav-btn[data-view="${viewId}"]`);
  if (btn) btn.classList.add('active');

  // Aggiorna titolo header
  const titles = { home: 'Diario Sportivo', register: 'Registra', stats: 'Statistiche', log: 'Log attività', settings: 'Impostazioni' };
  const titleEl = document.getElementById('header-title');
  if (titleEl) titleEl.textContent = titles[viewId] || '';
}

// Formatta data
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('it-IT', {
    weekday: 'short', day: 'numeric', month: 'short'
  });
}

// Settimana corrente (lun-dom)
export function currentWeekRange() {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0=lun
  const mon = new Date(today);
  mon.setDate(today.getDate() - dow);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return {
    from: mon.toISOString().slice(0, 10),
    to:   sun.toISOString().slice(0, 10),
  };
}

// Ultimi N giorni
export function lastNDays(n) {
  const to   = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - (n - 1) * 86400000).toISOString().slice(0, 10);
  return { from, to };
}

// Conferma modale semplice
export function confirm(msg) {
  return window.confirm(msg);
}

// Debounce
export function debounce(fn, ms = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
