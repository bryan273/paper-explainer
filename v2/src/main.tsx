import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import '@/lib/settings';

createRoot(document.getElementById('root')!).render(<App />);
