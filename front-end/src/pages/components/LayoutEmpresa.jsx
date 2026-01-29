import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaStore, FaUserCircle, FaChevronDown, FaPlusCircle, FaTimes } from 'react-icons/fa';

const LayoutEmpresa = ({ children, empresa }) => {
    const navigate = useNavigate();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div style={styles.dashboard}>
            {/* --- SIDEBAR REUTILIZABLE --- */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarLogo}>
                    <FaStore size={24} color="#6f4e37" />
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>MarketPanel</h2>
                </div>
                <nav style={{ marginTop: '30px' }}>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={styles.navItem}><Link to="/empresa/panel" style={styles.linkText}>🏠 Inicio</Link></li>
                        <li style={styles.navItem}><Link to="/empresa/pedidos" style={styles.linkText}>📦 Gestionar Pedidos</Link></li>
                        <li style={styles.navItem}><Link to="/empresa/productos" style={styles.linkText}>🍕 Mis Productos</Link></li>
                    </ul>
                </nav>
            </aside>

            <main style={styles.main}>
                {/* --- HEADER REUTILIZABLE --- */}
                <header style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }} ref={menuRef}>
                        {empresa?.logo_url ? (
                            <img src={empresa.logo_url} alt="Logo" style={styles.logoImg} />
                        ) : (
                            <FaUserCircle size={50} color="#cbd5e1" />
                        )}

                        <div style={styles.profileSelector} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ margin: 0, fontSize: '20px' }}>{empresa?.nombre || 'Mi Empresa'}</h1>
                                <FaChevronDown size={12} color="#64748b" />
                            </div>
                            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>Panel de Control</p>

                            {showProfileMenu && (
                                <div style={styles.dropdown}>
                                    <div style={styles.dropdownItem} onClick={() => navigate('/empresa/perfil')}>
                                        Mi Perfil
                                    </div>
                                    <hr style={styles.divider} />
                                    <div style={{ ...styles.dropdownItem, color: '#ef4444' }}
                                        onClick={() => { localStorage.clear(); navigate('/login'); }}>
                                        Cerrar Sesión
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <Link to="/empresa/productos/nuevo" style={styles.btnNuevo}>
                        <FaPlusCircle /> Nuevo Producto
                    </Link>
                </header>

                {/* Aquí se renderizará el contenido de cada página */}
                {children}
            </main>
        </div>
    );
};

// Estilos idénticos a los de tu Dashboard
const styles = {
    dashboard: { display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#1e293b' },
    sidebar: { width: '260px', background: 'white', padding: '30px 20px', position: 'fixed', height: '100vh', borderRight: '1px solid #e2e8f0', zIndex: 10 },
    sidebarLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' },
    navItem: { padding: '12px 15px' },
    linkText: { color: '#475569', textDecoration: 'none', fontWeight: '500' },
    main: { flex: 1, padding: '30px 50px', marginLeft: '260px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    logoImg: { width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    profileSelector: { cursor: 'pointer', padding: '5px 10px' },
    btnNuevo: { background: '#6f4e37', color: 'white', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
    dropdown: { position: 'absolute', top: '100%', left: '70px', background: 'white', minWidth: '180px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '12px', padding: '8px', zIndex: 100, border: '1px solid #f1f5f9' },
    dropdownItem: { padding: '10px 12px', fontSize: '14px', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' },
    divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' },
};

export default LayoutEmpresa;