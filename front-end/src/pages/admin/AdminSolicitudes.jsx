// ========================================
// IMPORTACIONES - Traemos las herramientas que necesitamos
// ========================================

// React, useEffect y useState: para crear componentes y manejar estados/efectos
import React, { useEffect, useState } from 'react';

// axios: herramienta para comunicarnos con el servidor
import api from '../../api/axios';

// useNavigate: función para cambiar de página
import { useNavigate } from 'react-router-dom';

// Iconos decorativos para los botones y acciones
import { 
    FaArrowLeft,  // Flecha izquierda (volver atrás)
    FaCheck,      // Check (aprobar)
    FaTimes,      // X (rechazar)
    FaSpinner,    // Spinner (cargando)
    FaEye         // Ojo (ver detalles)
} from 'react-icons/fa';

// ========================================
// COMPONENTE PRINCIPAL - AdminSolicitudes
// ========================================
const AdminSolicitudes = () => {
    // ========================================
    // ESTADOS - Variables que pueden cambiar
    // ========================================
    
    // solicitudes: array que guarda todas las solicitudes pendientes
    const [solicitudes, setSolicitudes] = useState([]);
    
    // loading: indica si estamos cargando datos del servidor
    const [loading, setLoading] = useState(true);
    
    // procesandoId: guarda el ID de la solicitud que se está procesando
    // (para deshabilitar los botones mientras se procesa)
    const [procesandoId, setProcesandoId] = useState(null);
    
    // solicitudExpandida: guarda el ID de la solicitud que está expandida
    // (para mostrar u ocultar los detalles completos)
    const [solicitudExpandida, setSolicitudExpandida] = useState(null);
    
    // navigate: función para cambiar de página
    const navigate = useNavigate();
    
    // Obtenemos el token de autenticación del localStorage
    const token = localStorage.getItem('AUTH_TOKEN');

    // ========================================
    // EFECTO - Se ejecuta cuando el componente carga
    // ========================================
    // useEffect se ejecuta automáticamente al cargar la página
    useEffect(() => {
        // Llamamos a la función que obtiene las solicitudes
        fetchSolicitudes();
    }, []); // [] significa: ejecuta esto solo una vez al cargar

    // ========================================
    // FUNCIÓN 1: Obtener solicitudes del servidor
    // ========================================
    const fetchSolicitudes = async () => {
        try {
            // Hacemos una petición GET al servidor para obtener las solicitudes
            const response = await api.get('/api/admin/solicitudes', {
                headers: { 
                    Authorization: `Bearer ${token}` // Enviamos el token para autenticarnos
                }
            });
            
            // Si el servidor nos devuelve datos válidos
            if (response.data && response.data.solicitudes) {
                // Guardamos las solicitudes en el estado
                setSolicitudes(response.data.solicitudes);
            }
            
            // Apagamos el estado de "cargando"
            setLoading(false);
        } catch (error) {
            // Si algo sale mal, lo mostramos en la consola
            console.error("Error al obtener solicitudes:", error);
            // Apagamos el estado de "cargando" aunque haya error
            setLoading(false);
        }
    };

    // ========================================
    // FUNCIÓN 2: Aprobar una solicitud
    // ========================================
    const handleAprobar = async (id) => {
        // Mostramos un cuadro de confirmación al admin
        // Si el admin cancela, salimos de la función
        if (!window.confirm("¿Aprobar esta empresa? Se enviará el correo de activación.")) return;
        
        // Marcamos esta solicitud como "en proceso"
        setProcesandoId(id);
        
        try {
            // Enviamos una petición POST al servidor para aprobar
            await api.post(
                `/api/admin/aprobar/${id}`, // URL con el ID
                {}, // Cuerpo vacío (no necesitamos enviar datos adicionales)
                {
                    headers: { 
                        Authorization: `Bearer ${token}` // Enviamos el token
                    }
                }
            );
            
            // Si todo salió bien, mostramos mensaje de éxito
            alert("¡Empresa aprobada!");
            
            // Removemos esta solicitud de la lista
            // filter() crea un nuevo array sin el elemento con este ID
            setSolicitudes(solicitudes.filter(s => s.id !== id));
        } catch (error) {
            // Si algo sale mal, mostramos error
            alert("Error al aprobar."+error);
        } finally {
            // Esto SIEMPRE se ejecuta (haya éxito o error)
            // Quitamos el estado de "procesando"
            setProcesandoId(null);
        }
    };

    // ========================================
    // FUNCIÓN 3: Rechazar una solicitud
    // ========================================
    const handleRechazar = async (id) => {
        // Mostramos un cuadro de confirmación al admin
        if (!window.confirm("¿Estás seguro de rechazar esta solicitud?")) return;
        
        // Marcamos esta solicitud como "en proceso"
        setProcesandoId(id);
        
        try {
            // Enviamos una petición POST al servidor para rechazar
            await api.post(
                `/api/admin/rechazar/${id}`, // URL con el ID
                {}, // Cuerpo vacío
                {
                    headers: { 
                        Authorization: `Bearer ${token}` // Enviamos el token
                    }
                }
            );
            
            // Si todo salió bien, mostramos mensaje de éxito
            alert("Solicitud rechazada correctamente.");
            
            // Removemos esta solicitud de la lista
            setSolicitudes(solicitudes.filter(s => s.id !== id));
        } catch (error) {
            // Si algo sale mal, mostramos error
            alert("Error al rechazar la solicitud."+error);
        } finally {
            // Quitamos el estado de "procesando"
            setProcesandoId(null);
        }
    };

    // ========================================
    // CASO 1: Si está cargando, mostramos spinner
    // ========================================
    if (loading) 
        return (
            <div style={styles.loader}>
                <FaSpinner className="spin" /> Cargando solicitudes...
            </div>
        );

    // ========================================
    // CASO 2: Todo cargado, mostramos la interfaz principal
    // ========================================
    return (
        <div style={styles.container}>
            {/* ========================================
                HEADER - Encabezado con botón de volver
                ======================================== */}
            <div style={styles.header}>
                {/* Botón para volver al dashboard */}
                <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
                    <FaArrowLeft /> Volver al Panel
                </button>
                {/* Título de la página */}
                <h1>Gestión de Solicitudes</h1>
            </div>

            {/* ========================================
                CONTENEDOR PRINCIPAL - Tabla de solicitudes
                ======================================== */}
            <div style={styles.cardContainer}>
                {/* Si hay solicitudes, mostramos la tabla */}
                {solicitudes.length > 0 ? (
                    <table style={styles.table}>
                        {/* ========================================
                            ENCABEZADO DE LA TABLA
                            ======================================== */}
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Correo</th>
                                <th>NIT</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        
                        {/* ========================================
                            CUERPO DE LA TABLA - Filas de datos
                            ======================================== */}
                        <tbody>
                            {/* Recorremos cada solicitud */}
                            {solicitudes.map((s) => (
                                // React.Fragment permite agrupar elementos sin agregar un div extra
                                // Necesitamos esto porque cada solicitud tiene 2 filas: 
                                // 1) la fila principal, 2) la fila de detalles expandible
                                <React.Fragment key={s.id}>
                                    {/* ========================================
                                        FILA PRINCIPAL - Datos básicos
                                        ======================================== */}
                                    <tr>
                                        {/* Nombre de la empresa (en negrita) */}
                                        <td style={styles.bold}>{s.nombre}</td>
                                        
                                        {/* Correo */}
                                        <td>{s.correo}</td>
                                        
                                        {/* NIT */}
                                        <td>{s.nit}</td>
                                        
                                        {/* ========================================
                                            COLUMNA DE ACCIONES - Botones
                                            ======================================== */}
                                        <td style={styles.actions}>
                                            {/* BOTÓN 1: Ver detalles / Cerrar detalles */}
                                            <button 
                                                onClick={() => {
                                                    // Si esta solicitud ya está expandida, la cerramos (ponemos null)
                                                    // Si no está expandida, la expandimos (guardamos su ID)
                                                    setSolicitudExpandida(
                                                        solicitudExpandida === s.id ? null : s.id
                                                    )
                                                }}
                                                style={styles.btnDetail}
                                            >
                                                <FaEye /> 
                                                {/* Texto dinámico: "Cerrar" si está expandida, "Ver todo" si no */}
                                                {solicitudExpandida === s.id ? 'Cerrar' : 'Ver todo'}
                                            </button>
                                            
                                            {/* BOTÓN 2: Aprobar */}
                                            <button 
                                                onClick={() => handleAprobar(s.id)} 
                                                style={styles.btnApprove}
                                                // Deshabilitamos si esta solicitud se está procesando
                                                disabled={procesandoId === s.id}
                                            >
                                                <FaCheck />
                                            </button>
                                            
                                            {/* BOTÓN 3: Rechazar */}
                                            <button 
                                                onClick={() => handleRechazar(s.id)} 
                                                style={styles.btnReject}
                                                // Deshabilitamos si esta solicitud se está procesando
                                                disabled={procesandoId === s.id}
                                            >
                                                <FaTimes />
                                            </button>
                                        </td>
                                    </tr>
                                    
                                    {/* ========================================
                                        FILA EXPANDIBLE - Detalles completos
                                        Solo se muestra si esta solicitud está expandida
                                        ======================================== */}
                                    {solicitudExpandida === s.id && (
                                        <tr style={styles.expandRow}>
                                            {/* colSpan="4" hace que esta celda ocupe las 4 columnas */}
                                            <td colSpan="4">
                                                <div style={styles.detailGrid}>
                                                    {/* ========================================
                                                        COLUMNA IZQUIERDA - Información textual
                                                        ======================================== */}
                                                    <div>
                                                        <p><strong>Teléfono:</strong> {s.telefono}</p>
                                                        <p><strong>Dirección:</strong> {s.direccion}</p>
                                                        <p><strong>Descripción:</strong> {s.descripcion}</p>
                                                    </div>
                                                    
                                                    {/* ========================================
                                                        COLUMNA DERECHA - Imágenes
                                                        ======================================== */}
                                                    <div style={styles.imageBox}>
                                                        {/* Logo */}
                                                        <div>
                                                            <p><strong>Logo:</strong></p>
                                                            <img 
                                                                src={s.logo_url} 
                                                                alt="Logo" 
                                                                style={styles.previewImg} 
                                                            />
                                                        </div>
                                                        
                                                        {/* Foto del local */}
                                                        <div>
                                                            <p><strong>Local:</strong></p>
                                                            <img 
                                                                src={s.foto_local_url} 
                                                                alt="Local" 
                                                                style={styles.previewImg} 
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    /* ========================================
                        CASO 3: No hay solicitudes
                        ======================================== */
                    <div style={styles.noData}>
                        <p>No hay solicitudes pendientes.</p>
                    </div>
                )}
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
        padding: '30px', // Espacio alrededor
        backgroundColor: '#f4f7f6', // Fondo gris-verde claro
        minHeight: '100vh' // Altura mínima de toda la pantalla
    },
    
    // Header (encabezado con botón de volver)
    header: { 
        display: 'flex', // Flexbox
        alignItems: 'center', // Alinear verticalmente
        gap: '20px', // Espacio entre elementos
        marginBottom: '30px' // Espacio abajo
    },
    
    // Botón "Volver al Panel"
    backBtn: { 
        background: '#6f4e37', // Marrón (café)
        color: 'white', // Texto blanco
        border: 'none', // Sin borde
        padding: '10px 15px', // Espacio interior
        borderRadius: '5px', // Esquinas redondeadas
        cursor: 'pointer', // Manita al pasar el mouse
        display: 'flex', // Flexbox para ícono + texto
        alignItems: 'center', // Alinear verticalmente
        gap: '8px' // Espacio entre ícono y texto
    },
    
    // Contenedor de la tabla (tarjeta blanca)
    cardContainer: { 
        backgroundColor: 'white', // Fondo blanco
        borderRadius: '10px', // Esquinas redondeadas
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', // Sombra suave
        overflowX: 'auto' // Scroll horizontal si la tabla es muy ancha
    },
    
    // Tabla
    table: { 
        width: '100%', // Ancho completo
        borderCollapse: 'collapse' // Elimina espacios entre celdas
    },
    
    // Texto en negrita (nombre de empresa)
    bold: { 
        fontWeight: 'bold' 
    },
    
    // Columna de acciones (botones)
    actions: { 
        display: 'flex', // Flexbox para alinear botones
        gap: '8px', // Espacio entre botones
        padding: '10px' // Espacio interior
    },
    
    // Botón "Ver todo / Cerrar" (azul)
    btnDetail: { 
        backgroundColor: '#17a2b8', // Azul cian
        color: 'white', // Texto blanco
        border: 'none', // Sin borde
        padding: '6px 10px', // Espacio interior
        borderRadius: '4px', // Esquinas redondeadas
        cursor: 'pointer', // Manita al pasar el mouse
        display: 'flex', // Flexbox
        alignItems: 'center', // Alinear verticalmente
        gap: '5px' // Espacio entre ícono y texto
    },
    
    // Botón "Aprobar" (verde)
    btnApprove: { 
        backgroundColor: '#28a745', // Verde
        color: 'white',
        border: 'none',
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    
    // Botón "Rechazar" (rojo)
    btnReject: { 
        backgroundColor: '#dc3545', // Rojo
        color: 'white',
        border: 'none',
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: 'pointer'
    },
    
    // Fila expandida (detalles completos)
    expandRow: { 
        backgroundColor: '#f9f9f9', // Fondo gris muy claro
        borderBottom: '2px solid #6f4e37' // Línea marrón abajo
    },
    
    // Grid de detalles (2 columnas)
    detailGrid: { 
        padding: '20px', // Espacio interior
        display: 'grid', // CSS Grid
        gridTemplateColumns: '1fr 1fr', // 2 columnas iguales
        gap: '20px' // Espacio entre columnas
    },
    
    // Contenedor de imágenes
    imageBox: { 
        display: 'flex', // Flexbox
        gap: '20px' // Espacio entre logo y foto
    },
    
    // Imagen de vista previa (logo y foto del local)
    previewImg: { 
        width: '100px', // Ancho fijo
        height: '100px', // Alto fijo (cuadrado)
        objectFit: 'cover', // Recorta para ajustar sin deformar
        borderRadius: '8px', // Esquinas redondeadas
        border: '1px solid #ddd' // Borde gris claro
    },
    
    // Mensaje cuando no hay solicitudes
    noData: { 
        padding: '40px', // Espacio interior grande
        textAlign: 'center', // Texto centrado
        color: '#888' // Gris
    },
    
    // Pantalla de carga (spinner)
    loader: { 
        display: 'flex', // Flexbox
        justifyContent: 'center', // Centrar horizontalmente
        alignItems: 'center', // Centrar verticalmente
        height: '100vh', // Altura de toda la pantalla
        fontSize: '1.2rem' // Tamaño de texto grande
    }
};

// Exportamos el componente
export default AdminSolicitudes;