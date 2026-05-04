# Movie Diary

개인 영화 일기 — 본 영화·별점·감상 메모 + 좋아한 배우 모음.

**Live**: https://kwkim-wq.github.io/movie-diary/

## 스택
React 18 · TypeScript · Vite · react-router-dom · localStorage · TMDB API

## 개발

```bash
npm install
npm run dev          # http://localhost:5173/
npm run build        # dist/ → GH Pages 자동 배포
```

`.env.local`에 `VITE_TMDB_KEY=...` 두면 자동 로드. 없어도 앱 첫 실행 시 입력 모달.

## 배포
`main`에 push 하면 GitHub Actions가 빌드 + GitHub Pages 배포.
