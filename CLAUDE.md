# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

'블럭 식스 플래너(Block Six Planner)' — a browser-only planner web app with two modes:
1. **Daily Planner** (`planner.html`) — 6 time blocks per day. 각 블럭은 다음으로 구성:
   - **큰 목표(대주제) 칸** — 블럭 전체를 관통하는 큰 범위의 할 일 (예: "강의 듣기", "모닝 루틴 수행", "그래픽 강의 듣고 응용해보기"). 코드상 변수명 `block.timeLabel`, CSS 클래스 `.time-input` — **시간 입력칸이 아님**, 레거시 네이밍 주의.
   - **체크리스트(세부 할 일) 3줄** — 큰 목표의 세부 항목 (예: "1강", "2강", "3강" / "요가", "명상", "아침체조"). `block.tasks[]`에 저장, 체크박스와 1:1 연동.
   - **메모 칸** — 자유 메모. `block.memo`.
   - **푸터**: 하루 전체 MEMO / GOOD / BAD / NEXT 회고.
2. **Weekly Planner** (`week.html`) — 6 blocks × 7 days grid. Cells are color-coded by text content. Includes Pre-Check List and Block Calculation table (가용블럭 / 실천 입력).

Data is persisted in both `localStorage` (offline cache) and **Firebase Firestore** (cloud sync).
Authentication is handled by **Firebase Auth (Google Sign-In)**.

## Hosting & Deployment

- **Live URL**: https://krsu0000.github.io/web_app_6
- **GitHub repo**: https://github.com/Krsu0000/web_app_6
- **Branch**: `main` → GitHub Pages auto-deploys on push

### Deploy workflow
```bash
cd C:\Users\pc\Desktop\6block
git add .
git commit -m "message"
git push origin main
# GitHub Pages 자동 배포 (1~2분 소요)
```

## Firebase Configuration

- **Project ID**: `cellular-unity-445007-p8`
- **Auth domain**: `cellular-unity-445007-p8.firebaseapp.com`
- **Firebase Console**: https://console.firebase.google.com → cellular-unity-445007-p8

### Firebase SDK 로드 방식
CDN compat build (ES module 금지 — `file://` 호환 및 인라인 스크립트 사용):
```html
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
```

### Firestore 데이터 구조
```
users/
  {uid}/
    planners/
      {YYYY-MM-DD}   ← daily planner document
    weeks/
      {YYYY-MM-DD}   ← weekly planner document (Monday date)
```

### Firestore 보안 규칙
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Auth 설정 (Console에서 완료된 항목)
- Google Sign-In: **활성화됨**
- 승인된 도메인: `localhost`, `krsu0000.github.io` 등록 완료

## Sync Architecture

저장 시 localStorage + Firestore **동시 저장** (듀얼 저장):
- `savePlanner(data)` → `savePlannerLocal()` + `savePlannerCloud()` (fire-and-forget)
- `saveWeekPlanner(data)` → `saveWeekLocal()` + `saveWeekCloud()` (fire-and-forget)

로드 시 **localStorage 우선 즉시 렌더 → Firestore에서 최신 데이터로 갱신**:
1. localStorage 데이터 있으면 즉시 `boot()` (빠른 초기 렌더)
2. 로그인 상태면 Firestore에서 fetch
3. `updatedAt` 타임스탬프 비교 → 클라우드가 더 최신이면 재렌더 + localStorage 덮어쓰기

비로그인 상태: localStorage만 사용 (기존 동작과 동일, 하위 호환)

### index.html 추가 기능
- **Auth bar** (헤더 우상단): 로그인 시 Google 프로필 사진 + 이름 + 로그아웃 버튼. 비로그인 시 "Google로 로그인" 버튼
- **Sync bar** (헤더 아래): 동기화 상태 표시 (`syncing` → `synced` → 사라짐)
- 로그인 시 `syncFromCloud()` 호출 → 전체 플래너 목록을 Firestore에서 받아 localStorage에 저장 후 `renderList()`

## Actual File Structure

```
6block/
├── index.html          # Entry point: lists all planners, auth UI, sync bar
├── planner.html        # Daily planner editor  (?date=YYYY-MM-DD)
├── week.html           # Weekly planner editor (?week=YYYY-MM-DD  ← Monday date)
├── css/
│   ├── main.css        # Shared styles, CSS variables, typography, index page, tooltip, week-item badge
│   ├── planner.css     # Daily block grid, checkbox, drag handle, divider line styles
│   ├── week.css        # Weekly grid, cell drag, Pre-Check List, Block Calc table styles
│   └── mobile.css      # Responsive overrides for planner.html (≤768 px)
└── assets/
    └── favicon.ico
```

> **Note:** The `js/` directory exists but is NOT used. All JavaScript is inlined inside `<script>` tags in each HTML file to ensure compatibility with the `file://` protocol (no server required).

## localStorage Key Schema

| Key pattern | Used by | Content |
|---|---|---|
| `planner_YYYY-MM-DD` | `planner.html`, `index.html` | Daily planner data |
| `week_YYYY-MM-DD` | `week.html`, `index.html` | Weekly planner data (Monday date) |

## Data Models

### Daily Planner — `planner_YYYY-MM-DD`

```json
{
  "id": "2026-02-20",
  "title": "2026년 2월 20일 (목)",
  "customTitle": null,
  "blocks": [
    {
      "id": 1,
      "timeLabel": "",   // ← 큰 목표(대주제) 입력값. 변수명·CSS명이 'time'이지만 시간이 아님!
      "checks": [false, false, false],
      "task": "",
      "memo": "",
      "tasks": [
        { "text": "", "done": false },
        { "text": "", "done": false },
        { "text": "", "done": false }
      ]
    }
  ],
  "dividers": [2, 4],
  "footer": { "memo": "", "good": "", "bad": "", "next": "" },
  "createdAt": "2026-02-20T09:00:00",
  "updatedAt": "2026-02-20T09:00:00"
}
```

- **`timeLabel`** (⚠️ 네이밍 주의): 블럭의 **큰 목표(대주제)**를 저장. CSS 클래스 `.time-input`, DOM 요소 `<textarea class="time-input">`. 절대 시간 입력 필드가 아님. 코드 수정 시 혼동 금지.
- **`tasks[]`**: 큰 목표의 세부 체크리스트. `checks[i]` ↔ `tasks[i].done` 1:1 연동 (체크 시 취소선)
- `dividers`: 기준선이 몇 번 블럭 아래에 위치하는지 (1~5, 기본 [2,4] = 점심/저녁)
- `task`: 구버전 호환용 필드 (현재는 `tasks[]` 사용)
- `customTitle`: null이면 자동 생성 한국어 날짜, 문자열이면 사용자 편집 제목

### Weekly Planner — `week_YYYY-MM-DD` (Monday)

```json
{
  "id": "2026-02-17",
  "title": "2026년 2월 3번째 주",
  "customTitle": null,
  "mondayDate": "2026-02-17",
  "cells": [
    [
      { "text": "회사", "color": "#CCE4F5" },
      { "text": "회사", "color": "#CCE4F5" }
    ]
  ],
  "preChecks": [
    { "id": 1, "checked": false, "text": "이번 주 CORE BLOCK :", "value": "" },
    { "id": 2, "checked": false, "text": "목표를 달성하기 위한 타임블럭 개수 :", "value": "" },
    { "id": 3, "checked": false, "text": "목표를 위한 타임블럭 양이",
      "options": ["충분","적당","부족"], "selectedOption": null },
    { "id": 4, "checked": false, "text": "목표를 위한 타임블럭 양이 부족하다고 생각된다면", "value": "",
      "subItems": [
        { "id": 41, "checked": false, "text": "더 비워낼 수 있는 블록은 없나요?", "value": "" },
        { "id": 42, "checked": false, "text": "목표 수정이 필요한가요?", "value": "" }
      ]
    }
  ],
  "actuals": { "회사": 5, "운동": 3 },
  "createdAt": "2026-02-17T09:00:00",
  "updatedAt": "2026-02-17T09:00:00"
}
```

- `cells[blockIdx][dayIdx]`: 6행(블럭) × 7열(월~일), 각 셀 `{ text, color }`
- `color`: `text` 기준 자동 배정 파스텔 색상 (고명도 중저채도 18색 팔레트)
- 같은 `text` → 항상 같은 `color` (페이지 로드 시 `colorMap` 재구성)
- `preChecks`: Pre-Check List 항목. `value` 필드가 있는 항목은 인라인 텍스트 입력 가능
- Pre-Check 체크박스 체크 시 시각 변화(취소선 등) 없음 — 데이터만 저장
- **`actuals`**: `{ [텍스트]: 숫자 }` 형태. 블럭 계산표(영역3)의 실천 칸 입력값. 마이그레이션: 없으면 `{}` 자동 초기화

## Architecture Notes

### 공통
- **No build step** — `index.html`을 브라우저에서 직접 열면 동작 (`file://` 호환)
- **All JS inlined** — 각 HTML 파일의 `<script>` 태그 안에 모든 로직 포함. ES module 사용 금지
- **Auto-save** — 모든 입력은 500ms 디바운스 후 localStorage + Firestore에 저장. 별도 저장 버튼 없음
- **Title editing** — 제목 `<span>` 클릭 시 `<input>`으로 전환, blur 시 `customTitle`에 저장
- **Korean locale** — 날짜는 `YYYY년 M월 D일 (요일)` 형식. 주간은 `YYYY년 M월 N번째 주`
- **Auth state** — `auth.onAuthStateChanged(user => { currentUser = user; loadPlanner/loadWeekPlanner(); })` 패턴. 각 페이지 로드 시 인증 상태 확인 후 데이터 로드

### index.html
- 월별 그룹 내에서 **주간 플래너가 일간 플래너보다 위**에 표시
- 주간 플래너: 파란색 "주간" 배지 (`item-type-badge`), `week-item` 클래스
- "이번 주 플래너" 버튼 → 해당 주 월요일 ID로 `week.html?week=YYYY-MM-DD`
- "오늘 플래너 열기" → `planner.html?date=YYYY-MM-DD`
- "날짜 선택" 버튼에 hover 툴팁 (버튼 아래쪽 표시, `top: calc(100% + 8px)`)
- **Auth bar**: `#auth-bar` div — JS로 동적 렌더. 로그인 시 avatar + name + 로그아웃, 비로그인 시 Google 로그인 버튼
- **Sync bar**: `#sync-bar` div — class `hidden` / `syncing` / `synced` 로 상태 전환

### planner.html
- **Grid columns (PC)**: `44px 92px 1fr 0.62fr` (번호 / 큰목표 / 할일+체크박스 / 메모)
- **Grid columns (태블릿 601~768px)**: `32px 72px 44px 1fr 0.62fr` (번호 / 큰목표 / 체크박스별도 / 할일 / 메모)
- **Grid columns (모바일 ≤600px)**: `36px 1fr` 2열 스택 레이아웃 (번호 | 큰목표→할일→메모 수직)
- **⚠️ `.block-time` / `.time-input` 네이밍**: CSS 클래스명과 변수명은 `time`이지만 실제 용도는 **블럭의 큰 목표(대주제) 입력 칸**. 폰트: SUIT Variable 14px/700. 절대 시간 필드로 오해하지 말 것.
- **Click-to-focus 패턴**: wrapper div 클릭 시 내부 input/textarea에 포커스 전달 → `div.addEventListener('click', () => input.focus())`. `.block-time`과 주간 `.calc-actual`에 적용됨.
- **Divider lines** (점심/저녁): `plannerData.dividers = [2, 4]` — 드래그로 위치 변경
  - `.divider-row { height: 20px }` 로 클릭 영역 확보 필수 (height:0 금지)
  - `.divider-line`, `.divider-label` 에 `pointer-events: none` — 클릭은 부모 wrap에서 처리
  - `getBlockRowByY(y)`: y좌표 기준으로 nearest block-row 탐지 (divider-row 위에서도 안정)
- **Block drag**: 핸들(`≡`)에서만 시작. `swapBlockContent()` — id(번호) 제외하고 내용만 교체
- **grow-wrap (task-line textarea 자동 높이)**: JS `scrollHeight` 없이 순수 CSS로 textarea 높이 자동 확장. `<span class="task-line-grow" data-value="...">` wrapper에 `display:grid` + `::after { content: attr(data-value) " "; grid-area: 1/1; }` + textarea `grid-area: 1/1`. 입력 시 `grow.dataset.value = ta.value` 업데이트 필수.
- **Migration**: `migratePlanner()` — 구버전 데이터에 `tasks[]`, `dividers` 필드 추가
- **Boot flow**: `auth.onAuthStateChanged` → `loadPlanner()` → localStorage 즉시 렌더 → Firestore 갱신

### week.html
- **주간 ID**: 해당 주 월요일 날짜 (`getWeekMonday()` 계산)
- **Grid**: `6.5% repeat(7, 1fr)` — `min-width` 없음, 화면 너비에 비례해 자동 축소
- **폰트/높이**: `clamp()` 함수로 모든 크기 자동 조정 → 모바일에서도 7일이 모두 보임
- **Color system**: `colorMap{}` (전역) — `text → color` 매핑. 로드 시 저장된 cells에서 재구성
- **Cell drag**: 셀 우상단 `⠿` 핸들에서 mousedown/touchstart → `swapCells()` → `renderGrid()` + `renderCalc()`
- **Block Calc (영역3)**: `cells` 전체를 집계해 텍스트별 count 표시. 총 42칸 - 사용 = 가용블럭. 실천 칸(`calc-actual`)은 편집 가능한 `<input type="number">`로, 값은 `weekData.actuals[text]`에 저장.
- **renderCalc() 구현 방식**: `innerHTML +=` 사용 금지 — 이벤트 리스너 부착 불가. 반드시 `document.createElement()` DOM 생성 방식 사용.
- **Pre-Check (영역2)**: `preChecks` 배열이 없거나 빈 배열이면 `defaultPreChecks()`로 마이그레이션
- **Migration guard**: `!weekData.preChecks || weekData.preChecks.length === 0` 조건으로 빈 배열도 처리. `actuals`도 동일: `if (!weekData.actuals) weekData.actuals = {}`.
- **Boot flow**: `auth.onAuthStateChanged` → `loadWeekPlanner()` → localStorage 즉시 렌더 → Firestore 갱신

## CSS Key Points

### main.css
- **CSS 변수 (M3 토큰)**: `--md-primary: #B94400`, `--md-primary-container: #FFDBCC`, `--md-tertiary: #4A6CE0`, `--md-surface: #FAFAFA`, `--md-on-surface: #201A18`
- **폰트 변수**: `--font-body: 'Noto Sans KR'` (본문 전용), `--font-ui: 'SUIT Variable'` (UI·헤딩·큰목표칸 전용)
- **SUIT 폰트 적용 대상**: `.app-header .logo`, `.btn`, `#planner-title`, `.time-input`, `.block-num-label`, `.col-header span` 등 — 본문(task·memo·footer)은 Noto 유지
- `.tooltip-box`: `top: calc(100% + 8px)` (버튼 아래), `::after`는 `border-bottom-color` (위쪽 화살표)
- `.week-item`: Tertiary 계열 (`--md-tertiary: #4A6CE0`) 배지/강조 — 주황 primary와 구분

### planner.css
- **Grid**: `44px 92px 1fr 0.62fr` (번호 / 큰목표 / 할일 / 메모) — 큰목표 넓고 메모 작게
- **`.time-input`**: SUIT Variable, `font-size: 14px`, `font-weight: 700`, `font-family: var(--font-ui)` 명시
- **grow-wrap**: `.task-line-grow { display: grid }` + `::after { content: attr(data-value) " "; grid-area: 1/1 }` + `.task-line-text { grid-area: 1/1 }` — textarea 자동 높이

### week.css
- 그리드에 `min-width` 사용 금지 — `clamp()` + 비율 단위(`%`, `1fr`)로 반응형 처리
- `.week-cell-input`: `font-size: clamp(9px, 1.5vw, 13px)` — 화면 축소 시 자동 소형화
- `.pre-value-input`: 밑줄 스타일 인라인 입력 (`border-bottom`만 있음, border 없음)
- Pre-Check 체크 시 텍스트 변화 없음 (`.pre-checked .pre-text` 스타일 없음)
- **`.calc-actual-input`**: flex 컨테이너 안에서 `align-self: stretch` 사용 (`height: 100%` 사용 금지 — flex+min-height 조합 시 높이 0으로 수렴해 클릭 불가). 숫자 스피너 제거: `-webkit-appearance: none` + `-moz-appearance: textfield`

## Development

No dependencies, no build tools required.

```bash
# 로컬 테스트 (Google 로그인은 localhost에서만 동작, file:// 불가)
npx serve .
python -m http.server 8080
# → http://localhost:8080 으로 접속

# 배포
git add .
git commit -m "message"
git push origin main
```

> **중요**: Google 로그인은 `file://` 프로토콜에서 동작하지 않음.
> 로컬 테스트 시 반드시 로컬 서버(`localhost`) 사용.

## Common Pitfalls

- **`.time-input` = 큰목표 칸**: 변수명(`timeLabel`)·클래스명(`.time-input`, `.block-time`)이 모두 'time'이지만 **시간 입력 필드가 아님**. 블럭의 대주제(큰 범위 할 일)를 입력하는 칸. 수정 시 절대 혼동 금지.
- **`renderCalc()` innerHTML += 금지**: 이벤트 리스너를 붙일 수 없음 → `document.createElement()` 방식 필수
- **flex 자식에 `height: 100%` 금지 (min-height만 있는 부모)**: flex 컨테이너가 `min-height`만 가질 때 자식 `height: 100%`는 0으로 수렴 → 클릭 불가. `align-self: stretch` 사용.
- **ES module 사용 금지**: `type="module"` + `import` 구문은 `file://`에서 CORS 오류 발생
- **divider-row height:0 금지**: 클릭 영역이 없어 드래그가 동작하지 않음
- **week.html preChecks 빈 배열 처리**: `!preChecks`만으로는 `[]` 감지 불가 → `length === 0` 조건 추가 필수
- **week.html actuals 마이그레이션**: 기존 저장 데이터에 `actuals` 없을 수 있음 → `if (!weekData.actuals) weekData.actuals = {}` 필수
- **colorMap 재구성**: 페이지 새로고침 시 `rebuildColorMap()` 호출 필요 (저장된 color 값으로 복원)
- **셀 드래그**: `week-cell-input`이 셀 전체를 덮으므로 반드시 별도 핸들 요소에만 mousedown 바인딩
- **Firebase 도메인 미등록**: 새 도메인에 배포 시 Firebase Console → Authentication → Settings → 승인된 도메인에 추가 필수. 미등록 시 `auth/operation-not-allowed` 오류 발생
- **Google 로그인 비활성화**: Firebase Console → Authentication → Sign-in method → Google 반드시 활성화
- **Firestore 규칙**: 테스트 모드 30일 만료 주의. 위의 보안 규칙으로 교체 필수
- **로컬 file:// 테스트**: Google 로그인 팝업이 `file://`에서 차단됨 → `npx serve .` 또는 `python -m http.server` 사용
