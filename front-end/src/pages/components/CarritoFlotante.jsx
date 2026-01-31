import React, { useState } from 'react';
import { FaShoppingBag, FaTimes, FaMinus, FaPlus, FaClock, FaChevronDown, FaChevronUp, FaStore, FaTrash, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const CarritoFlotante = ({ carrito, setCarrito, actualizarCantidad, confirmarPedido, eliminarDelCarrito }) => {
    const [isOpen, setIsOpen] = useState(false);
    console.log(setCarrito)
    const [seccionesAbiertas, setSeccionesAbiertas] = useState({});
    const [horasPorEmpresa, setHorasPorEmpresa] = useState({});
    
    // NUEVO: Estado para controlar el modal de confirmación
    const [modalConfirmacion, setModalConfirmacion] = useState({
        visible: false,
        empresaId: null,
        nombreTienda: '',
        productos: [],
        total: 0,
        hora: '',
        logo: null
    });

    // --- AGRUPAR PRODUCTOS POR EMPRESA (Se mantiene igual) ---
    const carritoAgrupado = carrito.reduce((acc, producto) => {
        const empresaId = producto.empresa_id || producto.empresa?.id;
        if (!empresaId) return acc;

        if (!acc[empresaId]) {
            const nombreEmpresa = producto.empresa?.nombre_establecimiento || 
                            producto.empresa?.nombre || 
                            "Tienda";
            acc[empresaId] = {
                id: empresaId,
                nombre: nombreEmpresa,
                logo: producto.empresa?.logo ? `http://127.0.0.1:8000/storage/${producto.empresa.logo}` : null,
                productos: []
            };
        }
        acc[empresaId].productos.push(producto);
        return acc;
    }, {});

    const toggleSeccion = (id) => {
        setSeccionesAbiertas(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleHoraChange = (id, valor) => {
        setHorasPorEmpresa(prev => ({ ...prev, [id]: valor }));
    };

    // NUEVO: Función para abrir el modal de confirmación
    const abrirModalConfirmacion = (empresaId, nombreTienda) => {
        const hora = horasPorEmpresa[empresaId];
        if (!hora) return alert(`Por favor selecciona hora para ${nombreTienda}`);

        const productosAEnviar = carrito.filter(p => (p.empresa_id || p.empresa?.id) == empresaId);
        
        const totalEmpresa = productosAEnviar.reduce((s, p) => {
            const precio = Number(p.precio) || 0;
            const cantidad = Number(p.pivot?.cantidad ?? p.cantidad ?? 0);
            return s + (precio * cantidad);
        }, 0);

        // Obtener el logo de la empresa
        const tienda = carritoAgrupado[empresaId];
        const logoEmpresa = tienda?.logo || null;

        setModalConfirmacion({
            visible: true,
            empresaId,
            nombreTienda,
            productos: productosAEnviar,
            total: totalEmpresa,
            hora,
            logo: logoEmpresa
        });
    };

    // NUEVO: Función para cerrar el modal
    const cerrarModal = () => {
        setModalConfirmacion({
            visible: false,
            empresaId: null,
            nombreTienda: '',
            productos: [],
            total: 0,
            hora: '',
            logo: null
        });
    };

    // MODIFICADO: Ahora se llama desde el modal
    const manejarConfirmarTienda = async () => {
        const { empresaId, productos, hora } = modalConfirmacion;
        
        try {
            const exito = await confirmarPedido("Recogida en Local", hora, empresaId, productos);

            if (exito) {
                setHorasPorEmpresa(prev => {
                    const nuevas = { ...prev };
                    delete nuevas[empresaId];
                    return nuevas;
                });
                cerrarModal();
                // Si el carrito queda vacío tras confirmar la última tienda, cerramos el sidebar
                if (carrito.length <= productos.length) setIsOpen(false);
            }
        } catch (error) {
            cerrarModal();
            alert(error.response?.data?.message || "Error al procesar el pedido");
        }
    };

    return (
        <>
            <div style={styles.floatingBtn} onClick={() => setIsOpen(true)}>
                <FaShoppingBag />
                <span style={styles.badge}>{carrito.length}</span>
            </div>

            {isOpen && (
                <div style={styles.overlay} onClick={() => setIsOpen(false)}>
                    <div style={styles.sidebar} onClick={e => e.stopPropagation()}>
                        <div style={styles.header}>
                            <h3 style={{ margin: 0 }}>Mi Carrito</h3>
                            <FaTimes style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
                        </div>

                        <div style={styles.itemsContainer}>
                            {Object.keys(carritoAgrupado).length === 0 ? (
                                <p style={{ textAlign: 'center', marginTop: '40px', color: '#888' }}>No hay productos.</p>
                            ) : (
                                Object.keys(carritoAgrupado).map((empresaId) => {
                                    const tienda = carritoAgrupado[empresaId];
                                    const estaAbierto = seccionesAbiertas[empresaId] !== false;

                                    const totalEmpresa = tienda.productos.reduce((s, p) => {
                                        const precio = Number(p.precio) || 0;
                                        const cantidad = Number(p.pivot?.cantidad ?? p.cantidad ?? 0);
                                        return s + (precio * cantidad);
                                    }, 0);

                                    return (
                                        <div key={empresaId} style={styles.empresaCard}>
                                            <div style={styles.empresaHeader} onClick={() => toggleSeccion(empresaId)}>
                                                <div style={styles.empresaInfo}>
                                                    {tienda.logo ? (
                                                        <img src={tienda.logo} style={styles.logoMini} alt="logo" />
                                                    ) : (
                                                        <div style={styles.logoPlaceholder}><FaStore /></div>
                                                    )}
                                                    <span style={styles.nombreEmpresa}>{tienda.nombre}</span>
                                                </div>
                                                {estaAbierto ? <FaChevronUp /> : <FaChevronDown />}
                                            </div>

                                            {estaAbierto && (
                                                <div style={styles.productosDetalle}>
                                                    {tienda.productos.map(prod => {
    const pPrecio = Number(prod.precio) || 0;
    const pCant = Number(prod.pivot?.cantidad ?? prod.cantidad ?? 0);
    const stockDisponible = Number(prod.stock);

    return (
        <div key={prod.id} style={styles.productoFila}>
            <img 
                src={prod.imagen ? `http://127.0.0.1:8000/storage/${prod.imagen}` : '/placeholder.jpg'} 
                style={styles.prodImg} 
                alt={prod.nombre}
            />
            <div style={{ flex: 1 }}>
                <div style={styles.prodHeader}>
                    <span style={styles.prodNombre}>{prod.nombre}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>${(pPrecio * pCant).toLocaleString()}</strong>
                        <FaTrash style={styles.btnEliminar} onClick={() => eliminarDelCarrito(prod.id)} />
                    </div>
                </div>
                
                <div style={styles.controles}>
                    <button 
                        type="button"
                        style={{
                            ...styles.qtyBtn,
                            opacity: pCant <= 1 ? 0.4 : 1,
                            cursor: pCant <= 1 ? 'not-allowed' : 'pointer',
                            backgroundColor: '#fff'
                        }} 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (pCant > 1) {
                                console.log("Restando producto:", prod.id, "Nueva cant:", pCant - 1);
                                actualizarCantidad(prod.id, pCant - 1);
                            }
                        }} 
                        disabled={pCant <= 1}
                    >
                        <FaMinus size={10} />
                    </button>

                    <span style={{ fontWeight: 'bold', minWidth: '25px', textAlign: 'center' }}>
                        {pCant}
                    </span>

                    <button 
                        type="button"
                        style={{
                            ...styles.qtyBtn, 
                            opacity: pCant >= stockDisponible ? 0.4 : 1,
                            cursor: pCant >= stockDisponible ? 'not-allowed' : 'pointer',
                            backgroundColor: pCant >= stockDisponible ? '#f8d7da' : '#fff'
                        }} 
                        onClick={() => {
                            if (pCant < stockDisponible) {
                                actualizarCantidad(prod.id, pCant + 1);
                            }
                        }}
                        disabled={pCant >= stockDisponible}
                    >
                        <FaPlus size={10} />
                    </button>
                    
                    {pCant >= stockDisponible && (
                        <span style={styles.stockWarning}>
                            <FaExclamationTriangle size={10} /> Máximo
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
})}

                                                    <div style={styles.empresaFooter}>
                                                        <div style={styles.horaCaja}>
                                                            <label style={{ fontSize: '12px', color: '#666' }}><FaClock /> Recogida:</label>
                                                            <input
                                                                type="time"
                                                                value={horasPorEmpresa[empresaId] || ""}
                                                                onChange={(e) => handleHoraChange(empresaId, e.target.value)}
                                                                style={styles.inputHora}
                                                            />
                                                        </div>
                                                        <div style={styles.totalCaja}>
                                                            <span>Subtotal tienda:</span>
                                                            <strong>${totalEmpresa.toLocaleString()}</strong>
                                                        </div>
                                                        <button
                                                            style={{
                                                                ...styles.btnConfirmar,
                                                                opacity: !horasPorEmpresa[empresaId] ? 0.6 : 1,
                                                                cursor: !horasPorEmpresa[empresaId] ? 'not-allowed' : 'pointer'
                                                            }}
                                                            onClick={() => abrirModalConfirmacion(empresaId, tienda.nombre)}
                                                            disabled={!horasPorEmpresa[empresaId]}
                                                        >
                                                            Confirmar pedido
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* NUEVO: MODAL DE CONFIRMACIÓN */}
            {modalConfirmacion.visible && (
                <div style={styles.modalOverlay} onClick={cerrarModal}>
                    <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaCheckCircle color="#6f4e37" />
                                Confirmar Pedido
                            </h3>
                            <FaTimes style={{ cursor: 'pointer', fontSize: '20px' }} onClick={cerrarModal} />
                        </div>

                        <div style={styles.modalBody}>
                            {/* Información de la tienda */}
                            <div style={styles.modalTiendaInfo}>
                                {modalConfirmacion.logo ? (
                                    <img 
                                        src={modalConfirmacion.logo} 
                                        style={styles.modalLogoEmpresa} 
                                        alt={modalConfirmacion.nombreTienda}
                                    />
                                ) : (
                                    <div style={styles.modalLogoPlaceholder}>
                                        <FaStore size={16} color="#6f4e37" />
                                    </div>
                                )}
                                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{modalConfirmacion.nombreTienda}</span>
                            </div>

                            {/* Hora de recogida */}
                            <div style={styles.modalHoraInfo}>
                                <FaClock size={14} color="#666" />
                                <span>Hora de recogida: <strong>{modalConfirmacion.hora}</strong></span>
                            </div>

                            {/* Lista de productos */}
                            <div style={styles.modalProductosContainer}>
                                <h4 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#666' }}>Productos del pedido:</h4>
                                {modalConfirmacion.productos.map(prod => {
                                    const pPrecio = Number(prod.precio) || 0;
                                    const pCant = Number(prod.pivot?.cantidad ?? prod.cantidad ?? 0);
                                    
                                    return (
                                        <div key={prod.id} style={styles.modalProductoItem}>
                                            <img 
                                                src={prod.imagen ? `http://127.0.0.1:8000/storage/${prod.imagen}` : '/placeholder.jpg'} 
                                                style={styles.modalProdImg} 
                                                alt={prod.nombre}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={styles.modalProdNombre}>{prod.nombre}</div>
                                                <div style={styles.modalProdDetalle}>
                                                    Cantidad: <strong>{pCant}</strong> × ${pPrecio.toLocaleString()}
                                                </div>
                                            </div>
                                            <div style={styles.modalProdPrecio}>
                                                ${(pPrecio * pCant).toLocaleString()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total */}
                            <div style={styles.modalTotal}>
                                <span style={{ fontSize: '16px' }}>Total a pagar:</span>
                                <strong style={{ fontSize: '22px', color: '#6f4e37' }}>
                                    ${modalConfirmacion.total.toLocaleString()}
                                </strong>
                            </div>
                        </div>

                        <div style={styles.modalFooter}>
                            <button style={styles.btnCancelar} onClick={cerrarModal}>
                                Cancelar
                            </button>
                            <button style={styles.btnConfirmarFinal} onClick={manejarConfirmarTienda}>
                                Confirmar Pedido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

const styles = {
    floatingBtn: { position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#6f4e37', color: 'white', padding: '15px', borderRadius: '50%', cursor: 'pointer', zIndex: 1000, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    badge: { position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', padding: '2px 7px', fontSize: '12px', border: '2px solid white', fontWeight: 'bold' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end' },
    sidebar: { width: '380px', background: '#f8f9fa', height: '100%', display: 'flex', flexDirection: 'column', padding: '20px', boxShadow: '-5px 0 15px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' },
    itemsContainer: { flex: 1, overflowY: 'auto' },
    empresaCard: { background: 'white', borderRadius: '12px', marginBottom: '15px', border: '1px solid #eee', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
    empresaHeader: { padding: '12px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff' },
    empresaInfo: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoMini: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' },
    logoPlaceholder: { width: '32px', height: '32px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6f4e37' },
    nombreEmpresa: { fontWeight: 'bold', fontSize: '15px', color: '#333' },
    productosDetalle: { padding: '15px', background: '#fcfcfc', borderTop: '1px solid #f0f0f0' },
    productoFila: { display: 'flex', gap: '12px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #eee' },
    prodImg: { width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover' },
    prodHeader: { display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '5px' },
    prodNombre: { fontWeight: '500', color: '#333', maxWidth: '120px' },
    btnEliminar: { color: '#ff4d4d', cursor: 'pointer', fontSize: '13px' },
    controles: { display: 'flex', alignItems: 'center', gap: '10px' },
    qtyBtn: { width: '24px', height: '24px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    stockWarning: { fontSize: '10px', color: '#e67e22', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '2px' },
    empresaFooter: { marginTop: '10px', paddingTop: '10px', borderTop: '2px dashed #eee' },
    horaCaja: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
    inputHora: { padding: '5px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none', fontSize: '13px' },
    totalCaja: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' },
    btnConfirmar: { width: '100%', padding: '12px', background: '#6f4e37', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', transition: '0.3s' },
    
    // NUEVO: Estilos del modal
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.6)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    modalContent: {
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
        overflow: 'hidden'
    },
    modalHeader: {
        padding: '20px',
        borderBottom: '2px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#fafafa'
    },
    modalBody: {
        padding: '20px',
        flex: 1,
        overflowY: 'auto'
    },
    modalTiendaInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px',
        background: '#f8f9fa',
        borderRadius: '8px',
        marginBottom: '15px'
    },
    modalLogoEmpresa: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #6f4e37'
    },
    modalLogoPlaceholder: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: '#fff',
        border: '2px solid #6f4e37',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalHoraInfo: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px',
        background: '#fff3cd',
        borderRadius: '6px',
        marginBottom: '20px',
        fontSize: '14px'
    },
    modalProductosContainer: {
        marginBottom: '20px'
    },
    modalProductoItem: {
        display: 'flex',
        gap: '12px',
        padding: '12px',
        background: '#fafafa',
        borderRadius: '8px',
        marginBottom: '10px',
        alignItems: 'center'
    },
    modalProdImg: {
        width: '50px',
        height: '50px',
        borderRadius: '6px',
        objectFit: 'cover'
    },
    modalProdNombre: {
        fontWeight: '500',
        fontSize: '14px',
        marginBottom: '4px',
        color: '#333'
    },
    modalProdDetalle: {
        fontSize: '12px',
        color: '#666'
    },
    modalProdPrecio: {
        fontWeight: 'bold',
        fontSize: '15px',
        color: '#6f4e37',
        minWidth: '80px',
        textAlign: 'right'
    },
    modalTotal: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px',
        background: '#f0f8ff',
        borderRadius: '8px',
        border: '2px solid #6f4e37'
    },
    modalFooter: {
        padding: '20px',
        borderTop: '2px solid #f0f0f0',
        display: 'flex',
        gap: '10px',
        background: '#fafafa'
    },
    btnCancelar: {
        flex: 1,
        padding: '12px',
        background: '#e0e0e0',
        color: '#333',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background 0.3s'
    },
    btnConfirmarFinal: {
        flex: 1,
        padding: '12px',
        background: '#6f4e37',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontWeight: 'bold',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'background 0.3s'
    }
};

export default CarritoFlotante;