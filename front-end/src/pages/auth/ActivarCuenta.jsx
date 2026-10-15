// ========================================
// IMPORTACIONES - Traemos las herramientas que necesitamos
// ========================================

// React y useEffect/useState: permiten crear componentes y manejar efectos secundarios y estados
import React, { useEffect, useState } from "react";

// useParams: extrae parámetros de la URL (como el token)
// useNavigate: permite cambiar de página
import { useParams, useNavigate } from "react-router-dom";

// axios: herramienta para comunicarnos con el servidor
import api from "../../api/axios";

// ========================================
// COMPONENTE PRINCIPAL - ActivarCuenta
// ========================================
const ActivarCuenta = () => {
    // ========================================
    // EXTRAER TOKEN DE LA URL
    // ========================================
    // useParams nos permite obtener el "token" que viene en la URL
    // Por ejemplo, si la URL es: /activar/abc123xyz
    // entonces token = "abc123xyz"
    const { token } = useParams(); 
    
    // navigate: función para cambiar de página
    const navigate = useNavigate();
    
    // ========================================
    // ESTADOS - Variables que pueden cambiar
    // ========================================
    
    // datos: guarda la información de la solicitud de empresa
    // (nombre de empresa, nombre del dueño, correo, etc.)
    const [datos, setDatos] = useState(null);
    
    // password: guarda la contraseña que el usuario escribe
    const [password, setPassword] = useState("");
    
    // confirmPassword: guarda la confirmación de contraseña
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // error: guarda mensajes de error (si el token es inválido, etc.)
    const [error, setError] = useState("");

    // ========================================
    // EFECTO - Se ejecuta cuando el componente se carga
    // ========================================
    // useEffect se ejecuta automáticamente cuando la página carga
    // Es como decir: "Cuando llegues aquí, haz esto primero"
    useEffect(() => {
        // Función para validar si el token es correcto
        const validarToken = async () => {
            try {
                // Enviamos el token al servidor para verificarlo
                // Es como mostrar un ticket para confirmar que es válido
                const res = await api.get(
                    `/api/empresa/validar-token/${token}`,
                );
                
                // Si el token es válido, el servidor nos devuelve los datos de la solicitud
                // Guardamos esos datos en el estado "datos"
                setDatos(res.data.solicitud);
            } catch (error) {
                // Si algo sale mal (token inválido, expirado, ya usado, etc.)
                // Mostramos un mensaje de error
                setError("El enlace de activación es inválido o ya fue utilizado."+error);
            }
        };
        
        // Ejecutamos la función de validación
        validarToken();
    }, [token]); // [token] significa: "ejecuta esto cada vez que el token cambie"

    // ========================================
    // FUNCIÓN: Cuando el usuario envía el formulario
    // ========================================
    const handleRegistroFinal = async (e) => {
        // Evitamos que la página se recargue (comportamiento por defecto)
        e.preventDefault();
        
        // ========================================
        // VALIDACIÓN: Las contraseñas deben coincidir
        // ========================================
        if (password !== confirmPassword) {
            // Si las contraseñas no son iguales, mostramos una alerta
            alert("Las contraseñas no coinciden");
            return; // Salimos de la función sin enviar nada
        }

        try {
            // ========================================
            // ENVIAR DATOS AL SERVIDOR
            // ========================================
            // Enviamos el token y las contraseñas al servidor para activar la cuenta
            await api.post(`/api/empresa/activar/${token}`, {
                token, // Token de activación
                password, // Contraseña nueva
                password_confirmation: confirmPassword, // Confirmación de contraseña
            });

            // ========================================
            // LIMPIAR SESIÓN ANTERIOR (IMPORTANTE)
            // ========================================
            // Si había alguien logueado antes (como un admin o usuario),
            // borramos toda esa información para empezar limpio
            
            // localStorage.clear() borra TODO del almacenamiento local
            // (tokens, roles, nombres, etc.)
            localStorage.clear();
            
            // Eliminamos el header de autorización de axios
            // Es como quitar la credencial que llevábamos puesta
            delete api.defaults.headers.common['Authorization'];

            // Mostramos mensaje de éxito
            alert("¡Cuenta activada con éxito! Por seguridad, inicia sesión con tus nuevas credenciales.");
            
            // Redirigimos al usuario a la página de login
            // Ahora deberá iniciar sesión con su nueva cuenta
            navigate("/login");
            
        } catch (error) {
            // Si algo sale mal al activar la cuenta
            // Mostramos un mensaje de error
            alert("Error al finalizar el registro. Inténtalo de nuevo."+error);
        }
    };

    // ========================================
    // CASO 1: Si hay un error (token inválido)
    // ========================================
    if (error)
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                {/* Mostramos el mensaje de error en rojo */}
                <h2 style={{ color: 'red' }}>{error}</h2>
                {/* Botón para ir al login */}
                <button onClick={() => navigate('/login')}>Ir al Login</button>
            </div>
        );

    // ========================================
    // CASO 2: Si aún estamos cargando los datos
    // ========================================
    if (!datos)
        return (
            <div style={{ textAlign: "center", marginTop: "50px" }}>
                Cargando datos de tu empresa...
            </div>
        );

    // ========================================
    // CASO 3: Todo está bien, mostramos el formulario
    // ========================================
    return (
        <div style={styles.container}>
            {/* Título principal */}
            <h2 style={{ textAlign: 'center' }}>Finalizar Registro</h2>
            
            {/* Nombre de la empresa (color marrón) */}
            <h3 style={{ color: '#6f4e37' }}>{datos.nombre_empresa}</h3>
            
            {/* Mensaje de bienvenida con el nombre del dueño */}
            <p>
                Hola <strong>{datos.nombre_dueno}</strong>, define tu contraseña para
                comenzar.
            </p>

            {/* FORMULARIO DE ACTIVACIÓN */}
            <form onSubmit={handleRegistroFinal} style={styles.form}>
                {/* ========================================
                    CAMPO 1: Correo (deshabilitado)
                    ======================================== */}
                <label>Correo Electrónico (Confirmado)</label>
                <input
                    type="text"
                    value={datos.correo} // Muestra el correo de la solicitud
                    disabled // Este campo está deshabilitado (no se puede editar)
                    style={styles.inputDisabled}
                />

                {/* ========================================
                    CAMPO 2: Nueva Contraseña
                    ======================================== */}
                <label>Nueva Contraseña</label>
                <input
                    type="password" // Tipo password oculta los caracteres
                    placeholder="Mínimo 8 caracteres"
                    style={styles.input}
                    onChange={(e) => setPassword(e.target.value)} // Guarda lo que el usuario escribe
                    required // Este campo es obligatorio
                />

                {/* ========================================
                    CAMPO 3: Confirmar Contraseña
                    ======================================== */}
                <label>Confirmar Contraseña</label>
                <input
                    type="password"
                    placeholder="Repite tu contraseña"
                    style={styles.input}
                    onChange={(e) => setConfirmPassword(e.target.value)} // Guarda la confirmación
                    required // Este campo es obligatorio
                />

                {/* ========================================
                    BOTÓN DE ENVÍO
                    ======================================== */}
                <button type="submit" style={styles.button}>
                    Activar mi Cuenta
                </button>
            </form>
        </div>
    );
};

// ========================================
// ESTILOS - Toda la apariencia visual
// ========================================
const styles = {
    // Contenedor principal (caja blanca centrada)
    container: {
        maxWidth: "400px", // Ancho máximo de 400px
        margin: "50px auto", // Centrado con margen arriba de 50px
        padding: "20px", // Espacio interior
        border: "1px solid #ddd", // Borde gris claro
        borderRadius: "10px", // Esquinas redondeadas
        backgroundColor: "#fff", // Fondo blanco
        boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" // Sombra suave
    },
    
    // Formulario
    form: { 
        display: "flex", 
        flexDirection: "column", // Elementos en columna (uno debajo del otro)
        gap: "15px" // Espacio de 15px entre elementos
    },
    
    // Input normal (contraseñas)
    input: { 
        padding: "12px", // Espacio interior
        borderRadius: "5px", // Esquinas redondeadas
        border: "1px solid #ccc" // Borde gris
    },
    
    // Input deshabilitado (correo)
    inputDisabled: {
        padding: "12px",
        borderRadius: "5px",
        border: "1px solid #eee", // Borde más claro
        backgroundColor: "#f9f9f9", // Fondo gris muy claro
        color: "#888", // Texto gris (indica que está deshabilitado)
    },
    
    // Botón de activar cuenta
    button: {
        padding: "14px",
        background: "#6f4e37", // Color marrón (café)
        color: "white", // Texto blanco
        border: "none", // Sin borde
        borderRadius: "5px", // Esquinas redondeadas
        cursor: "pointer", // Manita al pasar el mouse
        fontWeight: "bold", // Texto en negrita
        fontSize: "16px" // Tamaño de texto
    },
};

// Exportamos el componente para usarlo en otras partes
export default ActivarCuenta;