// ========================================
// IMPORTACIONES - Traemos las herramientas que necesitamos
// ========================================

// React: biblioteca para crear componentes
import React from 'react';

// useNavigate: función para cambiar de página
import { useNavigate } from 'react-router-dom';

// Iconos decorativos para el dashboard
// CAMBIO IMPORTANTE: FaUsersCog en lugar de FaUsersConfig (el original tenía un error)
import { 
    FaUsersCog,    // Ícono de usuarios con engranaje (gestión de usuarios)
    FaStoreAlt,    // Ícono de tienda (para empresas)
    FaUserCheck,   // Ícono de usuario con check (solicitudes)
    FaSignOutAlt   // Ícono de salida (cerrar sesión)
} from 'react-icons/fa';

import { useState } from 'react'
import axios from 'axios'
import { FaTags } from 'react-icons/fa'
import { useEffect } from 'react'
import { FaTrash } from 'react-icons/fa'


// ========================================
// COMPONENTE PRINCIPAL - AdminDashboard
// ========================================
const AdminDashboard = () => {
    // navigate: función para cambiar de página
    const navigate = useNavigate();
    
    // ========================================
    // OBTENER NOMBRE DEL ADMINISTRADOR
    // ========================================
    // Buscamos el nombre guardado en localStorage
    // Si no existe, usamos 'Administrador' como valor por defecto
    const adminName = localStorage.getItem('USER_NAME') || 'Administrador';
    const [categoriaNombre, setCategoriaNombre] = useState('')
    const [loadingCategoria, setLoadingCategoria] = useState(false)
    const [categorias, setCategorias] = useState([])
    const [loadingCategorias, setLoadingCategorias] = useState(false)

    // ========================================
    // CARGAR CATEGORÍAS AL MONTAR EL COMPONENTE
    // ========================================
    useEffect(() => {
        cargarCategorias();
    }, []);

    // ========================================
    // FUNCIÓN: Cargar Categorías
    // ========================================
    const cargarCategorias = async () => {
        setLoadingCategorias(true);
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/categorias');
            setCategorias(response.data);
        } catch (error) {
            console.error('Error al cargar categorías:', error);
        } finally {
            setLoadingCategorias(false);
        }
    };


    // ========================================
    // MÓDULOS DEL DASHBOARD - Tarjetas principales
    // ========================================
    // Array con la información de cada tarjeta/módulo
    const modules = [
        {
            id: 1, // Identificador único
            title: 'Solicitudes de Registro', // Título de la tarjeta
            description: 'Nuevas empresas que quieren unirse. Aprueba o rechaza sus cuentas.', // Descripción
            icon: <FaUserCheck size={40} />, // Ícono (tamaño 40px)
            route: '/admin/solicitudes', // Ruta a la que lleva al hacer clic
            color: '#e67e22', // Color naranja para esta tarjeta
            badge: 'Pendientes' // Etiqueta especial (solo esta tarjeta la tiene)
        },
        {
            id: 2,
            title: 'Gestión de Empresas',
            description: 'Listado de todos los locales activos. Puedes suspender o editar cuentas.',
            icon: <FaStoreAlt size={40} />, // Ícono de tienda
            route: '/admin/empresas',
            color: '#2980b9', // Color azul
            // Esta tarjeta NO tiene badge
        },
        {
            id: 3,
            title: 'Usuarios del Sistema',
            description: 'Control de clientes registrados y roles de usuario.',
            icon: <FaUsersCog size={40} />, // Ícono corregido (era FaUsersConfig antes, error)
            route: '/admin/usuarios',
            color: '#8e44ad', // Color morado
            // Esta tarjeta NO tiene badge
        }
    ];

    // ========================================
    // FUNCIÓN: Cerrar Sesión
    // ========================================
    const handleLogout = () => {
        // Borramos TODA la información guardada en localStorage
        // (token, nombre de usuario, rol, etc.)
        localStorage.clear();
        
        // Redirigimos al usuario a la página de login
        navigate('/login');
    };

    //función para crear categoría

    const crearCategoria = async () => {
        if (!categoriaNombre.trim()) return;

        try {
            const token = localStorage.getItem('AUTH_TOKEN');
            console.log('Token:', token);
            console.log('Headers:', {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json'
            });

            const response = await axios.post(
                'http://127.0.0.1:8000/api/admin/categorias',
                { nombre: categoriaNombre },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json'
                    }
                }
            );

            console.log('Respuesta:', response.data);
            alert('Categoría creada correctamente');
            setCategoriaNombre('');
            cargarCategorias(); // Recargar la lista de categorías
        } catch (error) {
            console.error('Error completo:', error);
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            console.error('Headers enviados:', error.config?.headers);
            alert(`Error: ${error.response?.data?.message || 'No autorizado o error del servidor'}`);
        }
    };

    // ========================================
    // FUNCIÓN: Eliminar Categoría
    // ========================================
    const eliminarCategoria = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

        try {
            const token = localStorage.getItem('AUTH_TOKEN');
            await axios.delete(
                `http://127.0.0.1:8000/api/admin/categorias/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json'
                    }
                }
            );

            alert('Categoría eliminada correctamente');
            cargarCategorias(); // Recargar la lista
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert(`Error: ${error.response?.data?.message || 'No se pudo eliminar la categoría'}`);
        }
    };



    // ========================================
    // PARTE VISUAL - Lo que se muestra en pantalla
    // ========================================
    return (
        <div style={styles.container}>
            {/* ========================================
                HEADER - Encabezado del dashboard
                ======================================== */}
            <header style={styles.header}>
                <div>
                    {/* Título principal */}
                    <h1 style={styles.welcome}>Panel de Administración Global</h1>
                    
                    {/* Subtítulo con nombre del admin */}
                    <p style={styles.roleTag}>Sesión iniciada como: {adminName} • Control Total</p>
                </div>
                
                {/* Botón de cerrar sesión */}
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    <FaSignOutAlt /> Cerrar Sesión
                </button>
            </header>

            {/* ========================================
                GRID DE TARJETAS - Módulos principales
                ======================================== */}
            <div style={styles.grid}>
                {/* Recorremos el array "modules" y creamos una tarjeta por cada módulo */}
                {modules.map((module) => (
                    <div 
                        key={module.id} // Clave única para React (optimización)
                        style={styles.card} 
                        onClick={() => navigate(module.route)} // Al hacer clic, navega a la ruta del módulo
                        
                        // ========================================
                        // EFECTO HOVER - Cuando el mouse entra
                        // ========================================
                        onMouseEnter={(e) => {
                            // Levantamos la tarjeta 5px hacia arriba
                            e.currentTarget.style.transform = 'translateY(-5px)';
                            // Cambiamos el color del borde al color del módulo
                            e.currentTarget.style.borderColor = module.color;
                        }}
                        
                        // ========================================
                        // EFECTO HOVER - Cuando el mouse sale
                        // ========================================
                        onMouseLeave={(e) => {
                            // Regresamos la tarjeta a su posición original
                            e.currentTarget.style.transform = 'translateY(0)';
                            // Regresamos el borde a gris claro
                            e.currentTarget.style.borderColor = '#eee';
                        }}
                    >
                        {/* ========================================
                            CONTENEDOR DEL ÍCONO
                            ======================================== */}
                        <div style={{ ...styles.iconWrapper, color: module.color }}>
                            {/* Mostramos el ícono del módulo */}
                            {module.icon}
                        </div>
                        
                        {/* ========================================
                            CUERPO DE LA TARJETA (texto)
                            ======================================== */}
                        <div style={styles.cardBody}>
                            {/* Título del módulo */}
                            <h3 style={styles.cardTitle}>{module.title}</h3>
                            
                            {/* Descripción del módulo */}
                            <p style={styles.cardDesc}>{module.description}</p>
                            
                            {/* Badge (etiqueta) - solo si el módulo tiene badge */}
                            {module.badge && (
                                <span style={{...styles.badge, backgroundColor: module.color}}>
                                    {module.badge}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ========================================
                CREAR CATEGORÍA
            ======================================== */}
            <div style={styles.categoriaCard}>
                <div style={styles.categoriaHeader}>
                    <FaTags size={28} />
                    <h2 style={{ margin: 0 }}>Crear nueva categoría de productos</h2>
                </div>
            
                <div style={styles.categoriaForm}>
                    <input
                        type="text"
                        placeholder="Nombre de la categoría"
                        value={categoriaNombre}
                        onChange={(e) => setCategoriaNombre(e.target.value)}
                        style={styles.categoriaInput}
                    />
            
                    <button
                        onClick={crearCategoria}
                        disabled={loadingCategoria}
                        style={styles.categoriaBtn}
                    >
                        {loadingCategoria ? 'Creando...' : 'Crear categoría'}
                    </button>
                </div>
                    {/* ========================================
                        LISTA DE CATEGORÍAS
                    ======================================== */}
                    <div style={styles.categoriaCard}>
                        <div style={styles.categoriaHeader}>
                            <h2 style={{ margin: 0 }}>Categorías existentes</h2>
                        </div>
        
                        {loadingCategorias ? (
                            <p style={{ color: '#7f8c8d' }}>Cargando categorías...</p>
                        ) : categorias.length === 0 ? (
                            <p style={{ color: '#7f8c8d' }}>No hay categorías creadas aún</p>
                        ) : (
                            <div style={styles.categoriasList}>
                                {categorias.map((categoria) => (
                                    <div key={categoria.id} style={styles.categoriaItem}>
                                        <span style={styles.categoriaNombre}>{categoria.nombre}</span>
                                        <button
                                            onClick={() => eliminarCategoria(categoria.id)}
                                            style={styles.deleteBtn}
                                            title="Eliminar categoría"
                                        >
                                            <FaTrash size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
            </div>

        </div>
    );
};

// ========================================
// ESTILOS - Toda la apariencia visual
// ========================================
const styles = {
    // Contenedor principal de toda la página
    container: { 
        padding: '40px', // Espacio alrededor
        backgroundColor: '#f0f2f5', // Fondo gris claro
        minHeight: '100vh', // Altura mínima de toda la pantalla
        fontFamily: 'Arial, sans-serif' // Tipo de letra
    },
    
    // Header (encabezado superior)
    header: { 
        display: 'flex', // Usar flexbox
        justifyContent: 'space-between', // Separar título y botón a los extremos
        alignItems: 'center', // Alinear verticalmente al centro
        marginBottom: '40px', // Espacio abajo
        borderBottom: '1px solid #ddd', // Línea divisoria abajo
        paddingBottom: '20px' // Espacio interior abajo
    },
    
    // Título principal "Panel de Administración Global"
    welcome: { 
        margin: 0, // Sin margen
        fontSize: '1.8rem', // Tamaño grande
        color: '#1a1a1a' // Negro oscuro
    },
    
    // Etiqueta de rol "Sesión iniciada como..."
    roleTag: { 
        margin: '5px 0 0', // Margen solo arriba
        color: '#e74c3c', // Color rojo
        fontWeight: 'bold', // Texto en negrita
        fontSize: '0.85rem', // Tamaño pequeño
        textTransform: 'uppercase' // Todo en MAYÚSCULAS
    },
    
    // Botón de cerrar sesión
    logoutBtn: { 
        backgroundColor: '#fff', // Fondo blanco
        border: '1px solid #c0392b', // Borde rojo
        color: '#c0392b', // Texto rojo
        padding: '8px 16px', // Espacio interior
        borderRadius: '6px', // Esquinas redondeadas
        cursor: 'pointer', // Manita al pasar el mouse
        display: 'flex', // Flexbox para alinear ícono y texto
        alignItems: 'center', // Alinear verticalmente
        gap: '8px', // Espacio entre ícono y texto
        fontWeight: 'bold' // Texto en negrita
    },
    
    // Grid (cuadrícula) para las tarjetas
    grid: { 
        display: 'grid', // Usar CSS Grid
        // Columnas que se adaptan automáticamente:
        // - Mínimo 320px de ancho cada una
        // - Máximo 1 fracción del espacio disponible
        // - Se crean tantas columnas como quepan
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '25px' // Espacio entre tarjetas
    },
    
    // Tarjeta individual (módulo)
    card: { 
        backgroundColor: '#fff', // Fondo blanco
        borderRadius: '12px', // Esquinas redondeadas
        padding: '30px', // Espacio interior
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)', // Sombra suave
        cursor: 'pointer', // Manita al pasar el mouse
        transition: 'all 0.3s ease', // Animación suave para todos los cambios
        display: 'flex', // Flexbox para organizar ícono y texto
        alignItems: 'flex-start', // Alinear al inicio (arriba)
        gap: '20px', // Espacio entre ícono y texto
        border: '1px solid #eee' // Borde gris muy claro
    },
    
    // Contenedor del ícono (cuadro gris de fondo)
    iconWrapper: { 
        backgroundColor: '#f9f9f9', // Fondo gris muy claro
        padding: '15px', // Espacio interior
        borderRadius: '10px' // Esquinas redondeadas
        // El color del ícono se define dinámicamente en el JSX
    },
    
    // Cuerpo de la tarjeta (contiene título y descripción)
    cardBody: { 
        textAlign: 'left' // Alineado a la izquierda
    },
    
    // Título de la tarjeta
    cardTitle: { 
        margin: '0 0 10px 0', // Solo margen abajo
        fontSize: '1.25rem', // Tamaño mediano-grande
        color: '#2c3e50' // Azul oscuro
    },
    
    // Descripción de la tarjeta
    cardDesc: { 
        color: '#7f8c8d', // Gris
        fontSize: '0.9rem', // Tamaño pequeño
        lineHeight: '1.4', // Altura de línea (espaciado entre líneas)
        margin: 0 // Sin margen
    },
    
    // Badge (etiqueta "Pendientes")
    badge: { 
        display: 'inline-block', // Se comporta como elemento en línea pero con propiedades de bloque
        marginTop: '12px', // Espacio arriba
        color: 'white', // Texto blanco
        padding: '4px 10px', // Espacio interior
        borderRadius: '4px', // Esquinas redondeadas
        fontSize: '0.75rem', // Tamaño muy pequeño
        fontWeight: 'bold' // Texto en negrita
        // El color de fondo se define dinámicamente en el JSX
    },

    categoriaCard: {
    marginTop: '50px',
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    border: '1px solid #eee'
},

categoriaHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
    color: '#2c3e50'
},

categoriaForm: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
},

categoriaInput: {
    flex: 1,
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '1.3rem'
},

categoriaBtn: {
    backgroundColor: '#27ae60',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
},

// Lista de categorías
categoriasList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '15px'
},

// Item individual de categoría
categoriaItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    transition: 'all 0.3s ease'
},

// Nombre de la categoría
categoriaNombre: {
    fontSize: '1.3rem',
    fontWeight: '500',
    color: '#2c3e50',
    flex: 1
},

// Botón de eliminar
deleteBtn: {
    backgroundColor: '#e74c3c',
    color: '#fff',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.3s ease'
}

};

// Exportamos el componente para usarlo en otras partes
export default AdminDashboard;