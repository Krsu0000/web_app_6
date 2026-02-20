import { getAllIds, getPlanner, createPlanner, deletePlanner } from './storage.js';
import { todayId, formatTitle, formatShort, formatMonthLabel } from './date.js';

const todayBtn = document.getElementById('btn-today');
const newBtn = document.getElementById('btn-new');
const listEl = document.getElementById('planner-list');
const emptyEl = document.getElementById('empty-state');

function openPlanner(id) {
  window.location.href = `planner.html?date=${id}`;
}

function handleToday() {
  const id = todayId();
  if (!getPlanner(id)) {
    createPlanner(id, formatTitle(id));
  }
  openPlanner(id);
}

function handleNew() {
  const id = todayId();
  const input = prompt('날짜를 입력하세요 (YYYY-MM-DD)', id);
  if (!input) return;
  const trimmed = input.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    alert('날짜 형식이 올바르지 않습니다. (예: 2026-02-20)');
    return;
  }
  if (!getPlanner(trimmed)) {
    createPlanner(trimmed, formatTitle(trimmed));
  }
  openPlanner(trimmed);
}

function handleDelete(e) {
  const id = e.currentTarget.dataset.id;
  if (!confirm(`"${formatTitle(id)}" 플래너를 삭제할까요?`)) return;
  deletePlanner(id);
  renderList();
}

function renderList() {
  const ids = getAllIds();
  listEl.innerHTML = '';

  if (ids.length === 0) {
    emptyEl.hidden = false;
    return;
  }
  emptyEl.hidden = true;

  // 월별 그룹핑
  const groups = {};
  ids.forEach(id => {
    const label = formatMonthLabel(id);
    if (!groups[label]) groups[label] = [];
    groups[label].push(id);
  });

  Object.entries(groups).forEach(([month, monthIds]) => {
    const section = document.createElement('section');
    section.className = 'month-group';

    const h2 = document.createElement('h2');
    h2.className = 'month-label';
    h2.textContent = month;
    section.appendChild(h2);

    monthIds.forEach(id => {
      const planner = getPlanner(id);
      const displayTitle = planner.customTitle || planner.title;
      const today = todayId();
      const isToday = id === today;

      const item = document.createElement('div');
      item.className = 'planner-item' + (isToday ? ' is-today' : '');

      item.innerHTML = `
        <button class="item-link" data-id="${id}">
          <span class="item-date">${formatShort(id)}</span>
          <span class="item-title">${escHtml(displayTitle)}</span>
          ${isToday ? '<span class="badge-today">오늘</span>' : ''}
        </button>
        <button class="item-delete" data-id="${id}" title="삭제">✕</button>
      `;

      item.querySelector('.item-link').addEventListener('click', () => openPlanner(id));
      item.querySelector('.item-delete').addEventListener('click', handleDelete);
      section.appendChild(item);
    });

    listEl.appendChild(section);
  });
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

todayBtn.addEventListener('click', handleToday);
newBtn.addEventListener('click', handleNew);
renderList();
