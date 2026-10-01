---
category: "개발"
---

# 할 일 드래그 중 목록 튐 수정

## 문서 위치

- Project: 현재 Amber 저장소
- Task: `docs/2026-10-01-todo-drag/`
- 검증 문서: `valid/`

## 목표

드래그 중 목록과 스크롤이 튀지 않고, 삽입선이 가리킨 위치로 순서·부모 관계가 저장된다.

## Issue 및 PR

- Issue: [#1](https://github.com/junhyoung-kim-dev/amber/issues/1)
- PR: 생성 예정 (`ts-kyungjun:jun/1` → `junhyoung-kim-dev:main`)
- Branch: `jun/1` (포크)
- Commit: `fb7171f` 기준, 이번 브랜치 HEAD에서 변경 추적

## 현재 기준 확인 내용

- 사용자가 확인한 증상: 드래그 중 화면이나 항목이 튀고 놓기 어려움.
- `TodoView.startDrag`가 원본 서브트리를 `display:none`으로 제거한 후 후보 좌표를 고정하고, 행마다 transform을 적용한다.
- `resolveDrop`이 부모와 형제 순서를 계산하고 `reparentTodo`, `reorderTodos`가 저장한다.

## 구현 계약

- 기대 동작: 드래그 중 기존 목록 배치 유지, 원본 흐림·이동 오버레이·삽입선 표시, 스크롤 뒤 현재 좌표로 판정.
- 변경 대상: `src/components/TodoView.tsx`, 드래그 DOM 계층, `src/styles.css` 및 회귀 테스트.
- 호환성: 기존 순서·부모 계산과 DB 스키마 유지.
- 상태 변경과 부작용: 드롭한 항목의 부모와 형제 순서만 기존 저장 경로로 갱신.
- 제외: 업무·리포트·휴가 데이터 이관 수정.

## 작업별 체크리스트

### 1. 드래그 피드백과 정리

- [x] 원본을 제거하지 않고 목록 크기를 유지한다.
- [x] 스크롤 좌표와 삽입선 계산을 일치시킨다.
- [x] Esc·창 포커스 해제·화면 전환 시 드래그를 취소하고 시각 효과를 정리한다.

### 2. 회귀 확인과 설치 앱 반영

- [x] 상하 이동·하위 이동·취소·스크롤 회귀 테스트를 수행한다.
- [x] 빌드 후 설치 앱을 갱신하고 실제 화면에서 드래그 결과를 확인한다.

## 검증 계획

### 1. 대상 테스트와 정적 검증

- [x] 드래그·트리 테스트와 프론트 빌드
  - 문서: [01-targeted-tests.md](valid/01-targeted-tests.md)

### 2. 실제 동작 검증

- [x] 앱에서 순서 이동·하위 이동·데이터 보존 확인
  - 문서: [02-runtime-smoke.md](valid/02-runtime-smoke.md)

## 검증 문서

- [01-targeted-tests.md](valid/01-targeted-tests.md)
- [02-runtime-smoke.md](valid/02-runtime-smoke.md)

## 남은 리스크

- 자동 테스트·설치 앱 검증 완료. 드래그 중 포인터와 휠 스크롤의 연속 조합은 DOM 회귀 테스트로 확인했고, 실제 앱에서는 긴 목록을 스크롤한 뒤 드롭 결과를 확인했다.
- 수정된 macOS 설치 앱 실행 중. 이전 앱과 DB, 전체 로컬 검증 자료는 원격 저장소 밖에 백업했다.
- 기존 13개 테이블의 내용 해시 동일. 임시 검증 항목 54개 정리 완료.
