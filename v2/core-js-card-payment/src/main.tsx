import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#262626',
          color: '#d4d4d4',
          border: '1px solid #404040',
          fontSize: '13px',
        },
        success: { iconTheme: { primary: '#22c55e', secondary: '#0a0a0a' } },
        error: { iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' } },
      }}
    />
  </StrictMode>,
);
