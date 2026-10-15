import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// En tu archivo de entrada principal (index.js o main.jsx)
import api from './api/axios';

const token = localStorage.getItem('AUTH_TOKEN');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
