import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaBoxOpen, FaMoneyBillWave, FaStar, FaExpandAlt, FaTimes } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// IMPORTAMOS TU LAYOUT
import LayoutEmpresa from '../components/LayoutEmpresa'; 

const DashboardEmpresa = () => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(null);

    // --- ESTADOS PARA FEEDBACK ---
    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [calificaciones, setCalificaciones] = useState([]);
    const [loadingFeedback, setLoadingFeedback] = useState(false);
    const [isOpen, setIsOpen] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);


    useEffect(() => {
        const token = localStorage.getItem('AUTH_TOKEN');
        if (!token) { navigate('/login'); return; }

        const fetchDashboardData = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/empresa/dashboard', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setData(response.data);
                setIsOpen(response.data.empresa.is_open);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    // --- FUNCIÓN PARA VER FEEDBACK ---
    const verFeedback = async () => {
        setLoadingFeedback(true);
        setShowFeedbackModal(true);
        const token = localStorage.getItem('AUTH_TOKEN');

        try {
            const response = await axios.get(`http://127.0.0.1:8000/api/empresa/calificaciones`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCalificaciones(response.data);
        } catch (error) {
            console.error("Error al cargar calificaciones:", error);
        } finally {
            setLoadingFeedback(false);
        }
    };

    // --- FUNCIÓN PARA DESCARGAR REPORTE PDF ---

    const descargarReporte = async () => {
    const token = localStorage.getItem('AUTH_TOKEN');

        try {
            const response = await axios.get(
                'http://127.0.0.1:8000/api/empresa/dashboard/pdf',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    responseType: 'blob',
                }
            );
    
            const file = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(file);
    
            const a = document.createElement('a');
            a.href = url;
            a.download = 'reporte-dashboard.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            alert('Error descargando el PDF');
            console.error(error);
        }
    };

    // --- FUNCIÓN PARA TOGGLE ESTADO DE LA EMPRESA ---

    const toggleEstadoEmpresa = async () => {
    if (updatingStatus) return;

    setUpdatingStatus(true);
    const token = localStorage.getItem('AUTH_TOKEN');

        try {
            const response = await axios.post(
                'http://127.0.0.1:8000/api/empresa/toggle-estado',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            setIsOpen(response.data.is_open);
        } catch (error) {
            alert('Error cambiando el estado de la tienda');
            console.error(error);
        } finally {
            setUpdatingStatus(false);
        }
    };



    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando panel...</div>;

    const stats = data?.stats_cards || {};
    const charts = data?.charts || {};
    const topProductos = data?.top_productos || [];
    const ultimosPedidos = data?.ultimos_pedidos || [];

    return (
        <LayoutEmpresa empresa={data?.empresa}>
            {/* --- CONTENIDO PRINCIPAL --- */}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '25px'
            }}>
                <span style={{
                    fontWeight: 'bold',
                    color: isOpen ? '#16a34a' : '#dc2626'
                }}>
                    {isOpen ? '🟢 Tienda Abierta' : '🔴 Tienda Cerrada'}
                </span>
            
                <button
                    onClick={toggleEstadoEmpresa}
                    disabled={updatingStatus}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '999px',
                        border: 'none',
                        cursor: updatingStatus ? 'not-allowed' : 'pointer',
                        background: isOpen ? '#dc2626' : '#16a34a',
                        color: 'white',
                        fontWeight: 'bold'
                    }}
                >
                    {isOpen ? 'Cerrar tienda' : 'Abrir tienda'}
                </button>
                <h5>En caso de cerrar la tienda, los clientes no podrán realizar pedidos.</h5>
            </div>


            <button
                onClick={descargarReporte}
                style={{
                    background: '#1e293b',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginBottom: '20px'
                }}
            >
                📄 Descargar Reporte Pdf
            </button>

            <section style={styles.sectionRow}>
                <div style={styles.cardKpi}>
                    <div style={styles.kpiIcon}><FaMoneyBillWave color="#2ecc71" /></div>
                    <div>
                        <p style={styles.kpiLabel}>Ventas Hoy</p>
                        <h3 style={styles.kpiValue}>${stats.ventas_hoy}</h3>
                    </div>
                </div>
                
                {/* KPI DE REPUTACIÓN (AHORA CLICKEABLE) */}
                <div style={{...styles.cardKpi, cursor: 'pointer'}} onClick={verFeedback}>
                    <div style={styles.kpiIcon}><FaStar color="#f1c40f" /></div>
                    <div>
                        <p style={styles.kpiLabel}>Reputación (Ver opiniones)</p>
                        <h3 style={styles.kpiValue}>{stats.promedio_calificacion} / 5</h3>
                    </div>
                </div>

                <div style={{...styles.cardKpi, cursor: 'pointer'}} onClick={verFeedback}>
                    <div style={styles.kpiIcon}><FaBoxOpen color="#e67e22" /></div>
                    <div>
                        <p style={styles.kpiLabel}>Total Feedback</p>
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
                                <XAxis dataKey="label" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Line type="monotone" dataKey="total" stroke="#6f4e37" strokeWidth={3} />
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
                                <XAxis dataKey="label" fontSize={12} />
                                <YAxis fontSize={12} />
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
                            <div key={i} style={styles.rankingItem}>
                                <span style={styles.rankNum}>{i + 1}</span>
                                <div style={{ flex: 1 }}>
                                    <div><img 
                                                src={`${prod.imagen}`} 
                                                alt={prod.nombre} 
                                                style={styles.img} 
                                            /></div>
                                    <div style={{ fontWeight: 'bold' }}>{prod.nombre}</div>
                                    <div style={{ fontSize: '12px', color: '#888' }}>${prod.precio}</div>
                                </div>
                                <span style={styles.rankSales}>{prod.ventas} uds</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={styles.rankingCard}>
                    <h3>Movimientos Recientes</h3>
                    <div style={{ marginTop: '15px' }}>
                        {ultimosPedidos.map((ped, i) => (
                            <div key={i} style={styles.pedidoItem}>
                                <div style={styles.pedidoAvatar}>{ped.cliente.charAt(0)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{ped.cliente}</div>
                                    <div style={{ fontSize: '11px', color: '#888' }}>{ped.hora}</div>
                                </div>
                                <div style={{ fontWeight: 'bold', color: '#2ecc71' }}>${ped.total}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- MODAL DE FEEDBACK (OPINIONES) --- */}
            {showFeedbackModal && (
                <div style={styles.modalOverlay} onClick={() => setShowFeedbackModal(false)}>
                    <div style={{ ...styles.modalContent, maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Opiniones de Clientes</h3>
                            <button onClick={() => setShowFeedbackModal(false)} style={styles.btnClose}><FaTimes /></button>
                        </div>
                        <div style={styles.modalBody}>
                            {loadingFeedback ? (
                                <p style={{textAlign: 'center', padding: '20px'}}>Cargando comentarios...</p>
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
                                <p style={{ textAlign: 'center', color: '#64748b', padding: '20px' }}>Aún no tienes calificaciones.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODALES DE EXPANSIÓN DE GRÁFICAS */}
            {modalOpen && (
                <div style={styles.modalOverlay} onClick={() => setModalOpen(null)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Vista Detallada</h3>
                            <button onClick={() => setModalOpen(null)} style={styles.btnClose}><FaTimes /></button>
                        </div>
                        <div style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                {modalOpen === 'semanal' ? (
                                    <LineChart data={charts.ventas_semanales || []}>
                                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Line type="monotone" dataKey="total" stroke="#6f4e37" strokeWidth={4} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={charts.ventas_anuales || []}>
                                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip /><Bar dataKey="total" fill="#d35400" />
                                    </BarChart>
                                )}
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </LayoutEmpresa>
    );
};

// Estilos
const styles = {
    sectionRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px' },
    cardKpi: { background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    kpiIcon: { width: '50px', height: '50px', borderRadius: '12px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    kpiLabel: { margin: 0, color: '#64748b', fontSize: '14px' },
    kpiValue: { margin: 0, fontSize: '24px', fontWeight: '800' },
    gridCharts: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' },
    chartContainer: { background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    chartHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    btnExpand: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px' },
    rankingCard: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    img: {
    width: '45px',        // Tamaño ideal para que no rompa el diseño
    height: '45px',
    borderRadius: '10px', // Bordes suaves para un look moderno
    objectFit: 'cover',   // Importante: mantiene la proporción sin deformar
    border: '1px solid #f1f5f9', // Un borde sutil para definir la imagen
    display: 'block'      // Quita espacios en blanco residuales
},
    rankingItem: { display: 'flex', alignItems: 'center', gap: '15px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
    rankNum: { width: '28px', height: '28px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px', fontWeight: 'bold' },
    rankSales: { background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    pedidoItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
    pedidoAvatar: { width: '35px', height: '35px', borderRadius: '8px', background: '#6f4e37', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: 'white', padding: '30px', borderRadius: '20px', width: '80%', maxWidth: '900px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    modalBody: { maxHeight: '60vh', overflowY: 'auto' },
    btnClose: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px' },
    // Estilos de Feedback
    feedbackItem: { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #e2e8f0' },
    feedbackHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    feedbackUser: { fontWeight: 'bold', color: '#1e293b', fontSize: '14px' },
    starsContainer: { display: 'flex', gap: '2px' },
    feedbackComment: { margin: '8px 0', color: '#475569', fontSize: '14px', fontStyle: 'italic' },
    feedbackDate: { color: '#94a3b8', fontSize: '12px' }
};

export default DashboardEmpresa;