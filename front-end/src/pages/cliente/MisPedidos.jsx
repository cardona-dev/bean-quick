import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    FaChevronDown, FaChevronUp, FaCoffee, FaClock, 
    FaMapMarkerAlt, FaTimesCircle, FaStar, FaRegStar, FaCheckCircle 
} from 'react-icons/fa';

const MisPedidos = () => {
    const [pedidos, setPedidos] = useState([]);
    const [abierto, setAbierto] = useState(null);
    const [filtro, setFiltro] = useState('todos');
    const [loadingEnvio, setLoadingEnvio] = useState(false);

    // --- ESTADOS PARA CALIFICACIÓN ---
    const [showModal, setShowModal] = useState(false);
    const [calificando, setCalificando] = useState({
        pedido_id: '',
        producto_id: '',
        nombre_prod: '',
        estrellas: 5,
        comentario: ''
    });

    const fetchPedidos = async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/cliente/mis-pedidos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPedidos(res.data);
        } catch (error) {
            console.error("Error al cargar pedidos", error);
        }
    };

    useEffect(() => {
        fetchPedidos();
    }, []);

    // --- NUEVA LÓGICA DE CANCELACIÓN (INTEGRADA) ---
    const cancelarPedido = async (id) => {
        if (!window.confirm("¿Estás seguro de que deseas cancelar este pedido? El stock será devuelto a la tienda.")) return;
        
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const res = await axios.post(`http://127.0.0.1:8000/api/cliente/pedidos/${id}/cancelar`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Actualizamos localmente el estado del pedido
            setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: 'Cancelado' } : p));
            
            // Mostramos el mensaje de éxito que viene del backend (restauración de stock)
            alert(res.data.message || "Pedido cancelado con éxito.");
        } catch (error) {
            alert(error.response?.data?.message || "No se pudo cancelar el pedido.");
        }
    };

    // --- LÓGICA DE CALIFICACIÓN ---
    const abrirModal = (pedidoId, producto) => {
        setCalificando({
            pedido_id: pedidoId,
            producto_id: producto.id,
            nombre_prod: producto.nombre,
            estrellas: 5,
            comentario: ''
        });
        setShowModal(true);
    };

    const enviarCalificacion = async () => {
        setLoadingEnvio(true);
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            await axios.post('http://127.0.0.1:8000/api/cliente/calificar', {
                pedido_id: calificando.pedido_id,
                producto_id: calificando.producto_id,
                estrellas: calificando.estrellas,
                comentario: calificando.comentario
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            alert("¡Gracias por tu reseña! ⭐");
            setShowModal(false);

            const nuevosPedidos = pedidos.map(p => {
                if (p.id === calificando.pedido_id) {
                    const nuevosProds = p.productos.map(prod => 
                        prod.id === calificando.producto_id ? { ...prod, ya_calificado: true } : prod
                    );
                    return { ...p, productos: nuevosProds };
                }
                return p;
            });
            setPedidos(nuevosPedidos);

        } catch (error) {
            alert(error.response?.data?.message || "Error al calificar");
        } finally {
            setLoadingEnvio(false);
        }
    };

    const pedidosFiltrados = filtro === 'todos' 
        ? pedidos 
        : pedidos.filter(p => p.estado.toLowerCase() === filtro.toLowerCase());

    const togglePedido = (id) => {
        setAbierto(abierto === id ? null : id);
    };

    const getStatusStyle = (status) => {
        switch (status.toLowerCase()) {
            case 'pendiente': return { color: '#f39c12', background: '#fdf5e6' };
            case 'preparando': return { color: '#3498db', background: '#ebf5fb' };
            case 'listo': return { color: '#27ae60', background: '#eafaf1' };
            case 'entregado': return { color: '#6f4e37', background: '#f5f5f5' };
            case 'cancelado': return { color: '#e74c3c', background: '#f9ebea' };
            default: return { color: '#333', background: '#eee' };
        }
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}><FaCoffee /> Mis Pedidos</h2>

            <div style={styles.filterMenu}>
                {['todos', 'pendiente', 'preparando', 'listo', 'entregado', 'cancelado'].map((estado) => (
                    <button key={estado} onClick={() => setFiltro(estado)} 
                        style={{...styles.filterBtn, ...(filtro === estado ? styles.filterBtnActive : {})}}>
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                    </button>
                ))}
            </div>
            
            <div style={styles.list}>
                {pedidosFiltrados.map((pedido) => (
                    <div key={pedido.id} style={styles.card}>
                        <div style={styles.cardHeader} onClick={() => togglePedido(pedido.id)}>
                            <div style={styles.headerMain}>
                                <div style={styles.brandContainer}>
                                    <img src={`http://127.0.0.1:8000/storage/${pedido.empresa?.logo}`} alt="Logo" style={styles.brandLogo} />
                                    <div style={styles.brandInfo}>
                                        <span style={styles.brandName}>{pedido.empresa?.nombre}</span>
                                        <span style={styles.orderId}>Pedido #{pedido.id}</span>
                                    </div>
                                </div>
                                <span style={{...styles.statusBadge, ...getStatusStyle(pedido.estado)}}>
                                    {pedido.estado}
                                </span>
                            </div>
                            <div style={styles.headerSub}>
                                <span><FaClock /> {pedido.hora_recogida}</span>
                                <span>${parseFloat(pedido.total).toLocaleString()}</span>
                                {abierto === pedido.id ? <FaChevronUp /> : <FaChevronDown />}
                            </div>
                        </div>

                        {abierto === pedido.id && (
                            <div style={styles.details}>
                                <p style={styles.detailInfo}>
                                    <FaMapMarkerAlt style={{color: '#6f4e37'}} /> <strong>Dirección:</strong> {pedido.empresa?.direccion}
                                </p>
                                
                                {pedido.estado.toLowerCase() === 'pendiente' && (
                                    <button onClick={() => cancelarPedido(pedido.id)} style={styles.cancelBtn}>
                                        <FaTimesCircle /> Cancelar Pedido
                                    </button>
                                )}

                                <hr style={styles.divider} />
                                <div style={styles.prodList}>
                                    {pedido.productos.map((prod) => (
                                        <div key={prod.id} style={styles.prodItem}>
                                            <div style={styles.prodLeft}>
                                                <img src={`http://127.0.0.1:8000/storage/${prod.imagen}`} alt="" style={styles.miniImg} />
                                                <div style={styles.prodText}>
                                                    <span style={styles.prodName}>{prod.nombre}</span>
                                                    <span style={styles.prodQty}>Cant: {prod.pivot.cantidad}</span>
                                                </div>
                                            </div>
                                            
                                            {pedido.estado.toLowerCase() === 'entregado' && (
                                                prod.ya_calificado ? (
                                                    <div style={styles.alreadyRated}>
                                                        <FaCheckCircle /> Calificado
                                                    </div>
                                                ) : (
                                                    <button style={styles.rateBtn} onClick={(e) => { e.stopPropagation(); abrirModal(pedido.id, prod); }}>
                                                        <FaStar /> Calificar
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* --- MODAL DE CALIFICACIÓN --- */}
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3>Calificar Producto</h3>
                        <p style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>{calificando.nombre_prod}</p>
                        
                        <div style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map(n => (
                                <span key={n} onClick={() => setCalificando({...calificando, estrellas: n})}>
                                    {n <= calificando.estrellas ? <FaStar color="#f1c40f" size={35} /> : <FaRegStar color="#ccc" size={35} />}
                                </span>
                            ))}
                        </div>

                        <textarea 
                            style={styles.textarea} 
                            placeholder="¿Qué te pareció el producto? (Opcional)"
                            value={calificando.comentario}
                            onChange={(e) => setCalificando({...calificando, comentario: e.target.value})}
                        />

                        <div style={styles.modalActions}>
                            <button 
                                style={{...styles.btnConfirm, opacity: loadingEnvio ? 0.7 : 1}} 
                                onClick={enviarCalificacion}
                                disabled={loadingEnvio}
                            >
                                {loadingEnvio ? 'Enviando...' : 'Enviar Calificación'}
                            </button>
                            <button style={styles.btnCancel} onClick={() => setShowModal(false)} disabled={loadingEnvio}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { maxWidth: '600px', margin: '20px auto', padding: '0 20px', paddingBottom: '80px' },
    title: { textAlign: 'center', color: '#6f4e37', marginBottom: '20px' },
    filterMenu: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '20px' },
    filterBtn: { padding: '8px 16px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '14px', color: '#666' },
    filterBtnActive: { background: '#6f4e37', color: 'white', border: '1px solid #6f4e37', fontWeight: 'bold' },
    list: { display: 'flex', flexDirection: 'column', gap: '15px' },
    card: { background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #eee' },
    cardHeader: { padding: '15px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' },
    headerMain: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    brandContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
    brandLogo: { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' },
    brandInfo: { display: 'flex', flexDirection: 'column' },
    brandName: { fontSize: '12px', fontWeight: 'bold', color: '#6f4e37', textTransform: 'uppercase' },
    orderId: { fontWeight: 'bold', fontSize: '15px' },
    statusBadge: { padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' },
    headerSub: { display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '14px', alignItems: 'center' },
    details: { padding: '15px', background: '#f9f9f9', borderTop: '1px solid #eee' },
    detailInfo: { fontSize: '13px', color: '#555', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' },
    cancelBtn: { width: '100%', padding: '10px', background: '#f9ebea', color: '#e74c3c', border: '1px solid #e74c3c', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' },
    divider: { border: '0', borderTop: '1px solid #eee', margin: '15px 0' },
    prodItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
    prodLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    miniImg: { width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' },
    prodText: { display: 'flex', flexDirection: 'column' },
    prodName: { fontSize: '14px', fontWeight: '500' },
    prodQty: { fontSize: '12px', color: '#888' },
    rateBtn: { background: '#f1c40f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
    alreadyRated: { color: '#27ae60', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: 'white', padding: '25px', borderRadius: '20px', width: '90%', maxWidth: '400px', textAlign: 'center' },
    starsRow: { display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0', cursor: 'pointer' },
    textarea: { width: '100%', minHeight: '80px', borderRadius: '10px', border: '1px solid #ddd', padding: '10px', marginBottom: '20px', fontSize: '14px', resize: 'none' },
    modalActions: { display: 'flex', flexDirection: 'column', gap: '10px' },
    btnConfirm: { background: '#6f4e37', color: 'white', padding: '12px', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
    btnCancel: { color: '#888', border: 'none', background: 'none', cursor: 'pointer' }
};

export default MisPedidos;