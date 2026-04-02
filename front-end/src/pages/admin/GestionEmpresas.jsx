import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { FaTrash, FaBuilding, FaArrowLeft, FaSearch, FaEdit, FaSave, FaTimes, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const GestionEmpresas = () => {
    const navigate = useNavigate();
    const [empresas, setEmpresas] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);

    const [modalAbierto, setModalAbierto] = useState(false);
    const [editando, setEditando] = useState({
        id: '', nombre: '', nit: '', telefono: '', direccion: ''
    });

    const token = localStorage.getItem('AUTH_TOKEN');

    useEffect(() => {
        cargarEmpresas();
    }, []);

    const cargarEmpresas = async () => {
        try {
            const res = await api.get('/api/admin/empresas', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmpresas(res.data);
        } catch (error) {
            console.error("Error cargando empresas:", error);
            Swal.fire('Error', 'No se pudieron cargar las empresas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAbrirEditar = (emp) => {
        setEditando({
            id: emp.id,
            nombre: emp.nombre || '',
            nit: emp.nit || '',
            telefono: emp.telefono || '',
            direccion: emp.direccion || ''
        });
        setModalAbierto(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/api/admin/empresas/${editando.id}`, editando, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Swal.fire('¡Éxito!', 'Empresa actualizada correctamente', 'success');
            setModalAbierto(false);
            cargarEmpresas();
        } catch (error) {
            Swal.fire('Error', 'No se pudieron guardar los cambios', 'error');
        }
    };

    const handleEliminar = async (id, nombre) => {
        const confirmar = await Swal.fire({
            title: `¿Eliminar ${nombre}?`,
            text: "Se borrarán todos los productos asociados a este local.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Sí, eliminar'
        });

        if (confirmar.isConfirmed) {
            try {
                await api.delete(`/api/admin/empresas/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmpresas(empresas.filter(e => e.id !== id));
                Swal.fire('Eliminado', 'La empresa ha sido borrada', 'success');
            } catch (error) {
                Swal.fire('Error', 'Hubo un problema al eliminar', 'error');
            }
        }
    };

    const filtradas = empresas.filter(e => {
        const term = busqueda.toLowerCase();
        const nombreVal = e.nombre ? e.nombre.toLowerCase() : '';
        const nitVal = e.nit ? e.nit.toLowerCase() : '';
        return nombreVal.includes(term) || nitVal.includes(term);
    });

    if (loading) return <div style={{padding: '20px'}}>Cargando directorio...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.topBar}>
                <button onClick={() => navigate('/admin/dashboard')} style={styles.backBtn}>
                    <FaArrowLeft /> Volver al Panel
                </button>
                <h1 style={styles.mainTitle}>Administrar empresas</h1>
            </div>

            <div style={styles.searchBarContainer}>
                <div style={styles.searchBox}>
                    <FaSearch color="#94a3b8" />
                    <input 
                        placeholder="Buscar por nombre o NIT..." 
                        style={styles.inputSearch}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </div>
            </div>

            <div style={styles.grid}>
                {filtradas.map(emp => (
                    <div key={emp.id} style={styles.card}>
                        {/* 1. Foto del Local (Banner) */}
                        <div style={styles.photoContainer}>
                            <img 
                                src={emp.foto_local_url || 'https://via.placeholder.com/400x150?text=Sin+Foto+Local'} 
                                alt="Local" 
                                style={styles.localPhoto} 
                            />
                        </div>

                        <div style={styles.cardContent}>
                            {/* 2. Logo Superpuesto y Título */}
                            <div style={styles.headerWithLogo}>
                                <img 
                                    src={emp.logo_url || 'https://via.placeholder.com/100?text=Logo'} 
                                    alt="Logo" 
                                    style={styles.logoImg} 
                                />
                                <div style={styles.titleInfo}>
                                    <h3 style={styles.empName}>{emp.nombre || 'Sin nombre'}</h3>
                                    <p style={styles.nitText}>NIT: {emp.nit}</p>
                                </div>
                            </div>

                            {/* 3. Cuerpo de información */}
                            <div style={styles.cardBody}>
                                <p style={styles.infoRow}><FaEnvelope style={styles.icon} /> {emp.usuario?.email || 'No disponible'}</p>
                                <p style={styles.infoRow}><FaPhone style={styles.icon} /> {emp.telefono || 'Sin teléfono'}</p>
                                <p style={styles.infoRow}><FaMapMarkerAlt style={styles.icon} /> {emp.direccion || 'Sin dirección'}</p>
                            </div>

                            <div style={styles.actions}>
                                <button onClick={() => handleAbrirEditar(emp)} style={styles.btnEdit}><FaEdit /> Editar</button>
                                <button onClick={() => handleEliminar(emp.id, emp.nombre)} style={styles.btnDelete}><FaTrash /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL DE EDICIÓN */}
            {modalAbierto && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalHeader}>
                            <h3>Editar Empresa</h3>
                            <button onClick={() => setModalAbierto(false)} style={styles.btnClose}><FaTimes /></button>
                        </div>
                        <form onSubmit={handleUpdate} style={styles.form}>
                            <div style={styles.group}>
                                <label>Nombre Comercial</label>
                                <input value={editando.nombre} onChange={e => setEditando({...editando, nombre: e.target.value})} style={styles.input} required />
                            </div>
                            <div style={styles.group}>
                                <label>NIT</label>
                                <input value={editando.nit} onChange={e => setEditando({...editando, nit: e.target.value})} style={styles.input} required />
                            </div>
                            <div style={styles.group}>
                                <label>Teléfono</label>
                                <input value={editando.telefono} onChange={e => setEditando({...editando, telefono: e.target.value})} style={styles.input} required />
                            </div>
                            <div style={styles.group}>
                                <label>Dirección</label>
                                <input value={editando.direccion} onChange={e => setEditando({...editando, direccion: e.target.value})} style={styles.input} required />
                            </div>
                            <button type="submit" style={styles.btnSave}><FaSave /> Guardar Cambios</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: { padding: '30px', backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' },
    topBar: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' },
    backBtn: { padding: '10px 15px', borderRadius: '8px', border: 'none', backgroundColor: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', color: '#475569', fontWeight: '500' },
    mainTitle: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 },
    searchBarContainer: { marginBottom: '25px' },
    searchBox: { display: 'flex', alignItems: 'center', background: 'white', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', maxWidth: '400px' },
    inputSearch: { border: 'none', outline: 'none', width: '100%', marginLeft: '10px', fontSize: '14px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
    
    // Tarjeta
    card: { background: 'white', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflow: 'hidden' },
    photoContainer: { width: '100%', height: '130px', backgroundColor: '#cbd5e0' },
    localPhoto: { width: '100%', height: '100%', objectFit: 'cover' },
    cardContent: { padding: '15px', paddingTop: '0' },
    
    // Header con Logo
    headerWithLogo: { display: 'flex', alignItems: 'flex-end', gap: '12px', marginTop: '-35px', marginBottom: '15px' },
    logoImg: { width: '75px', height: '75px', borderRadius: '14px', border: '4px solid white', backgroundColor: 'white', objectFit: 'cover', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    titleInfo: { paddingBottom: '5px' },
    empName: { fontSize: '18px', margin: 0, color: '#1e293b', fontWeight: '700' },
    nitText: { fontSize: '12px', color: '#94a3b8', margin: 0 },
    
    // Info y Acciones
    cardBody: { fontSize: '14px', color: '#64748b', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '6px' },
    infoRow: { margin: 0, display: 'flex', alignItems: 'center', gap: '8px' },
    icon: { color: '#6366f1', fontSize: '14px' },
    actions: { display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' },
    btnEdit: { flex: 1, padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#4f46e5', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px', fontWeight: '500' },
    btnDelete: { padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', cursor: 'pointer' },
    
    // Modal
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modal: { background: 'white', padding: '25px', borderRadius: '15px', width: '90%', maxWidth: '450px' },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    btnClose: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    group: { display: 'flex', flexDirection: 'column', gap: '5px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px' },
    btnSave: { marginTop: '10px', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }
};

export default GestionEmpresas;