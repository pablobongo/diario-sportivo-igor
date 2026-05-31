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

// SVG inline icons — Phosphor Icons (phosphoricons.com), licenza MIT
export const SPORT_ICONS = {
  palestra: `<svg viewBox="0 0 256 256" width="100%" height="100%" fill="currentColor"><path d="M248,120h-8V88a16,16,0,0,0-16-16H208V64a16,16,0,0,0-16-16H168a16,16,0,0,0-16,16v56H104V64A16,16,0,0,0,88,48H64A16,16,0,0,0,48,64v8H32A16,16,0,0,0,16,88v32H8a8,8,0,0,0,0,16h8v32a16,16,0,0,0,16,16H48v8a16,16,0,0,0,16,16H88a16,16,0,0,0,16-16V136h48v56a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16v-8h16a16,16,0,0,0,16-16V136h8a8,8,0,0,0,0-16ZM32,168V88H48v80Zm56,24H64V64H88V192Zm104,0H168V64h24V175.82c0,.06,0,.12,0,.18s0,.12,0,.18V192Zm32-24H208V88h16Z"/></svg>`,
  corsa: `<svg viewBox="0 0 256 256" width="100%" height="100%" fill="currentColor"><path d="M152,88a32,32,0,1,0-32-32A32,32,0,0,0,152,88Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,152,40Zm67.31,100.68c-.61.28-7.49,3.28-19.67,3.28-13.85,0-34.55-3.88-60.69-20a169.31,169.31,0,0,1-15.41,32.34,104.29,104.29,0,0,1,31.31,15.81C173.92,186.65,184,207.35,184,232a8,8,0,0,1-16,0c0-41.7-34.69-56.71-54.14-61.85-.55.7-1.12,1.41-1.69,2.1-19.64,23.8-44.25,36.18-71.63,36.18A92.29,92.29,0,0,1,31.2,208,8,8,0,0,1,32.8,192c25.92,2.58,48.47-7.49,67-30,12.49-15.14,21-33.61,25.25-47C86.13,92.35,61.27,111.63,61,111.84A8,8,0,1,1,51,99.36c1.5-1.2,37.22-29,89.51,6.57,45.47,30.91,71.93,20.31,72.18,20.19a8,8,0,1,1,6.63,14.56Z"/></svg>`,
  camminata: `<svg viewBox="0 0 256 256" width="100%" height="100%" fill="currentColor"><path d="M152,80a32,32,0,1,0-32-32A32,32,0,0,0,152,80Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,152,32Zm64,112a8,8,0,0,1-8,8c-35.31,0-52.95-17.81-67.12-32.12-2.74-2.77-5.36-5.4-8-7.84l-13.43,30.88,37.2,26.57A8,8,0,0,1,160,176v56a8,8,0,0,1-16,0V180.12l-31.07-22.2L79.34,235.19A8,8,0,0,1,72,240a7.84,7.84,0,0,1-3.19-.67,8,8,0,0,1-4.15-10.52l54.08-124.37c-9.31-1.65-20.92,1.2-34.7,8.58a163.88,163.88,0,0,0-30.57,21.77,8,8,0,0,1-10.95-11.66c2.5-2.35,61.69-57.23,98.72-25.08,3.83,3.32,7.48,7,11,10.57C166.19,122.7,179.36,136,208,136A8,8,0,0,1,216,144Z"/></svg>`,
  trekking: `<svg viewBox="0 0 256 256" width="100%" height="100%" fill="currentColor"><path d="M152,80a32,32,0,1,0-32-32A32,32,0,0,0,152,80Zm0-48a16,16,0,1,1-16,16A16,16,0,0,1,152,32Zm48,112v88a8,8,0,0,1-16,0V151.66c-25.75-2.25-34.35-15.52-42-27.36-2.85-4.39-5.56-8.57-9.13-12.19l-13.4,30.81,37.2,26.57A8,8,0,0,1,160,176v56a8,8,0,0,1-16,0V180.12l-31.07-22.2L79.34,235.19A8,8,0,0,1,72,240a7.84,7.84,0,0,1-3.19-.67,8,8,0,0,1-4.14-10.52L122.19,96.5a8,8,0,0,1,11-3.92,40.92,40.92,0,0,1,8,5.47c6.37,5.52,10.51,11.91,14.16,17.55,7.68,11.84,13.22,20.4,36.6,20.4A8,8,0,0,1,200,144ZM72,152a8,8,0,0,0,7.35-4.85l24-56a8,8,0,0,0-4.2-10.5l-28-12a8,8,0,0,0-10.5,4.2l-24,56a8,8,0,0,0,4.2,10.5l28,12A8,8,0,0,0,72,152ZM54.51,127.8,72.2,86.5l13.3,5.7L67.8,133.49Z"/></svg>`,
  bici: `<svg viewBox="0 0 256 256" width="100%" height="100%" fill="currentColor"><path d="M208,112a47.81,47.81,0,0,0-16.93,3.09L165.93,72H192a8,8,0,0,1,8,8,8,8,0,0,0,16,0,24,24,0,0,0-24-24H152a8,8,0,0,0-6.91,12l11.65,20H99.26L82.91,60A8,8,0,0,0,76,56H48a8,8,0,0,0,0,16H71.41L85.12,95.51,69.41,117.06a48.13,48.13,0,1,0,12.92,9.44l11.59-15.9L125.09,164A8,8,0,1,0,138.91,156l-30.32-52h57.48l11.19,19.17A48,48,0,1,0,208,112ZM80,160a32,32,0,1,1-20.21-29.74l-18.25,25a8,8,0,1,0,12.92,9.42l18.25-25A31.88,31.88,0,0,1,80,160Zm128,32a32,32,0,0,1-22.51-54.72L201.09,164A8,8,0,1,0,214.91,156L199.3,129.21A32,32,0,1,1,208,192Z"/></svg>`,
  calcetto: `<svg viewBox="0 0 256 256" width="100%" height="100%" fill="currentColor"><path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm76.52,147.42H170.9l-9.26-12.76,12.63-36.78,15-4.89,26.24,20.13A87.38,87.38,0,0,1,204.52,171.42Zm-164-34.3L66.71,117l15,4.89,12.63,36.78L85.1,171.42H51.48A87.38,87.38,0,0,1,40.47,137.12Zm10-50.64,5.51,18.6L40.71,116.77A87.33,87.33,0,0,1,50.43,86.48ZM109,152,97.54,118.65,128,97.71l30.46,20.94L147,152Zm91.07-46.92,5.51-18.6a87.33,87.33,0,0,1,9.72,30.29Zm-6.2-35.38-9.51,32.08-15.07,4.89L136,83.79V68.21l29.09-20A88.58,88.58,0,0,1,193.86,69.7ZM146.07,41.87,128,54.29,109.93,41.87a88.24,88.24,0,0,1,36.14,0ZM90.91,48.21l29.09,20V83.79L86.72,106.67l-15.07-4.89L62.14,69.7A88.58,88.58,0,0,1,90.91,48.21ZM63.15,187.42H83.52l7.17,20.27A88.4,88.4,0,0,1,63.15,187.42ZM110,214.13,98.12,180.71,107.35,168h41.3l9.23,12.71-11.83,33.42a88,88,0,0,1-36.1,0Zm55.36-6.44,7.17-20.27h20.37A88.4,88.4,0,0,1,165.31,207.69Z"/></svg>`,
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
  // Ritmo o velocità
  if (a.distanceKm && a.durationMinutes) {
    if (['corsa','camminata','trekking'].includes(a.activityType)) {
      const pace = calcPace(a.durationMinutes, a.distanceKm);
      if (pace) parts.push(pace);
    } else if (a.activityType === 'bici') {
      const speed = calcSpeed(a.durationMinutes, a.distanceKm);
      if (speed) parts.push(speed);
    }
  }
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
