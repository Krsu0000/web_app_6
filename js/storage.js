const PREFIX = 'planner_';

export function getPlanner(id) {
  const raw = localStorage.getItem(PREFIX + id);
  return raw ? JSON.parse(raw) : null;
}

export function savePlanner(data) {
  data.updatedAt = new Date().toISOString();
  localStorage.setItem(PREFIX + data.id, JSON.stringify(data));
}

export function deletePlanner(id) {
  localStorage.removeItem(PREFIX + id);
}

export function getAllIds() {
  const ids = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(PREFIX)) {
      ids.push(key.slice(PREFIX.length));
    }
  }
  return ids.sort((a, b) => b.localeCompare(a)); // 최신순
}

export function createPlanner(id, title) {
  const now = new Date().toISOString();
  const data = {
    id,
    title,
    customTitle: null,
    blocks: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      timeLabel: '',
      checks: [false, false, false],
      task: '',
      memo: '',
    })),
    footer: { memo: '', good: '', bad: '', next: '' },
    createdAt: now,
    updatedAt: now,
  };
  savePlanner(data);
  return data;
}
