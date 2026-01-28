import React, { useState } from 'react';
import { FaShoppingBag, FaTimes, FaMinus, FaPlus, FaClock, FaChevronDown, FaChevronUp, FaStore, FaTrash, FaExclamationTriangle } from 'react-icons/fa';

const CarritoFlotante = ({ carrito, setCarrito, actualizarCantidad, confirmarPedido, eliminarDelCarrito }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [seccionesAbiertas, setSeccionesAbiertas] = useState({});
    const [horasPorEmpresa, setHorasPorEmpresa] = useState({});

    const carritoAgrupado = carrito.reduce((acc, producto) => {
        const empresaId = producto.empresa_id || producto.empresa?.id;
        if (!empresaId) return acc;

        if (!acc[empresaId]) {
            const nombreEmpresa = producto.empresa?.nombre_establecimiento ||
                producto.empresa?.nombre ||
                producto.nombre_tienda_aux || 
                "Tienda";

            const logoEmpresa = producto.empresa?.logo
                ? `http://127.0.0.1:8000/storage/${producto.empresa.logo}`
                : null;

            acc[empresaId] = {
                id: empresaId,
                nombre: nombreEmpresa,
                logo: logoEmpresa,
                productos: []
            };
        }

        producto.nombre_tienda_aux = acc[empresaId].nombre;
        acc[empresaId].productos.push(producto);
        return acc;
    }, {});

    const toggleSeccion = (id) => {
        setSeccionesAbiertas(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleHoraChange = (id, valor) => {
        setHorasPorEmpresa(prev => ({ ...prev, [id]: valor }));
    };

    const manejarConfirmarTienda = async (empresaId, nombreTienda) => {
        const hora = horasPorEmpresa[empresaId];
        if (!hora) return alert(`Por favor selecciona hora para ${nombreTienda}`);

        // Filtramos productos que tengan al menos 1 de stock para enviar al servidor
        const productosAEnviar = carrito.filter(p => 
            (p.empresa_id || p.empresa?.id) == empresaId && p.stock > 0
        );

        if (productosAEnviar.length === 0) return alert("No hay productos con stock disponible en esta tienda.");

        const exito = await confirmarPedido("Recogida en Local", hora, empresaId, productosAEnviar);

        if (exito) {
            setHorasPorEmpresa(prev => {
                const nuevas = { ...prev };
                delete nuevas[empresaId];
                return nuevas;
            });
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
                                        if (p.stock <= 0) return s; // No sumar si no hay stock
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
                                                        const sinStock = prod.stock <= 0;
                                                        const limiteAlcanzado = pCant >= prod.stock;

                                                        return (
                                                            <div key={prod.id} style={{...styles.productoFila, opacity: sinStock ? 0.6 : 1}}>
                                                                <img src={prod.imagen ? `http://127.0.0.1:8000/storage/${prod.imagen}` : '/placeholder.jpg'} style={styles.prodImg} alt={prod.nombre} />
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={styles.prodHeader}>
                                                                        <span style={styles.prodNombre}>{prod.nombre}</span>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                            <strong>${(pPrecio * pCant).toLocaleString()}</strong>
                                                                            <FaTrash style={styles.btnEliminar} onClick={() => eliminarDelCarrito(prod.id)} />
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {sinStock ? (
                                                                        <span style={{color: 'red', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                                                                            <FaExclamationTriangle /> Agotado
                                                                        </span>
                                                                    ) : (
                                                                        <div style={styles.controles}>
                                                                            <button style={styles.qtyBtn} onClick={() => actualizarCantidad(prod.id, pCant - 1)}>
                                                                                <FaMinus size={10} />
                                                                            </button>
                                                                            <span style={{ fontWeight: 'bold', minWidth: '20px', textAlign: 'center' }}>{pCant}</span>
                                                                            <button 
                                                                                style={{...styles.qtyBtn, opacity: limiteAlcanzado ? 0.3 : 1}} 
                                                                                onClick={() => !limiteAlcanzado && actualizarCantidad(prod.id, pCant + 1)}
                                                                                disabled={limiteAlcanzado}
                                                                            >
                                                                                <FaPlus size={10} />
                                                                            </button>
                                                                        </div>
                                                                    )}
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
                                                                opacity: (!horasPorEmpresa[empresaId] || totalEmpresa === 0) ? 0.6 : 1,
                                                                cursor: (!horasPorEmpresa[empresaId] || totalEmpresa === 0) ? 'not-allowed' : 'pointer'
                                                            }}
                                                            onClick={() => manejarConfirmarTienda(empresaId, tienda.nombre)}
                                                            disabled={!horasPorEmpresa[empresaId] || totalEmpresa === 0}
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
        </>
    );
};

// ... Estilos (usa los mismos que ya tenías)
const styles = {
    // ... (Tus estilos anteriores aquí)
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
    empresaFooter: { marginTop: '10px', paddingTop: '10px', borderTop: '2px dashed #eee' },
    horaCaja: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
    inputHora: { padding: '5px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none', fontSize: '13px' },
    totalCaja: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' },
    btnConfirmar: { width: '100%', padding: '12px', background: '#6f4e37', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', transition: '0.3s' }
};

export default CarritoFlotante;