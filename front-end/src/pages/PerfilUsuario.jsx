import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaEnvelope, FaIdCard, FaSave, FaUserEdit, FaLock, FaKey, FaAt } from 'react-icons/fa';

const PerfilUsuario = () => {
    const [userData, setUserData] = useState({ name: '', email: '', role: '' });
    const [emailData, setEmailData] = useState({ email: '', email_confirmation: '' });
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        password: '',
        password_confirmation: ''
    });
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

    useEffect(() => {
        const fetchPerfil = async () => {
            const token = localStorage.getItem('AUTH_TOKEN');
            try {
                const res = await axios.get('http://127.0.0.1:8000/api/user', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserData({
                    name: res.data.name,
                    email: res.data.email,
                    role: res.data.role || localStorage.getItem('USER_ROLE')
                });
                setEmailData({ email: res.data.email, email_confirmation: res.data.email });
                setLoading(false);
            } catch (error) {
                console.error("Error al obtener perfil", error);
                setLoading(false);
            }
        };
        fetchPerfil();
    }, []);

    const handleUpdate = async (e, data, tipo) => {
        e.preventDefault();
        const token = localStorage.getItem('AUTH_TOKEN');
        
        // Validación local para correos y contraseñas
        if (tipo === 'password' && data.password !== data.password_confirmation) {
            setMensaje({ tipo: 'error', texto: 'Las contraseñas no coinciden' });
            return;
        }
        if (tipo === 'email' && data.email !== data.email_confirmation) {
            setMensaje({ tipo: 'error', texto: 'Los correos no coinciden' });
            return;
        }

        try {
            await axios.patch('http://127.0.0.1:8000/api/profile', data, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMensaje({ tipo: 'success', texto: `¡${tipo.toUpperCase()} actualizado con éxito!` });
            if (data.name) localStorage.setItem('USER_NAME', data.name);
            setTimeout(() => setMensaje({ tipo: '', texto: '' }), 3000);
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.response?.data?.message || 'Error al actualizar' });
        }
    };

    if (loading) return <div style={styles.loading}>Cargando información...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div style={styles.avatar}><FaUser size={40} /></div>
                    <h2 style={styles.title}>Mi Perfil</h2>
                    <p style={styles.subtitle}>Configuración total de tu cuenta</p>
                </div>

                {mensaje.texto && (
                    <div style={{...styles.alert, ...(mensaje.tipo === 'success' ? styles.success : styles.error)}}>
                        {mensaje.texto}
                    </div>
                )}

                {/* BLOQUE 1: NOMBRE */}
                <form onSubmit={(e) => handleUpdate(e, { name: userData.name }, 'nombre')} style={styles.form}>
                    <h3 style={styles.sectionTitle}>Información Personal</h3>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}><FaIdCard /> Nombre Completo</label>
                        <input 
                            style={styles.input}
                            type="text" 
                            value={userData.name} 
                            onChange={(e) => setUserData({...userData, name: e.target.value})} 
                            required 
                        />
                    </div>
                    <button type="submit" style={styles.buttonSmall}>Actualizar Nombre</button>
                </form>

                <div style={styles.divider}></div>

                {/* BLOQUE 2: EMAIL */}
                <form onSubmit={(e) => handleUpdate(e, emailData, 'email')} style={styles.form}>
                    <h3 style={styles.sectionTitle}>Contacto</h3>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}><FaAt /> Nuevo Correo Electrónico</label>
                        <input 
                            style={styles.input}
                            type="email" 
                            value={emailData.email} 
                            onChange={(e) => setEmailData({...emailData, email: e.target.value})} 
                            required 
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}><FaEnvelope /> Confirmar Correo</label>
                        <input 
                            style={styles.input}
                            type="email" 
                            value={emailData.email_confirmation} 
                            onChange={(e) => setEmailData({...emailData, email_confirmation: e.target.value})} 
                            required 
                        />
                    </div>
                    <button type="submit" style={styles.buttonSmall}>Actualizar Correo</button>
                </form>

                <div style={styles.divider}></div>

                {/* BLOQUE 3: PASSWORD */}
                <form onSubmit={(e) => handleUpdate(e, passwordData, 'password')} style={styles.form}>
                    <h3 style={styles.sectionTitle}>Seguridad</h3>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}><FaLock /> Contraseña Actual</label>
                        <input 
                            style={styles.input}
                            type="password" 
                            value={passwordData.current_password}
                            onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                            required 
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}><FaKey /> Nueva Contraseña</label>
                        <input 
                            style={styles.input}
                            type="password" 
                            value={passwordData.password}
                            onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                            required 
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}><FaKey /> Confirmar Nueva Contraseña</label>
                        <input 
                            style={styles.input}
                            type="password" 
                            value={passwordData.password_confirmation}
                            onChange={(e) => setPasswordData({...passwordData, password_confirmation: e.target.value})}
                            required 
                        />
                    </div>
                    <button type="submit" style={styles.buttonMain}>
                        <FaSave /> Guardar Nueva Contraseña
                    </button>
                </form>
            </div>
        </div>
    );
};

// Estilos actualizados para manejar múltiples secciones
const styles = {
    container: { display: 'flex', justifyContent: 'center', padding: '100px 20px', backgroundColor: '#f8f5f2', minHeight: '100vh' },
    card: { backgroundColor: '#fff', width: '100%', maxWidth: '500px', padding: '30px', borderRadius: '25px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' },
    header: { textAlign: 'center', marginBottom: '25px' },
    avatar: { width: '60px', height: '60px', backgroundColor: '#6F4E37', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' },
    title: { fontSize: '22px', color: '#3e2723', margin: 0 },
    subtitle: { fontSize: '13px', color: '#8d6e63' },
    sectionTitle: { fontSize: '15px', color: '#6F4E37', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', fontWeight: '700', color: '#5d4037', display: 'flex', alignItems: 'center', gap: '5px' },
    input: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #d7ccc8', fontSize: '14px' },
    buttonSmall: { padding: '10px', backgroundColor: '#efebe9', border: '1px solid #6F4E37', color: '#6F4E37', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px', transition: '0.2s' },
    buttonMain: { padding: '14px', backgroundColor: '#6F4E37', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', gap: '10px' },
    divider: { height: '1px', backgroundColor: '#eee', margin: '25px 0' },
    alert: { padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '13px' },
    success: { backgroundColor: '#e8f5e9', color: '#2e7d32' },
    error: { backgroundColor: '#ffebee', color: '#c62828' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6F4E37' }
};

export default PerfilUsuario;