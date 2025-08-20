import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

function TestApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>EllaAI Platform - Loading...</h1>
      <p>React {React.version} is working</p>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Failed to find root element');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <TestApp />
    </React.StrictMode>
  );
}