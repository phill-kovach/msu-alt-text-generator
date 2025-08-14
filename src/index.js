import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// This is the entry point for your React application.
// It finds the 'root' element in the HTML and renders the main App component into it.
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
