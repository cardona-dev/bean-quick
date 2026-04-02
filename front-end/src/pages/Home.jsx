import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { FaBolt, FaStar, FaLightbulb, FaArrowRight, FaStore } from 'react-icons/fa';
console.log(motion)
const Home = () => {
    const [destacados, setDestacados] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Verificamos si hay un token en el localStorage para saber si está logueado
    const token = localStorage.getItem('AUTH_TOKEN');

    useEffect(() => {
        const fetchDestacados = async () => {
            try {
                // Usar instancia centralizada de axios (api)
                const res = await api.get('/api/productos/destacados');
                setDestacados(res.data);
            } catch (error) {
                console.error("Error al cargar destacados", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDestacados();
    }, []);

    // Lógica para el botón "Ver Menú"
    const handleVerMenu = () => {
        if (token) {
            navigate('/cliente/dashboard');
        } else {
            navigate('/login');
        }
    };

    // Lógica para ir a una tienda específica desde un producto
    const handleIrATienda = (empresaId) => {
        if (token) {
            navigate(`/tienda/${empresaId}`);
        } else {
            navigate('/login');
        }
    };

    const fadeInUp = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    return (
        <div style={styles.pageWrapper}>
            {/* HERO SECTION */}
            <header style={styles.header}>
                <div style={styles.headerOverlay}>
                    <div style={styles.container}>
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }} style={styles.logoContainer}>
                            {/* Ruta corregida para que funcione desde cualquier subcarpeta */}
                            <img src="/img/logo.png" alt="Logo" style={styles.logo} />
                        </motion.div>
                        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.8 }} style={styles.heroText}>
                            <h2 style={styles.heroTitle}>
                                Bienvenido a Bean Quick <br />
                                <span style={styles.heroSubtitle}>El arte de reservar tu café ideal</span>
                            </h2>
                            <motion.button 
                                whileHover={{ scale: 1.1, backgroundColor: '#8b5e3c' }} 
                                whileTap={{ scale: 0.9 }} 
                                style={styles.ctaButton}
                                onClick={handleVerMenu}
                            >
                                Ver Menú <FaArrowRight style={{ marginLeft: '10px' }} />
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </header>

            {/* SOBRE NOSOTROS */}
            <motion.section initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} style={styles.section}>
                <div style={styles.container}>
                    <motion.h2 variants={fadeInUp} style={styles.sectionTitle}>Nuestro <span>ADN</span></motion.h2>
                    <div style={styles.gridNosotros}>
                        {[
                            { icon: <FaBolt />, title: 'Eficiencia', desc: 'Tu tiempo vale. Reservas rápidas para mañanas ocupadas.' },
                            { icon: <FaStar />, title: 'Calidad', desc: 'Granos seleccionados y procesos artesanales en cada taza.' },
                            { icon: <FaLightbulb />, title: 'Innovación', desc: 'La tecnología al servicio de tu paladar.' }
                        ].map((item, i) => (
                            <motion.div key={i} variants={fadeInUp} whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} style={styles.cardNosotros}>
                                <div style={styles.iconWrapper}>{item.icon}</div>
                                <h3 style={styles.cardTitle}>{item.title}</h3>
                                <p style={styles.cardContent}>{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* PRODUCTOS DESTACADOS DINÁMICOS */}
            <section style={{...styles.section, backgroundColor: '#fdfaf8'}}>
                <div style={styles.container}>
                    <h2 style={styles.sectionTitle}>Los Favoritos <span>de la Comunidad</span></h2>
                    
                    {loading ? (
                        <p style={{textAlign: 'center'}}>Buscando los mejores aromas...</p>
                    ) : (
                        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} style={styles.gridProductos}>
                            {destacados.map((prod) => (
                                <motion.div 
                                    key={prod.id} 
                                    variants={fadeInUp}
                                    whileHover={{ scale: 1.03 }}
                                    style={{...styles.productoCard, cursor: 'pointer'}}
                                    onClick={() => handleIrATienda(prod.empresa_id)}
                                >
                                    <div style={styles.imageContainer}>
                                        <motion.img 
                                            whileHover={{ scale: 1.1 }}
                                            src={prod.imagen_url} 
                                            alt={prod.nombre} 
                                            style={styles.productoImg} 
                                        />
                                    </div>
                                    <div style={styles.productoInfo}>
                                        <p style={styles.productoLabel}>{prod.nombre}</p>
                                        
                                        <div style={styles.companyInfoContainer}>
                                            {prod.empresa?.logo_url ? (
                                                <img 
                                                    src={prod.empresa.logo_url} 
                                                    alt={prod.empresa.nombre} 
                                                    style={styles.companyLogoTiny} 
                                                />
                                            ) : (
                                                <FaStore style={styles.companyIconTiny} />
                                            )}
                                            <span style={styles.storeTextName}>
                                                {prod.empresa?.nombre || 'Tienda Bean Quick'}
                                            </span>
                                        </div>

                                        <div style={styles.starsSmall}>
                                            {[...Array(5)].map((_, i) => (
                                                <FaStar 
                                                    key={i} 
                                                    color={i < Math.round(prod.calificaciones_avg_estrellas) ? "#FFD700" : "#ddd"} 
                                                    size={12}
                                                />
                                            ))}
                                            <span style={styles.ratingNum}>
                                                ({parseFloat(prod.calificaciones_avg_estrellas || 0).toFixed(1)})
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ALIADOS */}
            <section style={styles.section}>
                <div style={styles.container}>
                    <div style={styles.aliadosWrapper}>
                        <motion.div initial={{ x: -100, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }} style={styles.aliadosText}>
                            <h2 style={{...styles.sectionTitle, textAlign: 'left'}}>Alianza <span>Estratégica</span></h2>
                            <p style={styles.textJustify}>
                                Impulsamos el crecimiento de negocios locales junto a instituciones líderes. Bean Quick no es solo una app, es una plataforma de aceleración para la cultura del café.
                            </p>
                        </motion.div>
                        <motion.div initial={{ x: 100, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} transition={{ duration: 0.8 }} style={styles.aliadosLogoCont}>
                            <motion.img 
                                animate={{ y: [0, -15, 0] }} 
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
                                src="/img/aliados/SENAlogo.png" 
                                alt="SENA" 
                                style={styles.senaLogo} 
                            />
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

const styles = {
    pageWrapper: { fontFamily: "'Poppins', sans-serif", color: '#3e2723', overflowX: 'hidden' },
    container: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
    section: { padding: '100px 0' },
    header: { 
        height: '90vh', 
        backgroundImage: 'url("https://images.unsplash.com/photo-1442512595331-e89e73853f31?q=80&w=1470&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    },
    headerOverlay: { height: '100%', backgroundColor: 'rgba(38, 24, 21, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
    logo: { width: '180px', marginBottom: '30px' },
    heroTitle: { fontSize: '3.5rem', color: '#fff', fontWeight: '800', textShadow: '2px 2px 10px rgba(0,0,0,0.3)' },
    heroSubtitle: { color: '#e0c3a2', fontSize: '1.6rem', fontWeight: '300', display: 'block', marginTop: '10px' },
    ctaButton: { marginTop: '40px', padding: '18px 50px', backgroundColor: '#6F4E37', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '20px', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' },
    sectionTitle: { fontSize: '2.8rem', marginBottom: '60px', textAlign: 'center', fontWeight: '700' },
    gridNosotros: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' },
    cardNosotros: { padding: '50px 30px', textAlign: 'center', borderRadius: '25px', backgroundColor: '#fff', border: '1px solid #f0f0f0' },
    iconWrapper: { color: '#6F4E37', marginBottom: '25px', fontSize: '40px' },
    cardTitle: { fontSize: '1.6rem', marginBottom: '15px', color: '#3e2723' },
    cardContent: { color: '#6d6d6d', lineHeight: '1.7' },
    gridProductos: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '30px' },
    productoCard: { backgroundColor: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' },
    imageContainer: { height: '220px', overflow: 'hidden' },
    productoImg: { width: '100%', height: '100%', objectFit: 'cover' },
    productoInfo: { padding: '20px', textAlign: 'center' },
    productoLabel: { fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '12px' },
    companyInfoContainer: { 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '8px', 
        marginBottom: '15px',
        backgroundColor: '#f8f1eb',
        padding: '5px 12px',
        borderRadius: '20px',
        width: 'fit-content',
        margin: '0 auto 15px auto'
    },
    companyLogoTiny: { 
        width: '24px', 
        height: '24px', 
        borderRadius: '50%', 
        objectFit: 'cover',
        border: '1px solid #d7ccc8'
    },
    companyIconTiny: { color: '#8d6e63', fontSize: '14px' },
    storeTextName: { fontSize: '12px', fontWeight: '600', color: '#5d4037', letterSpacing: '0.3px' },
    starsSmall: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' },
    ratingNum: { fontSize: '11px', fontWeight: 'bold', marginLeft: '2px' },
    aliadosWrapper: { display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' },
    aliadosText: { flex: '1', minWidth: '320px' },
    textJustify: { fontSize: '1.1rem', lineHeight: '1.9', color: '#5d4037' },
    aliadosLogoCont: { flex: '1', textAlign: 'center' },
    senaLogo: { width: '220px', filter: 'grayscale(0.2)' }
};

export default Home;