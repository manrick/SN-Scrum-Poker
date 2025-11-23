import React from 'react';
import ReactDOM from 'react-dom/client';
import ScrumUserApp from './components/ScrumUserApp.jsx';

// This now uses the WebSocket version (no polling)
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ScrumUserApp />
  </React.StrictMode>
);