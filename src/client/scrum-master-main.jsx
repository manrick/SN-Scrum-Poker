import React from 'react';
import ReactDOM from 'react-dom/client';
import ScrumMasterApp from './components/ScrumMasterApp.jsx';

// This now uses the WebSocket version (no polling)
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ScrumMasterApp />
  </React.StrictMode>
);