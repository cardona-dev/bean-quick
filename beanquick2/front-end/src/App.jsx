import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Register from './pages/Register'; 
import Login from './pages/Login'; 
import Home from './pages/Home';
import './App.css';

// --- Componente de Navegación (Header) con Lógica Responsiva ---
const Header = () => {
    // 1. Estado para controlar si el menú móvil está abierto o cerrado
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Función para alternar el estado (abrir/cerrar)
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className='nav'>
            <div className="container nav_items">
                {/* Título/Logo */}
                <div className="tittle">
                    <Link to='/' className='item-tittle'>
                        <h1>Bean <span>Quick</span></h1>
                    </Link>
                </div>
                
                {/* 2. Botón de Hamburguesa (para móvil) */}
                <button 
                    className="menu-toggle" 
                    onClick={toggleMenu} 
                    aria-expanded={isMenuOpen}
                    aria-controls="nav-menu"
                >
                    {/* Puedes usar un icono o texto simple, p. ej., ☰ o X */}
                    {isMenuOpen ? '✕' : '☰'} 
                </button>

                {/* 3. Contenedor de Enlaces con Clase Condicional */}
                <div className={`nav-links-wrapper ${isMenuOpen ? 'active' : ''}`} id="nav-menu">
                    <Link to="/" className='link' onClick={() => setIsMenuOpen(false)}>
                        Inicio
                    </Link>
                    <Link to="/login" className='link' onClick={() => setIsMenuOpen(false)}>
                        Login
                    </Link>
                    <Link to="/register" className='link' onClick={() => setIsMenuOpen(false)}>
                        Registro
                    </Link>
                </div>
            </div>
        </nav>
    );
};

// --- Componente Principal de la Aplicación ---
function App() {
    return (
        <BrowserRouter>
            <Header /> 
            <main>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="*" element={<h1>404: Página no encontrada</h1>} />
                </Routes>
            </main>
        </BrowserRouter>
    );
}

export default App;