import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaStar, FaMapMarkerAlt } from 'react-icons/fa';

const DashboardCliente = () => {
    const [empresas, setEmpresas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [hoveredCard, setHoveredCard] = useState(null); // Estado para animar la card
    const [hoveredBtn, setHoveredBtn] = useState(null);   // Estado para animar el botón
    const navigate = useNavigate();
    const userName = localStorage.getItem('USER_NAME');

    useEffect(() => {
        const obtenerEmpresas = async () => {
            try {
                const token = localStorage.getItem('AUTH_TOKEN');
                const response = await axios.get('http://127.0.0.1:8000/api/cliente/empresas', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmpresas(response.data);
            } catch (error) {
                console.error("Error al cargar empresas:", error);
                if (error.response?.status === 401) navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        obtenerEmpresas();
    }, [navigate]);

    const empresasFiltradas = empresas.filter(emp => 
        emp.nombre.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div style={styles.page}>
            {/* --- HERO SECTION --- */}
            <div style={styles.hero}>
                <div style={styles.heroOverlay}>
                    <div style={styles.heroContent}>
                        <h1 style={styles.welcomeText}>¡Hola, {userName}! </h1>
                        <p style={styles.heroSubtext}>Descubre el aroma perfecto cerca de ti</p>
                        <div style={styles.searchWrapper}>
                            <FaSearch style={styles.searchIcon} />
                            <input 
                                type="text" 
                                placeholder="Busca tu cafetería favorita..." 
                                style={styles.searchInput}
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div style={styles.container}>
                <div style={styles.sectionHeader}>
                    <h2 style={styles.sectionTitle}>Cafeterías Disponibles</h2>
                    <span style={styles.badgeCount}>{empresasFiltradas.length} locales</span>
                </div>

                {loading ? (
                    <div style={styles.loader}>Cargando delicias...</div>
                ) : (
                    <div style={styles.grid}>
                        {empresasFiltradas.map((empresa) => (
                            <div 
                                key={empresa.id} 
                                style={{
                                    ...styles.card,
                                    ...(hoveredCard === empresa.id ? styles.cardHover : {})
                                }}
                                onMouseEnter={() => setHoveredCard(empresa.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                                onClick={() => navigate(`/tienda/${empresa.id}`)}
                            >
                                <div style={styles.imageContainer}>
                                    <img
                                        src={empresa.logo ? `http://127.0.0.1:8000/storage/${empresa.logo}` : 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800&auto=format&fit=crop'}
                                        alt={empresa.nombre}
                                        style={{
                                            ...styles.cardImg,
                                            ...(hoveredCard === empresa.id ? styles.cardImgHover : {})
                                        }}
                                    />
                                    <div style={styles.ratingBadge}><FaStar color="#fbbf24" /> 4.8</div>
                                </div>
                                
                                <div style={styles.cardBody}>
                                    <h3 style={styles.cardTitle}>{empresa.nombre}</h3>
                                    <p style={styles.cardDesc}>{empresa.descripcion || 'Una experiencia única en cada taza.'}</p>
                                    
                                    <div style={styles.cardFooter}>
                                        <span style={styles.location}><FaMapMarkerAlt /> Abierto ahora</span>
                                        <button 
                                            style={{
                                                ...styles.cardBtn,
                                                ...(hoveredBtn === empresa.id ? styles.cardBtnHover : {})
                                            }}
                                            onMouseEnter={() => setHoveredBtn(empresa.id)}
                                            onMouseLeave={() => setHoveredBtn(null)}
                                        >
                                            Ver Menú
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: '#fdfcfb', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    hero: { height: '350px', backgroundImage: 'url("https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' },
    heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7))', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    heroContent: { width: '90%', maxWidth: '600px' },
    welcomeText: { color: 'white', fontSize: '2.5rem', fontWeight: '800', margin: 0 },
    heroSubtext: { color: '#e2e8f0', fontSize: '1.1rem', marginBottom: '25px' },
    searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center', background: 'white', borderRadius: '50px', padding: '5px 20px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    searchIcon: { color: '#94a3b8' },
    searchInput: { border: 'none', padding: '12px 15px', width: '100%', fontSize: '16px', outline: 'none', borderRadius: '50px' },

    container: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    sectionTitle: { fontSize: '22px', fontWeight: '700', color: '#1e293b' },
    badgeCount: { background: '#f1f5f9', padding: '5px 12px', borderRadius: '15px', color: '#64748b', fontSize: '13px' },

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px' },

    // --- ESTILOS DE LA CARD ---
    card: {
        background: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        border: '1px solid #f1f5f9',
        transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease',
    },
    cardHover: {
        transform: 'translateY(-10px)',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    },
    imageContainer: { position: 'relative', height: '180px', overflow: 'hidden' },
    cardImg: { 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover', 
        transition: 'transform 0.6s ease' 
    },
    cardImgHover: {
        transform: 'scale(1.1)',
    },
    ratingBadge: { position: 'absolute', top: '12px', right: '12px', background: 'white', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' },
    cardBody: { padding: '20px' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px 0' },
    cardDesc: { fontSize: '14px', color: '#64748b', height: '42px', overflow: 'hidden' },
    
    cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f1f5f9' },
    location: { fontSize: '12px', color: '#10b981', fontWeight: '600' },
    
    // --- ESTILOS DEL BOTÓN ---
    cardBtn: {
        backgroundColor: '#6f4e37',
        color: 'white',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '12px',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    cardBtnHover: {
        backgroundColor: '#5a3d2b',
        transform: 'scale(1.05)',
        boxShadow: '0 4px 12px rgba(111, 78, 55, 0.4)',
    },
    
    loader: { textAlign: 'center', padding: '50px', fontSize: '18px', color: '#6f4e37' }
};

export default DashboardCliente;