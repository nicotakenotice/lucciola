import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
// Imported here (not via a <link> in index.html) so Vite hot-reloads it like the components
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
