import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
    FaBoxOpen, FaPlusCircle, FaMoneyBillWave, FaTimes, FaExpandAlt,
    FaStar, FaStore, FaUserCircle, FaChevronDown, FaCamera, FaSave
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const DashboardEmpresa = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const menuRef = useRef(null);

    // Estado para el formulario de actualización (incluimos logo y foto_local)
    const [formData, setFormData] = useState({
        nombre: '', direccion: '', telefono: '', descripcion: '', logo: null, foto_local: null
    });
    // Nuevos estados
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [calificaciones, setCalificaciones] = useState([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);

    // Función para cargar calificaciones
    const verFeedback = async () => {
        // Validar que tengamos los datos de la empresa antes de pedir el feedback
        if (!data?.empresa?.id) return;

        setLoadingFeedback(true);
        setShowFeedbackModal(true);
        const token = localStorage.getItem('AUTH_TOKEN');

        try {
            // CORRECCIÓN: Usar data.empresa.id en lugar de empresa.id
            const response = await axios.get(`http://127.0.0.1:8000/api/empresa/calificaciones`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCalificaciones(response.data);
            console.log("Datos recibidos:", response.data);
        } catch (error) {
            console.error("Error al cargar calificaciones:", error);
        } finally {
            setLoadingFeedback(false);
        }
    };
    
    const fetchDashboardData = async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/empresa/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setData(response.data);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    // Función para abrir el modal y cargar los datos actuales de la empresa
    const abrirModalPerfil = () => {
        if (data?.empresa) {
            setFormData({
                nombre: data.empresa.nombre || '',
                direccion: data.empresa.direccion || '',
                telefono: data.empresa.telefono || '',
                descripcion: data.empresa.descripcion || '',
                logo: null,
                foto_local: null
            });
        }

        setShowEditModal(true);
        setShowProfileMenu(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('AUTH_TOKEN');
        if (!token) { navigate('/login'); return; }

        fetchDashboardData();

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [navigate]);

    const handleUpdatePerfil = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('AUTH_TOKEN');
        const dataToSend = new FormData();

        dataToSend.append('nombre', formData.nombre);
        dataToSend.append('direccion', formData.direccion);
        dataToSend.append('telefono', formData.telefono);
        dataToSend.append('descripcion', formData.descripcion);

        if (formData.logo) dataToSend.append('logo', formData.logo);
        if (formData.foto_local) dataToSend.append('foto_local', formData.foto_local);

        try {
            // Usamos POST porque multipart/form-data a veces da problemas con PUT en algunos servidores
            await axios.post('http://127.0.0.1:8000/api/empresa/update', dataToSend, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setShowEditModal(false);
            fetchDashboardData(); // Recargar para ver los cambios reflejados
        } catch (error) {
            alert("Error al actualizar el perfil" + error);
        }
    };

    if (loading) return <div style={styles.loader}>Cargando panel de control...</div>;

    const empresa = data?.empresa;
    const stats = data?.stats_cards || {};
    const charts = data?.charts || {};
    const topProductos = data?.top_productos || [];
    const ultimosPedidos = data?.ultimos_pedidos || [];

    return (
        <div style={styles.dashboard}>
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
                <header style={styles.header}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', position: 'relative' }} ref={menuRef}>
                        {empresa?.logo ? (
                            <img src={empresa.logo_url} alt="Logo" style={styles.logoImg} />
                        ) : (
                            <FaUserCircle size={50} color="#cbd5e1" />
                        )}

                        <div style={styles.profileSelector} onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h1 style={{ margin: 0, fontSize: '20px' }}>{empresa?.nombre}</h1>
                                <FaChevronDown size={12} color="#64748b" />
                            </div>
                            <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>Administrador</p>

                            {showProfileMenu && (
                                <div style={styles.dropdown}>
                                    <div style={styles.dropdownItem} onClick={abrirModalPerfil}>
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

                <section style={styles.sectionRow}>
                    <div style={styles.cardKpi}>
                        <div style={styles.kpiIcon}><FaMoneyBillWave color="#2ecc71" /></div>
                        <div>
                            <p style={styles.kpiLabel}>Ventas Hoy</p>
                            <h3 style={styles.kpiValue}>${stats.ventas_hoy}</h3>
                        </div>
                    </div>
                    <div style={styles.cardKpi}>
                        <div style={styles.kpiIcon}><FaStar color="#f1c40f" /></div>
                        <div>
                            <p style={styles.kpiLabel}>Reputación</p>
                            <h3 style={styles.kpiValue}>{stats.promedio_calificacion} / 5</h3>
                        </div>
                    </div>
                    <div style={{...styles.cardKpi, cursor: 'pointer'}} onClick={verFeedback}>
                        <div style={styles.kpiIcon}><FaBoxOpen color="#e67e22" /></div>
                        <div>
                            <p style={styles.kpiLabel}>Total Feedback (Ver)</p>
                            <h3 style={styles.kpiValue}>{stats.total_calificaciones}</h3>
                        </div>
                    </div>
                </section>

                <section style={styles.gridCharts}>
                    <div style={styles.chartContainer}>
                        <div style={styles.chartHeader}>
                            <h3>Rendimiento Semanal</h3>
                            <button onClick={() => setModalOpen('semanal')} style={styles.btnExpand}><FaExpandAlt /></button>
                        </div>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={charts.ventas_semanales || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="total" stroke="#6f4e37" strokeWidth={3} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div style={styles.chartContainer}>
                        <div style={styles.chartHeader}>
                            <h3>Ventas Mensuales</h3>
                            <button onClick={() => setModalOpen('anual')} style={styles.btnExpand}><FaExpandAlt /></button>
                        </div>
                        <div style={{ height: '250px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.ventas_anuales || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="label" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#d35400" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                <section style={styles.bottomGrid}>
                    <div style={styles.rankingCard}>
                        <h3>Ranking de Productos</h3>
                        <div style={{ marginTop: '15px' }}>
                            {topProductos.map((prod, i) => (
                                <div key={i} style={{
                                    ...styles.rankingItem,
                                    background: i === 0 ? '#fffdf5' : 'transparent',
                                    borderBottom: i === topProductos.length - 1 ? 'none' : '1px solid #f1f5f9'
                                }}>
                                    <span style={{ ...styles.rankNum, background: i === 0 ? '#ffd700' : '#f1f5f9' }}>{i + 1}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold' }}>{prod.nombre}</div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>${prod.precio}</div>
                                    </div>
                                    <span style={styles.rankSales}>{prod.ventas} uds</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={styles.quickActions}>
                        <div style={styles.rankingCard}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ margin: 0 }}>Movimientos Recientes</h3>
                            </div>
                            {ultimosPedidos.map((ped, i) => (
                                <div key={i} style={styles.pedidoItem}>
                                    <div style={styles.pedidoAvatar}>{ped.cliente.charAt(0)}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{ped.cliente}</div>
                                        <div style={{ fontSize: '11px', color: '#888' }}>{ped.hora}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 'bold', color: '#2ecc71' }}>${ped.total}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            {/* MODAL DE FEEDBACK */}
            {showFeedbackModal && (
                <div style={styles.modalOverlay} onClick={() => setShowFeedbackModal(false)}>
                    <div style={{ ...styles.modalContent, maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Opiniones de Clientes</h3>
                            <button onClick={() => setShowFeedbackModal(false)} style={styles.btnClose}><FaTimes /></button>
                        </div>
                        <div style={styles.modalBody}>
                            {loadingFeedback ? (
                                <p>Cargando comentarios...</p>
                            ) : calificaciones.length > 0 ? (
                                calificaciones.map((cal, index) => (
                                    <div key={index} style={styles.feedbackItem}>
                                        <div style={styles.feedbackHeader}>
                                            <span style={styles.feedbackUser}>{cal.usuario?.name || 'Cliente'}</span>
                                            <div style={styles.starsContainer}>
                                                {[...Array(5)].map((_, i) => (
                                                    <FaStar key={i} color={i < cal.estrellas ? "#f1c40f" : "#e2e8f0"} size={14} />
                                                ))}
                                            </div>
                                        </div>
                                        <p style={styles.feedbackComment}>"{cal.comentario}"</p>
                                        <small style={styles.feedbackDate}>Producto: {cal.producto?.nombre} • {new Date(cal.created_at).toLocaleDateString()}</small>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <p style={{ color: '#64748b' }}>Aún no tienes calificaciones.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE EDITAR PERFIL */}
            {showEditModal && (
                <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Actualizar Datos de Empresa</h3>
                            <button onClick={() => setShowEditModal(false)} style={styles.btnClose}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleUpdatePerfil} style={styles.form}>
                            <div style={styles.inputGroup}>
                                <label>Nombre Comercial</label>
                                <input type="text" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required style={styles.input} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label>Dirección</label>
                                <input type="text" value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} style={styles.input} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label>Teléfono</label>
                                <input type="text" value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} style={styles.input} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label>Descripción</label>
                                <textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} style={styles.textarea} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label><FaCamera /> Cambiar Logo</label>
                                <input type="file" onChange={e => setFormData({ ...formData, logo: e.target.files[0] })} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label><FaCamera /> Cambiar Foto Local</label>
                                <input type="file" onChange={e => setFormData({ ...formData, foto_local: e.target.files[0] })} />
                            </div>
                            <button type="submit" style={styles.btnSave}>
                                <FaSave /> Guardar Cambios
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL GRÁFICO SEMANAL EXPANDIDO */}
            {modalOpen === 'semanal' && (
                <div style={styles.modalOverlay} onClick={() => setModalOpen(null)}>
                    <div style={{...styles.modalContent, maxWidth: '900px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Rendimiento Semanal - Vista Expandida</h3>
                            <button onClick={() => setModalOpen(null)} style={styles.btnClose}><FaTimes /></button>
                        </div>
                        <div style={{ height: '500px', padding: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={charts.ventas_semanales || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="label" fontSize={14} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={14} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="total" stroke="#6f4e37" strokeWidth={4} dot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL GRÁFICO ANUAL EXPANDIDO */}
            {modalOpen === 'anual' && (
                <div style={styles.modalOverlay} onClick={() => setModalOpen(null)}>
                    <div style={{...styles.modalContent, maxWidth: '900px', width: '90%'}} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Ventas Mensuales - Vista Expandida</h3>
                            <button onClick={() => setModalOpen(null)} style={styles.btnClose}><FaTimes /></button>
                        </div>
                        <div style={{ height: '500px', padding: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={charts.ventas_anuales || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="label" fontSize={14} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={14} tickLine={false} axisLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#d35400" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    dashboard: { display: 'flex', minHeight: '100vh', background: '#f8fafc', color: '#1e293b' },
    sidebar: { width: '260px', background: 'white', padding: '30px 20px', position: 'fixed', height: '100vh', borderRight: '1px solid #e2e8f0' },
    sidebarLogo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' },
    main: { flex: 1, padding: '30px 50px', marginLeft: '260px' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
    logoImg: { width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' },
    btnNuevo: { background: '#6f4e37', color: 'white', padding: '12px 20px', borderRadius: '10px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' },
    profileSelector: { cursor: 'pointer', padding: '5px 10px' },
    dropdown: { position: 'absolute', top: '100%', left: '70px', background: 'white', minWidth: '180px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', borderRadius: '12px', padding: '8px', zIndex: 100, border: '1px solid #f1f5f9' },
    dropdownItem: { padding: '10px 12px', fontSize: '14px', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' },
    divider: { border: 'none', borderTop: '1px solid #f1f5f9', margin: '4px 0' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '30px', borderRadius: '20px', width: '450px', boxShadow: '0 20px 25px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    modalBody: { maxHeight: '60vh', overflowY: 'auto' },
    btnClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#94a3b8', transition: 'color 0.2s' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' },
    textarea: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', minHeight: '80px', fontSize: '14px', fontFamily: 'inherit' },
    btnSave: { background: '#6f4e37', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' },
    sectionRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px' },
    cardKpi: { background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', transition: 'transform 0.2s, box-shadow 0.2s' },
    kpiIcon: { width: '50px', height: '50px', borderRadius: '12px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    kpiLabel: { margin: 0, color: '#64748b', fontSize: '14px' },
    kpiValue: { margin: 0, fontSize: '24px', fontWeight: '800' },
    gridCharts: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' },
    chartContainer: { background: 'white', padding: '20px', borderRadius: '16px' },
    chartHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    btnExpand: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', transition: 'color 0.2s', fontSize: '16px' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px' },
    rankingCard: { background: 'white', padding: '25px', borderRadius: '16px' },
    rankingItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0' },
    rankNum: { width: '28px', height: '28px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold' },
    rankSales: { background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    quickActions: { display: 'flex', flexDirection: 'column', gap: '20px' },
    pedidoItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
    pedidoAvatar: { width: '35px', height: '35px', borderRadius: '8px', background: '#6f4e37', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
    navItem: { padding: '12px 15px' },
    linkText: { color: '#475569', textDecoration: 'none', fontWeight: '500' },
    feedbackItem: { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '12px' },
    feedbackHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    feedbackUser: { fontWeight: 'bold', color: '#1e293b', fontSize: '14px' },
    starsContainer: { display: 'flex', gap: '2px' },
    feedbackComment: { margin: '8px 0', color: '#475569', fontSize: '14px', fontStyle: 'italic' },
    feedbackDate: { color: '#94a3b8', fontSize: '12px' }
};

export default DashboardEmpresa;