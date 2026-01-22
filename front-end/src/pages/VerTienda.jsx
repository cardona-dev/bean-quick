import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
// Importamos los iconos de estrellas
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

const VistaTienda = ({ agregarAlCarrito }) => {
    const { id } = useParams();
    const [empresa, setEmpresa] = useState(null);
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [filtroNombre, setFiltroNombre] = useState('');
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://127.0.0.1:8000/api/cliente/empresa/${id}/productos`);
                setEmpresa(response.data.empresa);
                setProductos(response.data.productos);
                setCategorias(response.data.categorias);
            } catch (error) {
                console.error("Error cargando la tienda", error);
            }
        };
        fetchData();
    }, [id]);

    // --- FUNCIÓN PARA RENDERIZAR ESTRELLAS SEGÚN EL PROMEDIO ---
    const renderEstrellas = (promedio) => {
        const valor = parseFloat(promedio) || 0;
        const estrellas = [];
        
        for (let i = 1; i <= 5; i++) {
            if (i <= valor) {
                estrellas.push(<FaStar key={i} color="#f1c40f" />);
            } else if (i - 0.5 <= valor) {
                estrellas.push(<FaStarHalfAlt key={i} color="#f1c40f" />);
            } else {
                estrellas.push(<FaRegStar key={i} color="#ccc" />);
            }
        }

        return (
            <div style={styles.starsContainer}>
                {estrellas}
                <span style={styles.ratingText}>{valor > 0 ? valor.toFixed(1) : "S/C"}</span>
            </div>
        );
    };

    const productosFiltrados = productos.filter(prod => {
        const coincideNombre = prod.nombre.toLowerCase().includes(filtroNombre.toLowerCase());
        const coincideCat = categoriaSeleccionada === 'todas' || prod.categoria_id == categoriaSeleccionada;
        return coincideNombre && coincideCat;
    });

    return (
        <div style={styles.mainContainer}>
            {empresa && (
                <div style={{
                    ...styles.shopHeader,
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(http://127.0.0.1:8000/storage/${empresa.foto_local})`
                }}>
                    <div style={styles.headerContent}>
                        <img
                            src={`http://127.0.0.1:8000/storage/${empresa.logo}`}
                            style={styles.shopLogo}
                            alt={empresa.nombre}
                        />
                        <div style={styles.headerTexts}>
                            <h1 style={styles.empresaNombre}>{empresa.nombre}</h1>
                            <p style={styles.empresaSlogan}>Sede Oficial - Menú Digital</p>
                        </div>
                    </div>
                </div>
            )}

            <div style={styles.contentWrapper}>
                <div style={styles.filterBar}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar producto..."
                        style={styles.searchInput}
                        onChange={(e) => setFiltroNombre(e.target.value)}
                    />
                    <select
                        style={styles.select}
                        onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                    >
                        <option value="todas">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>
                </div>

                <div style={styles.grid}>
                    {productosFiltrados.map(prod => (
                        <div key={prod.id} style={styles.card}>
                            <img
                                src={prod.imagen ? `http://127.0.0.1:8000/storage/${prod.imagen}` : 'https://via.placeholder.com/150'}
                                alt={prod.nombre}
                                style={styles.img}
                            />
                            <div style={styles.info}>
                                <h3 style={styles.prodName}>{prod.nombre}</h3>
                                
                                {/* MOSTRAR LAS ESTRELLAS AQUÍ */}
                                {renderEstrellas(prod.calificaciones_avg_estrellas)}

                                <p style={styles.desc}>{prod.descripcion}</p>
                                <div style={styles.footerCard}>
                                    <span style={styles.price}>${Number(prod.precio).toLocaleString()}</span>
                                    <button style={styles.addBtn} onClick={() => agregarAlCarrito(prod)}>
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {productosFiltrados.length === 0 && (
                    <p style={{ textAlign: 'center', marginTop: '50px' }}>No se encontraron productos.</p>
                )}
            </div>
        </div>
    );
};

const styles = {
    // ... mantén tus estilos anteriores y añade/modifica estos:
    mainContainer: { minHeight: '100vh', background: '#f9f9f9' },
    shopHeader: { height: '350px', backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'flex-end', padding: '40px 5%', position: 'relative' },
    headerContent: { display: 'flex', alignItems: 'center', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto', zIndex: 2 },
    shopLogo: { width: '120px', height: '120px', borderRadius: '15px', objectFit: 'cover', border: '4px solid white', backgroundColor: 'white' },
    headerTexts: { color: 'white' },
    empresaNombre: { margin: 0, fontSize: '32px', textShadow: '2px 2px 8px rgba(0,0,0,0.8)' },
    empresaSlogan: { margin: 0, opacity: 0.9, fontSize: '18px', textShadow: '1px 1px 4px rgba(0,0,0,0.8)' },
    contentWrapper: { maxWidth: '1200px', margin: '-30px auto 0 auto', padding: '0 20px 40px 20px', position: 'relative', zIndex: 5 },
    filterBar: { display: 'flex', gap: '15px', marginBottom: '30px', background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    searchInput: { flex: 2, padding: '12px 20px', borderRadius: '25px', border: '1px solid #eee', outline: 'none', fontSize: '16px' },
    select: { flex: 1, padding: '12px', borderRadius: '25px', border: '1px solid #eee', cursor: 'pointer' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px' },
    card: { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    img: { width: '100%', height: '200px', objectFit: 'cover' },
    info: { padding: '15px' },
    prodName: { margin: '0 0 5px 0', fontSize: '18px', fontWeight: 'bold' },
    
    // Estilos para el contenedor de estrellas
    starsContainer: { display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '10px' },
    ratingText: { fontSize: '14px', color: '#777', marginLeft: '5px', fontWeight: 'bold' },

    desc: { color: '#777', fontSize: '14px', marginBottom: '15px', height: '40px', overflow: 'hidden' },
    footerCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    price: { fontWeight: 'bold', fontSize: '18px', color: '#2ecc71' },
    addBtn: { background: '#1a1a1a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default VistaTienda;
