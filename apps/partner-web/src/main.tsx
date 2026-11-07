import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Filter out noisy third-party browser extension logs (MetaMask ObjectMultiplex, McAfee feature_collector)
if (typeof window !== 'undefined') {
  const noisePatterns = [
    /MaxListenersExceededWarning/i,
    /ObjectMultiplex/i,
    /app-init-liveness/i,
    /background-liveness/i,
    /feature_collector/i,
  ];
  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    const msg = args.map(a => (typeof a === 'string' ? a : (a as { message?: string })?.message || '')).join(' ');
    if (noisePatterns.some(p => p.test(msg))) return;
    origWarn(...args);
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
