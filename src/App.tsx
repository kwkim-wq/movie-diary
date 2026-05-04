// Phase 2 placeholder shell. Phase 3 swaps in the static List view.
import { MoviesProvider } from './store/MoviesContext';

function App() {
  return (
    <MoviesProvider>
      <div className="app-root" />
    </MoviesProvider>
  );
}

export default App;
