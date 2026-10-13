# 할 일 드래그 회귀 테스트와 빌드

## 검증 대상

- 작업 문서: `../task.md`
- 검증 항목: 드래그 표시, 순서·부모 계산, 정적 검증 및 앱 빌드
- 대상 경로/URL/ID: `src/lib/todoDrag.ts`, `src/lib/todoDrag.test.ts`, `src/lib/todoTree.test.ts`

## 실행 환경

- 실행 일시: 2026-10-01, 기록 갱신 2026-10-01T19:06:11+09:00
- 실행 위치: `<저장소>`
- 기준 브랜치/커밋: `jun/1`, `fb7171f` 기준 변경
- 실행 환경: macOS, 프로젝트의 pnpm·Vitest·TypeScript·Tauri

## 실행 내용

1. `pnpm exec vitest run src/lib/todoDrag.test.ts src/lib/todoTree.test.ts`
2. `pnpm exec tsc --noEmit`
3. `pnpm test:ts`
4. `pnpm tauri build --bundles app` (내부 `pnpm build` 실행)
5. 작업 문서 기본·category 구조 validator 실행

## 결과

| 검증 | 결과 |
| --- | --- |
| 대상 드래그·트리 테스트 | 2개 파일, 48개 테스트 통과 |
| 전체 프론트엔드 테스트 | 45개 파일, 587개 테스트 통과 |
| TypeScript 검사 | 종료 코드 0 |
| 프론트 빌드 | 성공, 2722개 모듈 변환 |
| Tauri release 앱 번들 | 성공 |
| 작업 문서 validator | 두 모드 모두 오류 0, 경고 0 (이슈 링크 반영 후) |

새 드래그 회귀 테스트는 원본·하위 항목 유지, 다른 행의 transform 미사용, 상하 이동, 가로 이동에 따른 부모 변경, 스크롤 뒤 좌표 재계산, 그리기 대기 중 mouseup 좌표, Esc·창 포커스 해제·화면 전환 취소, 손잡이 클릭을 다룬다.

- 기존 빌드 경고: 큰 프론트 청크, Rust의 미사용 함수·필드 2건. 빌드 실패 없음.
- Rust 코드는 변경하지 않았고 Rust 단위 테스트는 실행하지 않았다.
- `.github` CI 구성과 `package.json`의 별도 린트 스크립트는 없다. `scripts/lint-svg.mjs`는 노트의 SVG 도형 검사이므로 이번 DOM·CSS 변경에 적용하지 않았다.
- 번들: `<저장소>/src-tauri/target/release/bundle/macos/Amber.app`

## 판단

- 결과: 통과
- 요약: 드래그 회귀와 전체 프론트엔드 테스트, TypeScript 검사, 설치 가능한 앱 빌드가 통과했다.
- 근거: 명령 실행 결과 및 [설치 앱 검증](02-runtime-smoke.md).
- 남은 리스크: jsdom은 실제 브라우저 레이아웃을 계산하지 않으므로 화면·저장 검증을 별도로 수행했다.
