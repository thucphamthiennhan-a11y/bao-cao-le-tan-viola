export const fmt = (n) =>
  new Intl.NumberFormat('vi-VN').format(Math.round(n || 0));

export const fmtDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

export const getNum = (val) => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val.replace(/,/g,'')) || 0;
  return 0;
};

export const getText = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) return val.map(v => v.text || v.name || v.display_value || '').join(', ');
  if (typeof val === 'object') return val.text || val.name || val.display_value || '';
  return String(val);
};

export const getMonth = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
};

export const monthLabel = (ym) => {
  if (!ym) return '';
  const [y, m] = ym.split('-');
  return `T${parseInt(m)}/${y}`;
};
