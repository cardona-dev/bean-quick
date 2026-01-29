import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaClock, FaCheck, FaBox, FaUser, FaChevronDown, FaChevronUp, FaImage, FaTimes } from 'react-icons/fa';
import LayoutEmpresa from '../components/LayoutEmpresa'; // Asegúrate de que la ruta sea correcta

const GestionPedidosEmpresa = () => {
    const [pedidos, setPedidos] = useState([]);
    const [filtro, setFiltro] = useState('Pendiente'); 
    const [loading, setLoading] = useState(true);
    const [expandido, setExpandido] = useState({}); 

    const estados = ['Pendiente', 'Preparando', 'Listo', 'Entregado', 'Cancelado'];

    useEffect(() => {
        fetchPedidos();
        const intervalo = setInterval(fetchPedidos, 30000);
        return () => clearInterval(intervalo);
    }, []);

    const fetchPedidos = async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/empresa/pedidos', {
                headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }
            });
            setPedidos(res.data);
        } catch (error) {
            console.error("Error al cargar pedidos", error);
        } finally {
            setLoading(false);
        }
    };

    const cambiarEstado = async (id, nuevoEstado) => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            await axios.patch(`http://127.0.0.1:8000/api/empresa/pedidos/${id}/estado`, 
                { estado: nuevoEstado },
                { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }
            );
            setPedidos(prev => prev.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p));
        } catch (error) {
            alert(`No se pudo actualizar: ${error.response?.data?.message || "Error"}`);
        }
    };

    const togglePedido = (id) => {
        setExpandido(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const pedidosFiltrados = pedidos.filter(p => p.estado === filtro);

    if (loading) return <div style={styles.center}>Cargando pedidos...</div>;

    return (
        <LayoutEmpresa titulo="Gestión de Pedidos">
            {/* Selector de Estados */}
            <div style={styles.filterBar}>
                {estados.map(e => (
                    <button key={e} onClick={() => setFiltro(e)}
                        style={{...styles.filterTab, ...(filtro === e ? styles.activeTab : {})}}>
                        {e} ({pedidos.filter(p => p.estado === e).length})
                    </button>
                ))}
            </div>

            {/* Listado de Pedidos */}
            <div style={styles.listContainer}>
                {pedidosFiltrados.length === 0 ? (
                    <div style={styles.empty}>
                        <FaBox size={40} color="#ccc" />
                        <p>Sin pedidos {filtro}</p>
                    </div>
                ) : (
                    pedidosFiltrados.map((pedido, index) => {
                        const esExpandido = expandido[pedido.id];
                        return (
                            <div key={pedido.id} style={styles.card}>
                                <div style={styles.mainRow}>
                                    <div style={styles.infoCol}>
                                        <div style={styles.cardHeader}>
                                            <span style={styles.badgeIndex}>{index + 1}º</span>
                                            <span style={styles.orderId}>#{pedido.id}</span>
                                            <span style={styles.time}><FaClock /> {pedido.hora_recogida}</span>
                                        </div>
                                        <div style={styles.clientName}><FaUser size={12}/> {pedido.cliente?.name}</div>
                                        <button onClick={() => togglePedido(pedido.id)} style={styles.toggleBtn}>
                                            {pedido.productos?.length || 0} items {esExpandido ? <FaChevronUp /> : <FaChevronDown />}
                                        </button>
                                    </div>

                                    <div style={styles.actionCol}>
                                        <div style={styles.totalPrice}>${parseFloat(pedido.total).toLocaleString()}</div>
                                        {pedido.estado === 'Pendiente' && <button style={styles.btnPrep} onClick={() => cambiarEstado(pedido.id, 'Preparando')}>Cocinar</button>}
                                        {pedido.estado === 'Preparando' && <button style={styles.btnListo} onClick={() => cambiarEstado(pedido.id, 'Listo')}>¡Listo!</button>}
                                        {pedido.estado === 'Listo' && <button style={styles.btnEntregar} onClick={() => cambiarEstado(pedido.id, 'Entregado')}>Entregar</button>}
                                        {pedido.estado === 'Entregado' && <span style={styles.completed}><FaCheck /> Entregado</span>}
                                        {pedido.estado === 'Cancelado' && <span style={styles.cancelledText}><FaTimes /> Cancelado</span>}
                                    </div>
                                </div>

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
                                                    <span style={styles.productName}><strong>{prod.pivot.cantidad}x</strong> {prod.nombre}</span>
                                                    <span style={styles.productPrice}>U: ${(prod.pivot.precio_unitario).toLocaleString()}</span>
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

// Mantenemos solo los estilos específicos de la página de pedidos
const styles = {
    filterBar: { display: 'flex', gap: '10px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' },
    filterTab: { padding: '10px 20px', border: 'none', background: 'white', cursor: 'pointer', borderRadius: '12px', fontSize: '14px', whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', color: '#64748b' },
    activeTab: { background: '#6f4e37', color: 'white' },
    listContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '15px' },
    card: { background: 'white', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #f1f5f9' },
    mainRow: { padding: '20px' },
    infoCol: { flex: 1 },
    cardHeader: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' },
    badgeIndex: { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
    orderId: { fontWeight: 'bold', fontSize: '16px', color: '#1e293b' },
    time: { color: '#e11d48', fontSize: '13px', fontWeight: 'bold', marginLeft: 'auto' },
    clientName: { fontSize: '14px', color: '#475569', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '5px' },
    toggleBtn: { background: '#f1f5f9', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#475569' },
    actionCol: { marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    totalPrice: { fontWeight: '800', fontSize: '18px', color: '#1e293b' },
    btnPrep: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    btnListo: { background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    btnEntregar: { background: '#6f4e37', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    dropdown: { background: '#f8fafc', padding: '15px' },
    productRow: { display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid #e2e8f0' },
    imgWrapper: { width: '50px', height: '50px', borderRadius: '8px', overflow: 'hidden' },
    productImg: { width: '100%', height: '100%', objectFit: 'cover' },
    productDetails: { display: 'flex', flexDirection: 'column' },
    productName: { fontSize: '14px', color: '#1e293b' },
    productPrice: { fontSize: '12px', color: '#64748b' },
    center: { textAlign: 'center', marginTop: '100px', fontSize: '18px', color: '#64748b' },
    empty: { textAlign: 'center', padding: '60px', gridColumn: '1/-1', color: '#94a3b8' },
    completed: { color: '#10b981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
    cancelledText: { color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }
};

export default GestionPedidosEmpresa;