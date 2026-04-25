/* =============================================
   app.js — Bootstrap principale
   ============================================= */

import { openDB } from './db.js';
import { renderHome }     from './home.js';
import { renderRegister } from './register.js';
import { renderStats }    from './stats.js';
import { renderLog }      from './log.js';
import { renderSettings } from './settings.js';
import { navigateTo }     from './utils.js';

// Esponi navigateTo globalmente (usato dai template HTML)
window.navigateTo = navigateTo;

// Router
const viewRenderers = {
  home:     renderHome,
  register: renderRegister,
  stats:    renderStats,
  log:      renderLog,
  settings: renderSettings,
};

let activeView = null;

async function navigate(viewId) {
  if (viewId === activeView) return;
  activeView = viewId;

  navigateTo(viewId);

  const render = viewRenderers[viewId];
  if (render) await render();
}

// Nav buttons
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const view = btn.dataset.view;
    if (view) navigate(view);
  });
});

// Header date
function updateHeaderDate() {
  const el = document.getElementById('header-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('it-IT', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }
}

// PWA install
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window._deferredInstall = e;
});

// Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/diario-sportivo-igor/service-worker.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// Init
async function init() {
  await openDB();
  updateHeaderDate();
  await navigate('home');
}

init().catch(console.error);
