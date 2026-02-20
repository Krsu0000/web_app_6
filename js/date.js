const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function todayId() {
  const d = new Date();
  return toId(d);
}

export function toId(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromId(id) {
  const [y, m, d] = id.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatTitle(id) {
  const date = fromId(id);
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = DAYS_KO[date.getDay()];
  return `${y}년 ${m}월 ${d}일 (${day})`;
}

export function formatShort(id) {
  const date = fromId(id);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = DAYS_KO[date.getDay()];
  return `${m}/${d} (${day})`;
}

export function formatMonthLabel(id) {
  const date = fromId(id);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}
