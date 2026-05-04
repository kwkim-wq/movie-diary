// App — top-level router. Tree:
//   /                     → ListPage (filter="all")
//   /year/:year           → ListPage (filter="year")
//   /liked                → ListPage (filter="liked")
//   /lists                → PlaceholderPage ("리스트 — 준비 중")
//   /stats                → PlaceholderPage ("통계 — 준비 중")
//   /entry/:id            → DetailPage
//   *                     → NotFoundPage
//
// MovieModal sits *outside* of <Routes> so it can render on top of any page —
// it reads ?modal=new|edit from useSearchParams and decides what to do.

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MovieModal } from './components/modal/MovieModal';
import { TmdbKeyOnboarding } from './components/modal/TmdbKeyOnboarding';
import { DetailPage } from './routes/DetailPage';
import { ListPage } from './routes/ListPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { PlaceholderPage } from './routes/PlaceholderPage';
import { MoviesProvider } from './store/MoviesContext';

function App() {
  // basename matches vite.config.ts `base: '/movie-diary/'` so links resolve
  // correctly both in dev and after `vite build`.
  return (
    <BrowserRouter basename="/movie-diary">
      <MoviesProvider>
        <Routes>
          <Route path="/" element={<ListPage filter="all" />} />
          <Route path="/year/:year" element={<ListPage filter="year" />} />
          <Route path="/liked" element={<ListPage filter="liked" />} />
          <Route
            path="/lists"
            element={<PlaceholderPage label="리스트 — 준비 중" activeNav="lists" />}
          />
          <Route
            path="/stats"
            element={<PlaceholderPage label="통계 — 준비 중" activeNav="stats" />}
          />
          <Route path="/entry/:id" element={<DetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        {/* Global overlays — read from URL search params. */}
        <MovieModal />
        <TmdbKeyOnboarding />
      </MoviesProvider>
    </BrowserRouter>
  );
}

export default App;
