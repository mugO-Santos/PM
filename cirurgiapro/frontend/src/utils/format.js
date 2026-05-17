export const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0);

export const formatMinutes = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}h${m > 0 ? ` ${String(m).padStart(2, '0')}min` : ''}`;
};

export const minutesToHHMM = (totalMinutes) => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const hhmmToMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};

export const tiposAnestesia = [
  'Geral',
  'Sedação',
  'Local',
  'Regional',
  'Raquidiana',
  'Peridural',
  'Bloqueio de Plexo',
];

export const anestesiaBadgeClass = (tipo) => {
  const map = {
    'Geral': 'badge-azul',
    'Sedação': 'badge-verde',
    'Local': 'badge-cinza',
    'Regional': 'badge-laranja',
    'Raquidiana': 'badge-azul',
    'Peridural': 'badge-verde',
    'Bloqueio de Plexo': 'badge-laranja',
  };
  return map[tipo] || 'badge-cinza';
};
