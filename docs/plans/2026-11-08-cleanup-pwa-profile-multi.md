# 구현 계획 — 단기 정리 + PWA·프로필 + 멀티 파일럿

- **날짜**: 2026-11-08
- **상태**: 구현 시작 (사용자 승인 2026-11-08)
- **범위 선택**: 단기 전부 포함 / PWA 셸+캐시 / 프로필 모달 / 멀티 파일럿 1종(`snowball`) 후 순차
- **베이스**: `WBmaker2/dochon-games-portal` `main` @ `648a04b`, 배포 https://wbmaker2.github.io/dochon-games-portal/

## 전제

- 스택: React 18 + Vite 5, `base: '/dochon-games-portal/'`, GitHub Pages(`gh-pages` 브랜치), Firebase RTDB REST
- 규모: 플레이 가능 35종(멀티 P2P 5종: `ghoulduel·snowball·schooltag·microkart·piratecoin`), 준비 중 6종
- `GEMINI.md` 규칙: 점수 입력 placeholder `예:홍길동`, 신규 게임 독립 폴더, `score<=100` 폼 미노출, 업데이트 내역 버튼·changelog 누적, 보안 민감정보 미기재, 점수 등록 후 해당 탭 자동 표시, 네트워크 용어 순화

## Phase A. 단기 정리 (전부 포함)

### A1. 파일 정리
- 루트 `leaderboard.html` 삭제 — 단일 소스는 `public/leaderboard.html` (XSS 해소본). `vite.config.js` 롤업 엔트리는 이미 제거됨.
- `src/utils/leaderboard.js` 삭제 — import 0건, `getLocalHighScore()`로 대체 완료.
- `public/` jpg·webp 중복 정리 — `gamesData.js`·게임 내 참조 grep 후 살아있는 포맷만 남기고 나머지 삭제 (목표 65MB→20MB 이하). 원본 jpg는 git 히스토리로 보존.
- `GameErrorBoundary` 재시도 복구: `key` 리마운트 — `App.jsx`에서 `<GameErrorBoundary key={activeGame+gameAttempt}>` 적용, `handleRetry`도 카운터 증가.
- `GameShell`·`useGameCanvas`: import 0건 → 1차에서는 파일 유지 + `GameShell`에 barrel 주석 추가(혼란 방지). 실제 이관은 이번 범위에서 제외하고 잔여로 명시.
- `index.html`·`public/manifest.json` "32종" 문구 → "35종", `getLatestVersion` 데드 import 제거 여부 확인.

### A2. 보안 (Rules 재검증 포함)
- `LeaderboardModal.jsx`: 이미 5회 lockout이 있음 → 시간 기반 해제(30초) 추가, `localStorage`로 새로고침 우회 방지(타임스탬프 저장), 안내 문구 유지.
- `database.rules.json`: `p2p_signaling` 전면 개방 → shape 검증으로 교체
  - `p2p_signaling/$gameId/$roomCode`: `.validate`에서 `host`(객체·`name` 1~16자), `status` enum(`lobby|playing|ended`), `heartbeat` 숫자만 허용. `guests` 자식은 이름·점수 shape 검증.
  - 기존 WebRTC SDP/ICE·릴레이 경로는 크기 상한(`$other` 키 길이 제한)으로 남김 — 완전 차단은 Auth 후속.
  - 쓰기는 기존 `leaderboards/$entry` 그대로 (점수 증가만, 16자·`>100·≤100000000`).
- 배포: `firebase deploy --only database --project dochon-games-portal-bbdbc` 후 검증 — 100점 이하·형식 위반 거부, 방 생성·heartbeat·릴레이 폴백 회귀 없음 확인.

**검증 A:** `npm run lint && npm run test && npm run build` 그린, leaderboard XSS 페이로드 차단, 방 입장·채팅 폴링 정상.

## Phase B. 중기 — PWA + 프로필

### B1. PWA 완성 (셸+캐시)
- `vite-plugin-pwa` 도입 — `vite.config.js`에 `base` 일치(`'/dochon-games-portal/'`), `registerType:autoUpdate`, `manifest: false`(기존 `public/manifest.json` 재사용) + `workbox.runtimeCaching`:
  - 셸·폰트·썸네일·앱 아이콘: `CacheFirst` / `StaleWhileRevalidate`
  - Firebase RTDB (`*.firebasedatabase.app`): `NetworkOnly` (실시간 우선, 오프라인 캐시 제외)
- `src/main.jsx`에 `registerSW` 호출, `index.html` 유지.
- UI: `App.jsx` 상단 설치 버튼(`beforeinstallprompt` 캡처) + 업데이트 토스트, iOS 폴백(공유→홈 화면 추가 안내).
- **검증:** DevTools Application SW 활성, 오프라인 새로고침 시 셸 로드, Lighthouse PWA 통과.

### B2. 프로필 최소형 (모달)
- 신규 `src/components/ProfileModal.jsx` + `src/utils/profile.js`:
  - 입력: `localStorage dochon_profile_name`(16자 상한), 집계는 `getAllLeaderboardsFromDB()` + `dochon_leaderboard_*` 캐시
  - 표시: 내 최고 점수 게임별, 최근 5회, 1등 N회 배지(COUNT rank==1), `내 기록` 버튼
  - 점수 제출 후 캐시 갱신 (`submitScoreToDB` 성공 시 `profile.js:refreshProfile()`)
- `App.jsx`에 `내 기록(User)` 아이콘 버튼, `GEMINI.md` placeholder 규칙 유지 (`예:홍길동`).
- **검증:** 점수 등록 → 프로필 즉시 반영, 이름 변경 시 집계 유지.

## Phase C. 멀티 확장 — 파일럿 1종(`snowball`) 후 순차

**파일럿:** `snowball` (가장 단순, 네트워크 패턴 대표) → 결과 보고 `ghoulduel` → `schooltag·microkart·piratecoin` 순차 복제

- **방 목록:** `p2p_signaling/<gameId>` GET → 활성 방 카드(인원·상태·입장) — `SnowballGame.jsx` 좌측 패널 확장, `FirebaseSignaling.listRooms(gameId)` 신규
- **초대 링크:** `?game=snowball&room=CODE` 복사 버튼 — `App.jsx` `?game=` 패턴을 `&room=`까지 확장, `popstate` 동기화
- **관전:** `guests.<id>.spectator:true` — 입력 제외·상태 구독만, 방장 heartbeat·`onHostLost` 재사용
- **AI 대전(점심):** P2P 없을 때 CPU 봇 — `snowballLogic.js`에 `createBot()` 분리, 네트워크 없어도 플레이 가능, 방 대기 중 "혼자 + AI" 버튼
- **검증:** 방 생성→초대→관전→재시작, 호스트 이탈 안내, Rules shape 하에서도 5종 회귀 없음 (파일럿 먼저, 나머지는 동일 패턴 적용 명시)

## 실행 순서·리스크

| 순서 | Phase | 검증 방법 |
|---|---|---|
| 1 | A1 파일 정리 | lint/test/build, 35종 카드 오픈 |
| 2 | A2 보안+Rules 배포 | Rules 거부·방 회귀 확인 |
| 3 | B1 PWA → B2 프로필 | 오프라인·설치·프로필 갱신 |
| 4 | C 파일럿 snowball | 방·초대·관전·AI |

**리스크와 대응**
- Rules 강화 시 관리자 편집 차단 → Auth 후속까지 안내 표시 유지
- PWA 캐시는 셸만 — 첫 로딩 무겁지 않게, RTDB는 NetworkOnly
- 멀티는 파일럿으로 회귀 차단, 나머지 4종은 다음 단계에서 동일 패턴 이관
