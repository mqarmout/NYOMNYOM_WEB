export const COLORS = ['#7c6fef','#5b8dee','#ef6f6f','#6fefd0','#efb96f','#ef6fcd','#8deed0','#d0ef6f'];

export function fmt(n, currency = '$') {
  return currency + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtDate(d) {
  const today = new Date().toISOString().split('T')[0];
  const yest  = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (d === today) return 'Today';
  if (d === yest)  return 'Yesterday';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getInitials(name) {
  if (!name || !name.trim()) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export async function apiFetch(path, opts = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  try {
    return await res.json();
  } catch {
    return { error: `HTTP ${res.status}` };
  }
}
