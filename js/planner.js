import { getPlanner, savePlanner, createPlanner } from './storage.js';
import { todayId, formatTitle } from './date.js';

// URL에서 date 파라미터 추출
const params = new URLSearchParams(location.search);
const dateId = params.get('date') || todayId();

let data = getPlanner(dateId);
if (!data) {
  data = createPlanner(dateId, formatTitle(dateId));
}

// DOM refs
const titleSpan = document.getElementById('planner-title');
const titleInput = document.getElementById('planner-title-input');
const dayLabel = document.getElementById('day-label');
const blocksContainer = document.getElementById('blocks-container');
const footerMemo = document.getElementById('footer-memo');
const footerGood = document.getElementById('footer-good');
const footerBad = document.getElementById('footer-bad');
const footerNext = document.getElementById('footer-next');
const saveIndicator = document.getElementById('save-indicator');

// 요일 레이블
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
function getDayLabel(id) {
  const [y, m, d] = id.split('-').map(Number);
  return DAYS[new Date(y, m - 1, d).getDay()];
}

// 자동 저장 debounce
let saveTimer = null;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveIndicator.textContent = '저장 중...';
  saveTimer = setTimeout(() => {
    savePlanner(data);
    saveIndicator.textContent = '저장됨 ✓';
    setTimeout(() => { saveIndicator.textContent = ''; }, 1500);
  }, 500);
}

// 제목 렌더
function renderTitle() {
  const display = data.customTitle || data.title;
  titleSpan.textContent = display;
  titleInput.value = display;
  dayLabel.textContent = getDayLabel(dateId);
}

// 제목 편집 토글
titleSpan.addEventListener('click', () => {
  titleSpan.hidden = true;
  titleInput.hidden = false;
  titleInput.focus();
  titleInput.select();
});

titleInput.addEventListener('blur', commitTitle);
titleInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') titleInput.blur();
  if (e.key === 'Escape') {
    titleInput.value = data.customTitle || data.title;
    titleInput.blur();
  }
});

function commitTitle() {
  const val = titleInput.value.trim();
  if (val && val !== (data.customTitle || data.title)) {
    data.customTitle = val;
    scheduleSave();
  }
  titleSpan.textContent = data.customTitle || data.title;
  titleSpan.hidden = false;
  titleInput.hidden = true;
}

// 블럭 렌더
function renderBlocks() {
  blocksContainer.innerHTML = '';
  data.blocks.forEach(block => {
    const el = document.createElement('div');
    el.className = 'block-row';
    el.dataset.blockId = block.id;
    el.innerHTML = `
      <div class="block-num">${block.id}</div>
      <div class="block-time">
        <input class="time-input" type="text" placeholder="시간" value="${escHtml(block.timeLabel)}" maxlength="10">
      </div>
      <div class="block-checks">
        ${block.checks.map((checked, ci) => `
          <label class="check-label">
            <input type="checkbox" data-ci="${ci}" ${checked ? 'checked' : ''}>
            <span class="checkmark"></span>
          </label>
        `).join('')}
      </div>
      <div class="block-task">
        <textarea class="task-input" placeholder="할 일을 입력하세요..." rows="3">${escHtml(block.task)}</textarea>
      </div>
      <div class="block-memo">
        <textarea class="memo-input" placeholder="메모..." rows="3">${escHtml(block.memo)}</textarea>
      </div>
    `;

    // 이벤트 바인딩
    el.querySelector('.time-input').addEventListener('input', e => {
      block.timeLabel = e.target.value;
      scheduleSave();
    });

    el.querySelectorAll('input[type=checkbox]').forEach(cb => {
      cb.addEventListener('change', e => {
        block.checks[+e.target.dataset.ci] = e.target.checked;
        scheduleSave();
      });
    });

    el.querySelector('.task-input').addEventListener('input', e => {
      block.task = e.target.value;
      autoResize(e.target);
      scheduleSave();
    });

    el.querySelector('.memo-input').addEventListener('input', e => {
      block.memo = e.target.value;
      autoResize(e.target);
      scheduleSave();
    });

    blocksContainer.appendChild(el);
  });
}

// 푸터 렌더 & 바인딩
function renderFooter() {
  footerMemo.value = data.footer.memo;
  footerGood.value = data.footer.good;
  footerBad.value = data.footer.bad;
  footerNext.value = data.footer.next;

  [footerMemo, footerGood, footerBad, footerNext].forEach(el => {
    autoResize(el);
    el.addEventListener('input', () => {
      data.footer[el.dataset.key] = el.value;
      autoResize(el);
      scheduleSave();
    });
  });
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// 초기화
renderTitle();
renderBlocks();
renderFooter();
