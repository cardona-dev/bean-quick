import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { FaBoxOpen, FaMoneyBillWave, FaStar, FaExpandAlt, FaTimes } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

import LayoutEmpresa from '../components/LayoutEmpresa';

const PERIODOS = [
    { key: 'dia',    label: 'Hoy' },
    { key: 'semana', label: 'Semana' },
    { key: 'mes',    label: 'Mes' },
    { key: 'anio',   label: 'Año' },
];

const PERIODO_LABEL = {
    dia:    'de hoy',
    semana: 'de esta semana',
    mes:    'de este mes',
    anio:   'de este año',
};

const DashboardEmpresa = () => {
    const navigate = useNavigate();
    const [data, setData]               = useState(null);
    const [loading, setLoading]         = useState(true);
    const [periodo, setPeriodo]         = useState('semana');
    const [modalOpen, setModalOpen]     = useState(null);

    const [showFeedbackModal, setShowFeedbackModal] = useState(false);
    const [calificaciones, setCalificaciones]       = useState([]);
    const [loadingFeedback, setLoadingFeedback]     = useState(false);

    const [isOpen, setIsOpen]               = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchDashboardData = useCallback(async (periodoActual) => {
        const token = localStorage.getItem('AUTH_TOKEN');
        if (!token) { navigate('/login'); return; }

        setLoading(true);
        try {
            const response = await api.get('/api/empresa/dashboard', {
                headers: { 'Authorization': `Bearer ${token}` },
                params:  { periodo: periodoActual }
            });
            setData(response.data);
            setIsOpen(response.data.empresa.is_open);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData(periodo);
    }, [periodo, fetchDashboardData]);

    const handlePeriodo = (nuevoPeriodo) => {
        if (nuevoPeriodo === periodo) return;
        setPeriodo(nuevoPeriodo);
    };

    const verFeedback = async () => {
        setLoadingFeedback(true);
        setShowFeedbackModal(true);
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const response = await api.get(`/api/empresa/calificaciones`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCalificaciones(response.data);
        } catch (error) {
            console.error("Error al cargar calificaciones:", error);
        } finally {
            setLoadingFeedback(false);
        }
    };

    const descargarReporte = async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const response = await api.get(
                '/api/empresa/dashboard/pdf',
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params:  { periodo },
                    responseType: 'blob',
                }
            );
            const file = new Blob([response.data], { type: 'application/pdf' });
            const url  = window.URL.createObjectURL(file);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `reporte-dashboard-${periodo}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            alert('Error descargando el PDF');
            console.error(error);
        }
    };

    const toggleEstadoEmpresa = async () => {
        if (updatingStatus) return;
        setUpdatingStatus(true);
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const response = await api.post(
                '/api/empresa/toggle-estado',
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

    if (loading) return (
        <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Cargando panel...
        </div>
    );

    // Mismos nombres que el original
    const stats          = data?.stats_cards || {};
    const charts         = data?.charts || {};
    const topProductos   = data?.top_productos || [];
    const ultimosPedidos = data?.ultimos_pedidos || [];

    // Para el gráfico: semana y dia usan ventas_semanales, mes y anio usan ventas_anuales
    const datosGrafico = (periodo === 'mes' || periodo === 'anio')
        ? (charts.ventas_anuales || [])
        : (charts.ventas_semanales || []);

    const usarLineChart = periodo === 'semana' || periodo === 'dia';

    return (
        <LayoutEmpresa empresa={data?.empresa}>

            {/* ESTADO TIENDA */}
            <div style={styles.tiendaRow}>
                <span style={{ fontWeight: 'bold', color: isOpen ? '#16a34a' : '#dc2626' }}>
                    {isOpen ? '🟢 Tienda Abierta' : '🔴 Tienda Cerrada'}
                </span>
                <button
                    onClick={toggleEstadoEmpresa}
                    disabled={updatingStatus}
                    style={{
                        ...styles.btnToggle,
                        background: isOpen ? '#dc2626' : '#16a34a',
                        opacity: updatingStatus ? 0.6 : 1,
                    }}
                >
                    {isOpen ? 'Cerrar tienda' : 'Abrir tienda'}
                </button>
                <h5>En caso de cerrar la tienda, los clientes no podrán realizar pedidos.</h5>
            </div>

            {/* FILTRO DE PERIODO + BOTÓN PDF */}
            <div style={styles.headerRow}>
                <div style={styles.periodoSelector}>
                    {PERIODOS.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => handlePeriodo(p.key)}
                            style={{
                                ...styles.periodoBtn,
                                ...(periodo === p.key ? styles.periodoBtnActive : {})
                            }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <button onClick={descargarReporte} style={styles.btnPdf}>
                    📄 Descargar Reporte PDF
                </button>
            </div>

            {/* KPI CARDS - mismos nombres que el original */}
            <section style={styles.sectionRow}>
                <div style={styles.cardKpi}>
                    <div style={styles.kpiIcon}><FaMoneyBillWave color="#2ecc71" /></div>
                    <div>
                        <p style={styles.kpiLabel}>Ventas {PERIODO_LABEL[periodo]}</p>
                        <h3 style={styles.kpiValue}>${stats.ventas_hoy}</h3>
                    </div>
                </div>

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

            {/* GRÁFICO ÚNICO ADAPTABLE */}
            <section style={styles.gridCharts}>
                <div style={styles.chartContainer}>
                    <div style={styles.chartHeader}>
                        <h3>Rendimiento — {PERIODOS.find(p => p.key === periodo)?.label}</h3>
                        <button onClick={() => setModalOpen('grafico')} style={styles.btnExpand}><FaExpandAlt /></button>
                    </div>
                    <div style={{ height: '250px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            {usarLineChart ? (
                                <LineChart data={datosGrafico}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="label" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="total" stroke="#6f4e37" strokeWidth={3} />
                                </LineChart>
                            ) : (
                                <BarChart data={datosGrafico}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis dataKey="label" fontSize={12} />
                                    <YAxis fontSize={12} />
                                    <Tooltip />
                                    <Bar dataKey="total" fill="#d35400" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            </section>

            {/* RANKING + PEDIDOS */}
            <section style={styles.bottomGrid}>
                <div style={styles.rankingCard}>
                    <h3>Ranking de Productos</h3>
                    <div style={{ marginTop: '15px' }}>
                        {topProductos.map((prod, i) => (
                            <div key={i} style={styles.rankingItem}>
                                <span style={styles.rankNum}>{i + 1}</span>
                                <div style={{ flex: 1 }}>
                                    <div><img src={`${prod.imagen}`} alt={prod.nombre} style={styles.img} /></div>
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

            {/* MODAL FEEDBACK */}
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

            {/* MODAL GRÁFICO EXPANDIDO */}
            {modalOpen && (
                <div style={styles.modalOverlay} onClick={() => setModalOpen(null)}>
                    <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3>Vista Detallada — {PERIODOS.find(p => p.key === periodo)?.label}</h3>
                            <button onClick={() => setModalOpen(null)} style={styles.btnClose}><FaTimes /></button>
                        </div>
                        <div style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                {usarLineChart ? (
                                    <LineChart data={datosGrafico}>
                                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip />
                                        <Line type="monotone" dataKey="total" stroke="#6f4e37" strokeWidth={4} />
                                    </LineChart>
                                ) : (
                                    <BarChart data={datosGrafico}>
                                        <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis /><Tooltip />
                                        <Bar dataKey="total" fill="#d35400" />
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

const styles = {
    tiendaRow:   { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' },
    btnToggle:   { padding: '8px 16px', borderRadius: '999px', border: 'none', cursor: 'pointer', color: 'white', fontWeight: 'bold' },
    headerRow:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '12px' },
    periodoSelector: { display: 'flex', gap: '6px', background: '#f1f5f9', borderRadius: '12px', padding: '4px' },
    periodoBtn: {
        padding: '8px 18px', borderRadius: '9px', border: 'none', cursor: 'pointer',
        background: 'transparent', fontWeight: '600', fontSize: '14px', color: '#64748b',
        transition: 'all 0.2s ease'
    },
    periodoBtnActive: { background: 'white', color: '#1e293b', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
    btnPdf: { background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' },
    sectionRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px', marginBottom: '40px' },
    cardKpi: { background: 'white', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    kpiIcon: { width: '50px', height: '50px', borderRadius: '12px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    kpiLabel: { margin: 0, color: '#64748b', fontSize: '14px' },
    kpiValue: { margin: 0, fontSize: '24px', fontWeight: '800' },
    gridCharts: { display: 'grid', gridTemplateColumns: '1fr', gap: '25px', marginBottom: '40px' },
    chartContainer: { background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    chartHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
    btnExpand: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
    bottomGrid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '25px' },
    rankingCard: { background: 'white', padding: '25px', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
    img: { width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #f1f5f9', display: 'block' },
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
    feedbackItem: { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #e2e8f0' },
    feedbackHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    feedbackUser: { fontWeight: 'bold', color: '#1e293b', fontSize: '14px' },
    starsContainer: { display: 'flex', gap: '2px' },
    feedbackComment: { margin: '8px 0', color: '#475569', fontSize: '14px', fontStyle: 'italic' },
    feedbackDate: { color: '#94a3b8', fontSize: '12px' }
};

export default DashboardEmpresa;