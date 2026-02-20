# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

'블럭 식스 플래너(Block Six Planner)' — a browser-only planner web app with two modes:
1. **Daily Planner** (`planner.html`) — 6 time blocks per day, each with 3 checkboxes, 3 task lines, and a memo area. Footer captures MEMO / GOOD / BAD / NEXT reflections.
2. **Weekly Planner** (`week.html`) — 6 blocks × 7 days grid. Cells are color-coded by text content. Includes Pre-Check List and Block Calculation table (가용블럭).

All data is persisted in `localStorage`. No backend, no build step.

## Actual File Structure

```
6block/
├── index.html          # Entry point: lists all planners, "오늘 플래너 열기" / "이번 주 플래너" / "날짜 선택" buttons
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
      "timeLabel": "",
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

- `checks[i]` ↔ `tasks[i]`: 왼쪽 체크박스와 할 일 텍스트 줄이 1:1 연동 (체크 시 취소선)
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
  "createdAt": "2026-02-17T09:00:00",
  "updatedAt": "2026-02-17T09:00:00"
}
```

- `cells[blockIdx][dayIdx]`: 6행(블럭) × 7열(월~일), 각 셀 `{ text, color }`
- `color`: `text` 기준 자동 배정 파스텔 색상 (고명도 중저채도 18색 팔레트)
- 같은 `text` → 항상 같은 `color` (페이지 로드 시 `colorMap` 재구성)
- `preChecks`: Pre-Check List 항목. `value` 필드가 있는 항목은 인라인 텍스트 입력 가능
- Pre-Check 체크박스 체크 시 시각 변화(취소선 등) 없음 — 데이터만 저장

## Architecture Notes

### 공통
- **No build step** — `index.html`을 브라우저에서 직접 열면 동작 (`file://` 호환)
- **All JS inlined** — 각 HTML 파일의 `<script>` 태그 안에 모든 로직 포함. ES module 사용 금지
- **Auto-save** — 모든 입력은 500ms 디바운스 후 `localStorage`에 저장. 별도 저장 버튼 없음
- **Title editing** — 제목 `<span>` 클릭 시 `<input>`으로 전환, blur 시 `customTitle`에 저장
- **Korean locale** — 날짜는 `YYYY년 M월 D일 (요일)` 형식. 주간은 `YYYY년 M월 N번째 주`

### index.html
- 월별 그룹 내에서 **주간 플래너가 일간 플래너보다 위**에 표시
- 주간 플래너: 파란색 "주간" 배지 (`item-type-badge`), `week-item` 클래스
- "이번 주 플래너" 버튼 → 해당 주 월요일 ID로 `week.html?week=YYYY-MM-DD`
- "오늘 플래너 열기" → `planner.html?date=YYYY-MM-DD`
- "날짜 선택" 버튼에 hover 툴팁 (버튼 아래쪽 표시, `top: calc(100% + 8px)`)

### planner.html
- **Grid columns**: `44px 64px 52px 1fr 1fr` (번호/시간/체크박스/할일/메모)
- **Divider lines** (점심/저녁): `plannerData.dividers = [2, 4]` — 드래그로 위치 변경
  - `.divider-row { height: 20px }` 로 클릭 영역 확보 필수 (height:0 금지)
  - `.divider-line`, `.divider-label` 에 `pointer-events: none` — 클릭은 부모 wrap에서 처리
  - `getBlockRowByY(y)`: y좌표 기준으로 nearest block-row 탐지 (divider-row 위에서도 안정)
- **Block drag**: 핸들(`≡`)에서만 시작. `swapBlockContent()` — id(번호) 제외하고 내용만 교체
- **Migration**: `migratePlanner()` — 구버전 데이터에 `tasks[]`, `dividers` 필드 추가

### week.html
- **주간 ID**: 해당 주 월요일 날짜 (`getWeekMonday()` 계산)
- **Grid**: `6.5% repeat(7, 1fr)` — `min-width` 없음, 화면 너비에 비례해 자동 축소
- **폰트/높이**: `clamp()` 함수로 모든 크기 자동 조정 → 모바일에서도 7일이 모두 보임
- **Color system**: `colorMap{}` (전역) — `text → color` 매핑. 로드 시 저장된 cells에서 재구성
- **Cell drag**: 셀 우상단 `⠿` 핸들에서 mousedown/touchstart → `swapCells()` → `renderGrid()` + `renderCalc()`
- **Block Calc (영역3)**: `cells` 전체를 집계해 텍스트별 count 표시. 총 42칸 - 사용 = 가용블럭
- **Pre-Check (영역2)**: `preChecks` 배열이 없거나 빈 배열이면 `defaultPreChecks()`로 마이그레이션
- **Migration guard**: `!weekData.preChecks || weekData.preChecks.length === 0` 조건으로 빈 배열도 처리

## CSS Key Points

### main.css
- CSS 변수: `--accent: #e8500a`, `--border-strong: #1a1a1a`, `--bg: #f5f5f5`, `--surface: #fff`
- `.tooltip-box`: `top: calc(100% + 8px)` (버튼 아래), `::after`는 `border-bottom-color` (위쪽 화살표)
- `.week-item`: 파란 계열 (`#4a7ce0`) 배지/강조 — 주황 accent와 구분

### week.css
- 그리드에 `min-width` 사용 금지 — `clamp()` + 비율 단위(`%`, `1fr`)로 반응형 처리
- `.week-cell-input`: `font-size: clamp(9px, 1.5vw, 13px)` — 화면 축소 시 자동 소형화
- `.pre-value-input`: 밑줄 스타일 인라인 입력 (`border-bottom`만 있음, border 없음)
- Pre-Check 체크 시 텍스트 변화 없음 (`.pre-checked .pre-text` 스타일 없음)

## Development

No dependencies, no build tools required.

```bash
# 직접 열기 (권장 — 서버 불필요)
# index.html을 브라우저에서 더블클릭

# 또는 서버로 실행
npx serve .
python -m http.server 8080
```

## Common Pitfalls

- **ES module 사용 금지**: `type="module"` + `import` 구문은 `file://`에서 CORS 오류 발생
- **divider-row height:0 금지**: 클릭 영역이 없어 드래그가 동작하지 않음
- **week.html preChecks 빈 배열 처리**: `!preChecks`만으로는 `[]` 감지 불가 → `length === 0` 조건 추가 필수
- **colorMap 재구성**: 페이지 새로고침 시 `rebuildColorMap()` 호출 필요 (저장된 color 값으로 복원)
- **셀 드래그**: `week-cell-input`이 셀 전체를 덮으므로 반드시 별도 핸들 요소에만 mousedown 바인딩
