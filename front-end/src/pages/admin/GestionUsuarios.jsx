import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    FaUserEdit, FaTrash, FaSearch, FaUserCircle, 
    FaArrowLeft, FaCheck, FaTimes, FaSpinner, FaEye 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'; // 1. Asegúrate de que esté importado

const AdminUsuarios = () => {
    // 2. INICIALIZA EL NAVIGATE AQUÍ ABAJO 👇
    const navigate = useNavigate();

    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState('');
    
    const [modalAbierto, setModalAbierto] = useState(false);
    const [usuarioEditando, setUsuarioEditando] = useState({ id: '', name: '', email: '', rol: '', password: '' });

    const token = localStorage.getItem('AUTH_TOKEN');

    useEffect(() => {
        cargarUsuarios();
    }, []);

    const cargarUsuarios = async () => {
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/admin/solicitudes', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsuarios(res.data.usuarios);
        } catch (error) {
            console.error("Error al cargar usuarios", error);
        } finally {
            setLoading(false);
        }
    };

    // ... (Mantén tus funciones handleEliminar, abrirModalEditar y handleUpdate igual)
    const handleEliminar = async (id, nombre) => {
        const confirmar = await Swal.fire({
            title: `¿Eliminar a ${nombre}?`,
            text: "Esta acción no se puede deshacer",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        });

        if (confirmar.isConfirmed) {
            try {
                await axios.delete(`http://127.0.0.1:8000/api/admin/usuarios/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsuarios(usuarios.filter(u => u.id !== id));
                Swal.fire('Eliminado', 'El usuario ha sido borrado.', 'success');
            } catch (error) {
                Swal.fire('Error', 'No se pudo eliminar el usuario.', 'error');
            }
        }
    };

    const abrirModalEditar = (user) => {
        setUsuarioEditando({ ...user, password: '' });
        setModalAbierto(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://127.0.0.1:8000/api/admin/usuarios/${usuarioEditando.id}`, usuarioEditando, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setModalAbierto(false);
            cargarUsuarios();
            Swal.fire('Actualizado', 'Usuario modificado con éxito', 'success');
        } catch (error) {
            Swal.fire('Error', 'Error al actualizar datos', 'error');
        }
    };

    const usuariosFiltrados = usuarios.filter(u => 
        u.name.toLowerCase().includes(busqueda.toLowerCase()) || 
        u.email.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div style={styles.container}>
            {/* Cabecera mejorada con el botón de volver */}
            <div style={styles.topBar}>
                <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
                    <FaArrowLeft /> Volver al Panel
                </button>
                <h1 style={styles.mainTitle}>Gestión de Usuarios</h1>
            </div>

            <div style={styles.header}>
                <h2 style={styles.title}>Listado de Usuarios</h2>
                <div style={styles.searchBox}>
                    <FaSearch color="#94a3b8" />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre o email..." 
                        style={styles.inputSearch}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            {/* ... Resto de tu tabla y modal se mantienen igual ... */}
            <div style={styles.card}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thead}>
                            <th style={styles.th}>Usuario</th>
                            <th style={styles.th}>Rol</th>
                            <th style={styles.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuariosFiltrados.map(user => (
                            <tr key={user.id} style={styles.tr}>
                                <td style={styles.td}>
                                    <div style={styles.userCell}>
                                        <FaUserCircle size={30} color="#cbd5e1" />
                                        <div>
                                            <div style={styles.name}>{user.name}</div>
                                            <div style={styles.email}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={styles.td}>
                                    <span style={{...styles.badge, backgroundColor: user.rol === 'admin' ? '#dbeafe' : '#f1f5f9', color: user.rol === 'admin' ? '#1e40af' : '#475569'}}>
                                        {user.rol}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <div style={styles.actions}>
                                        <button onClick={() => abrirModalEditar(user)} style={styles.btnEdit}><FaUserEdit /></button>
                                        <button onClick={() => handleEliminar(user.id, user.name)} style={styles.btnDelete}><FaTrash /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MODAL DE EDICIÓN */}
            {modalAbierto && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <h3>Editar Usuario</h3>
                        <form onSubmit={handleUpdate}>
                            <div style={styles.formGroup}>
                                <label>Nombre</label>
                                <input 
                                    value={usuarioEditando.name} 
                                    onChange={e => setUsuarioEditando({...usuarioEditando, name: e.target.value})}
                                    style={styles.input} required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Email</label>
                                <input 
                                    value={usuarioEditando.email} 
                                    onChange={e => setUsuarioEditando({...usuarioEditando, email: e.target.value})}
                                    style={styles.input} required
                                />
                            </div>
                            <div style={styles.formGroup}>
                                <label>Rol</label>
                                <select 
                                    value={usuarioEditando.rol} 
                                    onChange={e => setUsuarioEditando({...usuarioEditando, rol: e.target.value})}
                                    style={styles.input}
                                >
                                    <option value="cliente">Cliente</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>
                            <div style={styles.formGroup}>
                                <label>Nueva Contraseña (opcional)</label>
                                <input 
                                    type="password"
                                    value={usuarioEditando.password} 
                                    onChange={e => setUsuarioEditando({...usuarioEditando, password: e.target.value})}
                                    style={styles.input}
                                />
                            </div>
                            <div style={styles.modalButtons}>
                                <button type="button" onClick={() => setModalAbierto(false)} style={styles.btnCancel}>Cancelar</button>
                                <button type="submit" style={styles.btnSave}>Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Agregué los nuevos estilos necesarios
const styles = {
    container: { padding: '20px', fontFamily: 'Arial, sans-serif' },
    topBar: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
    backBtn: { 
        display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', 
        backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', 
        cursor: 'pointer', color: '#475569', fontWeight: 'bold' 
    },
    mainTitle: { fontSize: '24px', color: '#1e293b', margin: 0 },
    header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' },
    title: { fontSize: '18px', fontWeight: 'bold', color: '#64748b' },
    searchBox: { display: 'flex', alignItems: 'center', background: 'white', padding: '8px 15px', borderRadius: '8px', border: '1px solid #e2e8f0', gap: '10px' },
    inputSearch: { border: 'none', outline: 'none', fontSize: '14px', width: '250px' },
    card: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
    th: { padding: '12px 20px', textAlign: 'left', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '15px 20px' },
    userCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    name: { fontWeight: '600', color: '#334155' },
    email: { fontSize: '12px', color: '#94a3b8' },
    badge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
    actions: { display: 'flex', gap: '10px' },
    btnEdit: { background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#64748b' },
    btnDelete: { background: '#fef2f2', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' },
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modal: { background: 'white', padding: '30px', borderRadius: '12px', width: '400px' },
    formGroup: { marginBottom: '15px' },
    input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '5px' },
    modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    btnCancel: { padding: '10px 20px', background: '#f1f5f9', border: 'none', borderRadius: '6px', cursor: 'pointer' },
    btnSave: { padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
};

export default AdminUsuarios;