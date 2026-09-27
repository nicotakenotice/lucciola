import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
// Importato qui (e non con un <link> in index.html) perché Vite lo aggiorni a caldo come i componenti
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
