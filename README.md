# Amber

로컬 우선 macOS 데스크탑 앱입니다. 할 일과 타임테이블, 마크다운 노트, mermaid 다이어그램과
DB 스키마 ERD, AI 데일리/주간 리포트를 한 곳에서 다룹니다. 데이터는 전부 내 Mac 에 파일로 남고
서버나 계정은 없습니다.

이 문서는 설치와 초기 세팅 안내서입니다.

## 요구사항

- macOS, Xcode Command Line Tools
- Rust 툴체인 ([rustup](https://rustup.rs))
- Node.js 20 이상, [pnpm](https://pnpm.io)
- 선택, AI 기능: [Claude Code](https://claude.com/claude-code) 또는 [Codex CLI](https://developers.openai.com/codex) 설치 후 로그인
- 선택, 리포트: [`gh`](https://cli.github.com) 로그인
- 선택, DB 동기화: `information_schema` 를 읽을 수 있는 MySQL 계정

## 1. 툴체인 설치 (처음 한 번)

```bash
xcode-select --install                                          # clang, git
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh  # rustc, cargo (stable)
corepack enable && corepack prepare pnpm@latest --activate      # pnpm (또는 brew install pnpm)
```

설치가 끝나면 터미널을 새로 열어야 `cargo` 가 `PATH` 에 잡힙니다. Tauri CLI 는 dev 의존성이라
`pnpm install` 이 같이 받아 옵니다. 따로 전역 설치할 것은 없습니다.

## 2. 빌드하고 설치

```bash
git clone https://github.com/junhyoung-kim-dev/amber && cd amber
pnpm install
pnpm tauri build --bundles app
ditto src-tauri/target/release/bundle/macos/Amber.app /Applications/Amber.app
```

- 첫 빌드는 Rust 쪽을 컴파일하느라 몇 분 걸립니다.
- `--bundles app` 은 `.dmg` 없이 `.app` 만 만듭니다.
- 내 Mac 에서 직접 빌드한 앱은 격리 표시가 붙지 않아서, 서명이 없어도 Gatekeeper 경고 없이 열립니다.

## 3. 첫 실행 세팅

첫 실행 때 온보딩이 로그인 셸의 `PATH` 에서 AI CLI 를 찾습니다. 앱은 API 키를 저장하지 않고
각 CLI 의 로그인 세션을 그대로 씁니다. 토큰이 만료되면 앱 안에서 다시 로그인할 수 있습니다.

나머지는 설정(`⌘,`)에서 합니다.

| 탭 | 할 일 |
|---|---|
| AI | 쓸 CLI, 모델, 응답 언어 |
| 프롬프트 | 노트 AI 에서 칩으로 쓰는 저장 프롬프트 |
| 데일리 리포트 | 읽을 소스와 순서. GitHub 활동(`gh`), Claude Code / Codex 세션 기록. Slack, Notion 은 Claude Code 에 등록된 MCP 서버로 읽습니다(읽기 전용) |
| 데이터베이스 | MySQL 연결. 비밀번호는 macOS 키체인에만 저장됩니다 |
| 모양 | 테마, UI 언어(한국어 / English) |

노트와 다이어그램 트리는 원하는 폴더(git 저장소 등)를 루트로 열 수 있습니다.

## 4. 업데이트

설치된 앱은 스스로 업데이트되지 않습니다. 최신 소스를 받아 다시 빌드합니다.

```bash
git pull
pnpm install
pnpm tauri build --bundles app
```

Amber 를 종료(`⌘Q`)한 뒤 앱을 바꿔 끼웁니다.

```bash
rm -rf /Applications/Amber.app && ditto src-tauri/target/release/bundle/macos/Amber.app /Applications/Amber.app
```

## 데이터 위치

```
~/Library/Application Support/dev.jhzlo.amber/
├── amber.db     # 메타데이터: 할 일, 타임블록, 카드, 리포트, DB 연결, 설정
└── vault/       # 노트(.md), 다이어그램(.mmd), 리포트 파일
```

데이터는 앱 밖에 있어서 앱을 바꿔 끼워도 그대로 남습니다. 백업은 설정 하단의 백업 버튼을
쓰세요. `amber.db` 는 WAL 모드라 실행 중에 파일을 그냥 복사하면 최근 기록이 빠질 수 있습니다.

## 개발 실행

```bash
pnpm tauri dev      # 핫 리로드 개발 빌드
pnpm test           # vitest + cargo test
```

개발 빌드는 설치된 앱과 같은 데이터 폴더를 씁니다. 둘을 동시에 띄우지 마세요.

## 라이선스

[MIT](./LICENSE)
