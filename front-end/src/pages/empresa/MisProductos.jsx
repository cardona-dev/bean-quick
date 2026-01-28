import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaArrowLeft, FaSignOutAlt, FaSearch } from 'react-icons/fa';

const MisProductos = () => {
    const [productos, setProductos] = useState([]);
    const [busqueda, setBusqueda] = useState(''); // Estado para el buscador
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem('AUTH_TOKEN');
    const userName = localStorage.getItem('USER_NAME') || 'Empresa';

    const fetchProductos = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/empresa/productos', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProductos(response.data);
        } catch (error) {
            console.error("Error cargando productos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    // --- LÓGICA DE COLORES PARA EL STOCK ---
    const getStockBadgeStyle = (stock) => {
        if (stock === 0) return { ...styles.stockBadge, background: '#FFF3E0', color: '#EF6C00' }; // Amarillo (Agotado)
        if (stock < 10) return { ...styles.stockBadge, background: '#FFEBEE', color: '#C62828' }; // Rojo (Poco stock)
        return { ...styles.stockBadge, background: '#E8F5E9', color: '#2E7D32' }; // Verde (Suficiente)
    };

    const getStockText = (stock) => {
        if (stock === 0) return 'Agotado';
        if (stock < 10) return `Bajo Stock (${stock})`;
        return `En Stock (${stock})`;
    };

    // --- FILTRO DE BÚSQUEDA ---
    const productosFiltrados = productos.filter((p) => {
        const query = busqueda.toLowerCase();
        const nombre = p.nombre.toLowerCase();
        const categoria = (p.categoria?.nombre || 'general').toLowerCase();
        const estado = getStockText(p.stock).toLowerCase();

        return nombre.includes(query) || categoria.includes(query) || estado.includes(query);
    });

    const handleEliminar = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/empresa/productos/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setProductos(productos.filter(p => p.id !== id));
            alert("Producto eliminado correctamente");
        } catch (error) {
            alert("No se pudo eliminar el producto"+error);
        }
    };

    if (loading) return <div style={styles.loader}>Cargando...</div>;

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.welcome}>Mis Productos</h1>
                    <p style={styles.roleTag}>Gestiona el catálogo de {userName}</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/empresa/panel')} style={styles.backBtn}>
                        <FaArrowLeft /> Volver al Panel
                    </button>
                    <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={styles.logoutBtn}>
                        <FaSignOutAlt /> Cerrar Sesión
                    </button>
                </div>
            </header>

            <div style={styles.actionRow}>
                {/* BARRA DE BÚSQUEDA */}
                <div style={styles.searchContainer}>
                    <FaSearch style={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, categoría o estado (Agotado, Bajo)..." 
                        style={styles.searchInput}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
                <Link to="/empresa/productos/nuevo" style={styles.addBtn}>
                    <FaPlus /> Agregar Nuevo Producto
                </Link>
            </div>

            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th style={styles.th}>Imagen</th>
                            <th style={styles.th}>Nombre</th>
                            <th style={styles.th}>Categoría</th>
                            <th style={styles.th}>Stock</th> {/* NUEVA COLUMNA */}
                            <th style={styles.th}>Precio</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosFiltrados.map((prod) => (
                            <tr key={prod.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <img src={prod.imagen_url || 'https://via.placeholder.com/50'} alt={prod.nombre} style={styles.img} />
                                </td>
                                <td style={styles.td}><strong>{prod.nombre}</strong></td>
                                <td style={styles.td}>
                                    <span style={styles.categoryBadge}>{prod.categoria?.nombre || 'General'}</span>
                                </td>
                                <td style={styles.td}>
                                    <span style={getStockBadgeStyle(prod.stock)}>
                                        {getStockText(prod.stock)}
                                    </span>
                                </td>
                                <td style={styles.td}>${prod.precio.toLocaleString()}</td>
                                <td style={styles.td}>
                                    <button onClick={() => navigate(`/empresa/productos/editar/${prod.id}`)} style={styles.editBtn} title="Editar"><FaEdit /></button>
                                    <button onClick={() => handleEliminar(prod.id, prod.nombre)} style={styles.deleteBtn} title="Eliminar"><FaTrash /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {productosFiltrados.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                        No se encontraron productos con esa búsqueda.
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '40px', backgroundColor: '#f8f9fa', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #eee', paddingBottom: '20px' },
    welcome: { margin: 0, fontSize: '2rem', color: '#333' },
    roleTag: { margin: '5px 0 0', color: '#666', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' },
    backBtn: { backgroundColor: '#fff', border: '1px solid #ccc', color: '#555', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    logoutBtn: { backgroundColor: 'transparent', border: '1px solid #d9534f', color: '#d9534f', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
    actionRow: { marginBottom: '20px', display: 'flex', justifyContent: 'space-between', gap: '20px' },
    searchContainer: { position: 'relative', flex: 1 },
    searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#999' },
    searchInput: { width: '100%', padding: '12px 12px 12px 45px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' },
    addBtn: { background: '#6f4e37', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' },
    tableContainer: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: '#f8f9fa' },
    th: { padding: '15px', textAlign: 'left', color: '#666', fontWeight: 'bold', borderBottom: '2px solid #eee' },
    td: { padding: '15px', borderBottom: '1px solid #f1f1f1', verticalAlign: 'middle' },
    tr: { transition: '0.2s' },
    img: { width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #eee' },
    categoryBadge: { background: '#e1f5fe', color: '#0288d1', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
    stockBadge: { padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', display: 'inline-block' },
    editBtn: { background: '#e3f2fd', color: '#1976d2', border: 'none', padding: '10px', borderRadius: '8px', marginRight: '8px', cursor: 'pointer' },
    deleteBtn: { background: '#ffebee', color: '#d32f2f', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#666' }
};

export default MisProductos;