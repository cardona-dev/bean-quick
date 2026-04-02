import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { 
    FaStore, FaUserCircle, FaChevronDown, FaPlusCircle, FaTimes, 
    FaSave, FaPhone, FaMapMarkerAlt, FaCamera, FaImage, FaBox, 
    FaUtensils, FaChartLine, FaBars, FaChevronLeft
} from 'react-icons/fa';

const LayoutEmpresa = ({ children, empresa }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // --- ESTADOS DE UI ---
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showModal, setShowModal] = useState(false);
    
    const menuRef = useRef(null);

    const [formData, setFormData] = useState({
        nombre: '', email: '', telefono: '', direccion: '', descripcion: '', logo: null, imagen: null
    });

    const [previews, setPreviews] = useState({ logo: null, imagen: null });

    useEffect(() => {
        if (empresa) {
            setFormData(prev => ({
                ...prev,
                nombre: empresa.nombre || '',
                email: empresa.email || '',
                telefono: empresa.telefono || '',
                direccion: empresa.direccion || '',
                descripcion: empresa.descripcion || ''
            }));
            setPreviews({
                logo: empresa.logo_url || null,
                imagen: empresa.imagen_url || null
            });
        }
    }, [empresa]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({ ...prev, [field]: file }));
            setPreviews(prev => ({ ...prev, [field]: URL.createObjectURL(file) }));
        }
    };

    const handleGuardarCambios = async (e) => {
        e.preventDefault();
        const dataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) dataToSend.append(key, formData[key]);
        });

        try {
            const response = await api.post('/api/empresa/update', dataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('AUTH_TOKEN')}`
                }
            });
            if (response.status === 200) {
                alert("Perfil actualizado");
                setShowModal(false);
                window.location.reload(); 
            }
        } catch (error) {
            alert("Error al actualizar");
        }
    };

    // Componente de Link Adaptable
    const NavLinkItem = ({ to, icon, text }) => {
        const active = location.pathname === to;
        return (
            <li style={{ marginBottom: '8px' }}>
                <Link to={to} title={isCollapsed ? text : ""} style={{
                    ...styles.linkText,
                    ...(active ? styles.linkActive : {}),
                    justifyContent: isCollapsed ? 'center' : 'flex-start',
                    padding: isCollapsed ? '12px 0' : '12px 15px',
                }}>
                    <span style={{ fontSize: '18px', display: 'flex' }}>{icon}</span>
                    {!isCollapsed && <span style={{ transition: '0.3s' }}>{text}</span>}
                </Link>
            </li>
        );
    };

    return (
        <div style={styles.dashboard}>
            {/* --- SIDEBAR --- */}
            <aside style={{ 
                ...styles.sidebar, 
                width: isCollapsed ? '80px' : '260px' 
            }}>
                <div style={{ 
                    ...styles.sidebarLogo, 
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    padding: isCollapsed ? '0' : '0 10px'
                }}>
                    {!isCollapsed && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={styles.logoIcon}><FaUtensils color="white" /></div>
                            <h2 style={styles.logoText}>Market<span>Panel</span></h2>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsCollapsed(!isCollapsed)} 
                        style={styles.toggleBtn}
                    >
                        {isCollapsed ? <FaBars /> : <FaChevronLeft />}
                    </button>
                </div>
                
                <nav style={{ marginTop: '30px' }}>
                    <p style={{ 
                        ...styles.navSectionTitle, 
                        textAlign: isCollapsed ? 'center' : 'left',
                        fontSize: isCollapsed ? '9px' : '11px'
                    }}>
                        {isCollapsed ? '---' : 'GESTIÓN'}
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <NavLinkItem to="/empresa/panel" icon={<FaChartLine />} text="Inicio" />
                        <NavLinkItem to="/empresa/pedidos" icon={<FaBox />} text="Pedidos" />
                        <NavLinkItem to="/empresa/productos" icon={<FaStore />} text="Mis Productos" />
                    </ul>
                </nav>

                <div style={{ ...styles.sidebarFooter, display: isCollapsed ? 'none' : 'block' }}>
                    <p>© 2026 Admin</p>
                </div>
            </aside>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <main style={{ 
                ...styles.main, 
                marginLeft: isCollapsed ? '80px' : '260px' 
            }}>
                <header style={styles.header}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px' }}>Bienvenido de nuevo {empresa?.nombre || 'hola'}</h2>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Dashboard </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link to="/empresa/productos/nuevo" style={styles.btnNuevo}>
                            <FaPlusCircle /> {!isCollapsed && "Nuevo Producto"}
                        </Link>

                        <div style={styles.profileWrapper} ref={menuRef}>
                            <div style={styles.profileTrigger} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                                {empresa?.logo_url ? (
                                    <img src={empresa.logo_url} alt="Logo" style={styles.avatarImg} />
                                ) : (
                                    <FaUserCircle size={35} color="#cbd5e1" />
                                )}
                                <FaChevronDown size={10} color="#64748b" />
                            </div>

                            {showProfileMenu && (
                                <div style={styles.dropdown}>
                                    <div style={styles.dropdownItem} onClick={() => { setShowModal(true); setShowProfileMenu(false); }}>
                                        👤 Mi Perfil
                                    </div>
                                    <hr style={styles.divider} />
                                    <div style={{ ...styles.dropdownItem, color: '#ef4444' }}
                                        onClick={() => { localStorage.clear(); navigate('/login'); }}>
                                        🚪 Cerrar Sesión
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div style={styles.contentContainer}>
                    {children}
                </div>
            </main>

            {/* --- MODAL (Se mantiene igual pero con el estilo limpio) --- */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0 }}>Ajustes del Negocio</h3>
                            <FaTimes style={{ cursor: 'pointer', color: '#94a3b8' }} onClick={() => setShowModal(false)} />
                        </div>
                        
                        <form onSubmit={handleGuardarCambios}>
                            <div style={styles.imagesSection}>
                                <div style={styles.coverContainer}>
                                    <label style={styles.labelImage}>Portada</label>
                                    <div style={styles.imagePreviewBox}>
                                        {previews.imagen ? <img src={previews.imagen} style={styles.fullImg} alt="Portada" /> : <FaImage size={30} color="#cbd5e1" />}
                                        <label htmlFor="upload-portada" style={styles.uploadBtnOverlay}><FaCamera /> Cambiar</label>
                                        <input id="upload-portada" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageChange(e, 'imagen')} />
                                    </div>
                                </div>
                                <div style={styles.logoContainer}>
                                    <label style={styles.labelImage}>Logo</label>
                                    <div style={styles.logoPreviewBox}>
                                        {previews.logo ? <img src={previews.logo} style={styles.fullImg} alt="Logo" /> : <FaStore size={25} color="#cbd5e1" />}
                                        <label htmlFor="upload-logo" style={styles.uploadBtnCircle}><FaCamera size={10} /></label>
                                        <input id="upload-logo" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleImageChange(e, 'logo')} />
                                    </div>
                                </div>
                            </div>
                            <div style={styles.formGrid}>
                                <div style={styles.formGroup}><label style={styles.label}>Nombre</label><input type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={styles.input} /></div>
                                <div style={styles.formGroup}><label style={styles.label}>Teléfono</label><input type="text" name="telefono" value={formData.telefono} onChange={handleChange} style={styles.input} /></div>
                                <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}><label style={styles.label}>Dirección</label><input type="text" name="direccion" value={formData.direccion} onChange={handleChange} style={styles.input} /></div>
                                <div style={{ ...styles.formGroup, gridColumn: 'span 2' }}><label style={styles.label}>Descripción</label><textarea name="descripcion" rows="3" value={formData.descripcion} onChange={handleChange} style={styles.textarea}></textarea></div>
                            </div>
                            <button type="submit" style={styles.btnGuardar}>Actualizar Perfil</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    dashboard: { display: 'flex', minHeight: '100vh', background: '#f1f5f9', fontFamily: "'Inter', sans-serif" },
    
    // Sidebar Dinámico
    sidebar: { background: '#1e293b', padding: '25px 15px', position: 'fixed', height: '100vh', zIndex: 100, display: 'flex', flexDirection: 'column', transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
    sidebarLogo: { display: 'flex', alignItems: 'center', marginBottom: '40px' },
    logoIcon: { background: '#6f4e37', padding: '8px', borderRadius: '10px', display: 'flex' },
    logoText: { color: 'white', margin: 0, fontSize: '1.1rem', fontWeight: 'bold' },
    toggleBtn: { background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
    
    navSectionTitle: { color: '#64748b', fontWeight: '700', letterSpacing: '1px', marginBottom: '15px', paddingLeft: '10px' },
    linkText: { color: '#94a3b8', textDecoration: 'none', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '15px', borderRadius: '12px', transition: 'all 0.2s' },
    linkActive: { background: '#6f4e37', color: 'white' },
    
    // Main Content Dinámico
    main: { flex: 1, display: 'flex', flexDirection: 'column', transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
    header: { height: '70px', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 },
    contentContainer: { padding: '30px' },
    
    btnNuevo: { background: '#6f4e37', color: 'white', padding: '10px 15px', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '14px' },
    avatarImg: { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' },
    profileWrapper: { position: 'relative' },
    profileTrigger: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    dropdown: { position: 'absolute', top: '100%', right: '0', marginTop: '10px', width: '160px', background: 'white', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', borderRadius: '10px', padding: '5px', border: '1px solid #f1f5f9' },
    dropdownItem: { padding: '10px', fontSize: '13px', borderRadius: '6px', cursor: 'pointer', color: '#475569', transition: '0.2s' },
    divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' },

    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(15, 23, 42, 0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(3px)' },
    modalContent: { background: 'white', padding: '25px', borderRadius: '15px', width: '500px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    imagesSection: { display: 'flex', gap: '15px', marginBottom: '20px' },
    imagePreviewBox: { position: 'relative', flex: 1, height: '120px', borderRadius: '10px', overflow: 'hidden', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    logoPreviewBox: { position: 'relative', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '2px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    fullImg: { width: '100%', height: '100%', objectFit: 'cover' },
    uploadBtnOverlay: { position: 'absolute', bottom: '5px', right: '5px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '15px', fontSize: '10px', cursor: 'pointer' },
    uploadBtnCircle: { position: 'absolute', bottom: '0', right: '0', background: '#6f4e37', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
    formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    label: { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: '600', color: '#64748b' },
    input: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' },
    textarea: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', resize: 'none' },
    btnGuardar: { width: '100%', padding: '12px', background: '#6f4e37', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' }
};

export default LayoutEmpresa;