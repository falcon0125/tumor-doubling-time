// VERSION: TIMESTAMP_20240722_100000_INDEX_TSX
// Log to confirm execution of this script version
console.log("Executing index.tsx - VERSION: TIMESTAMP_20240722_100000_INDEX_TSX");

import React from 'react';
import ReactDOM from 'react-dom/client';
import TumorCalculatorApp from './TumorCalculatorApp.tsx'; // Renamed import

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TumorCalculatorApp />
  </React.StrictMode>
);