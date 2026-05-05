// App — top-level router. Tree:
//   /                     → ListPage (filter="all")
//   /year/:year           → ListPage (filter="year")
//   /liked                → ListPage (filter="liked")
//   /lists                → PlaceholderPage ("리스트 — 준비 중")
//   /actors               → ActorsPage
//   /actor/:id            → ActorDetailPage
//   /stats                → StatsPage
//   /settings             → SettingsPage
//   /entry/:id            → DetailPage
//   *                     → NotFoundPage
//
// MovieModal sits *outside* of <Routes> so it can render on top of any page —
// it reads ?modal=new|edit from useSearchParams and decides what to do.

import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { MovieModal } from './components/modal/MovieModal';
import { TmdbKeyOnboarding } from './components/modal/TmdbKeyOnboarding';
import { ActorDetailPage } from './routes/ActorDetailPage';
import { ActorsPage } from './routes/ActorsPage';
import { DetailPage } from './routes/DetailPage';
import { ListPage } from './routes/ListPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { PlaceholderPage } from './routes/PlaceholderPage';
import { SettingsPage } from './routes/SettingsPage';
import { StatsPage } from './routes/StatsPage';
import { MoviesProvider } from './store/MoviesContext';

function App() {
  // basename mirrors vite's BASE_URL — '/' in dev, '/movie-diary/' in build.
  // Trailing slash trimmed because react-router expects basename without it.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';
  return (
    <BrowserRouter basename={basename}>
      <MoviesProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<ListPage filter="all" />} />
          <Route path="/year/:year" element={<ListPage filter="year" />} />
          <Route path="/liked" element={<ListPage filter="liked" />} />
          <Route
            path="/lists"
            element={<PlaceholderPage label="리스트 — 준비 중" activeNav="lists" />}
          />
          <Route path="/actors" element={<ActorsPage />} />
          <Route path="/actor/:id" element={<ActorDetailPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
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
