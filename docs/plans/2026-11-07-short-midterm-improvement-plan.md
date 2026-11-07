# 단기~중기 개선 구현 계획 (설계 확정안)

- **날짜**: 2026-11-07
- **상태**: 설계 확정 (2026-11-07 사용자 승인)
- **범위**: 단기~중기 (보안·정합성·공용 레이어·레지스트리·품질 게이트)
- **선택 사항**: 관리자 보호는 **env + Firebase Rules만** (Firebase Auth는 후속 단계) / 타입은 **JS 유지** / 문서 위치는 **docs/plans/**

## 전제

- 실제 루트: `.../dochon-games-portal` (복수, 중첩 폴더 없음)
- 스택: React 18 + Vite 5, GitHub Pages 배포(`base: '/dochon-games-portal/'`), Firebase RTDB REST 리더보드, WebRTC P2P 멀티플레이어 5종
- 규모: 플레이 가능 게임 35개 + 준비 중 6개, `src/App.jsx`(719줄) 상태 기반 라우팅, 게임별 폴더 `src/components/games/<name>/`

---

## 단기 (1~3주) — Phase 0~2

### Phase 0. 기반 (선행, 1~2일)

- `.gitignore` 신설 (`node_modules/`, `dist/`, `.DS_Store`)
- `gh-pages`를 devDeps로 고정 (`npx` 임의 최신 가져오기 제거, 재현성 확보)
- 첫 커밋 실행 (현재 `.git` 커밋 0개, 전체 untracked)
- 루트 `README.md` 신설: 실행(`npm run dev`), 배포(`npm run deploy`), 실제 배포 URL, 아키텍처 요약
- `docs/UPDATELOG.md` 신설 (전역 규칙: 오늘 날짜 섹션 추가, 사용자용 쉬운 말, 관리자 모드 내용 제외). 인앱 `src/data/changelogData.js`는 유지

### Phase 1. 보안 (최우선, 3~5일)

1. **`dist/leaderboard.html` 경로 충돌 해소**
   - 현 상태: `vite.config.js` 롤업 엔트리 `leaderboard: leaderboard.html` 과 `public/leaderboard.html`이 모두 `dist/leaderboard.html`을 노려, 어느 쪽이 서비스되는지 불확정 (public 복사본은 DB 미연동 localStorage 전용으로 stale 가능성 큼).
   - 조치: `public/leaderboard.html`을 단일 소스로 확정, 롤업 엔트리 제거. 즉각 **관리자 비밀번호 교체(rotation)** — 이미 배포 번들에 노출된 4자리 평문이므로 어떤 조치보다 먼저 수행.

2. **XSS 해소 (`leaderboard.html` 내 `innerHTML` 렌더링)**
   - 대상: 루트본 `renderScores()` (name/date/score) 및 public본 동일 위치. DB/localStorage에서 온 문자열을 이스케이프 없이 삽입하는 저장형 XSS.
   - 조치: `textContent`/DOM 생성 방식으로 교체. rank 배지(로컬 생성 숫자/이모지)는 유지. React `LeaderboardModal`은 JSX 텍스트 노드라 안전 — 수정 대상 아님.

3. **관리자 비밀번호 외부 이동 (env)**
   - 대상: `LeaderboardModal.jsx`의 하드코딩 secret 비교(`'8582'` + btoa 중복 비교) 제거.
   - 조치: `.env`의 `VITE_ADMIN_PASS`로 이동, 비밀번호 길이 증가, 클라이언트 측 연속 실패 lockout(일정 횟수 후 입력 차단) 추가.
   - **잔여 위험 (선택된 트레이드오프)**: Vite는 `VITE_*` env를 빌드 시 번들에 인라인하므로 완전 차단은 아님. Firebase Auth 도입 단계에서 서버측 검사(custom claims)로 교체할 예정임을 명시.

4. **Firebase Rules + `firebase.json` 신설**
   - 현재 규칙 파일 전무 → DB 사실상 전면 개방(인증 없는 REST 전 경로). 별도 배포 절차(`firebase deploy --only database`) 문서화.
   - Rules v1:
     - **읽기**: 공개 (`getAllLeaderboardsFromDB`의 루트 GET, `getLeaderboardFromDB` 경로 GET 보장 — App 추천 점수가 비지 않음).
     - **쓰기**: shape 검증 가능한 경우만 허용 — `name`(문자열, 1자 이상·상한), `score` > 100, `date`/`timestamp` 형식, 크기 상한. `submitScoreToDB`의 부분 PATCH(`{score, date, timestamp}`만) 규격을 규칙과 정합.
     - **UPDATE/DELETE**: 전면 deny. 인증이 없어 관리자/일반 사용자를 구분할 수 없으므로, 관리자 편집/삭제(`updateScoreInDB`/`deleteScoreFromDB`)는 Auth 도입 전까지 **비활성화 + 안내 표시**.
   - `p2p_signaling` 경로는 형식/크기 제한만 적용 — 룸 스쿼팅·위장 완전 방지는 Auth 단계에서 해결.

5. **PII 정리**: 폴백 이름(예: `김도촌 (5A)`)은 관례 유지하되, changelog에 실제 학생 정보가 들어가지 않음을 재확인 (`GEMINI.md` 규칙).

### Phase 2. 정합성 정리 (3~5일)

1. **레거시 리더보드 제거 (`src/utils/leaderboard.js`)**
   - 현재: 5개 게임이 import. `pacman`(getHighScore + saveScore 2곳), `dino`/`snake`(getHighScore만 — saveScore는 인자 부족 no-op 버그), `solitaire`/`minesweeper`(getHighScore만).
   - 조치: `dochon_leaderboard_<key>` 최대값으로 대체(파일만 지우면 5개 게임 빌드 실패 — 호출부부터 수정). 초기 하이스코어 변화 명시 (pacman 3250→대체값, dino 1420·snake 680→대체값).
   - 데드 코드 `syncLocalStorageToCloudDB`도 함께 제거 (어디서도 호출 안 됨, `dochon_leaderboard_*`를 읽으므로 마이그레이션 의존성 없음).

2. **의존성/자산 정리**
   - 미사용 `peerjs` 의존성 제거 (src import 0건 — WebRTC 네이티브 + Firebase 시그널링만 사용).
   - `changelogData.js`의 데드 import(`App.jsx`의 `getLatestVersion`) 제거.
   - 고아 자산: `tictactoe.jpg`(gamesData는 `donut-tictactoe.jpg` 사용), 참조 0건인 svg 7종 삭제.

3. **계약 통일 (동작 변경 없음, 문서화 중심)**
   - `onScoreSubmitted` 인자는 무시됨(`App.jsx`의 `activeGame` 클로저 승자). 6개 게임이 id를 넘기지만 dead code이므로 유지하되 주석으로 문서화.
   - `submitScoreToDB` 반환값은 `<=100`인 경우만 `false`, 그 외 항상 `true`(클라우드 실패 포함) — 28개 게임이 반환값을 무시하는 낙관 경로와 정합함을 코드 주석·README에 명시.
   - `GameErrorBoundary` 재시도: 실패한 컴포넌트에 `key` 리마운트 부여 (현재 no-op `onRetry`로 복구 불가).
   - `index.html`·manifest의 구식 문구 "32종" → 35종 수정.

---

## 중기 (1~3개월) — Phase 3~5

### Phase 3. 공용 레이어 (파일럿: tetris → brickbreaker → 레거시 5종 순)

1. **`ScoreSubmitForm` + `useScoreSubmit` 훅 신설**
   - 35개 게임에 복붙된 점수 제출 폼·핸들러 통합. 변이 축 흡수: `maxLength`(기본 10 / 레거시 16), 상태명(`playerName`/`studentName` 등) 어댑터, `isSubmitting`/`submitted` 관리, `score>100` 가드, `submitScoreToDB` 후 낙관적 `setSubmitted(true)` 보존.
   - 7개 반환값 캡처 게임(`setSubmitError`/`alert` 등)의 에러 UI는 `variant` prop으로 분리, 이중 폼 5종(brickbreaker/halfmoon/minesweeper/jerry lawson/pangolin)은 훅 인스턴스 공유.
   - 신규 게임은 반드시 이 컴포넌트만 사용.

2. **오디오 통합 (`AudioProvider` + `useMuted`)**
   - 27개 게임 오디오 + 공용 `soundFx`를 `{muted, setMuted, toggleMute}` 인터페이스 어댑터로 감싸기. 3종 스펠링(`setMuted`/`toggleMute` 반환/`setMute`) 흡수, tetris `setMuted → stopTheme` 결합 보존, skyJumper의 데드 `setMute` 정리.
   - `App.jsx:673`에 `isMuted` prop을 실제로 연결 (현재 piratecoin만 선언, 항상 false). 전역 음소거가 전 게임에 도달하도록 점진 이관.

3. **`GameShell` (선택적 opt-in)**
   - HUD 바·일시정지/음소거/재시작/도움말 슬롯 + `HowToPlayModal` 렌더 위치 통일. 일시정지 없는 25종·도움말 없는 3종(dino/pacman/snake)은 opt-out/null 폴백.
   - App 레벨(오버레이+`GameErrorBoundary`+`Suspense`)은 이미 셸이므로, 게임 내부 중복만 해소.

4. **`useGameCanvas` 훅**
   - canvasRef·DPR 상한 2·좌표 변환(`getBoundingClientRect` → 캔버스)·resize(piratecoin의 유일한 구현 패턴) 일원화. 게임별 점진 이관 — HiDPI 흐림 해소가 주목적.

5. **CSS 정리**
   - 스트랜디드된 `.dino-*`/`.snake-*`/`.pacman-score-form*`을 co-located 파일로 이동(33게임 관례).
   - 전역 `button/input/*/body` 규칙과 touch-action 목록은 load-bearing이므로 손대지 않음.

### Phase 4. 레지스트리 + 딥링크

- `GAME_COMPONENTS`(`App.jsx:16–52`)와 `gamesData`를 **단일 레지스트리**로 통합: `import.meta.glob` 기반 lazy 로드.
- `donut_tictactoe ↔ tictactoe` 매핑 codify, 35개 id 런타임 검증(assert) — "빈 모달" 실패 모드를 조기에 표면화.
- `?game=<id>` 딥링크 + `push/popstate`와 오버레이 상태 동기화 (새로고침 시 게임 소실 해결).
- 주의: bare `import.meta.glob`은 `*Game.jsx` 파일명 휴리스틱 실패(`MagicCatGame`/`PacManGame` 대소문자 등)와 오디오 싱글턴 eager 평가로 청크 분할을 무력화하므로, 검증 로직과 함께 도입.

### Phase 5. 품질 게이트 + 접근성 + 성능

1. **도구 체인**
   - ESLint flat + react/react-hooks, Prettier, `lint`/`format` 스크립트.
   - vitest 단위테스트: 분리된 `*Logic.js`/`*Physics.js`/`rankingAlgorithm.js`부터.
   - Playwright 스모크: 35카드 렌더·게임 오픈·점수 제출.
   - CI (`.github/workflows`): `npm ci → lint → test → build`.
2. **접근성 베이스라인**
   - 공용 Modal 컴포넌트(Escape·포커스 트랩/복귀·스크롤 잠금·`role=dialog`)로 5종 교체 (현재는 role/Escape/포커스 트랩 전무, Leaderboard만 스크롤 잠금 누락).
   - `GameCard`를 `<button>`/키보드 가능으로, canvas에 `tabIndex=0`+`aria-label`+포커스 링.
   - `user-scalable=no` 해제, 전역 `prefers-reduced-motion` 차단, `:focus-visible` 스타일로 `outline:none` 대체, CI에 axe 스모크 1개.
3. **성능 예산**
   - 썸네일 WebP 변환·≤150KB (현재 135px 표시 이미지에 ~882KB jpg, `public/` 61MB).
   - `ChangelogModal` `lazy()` 분리 (현재 180KB 데이터가 메인 번들에 정적 포함), 폰트 `display=swap`+subset, `manualChunks`(react/lucide 분리).
   - 목표: `public/` 61MB → 20MB 이하.

---

## 실행 순서·검증·리스크

| 순서 | Phase | 검증 방법 |
|------|-------|-----------|
| 1 | 0 기반 | `npm run build` 통과, README/UPDATELOG 존재 확인 |
| 2 | 1 보안 | leaderboard 페이지에서 점수 렌더·XSS 페이로드 차단 확인, Rules 배포 후 100점 이하/형식 위반 쓰기 차단 확인, 관리자 편집 비활성화 안내 표시 |
| 3 | 2 정합성 | 5개 레거시 게임 플레이·하이스코어 확인, 35게임 점수 등록 회귀 없음 |
| 4 | 3 공용 레이어 | 파일럿(tetris→brickbreaker) 플레이, 전역 음소거 도달 확인 |
| 5 | 4 레지스트리 | 35개 전 카드 오픈·딥링크 새로고침 확인 |
| 6 | 5 품질 게이트 | CI 그린, axe 스모크 통과, `public/` 크기 측정 |

**주요 리스크와 대응**

- Rules 도입 시 관리자 편집/삭제 비활성화 → Auth 후속 단계에서 복구 (일정 합의됨).
- `ScoreForm` 이관 시 28게임 낙관 경로 회귀 → 파일럿 순서로 차단.
- glob 레지스트리의 빈 모달 회귀 → 런타임 assert로 조기에 표면화.
- env로 옮긴 비밀번호도 번들 노출 → 길이 증가+lockout으로 완화, Auth 단계에서 교체 명시.
