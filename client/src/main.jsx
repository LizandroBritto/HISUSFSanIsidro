import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter as Router } from "react-router-dom"; 
import {  UserProvider } from './context/UserContext';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
    <UserProvider>
    <App />
    </UserProvider>
    </Router>
  </StrictMode>,
)
