import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FaClock, FaCheck, FaBox, FaUser, FaChevronDown, FaChevronUp, FaImage, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

// IMPORTAMOS TU LAYOUT PROFESIONAL
import LayoutEmpresa from '../components/LayoutEmpresa'; 

const GestionPedidosEmpresa = () => {
    const [pedidos, setPedidos] = useState([]);
    const [empresa, setEmpresa] = useState(null); 
    const [filtro, setFiltro] = useState('Pagado'); 
    const [loading, setLoading] = useState(true);
    const [expandido, setExpandido] = useState({}); 
    const navigate = useNavigate();

    const estados = ['Pagado', 'Preparando', 'Listo', 'Entregado', 'Cancelado'];

    useEffect(() => {
        const cargarDatosIniciales = async () => {
            setLoading(true);
            const token = localStorage.getItem('AUTH_TOKEN');
            if (!token) { navigate('/login'); return; }

            try {
                // Ejecutamos ambas peticiones en paralelo
                const [resEmpresa, resPedidos] = await Promise.all([
                    api.get('/api/empresa/dashboard', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    api.get('/api/empresa/pedidos', {
                        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
                    })
                ]);

                setEmpresa(resEmpresa.data.empresa);
                setPedidos(resPedidos.data);
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setLoading(false);
            }
        };

        cargarDatosIniciales();

        // Intervalo para actualizar solo los pedidos cada 30 segundos
        const intervalo = setInterval(fetchPedidosSolo, 30000);
        return () => clearInterval(intervalo);
    }, [navigate]);

    // Función secundaria para el refresco automático sin recargar la empresa
    const fetchPedidosSolo = async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const res = await api.get('/api/empresa/pedidos', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            setPedidos(res.data);
        } catch (error) {
            console.error("Error en refresco automático:", error);
        }
    };

    const cambiarEstado = async (id, nuevoEstado) => {
        if (nuevoEstado === 'Cancelado' && !window.confirm("¿Estás seguro de que deseas cancelar este pedido?")) {
            return;
        }

        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            await api.patch(`/api/empresa/pedidos/${id}/estado`, 
                { estado: nuevoEstado },
                { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
            );
            // Actualización optimista de la UI
            setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
        } catch (error) {
            alert(`No se pudo actualizar: ${error.response?.data?.message || "Error de servidor"}`);
        }
    };

    const togglePedido = (id) => {
        setExpandido(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const pedidosFiltrados = pedidos.filter(p => p.estado === filtro);

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Cargando gestión de pedidos...</div>;

    return (
        <LayoutEmpresa empresa={empresa}>
            {/* CABECERA DE LA SECCIÓN */}
            <div style={styles.contentHeader}>
                <h2 style={styles.title}>Gestión de Pedidos</h2>
                <p style={styles.subtitle}>Administra tus pedidos activos y finalizados en tiempo real.</p>
            </div>

            {/* BARRA DE FILTROS (TABS) */}
            <div style={styles.filterBar}>
                {estados.map(e => (
                    <button 
                        key={e} 
                        onClick={() => setFiltro(e)}
                        style={{...styles.filterTab, ...(filtro === e ? styles.activeTab : {})}}
                    >
                        {e} ({pedidos.filter(p => p.estado === e).length})
                    </button>
                ))}
            </div>

            {/* LISTA DE PEDIDOS */}
            <div style={styles.listContainer}>
                {pedidosFiltrados.length === 0 ? (
                    <div style={styles.empty}>
                        <FaBox size={40} color="#cbd5e1" />
                        <p>No hay pedidos en estado <strong>{filtro}</strong></p>
                    </div>
                ) : (
                    pedidosFiltrados.map((pedido, index) => {
                        const esExpandido = expandido[pedido.id];
                        return (
                            <div key={pedido.id} style={styles.card}>
                                <div style={styles.mainRow}>
                                    <div style={styles.infoCol}>
                                        <div style={styles.cardHeader}>
                                            <span style={styles.badgeIndex}>#{index + 1}</span>
                                            <span style={styles.orderId}>Pedido {pedido.id}</span>
                                            <span style={styles.time}><FaClock /> {pedido.hora_recogida}</span>
                                        </div>
                                        <div style={styles.clientName}><FaUser size={12}/> {pedido.cliente?.name}</div>
                                        <button onClick={() => togglePedido(pedido.id)} style={styles.toggleBtn}>
                                            {pedido.productos?.length || 0} productos {esExpandido ? <FaChevronUp /> : <FaChevronDown />}
                                        </button>
                                    </div>

                                    <div style={styles.actionCol}>
                                        <div style={styles.totalPrice}>${parseFloat(pedido.total).toLocaleString()}</div>
                                        <div style={styles.buttonGroup}>
                                            {pedido.estado === 'Pagado' && (
                                                <button style={styles.btnPrep} onClick={() => cambiarEstado(pedido.id, 'Preparando')}>Empezar Cocina</button>
                                            )}
                                            {pedido.estado === 'Preparando' && (
                                                <button style={styles.btnListo} onClick={() => cambiarEstado(pedido.id, 'Listo')}>Marcar como Listo</button>
                                            )}
                                            {pedido.estado === 'Listo' && (
                                                <button style={styles.btnEntregar} onClick={() => cambiarEstado(pedido.id, 'Entregado')}>Confirmar Entrega</button>
                                            )}
                                            
                                            {/* BOTÓN CANCELAR (Solo para estados no finales) */}
                                            {['Pagado', 'Preparando', 'Listo'].includes(pedido.estado) && (
                                                <button style={styles.btnCancel} onClick={() => cambiarEstado(pedido.id, 'Cancelado')}>Cancelar Pedido</button>
                                            )}

                                            {pedido.estado === 'Entregado' && <span style={styles.completed}><FaCheck /> Entregado con éxito</span>}
                                            {pedido.estado === 'Cancelado' && <span style={styles.cancelled}><FaTimesCircle /> Pedido Cancelado</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* DESPLEGABLE DE PRODUCTOS */}
                                {esExpandido && (
                                    <div style={styles.dropdown}>
                                        {pedido.productos.map(prod => (
                                            <div key={prod.id} style={styles.productRow}>
                                                <div style={styles.imgWrapper}>
                                                    {prod.imagen ? (
                                                        <img src={`http://127.0.0.1:8000/storage/${prod.imagen}`} alt={prod.nombre} style={styles.productImg} />
                                                    ) : (
                                                        <div style={styles.noImg}><FaImage /></div>
                                                    )}
                                                </div>
                                                <div style={styles.productDetails}>
                                                    <span style={styles.productName}>
                                                        <strong>{prod.pivot.cantidad}x</strong> {prod.nombre}
                                                    </span>
                                                    <span style={styles.productPrice}>
                                                        Unitario: ${parseFloat(prod.pivot.precio_unitario).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </LayoutEmpresa>
    );
};

// ESTILOS
const styles = {
    contentHeader: { marginBottom: '30px' },
    title: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#1e293b' },
    subtitle: { margin: '5px 0 0 0', color: '#64748b', fontSize: '15px' },
    filterBar: { display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '10px' },
    filterTab: { 
        padding: '10px 22px', border: 'none', background: 'white', cursor: 'pointer', 
        borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: '#64748b', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' 
    },
    activeTab: { background: '#6f4e37', color: 'white' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
    card: { 
        background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', 
        border: '1px solid #f1f5f9', overflow: 'hidden' 
    },
    mainRow: { display: 'flex', padding: '24px', alignItems: 'center', justifyContent: 'space-between' },
    infoCol: { flex: 1 },
    cardHeader: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' },
    badgeIndex: { backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' },
    orderId: { fontWeight: 'bold', fontSize: '18px', color: '#1e293b' },
    time: { color: '#d35400', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' },
    clientName: { fontSize: '15px', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' },
    toggleBtn: { background: '#f8fafc', border: '1px solid #e2e8f0', padding: '7px 14px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    actionCol: { textAlign: 'right', minWidth: '180px' },
    totalPrice: { marginBottom: '12px', fontWeight: '900', fontSize: '22px', color: '#1e293b' },
    buttonGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    btnPrep: { background: '#2563eb', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    btnListo: { background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    btnEntregar: { background: '#64748b', color: 'white', border: 'none', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' },
    btnCancel: { background: 'none', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline', marginTop: '5px' },
    completed: { color: '#10b981', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' },
    cancelled: { color: '#ef4444', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' },
    dropdown: { backgroundColor: '#f8fafc', padding: '20px', borderTop: '1px solid #f1f5f9' },
    productRow: { display: 'flex', alignItems: 'center', gap: '15px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
    imgWrapper: { width: '45px', height: '45px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' },
    productImg: { width: '100%', height: '100%', objectFit: 'cover' },
    noImg: { width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' },
    productDetails: { display: 'flex', flexDirection: 'column' },
    productName: { fontSize: '14px', color: '#1e293b' },
    productPrice: { fontSize: '12px', color: '#94a3b8' },
    empty: { textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }
};

export default GestionPedidosEmpresa;