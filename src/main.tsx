import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { registerServiceWorker } from './pwa';
// Self-hosted fonts, Latin subset only (covers Italian and English)
import '@fontsource/cinzel-decorative/latin-700.css';
import '@fontsource/quicksand/latin-500.css';
import '@fontsource/quicksand/latin-700.css';
// Imported here (not via a <link> in index.html) so Vite hot-reloads it like the components
import './style.css';

registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
