/* =============================================
   activities.js — configurazione sport e campi
   ============================================= */

export const MUSCLE_GROUPS = [
  { key: 'petto',      label: 'Petto',      minPerWeek: 2 },
  { key: 'dorso',      label: 'Dorso',      minPerWeek: 2 },
  { key: 'spalle',     label: 'Spalle',     minPerWeek: 1 },
  { key: 'bicipiti',   label: 'Bicipiti',   minPerWeek: 1 },
  { key: 'tricipiti',  label: 'Tricipiti',  minPerWeek: 1 },
  { key: 'gambe',      label: 'Gambe',      minPerWeek: 1 },
  { key: 'femorali',   label: 'Femorali',   minPerWeek: 1 },
  { key: 'polpacci',   label: 'Polpacci',   minPerWeek: 1 },
  { key: 'addominali', label: 'Addominali', minPerWeek: 1 },
  { key: 'stacchi',    label: 'Stacchi',    minPerWeek: 1 },
  { key: 'cardio',     label: 'Cardio',     minPerWeek: 0 },
];

export const GYM_MODES = [
  { key: 'muscoli', label: 'Muscoli' },
  { key: 'cardio',  label: 'Solo cardio' },
  { key: 'misto',   label: 'Misto' },
];

export const INTENSITY_LEVELS = [
  { key: 'bassa',   label: '🟢 Bassa' },
  { key: 'media',   label: '🟡 Media' },
  { key: 'alta',    label: '🟠 Alta' },
  { key: 'massima', label: '🔴 Massima' },
];

// SVG inline icons (Lucide-style, 24x24 viewBox)
export const SPORT_ICONS = {
  palestra:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M18 4v16M3 8h4M17 8h4M3 16h4M17 16h4"/></svg>`,
  corsa:      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="4" r="1.5"/><path d="M7 21l4-7-2-4 3-3 2 3h5"/><path d="M11 11l-2 3 3 1"/></svg>`,
  camminata:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="1.5"/><path d="M9 9l3 1 2-2"/><path d="M9 20l1-5 3 2 1 3"/><path d="M15 20l-1-4-2-2"/><path d="M8 12l-2 4"/></svg>`,
  trekking:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20l6-12 4 5 3-4 5 11"/><path d="M17 4l1 3"/></svg>`,
  bici:       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h-5l-3 8h10l-2-8z"/><path d="M15 6l2 5"/></svg>`,
  calcetto:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20"/><path d="M2 12h20"/><path d="M12 7l5 3-5 3-5-3z"/></svg>`,
};

export const ACTIVITIES = [
  {
    key:    'palestra',
    label:  'Palestra',
    color:  '#6366f1',
    fields: ['date', 'durationMinutes', 'gymMode', 'muscleGroups', 'cardioMinutes', 'intensity', 'notes'],
  },
  {
    key:    'corsa',
    label:  'Corsa',
    color:  '#f59e0b',
    fields: ['date', 'durationMinutes', 'distanceKm', 'intensity', 'notes'],
  },
  {
    key:    'camminata',
    label:  'Camminata',
    color:  '#10b981',
    fields: ['date', 'durationMinutes', 'distanceKm', 'notes'],
  },
  {
    key:    'trekking',
    label:  'Trekking',
    color:  '#84cc16',
    fields: ['date', 'durationMinutes', 'distanceKm', 'elevationGain', 'intensity', 'notes'],
  },
  {
    key:    'bici',
    label:  'Bici',
    color:  '#3b82f6',
    fields: ['date', 'durationMinutes', 'distanceKm', 'elevationGain', 'intensity', 'notes'],
  },
  {
    key:    'calcetto',
    label:  'Calcetto',
    color:  '#ec4899',
    fields: ['date', 'intensity', 'notes'],
  },
];

export function getActivity(key) {
  return ACTIVITIES.find(a => a.key === key);
}

export function getMuscleGroup(key) {
  return MUSCLE_GROUPS.find(m => m.key === key);
}

// Calcola passo medio (min/km) da minuti e km
export function calcPace(minutes, km) {
  if (!minutes || !km || km === 0) return null;
  const totalSec = (minutes / km) * 60;
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${s.toString().padStart(2,'0')} min/km`;
}

// Calcola velocità media (km/h)
export function calcSpeed(minutes, km) {
  if (!minutes || !km || minutes === 0) return null;
  return ((km / minutes) * 60).toFixed(1) + ' km/h';
}

// Genera riepilogo testuale di un'attività
export function activitySummary(a) {
  const act = getActivity(a.activityType);
  if (!act) return '';
  const parts = [];
  if (a.durationMinutes) parts.push(`${a.durationMinutes} min`);
  if (a.distanceKm)      parts.push(`${a.distanceKm} km`);
  if (a.muscleGroups && a.muscleGroups.length)
    parts.push(a.muscleGroups.map(k => getMuscleGroup(k)?.label || k).join(', '));
  if (a.gymMode === 'cardio') parts.push('Cardio');
  return parts.join(' · ');
}

// Formatta data IT
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return dt.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function generateId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}
