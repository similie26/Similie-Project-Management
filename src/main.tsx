import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error handler for catching early initialization errors
window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global Error:', { message, source, lineno, colno, error });
  const root = document.getElementById('root');
  if (root && root.innerHTML === '') {
    root.innerHTML = `
      <div style="padding: 20px; color: #b41340; font-family: sans-serif;">
        <h1 style="font-size: 20px; margin-bottom: 10px;">Application Error</h1>
        <p style="font-size: 14px; margin-bottom: 10px;">The application failed to load. Please check the browser console for details.</p>
        <pre style="background: #eee; padding: 10px; border-radius: 4px; font-size: 12px; overflow: auto;">${message}</pre>
      </div>
    `;
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
