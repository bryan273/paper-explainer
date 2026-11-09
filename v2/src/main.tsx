import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@/lib/settings';

// After a new release the old page may still ask for files that no longer exist: load the new release once, instead of showing a broken page
window.addEventListener('vite:preloadError', (e) => {
  e.preventDefault();
  try { if (sessionStorage.getItem('pl-reloaded')) return; sessionStorage.setItem('pl-reloaded', '1'); } catch { /* private mode */ }
  window.location.reload();
});
window.setTimeout(() => { try { sessionStorage.removeItem('pl-reloaded'); } catch { /* ignore */ } }, 20000);

createRoot(document.getElementById('root')!).render(<App />);
