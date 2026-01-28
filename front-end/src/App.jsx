import './index.css';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import {
    FaUserCircle, FaStar, FaSignOutAlt, FaUserEdit,
    FaChevronDown, FaStore, FaClipboardList
} from 'react-icons/fa';

// Importaciones de páginas (Tus imports actuales)
import Register from './pages/auth/Register';
import Login from './pages/auth/Login';
import Home from './pages/Home';
import RegistroEmpresa from './pages/auth/RegistroEmpresa';
import DashboardCliente from './pages/cliente/DashboardCliente';
import DashboardEmpresa from './pages/empresa/DashboardEmpresa';
import AgregarProducto from './pages/empresa/AgregarProducto';
import MisProductos from './pages/empresa/MisProductos';
import VistaTienda from './pages/VerTienda';
import CarritoFlotante from './pages/components/CarritoFlotante';
import ActivarCuenta from './pages/auth/ActivarCuenta';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSolicitudes from './pages/admin/AdminSolicitudes';
import MisPedidos from './pages/cliente/MisPedidos';
import GestionPedidosEmpresa from './pages/empresa/GestionPedidosEmpresa';
import Footer from './pages/components/common/Footer';  
// Nuevas páginas (Deberás crearlas a continuación)
import MisCalificaciones from './pages/cliente/MisCalificaciones';
import PerfilUsuario from './pages/cliente/PerfilUsuario';
const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isAuthenticated = !!localStorage.getItem('AUTH_TOKEN');
    const userRole = localStorage.getItem('USER_ROLE');
    const userName = localStorage.getItem('USER_NAME') || 'Mi Cuenta';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsUserDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    return (
        <nav className='nav'>
            <div className="container nav_items">
                <div className="tittle">
                    <Link to='/' className='item-tittle' onClick={() => setIsMenuOpen(false)}>
                        <h1>Bean <span>Quick</span></h1>
                    </Link>
                </div>

                {/* Botón de hamburguesa original */}
                <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>

                {/* Contenedor de enlaces con tu clase original */}
                <div className={`nav-links-wrapper ${isMenuOpen ? 'active' : ''}`}>
                    <Link to="/" className='link' onClick={() => setIsMenuOpen(false)}>Inicio</Link>

                    {!isAuthenticated ? (
                        <>
                            <Link to="/solicitud-empresa" className='link' onClick={() => setIsMenuOpen(false)}>
                                Registrar Empresa
                            </Link>
                            <Link to="/login" className='link' onClick={() => setIsMenuOpen(false)}>Login</Link>
                            <Link to="/register" className='link' onClick={() => setIsMenuOpen(false)}>Registro</Link>
                        </>
                    ) : (
                        <>
                            {userRole === 'admin' && (
                                <Link to="/admin/dashboard" className='link' onClick={() => setIsMenuOpen(false)}>Panel Admin</Link>
                            )}
                            {userRole === 'cliente' && (
                                <>
                                    <Link to="/cliente/dashboard" className='link' onClick={() => setIsMenuOpen(false)}>Tiendas</Link>
                                    <Link to="/cliente/mis-pedidos" className='link' onClick={() => setIsMenuOpen(false)}>Mis Pedidos</Link>
                                </>
                            )}
                            {userRole === 'empresa' && (
                                <Link to="/empresa/panel" className='link' onClick={() => setIsMenuOpen(false)}>Mi Cafetería</Link>
                            )}

                            {/* --- CONTENEDOR DEL DROPDOWN --- */}
                            <div className="user-dropdown-container" ref={dropdownRef}>
                                <button
                                    className="user-nav-btn"
                                    onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                                >
                                    <FaUserCircle size={18} />
                                    <span>{userName}</span>
                                    <FaChevronDown size={10} className={isUserDropdownOpen ? 'rotate' : ''} />
                                </button>

                                {isUserDropdownOpen && (
                                    <div className="user-dropdown-menu">
                                        <div className="dropdown-header">HOLA, {userName.toUpperCase()}</div>

                                        <Link to="/perfil" className="dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                                            <FaUserEdit /> Mi Perfil
                                        </Link>

                                        {userRole === 'cliente' && (
                                            <Link to="/cliente/mis-calificaciones" className="dropdown-item" onClick={() => setIsUserDropdownOpen(false)}>
                                                <FaStar /> Calificaciones
                                            </Link>
                                        )}

                                        <div className="dropdown-divider"></div>

                                        <button onClick={handleLogout} className="logout-action">
                                            <FaSignOutAlt /> Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
// --- COMPONENTE PRINCIPAL APP ---
function App() {
    const [carrito, setCarrito] = useState([]);

    const fetchCarrito = useCallback(async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        if (!token) return;
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/cliente/carrito', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) setCarrito(res.data);
        } catch (error) {
            console.error("Error al cargar carrito inicial", error);
        }
    }, []);

    useEffect(() => {
        fetchCarrito();
    }, [fetchCarrito]);
const agregarAlCarrito = async (producto, cantidad = 1) => {
    const token = localStorage.getItem('AUTH_TOKEN');
    if (!token) { 
        alert("Debes iniciar sesión"); 
        return; 
    }

    // 1. BUSCAR SI YA ESTÁ EN EL CARRITO LOCAL
    const productoEnCarrito = carrito.find(item => item.id === producto.id);
    
    // Obtenemos la cantidad que ya existe (manejando pivot o cantidad directa)
    const cantidadActual = productoEnCarrito 
        ? (productoEnCarrito.pivot?.cantidad ?? productoEnCarrito.cantidad ?? 0) 
        : 0;

    // 2. VALIDACIÓN DE STOCK LOCAL
    // Si la (cantidad que ya tengo + la que quiero agregar) supera el stock, frenamos.
    if (cantidadActual + cantidad > producto.stock) {
        alert(`¡Ups! No puedes agregar más. El stock disponible es de ${producto.stock} unidades y ya tienes ${cantidadActual} en tu carrito.`);
        return;
    }

    try {
        const res = await axios.post(
            `http://127.0.0.1:8000/api/cliente/carrito/agregar/${producto.id}`,
            { cantidad }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.data?.productos) {
            setCarrito(res.data.productos);
        }
    } catch (error) {
        console.error("Error al agregar", error);
        // Opcional: Si el servidor responde con error de stock, mostrarlo
        if (error.response?.status === 422) {
            alert(error.response.data.message);
        }
    }
};

    const actualizarCantidad = async (productoId, nuevaCantidad) => {
    if (nuevaCantidad < 1) return eliminarDelCarrito(productoId);
    
    const token = localStorage.getItem('AUTH_TOKEN');

    // ACTUALIZACIÓN OPTIMISTA: Actualizamos cantidad y pivot.cantidad
    setCarrito(prev => prev.map(p => 
        p.id === productoId 
            ? { 
                ...p, 
                cantidad: nuevaCantidad, 
                pivot: p.pivot ? { ...p.pivot, cantidad: nuevaCantidad } : { cantidad: nuevaCantidad }
            } 
            : p
    ));

    try {
        await axios.put(`http://127.0.0.1:8000/api/cliente/carrito/actualizar/${productoId}`,
            { cantidad: nuevaCantidad }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
    } catch (error) { 
        console.error("Error al actualizar", error);
        // Opcional: Revertir el cambio si falla la API
    }
};

    const eliminarDelCarrito = async (productoId) => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            await axios.delete(`http://127.0.0.1:8000/api/cliente/carrito/eliminar/${productoId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCarrito(prev => prev.filter(p => p.id !== productoId));
        } catch (error) { console.error("Error al eliminar", error); }
    };

    const confirmarPedido = async (direccion, horaRecogida, empresaId, productosTienda) => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            await axios.post(`http://127.0.0.1:8000/api/cliente/pedidos`,
                { direccion, hora_recogida: horaRecogida, empresa_id: empresaId, items: productosTienda },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("¡Pedido realizado!");
            setCarrito(prev => prev.filter(item => item.empresa_id != empresaId));
            return true;
        } catch (error) { alert("Error al procesar el pedido" + error); return false; }
    };

    return (
        <BrowserRouter>
            <AppLayout
                carrito={carrito}
                setCarrito={setCarrito}
                agregarAlCarrito={agregarAlCarrito}
                confirmarPedido={confirmarPedido}
                actualizarCantidad={actualizarCantidad}
                eliminarDelCarrito={eliminarDelCarrito}
            />
        </BrowserRouter>
    );
}

const AppLayout = ({ carrito, setCarrito, agregarAlCarrito, confirmarPedido, actualizarCantidad, eliminarDelCarrito }) => {
    const location = useLocation();
    const userRole = localStorage.getItem('USER_ROLE');

    const isEmpresa = location.pathname.startsWith('/empresa');
    const isAdmin = location.pathname.startsWith('/admin');
    const isAuthPage = ['/login', '/register'].includes(location.pathname);
    const hideHeader = isEmpresa || isAdmin;

    return (
        <>
            {!hideHeader && <Header />}

            {!isEmpresa && !isAdmin && !isAuthPage && userRole === 'cliente' && (
                <CarritoFlotante
                    carrito={carrito}
                    setCarrito={setCarrito}
                    confirmarPedido={confirmarPedido}
                    actualizarCantidad={actualizarCantidad}
                    eliminarDelCarrito={eliminarDelCarrito}
                />
            )}

            <main className={hideHeader ? '' : 'main-content'}>
                <div className={hideHeader ? '' : 'content-wrapper'}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/empresa/activar/:token" element={<ActivarCuenta />} />
                        <Route path="/solicitud-empresa" element={<RegistroEmpresa />} />
                        <Route path="/cliente/dashboard" element={<DashboardCliente />} />
                        <Route path="/tienda/:id" element={<VistaTienda agregarAlCarrito={agregarAlCarrito} />} />
                        <Route path="/cliente/mis-pedidos" element={<MisPedidos />} />
                        <Route path="/perfil" element={<PerfilUsuario />} />
                        <Route path="/cliente/mis-calificaciones" element={<MisCalificaciones/>} />

                        {/* RUTAS EMPRESA */}
                        <Route path="/empresa/panel" element={<DashboardEmpresa />} />
                        <Route path="/empresa/productos/nuevo" element={<AgregarProducto />} />
                        <Route path="/empresa/productos/editar/:id" element={<AgregarProducto />} />
                        <Route path="/empresa/productos" element={<MisProductos />} />
                        <Route path="/empresa/pedidos" element={<GestionPedidosEmpresa />} />

                        {/* RUTAS ADMIN */}
                        <Route path="/admin/dashboard" element={userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} />
                        <Route path="/admin/solicitudes" element={userRole === 'admin' ? <AdminSolicitudes /> : <Navigate to="/login" />} />
                    </Routes>
                </div>
            </main>
            <Footer />
        </>
        
    );
};

export default App;