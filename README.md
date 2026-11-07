# 도촌 게임 포털 (Dochon Games Portal)

도촌초등학교 학생들을 위한 아케이드 게임 종합 포털과 실시간 명예의 전당입니다. React 18 + Vite 5로 제작되었습니다.

## 실행

```bash
npm install
npm run dev      # http://localhost:5173
```

## 배포

```bash
npm run deploy   # 빌드 후 GitHub Pages로 배포
```

- 배포 주소: `https://wbmaker01-ai.github.io/dochon-games-portal/` (GitHub Pages, `base: '/dochon-games-portal/'`)
- 빌드 산출물: `dist/`

## 구성

- `src/components/games/<게임이름>/` — 게임별 독립 폴더 (컴포넌트·상수·로직·에셋)
- `src/data/gamesData.js` — 게임 메타데이터·카테고리
- `src/utils/leaderboardApi.js` — Firebase RTDB REST 기반 명예의 전당 서비스
- `public/leaderboard.html` — 별도 랭킹 창 (단일 소스, Vite public 복사)
- `docs/plans/` — 개선 계획 문서, `docs/UPDATELOG.md` — 업데이트 내역

## 규칙

- 프로젝트 실행 규칙은 [`GEMINI.md`](./GEMINI.md)를 참고하세요.

## 보안

- 관리자 비밀번호는 `.env`의 `VITE_ADMIN_PASS` (`.env.example` 참고, `.env`는 커밋 금지)
- DB 접근 규칙: [`database.rules.json`](./database.rules.json) — Firebase 프로젝트 `dochon-games-portal-bbdbc`에 배포 완료 (2026-11-07)
  - 배포 명령: `firebase deploy --only database --project dochon-games-portal-bbdbc`
  - 읽기 공개, 쓰기는 점수 향상/형식 검증만 허용, 기록 삭제·점수 하락 거부
