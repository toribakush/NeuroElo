import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Removemos qualquer wrapper extra que possa causar erro de Ref no topo
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
