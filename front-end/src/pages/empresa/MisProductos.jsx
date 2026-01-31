import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaImage, FaExclamationTriangle,FaBox } from 'react-icons/fa';

import LayoutEmpresa from '../components/LayoutEmpresa';

const MisProductos = () => {
    const [productos, setProductos] = useState([]);
    const [empresa, setEmpresa] = useState(null); 
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem('AUTH_TOKEN');

    useEffect(() => {
        const cargarDatos = async () => {
            setLoading(true);
            try {
                const [resEmpresa, resProductos] = await Promise.all([
                    axios.get('http://127.0.0.1:8000/api/empresa/dashboard', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get('http://127.0.0.1:8000/api/empresa/productos', {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);

                setEmpresa(resEmpresa.data.empresa);
                setProductos(resProductos.data);
            } catch (error) {
                console.error("Error cargando productos", error);
                if (error.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [token, navigate]);

    const handleEliminar = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/empresa/productos/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProductos(productos.filter(p => p.id !== id));
        } catch (error) {
            alert("No se pudo eliminar el producto"+error);
        }
    };

    // Función para determinar el estilo del badge de stock
    const getStockBadge = (stock) => {
        if (stock <= 0) return styles.stockAgotado;
        if (stock <= 10) return styles.stockBajo;
        return styles.stockOk;
    };

    if (loading) return <div style={styles.loader}>Cargando catálogo...</div>;

    return (
        <LayoutEmpresa empresa={empresa}>
            <div style={styles.contentHeader}>
                <div>
                    <h2 style={styles.title}>Mis Productos</h2>
                    <p style={styles.subtitle}>Controla tu inventario y precios.</p>
                </div>
            </div>

            <div style={styles.tableCard}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th style={styles.th}>Imagen</th>
                            <th style={styles.th}>Producto</th>
                            <th style={styles.th}>Categoría</th>
                            <th style={styles.th}>Stock</th>
                            <th style={styles.th}>Precio</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((prod) => (
                            <tr key={prod.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <div style={styles.imgContainer}>
                                        {prod.imagen ? (
                                            <img 
                                                src={`http://127.0.0.1:8000/storage/${prod.imagen}`} 
                                                alt={prod.nombre} 
                                                style={styles.img} 
                                            />
                                        ) : (
                                            <div style={styles.noImg}><FaImage /></div>
                                        )}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.prodName}>{prod.nombre}</div>
                                    <div style={styles.prodDesc}>{prod.descripcion?.substring(0, 30)}...</div>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.categoryBadge}>
                                        {prod.categoria?.nombre || 'General'}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <div style={{...styles.stockBadge, ...getStockBadge(prod.stock)}}>
                                        {prod.stock <= 0 ? 'AGOTADO' : `${prod.stock} uds`}
                                        {prod.stock > 0 && prod.stock <= 10 && <FaExclamationTriangle style={{marginLeft: '5px'}} />}
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <span style={styles.priceText}>${parseFloat(prod.precio).toLocaleString()}</span>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actionGroup}>
                                        <button onClick={() => navigate(`/empresa/productos/editar/${prod.id}`)} style={styles.editBtn}><FaEdit /></button>
                                        <button onClick={() => handleEliminar(prod.id, prod.nombre)} style={styles.deleteBtn}><FaTrash /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {productos.length === 0 && (
                    <div style={styles.emptyState}>
                        <FaBox size={40} color="#cbd5e1" />
                        <p>No hay productos en el inventario.</p>
                    </div>
                )}
            </div>
        </LayoutEmpresa>
    );
};

const styles = {
    contentHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#1e293b' },
    subtitle: { margin: '5px 0 0 0', color: '#64748b', fontSize: '15px' },
    addBtn: { background: '#6f4e37', color: 'white', padding: '12px 20px', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' },
    tableCard: { background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: '#f8fafc', borderBottom: '1px solid #f1f5f9' },
    th: { padding: '15px 20px', textAlign: 'left', color: '#64748b', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' },
    td: { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
    tr: { transition: '0.2s' },
    imgContainer: { width: '50px', height: '50px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' },
    img: { width: '100%', height: '100%', objectFit: 'cover' },
    noImg: { width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' },
    prodName: { fontWeight: '700', color: '#1e293b', fontSize: '15px' },
    prodDesc: { fontSize: '12px', color: '#94a3b8' },
    categoryBadge: { background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold' },
    
    // ESTILOS DE STOCK
    stockBadge: { 
        display: 'inline-flex', 
        alignItems: 'center', 
        padding: '5px 12px', 
        borderRadius: '20px', 
        fontSize: '12px', 
        fontWeight: '800' 
    },
    stockOk: { background: '#dcfce7', color: '#166534' },     // VERDE
    stockBajo: { background: '#fef3c7', color: '#92400e' },   // NARANJA
    stockAgotado: { background: '#fee2e2', color: '#991b1b' }, // ROJO

    priceText: { fontWeight: '800', color: '#1e293b', fontSize: '16px' },
    actionGroup: { display: 'flex', gap: '8px' },
    editBtn: { background: '#eff6ff', color: '#2563eb', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    deleteBtn: { background: '#fff1f2', color: '#e11d48', border: 'none', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#666' },
    emptyState: { padding: '60px', textAlign: 'center', color: '#94a3b8' }
};

export default MisProductos;