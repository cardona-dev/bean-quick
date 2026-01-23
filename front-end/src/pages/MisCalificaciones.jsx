import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaStore, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const MisCalificaciones = () => {
    const [calificaciones, setCalificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ estrellas: 5, comentario: '' });

    const fetchCalificaciones = async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const res = await axios.get('http://127.0.0.1:8000/api/cliente/mis-calificaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCalificaciones(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error", error);
        }
    };

    useEffect(() => { fetchCalificaciones(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de eliminar esta reseña?")) return;
        try {
            await axios.delete(`http://127.0.0.1:8000/api/cliente/calificaciones/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }
            });
            fetchCalificaciones();
        } catch (error) { alert("Error al eliminar"); }
    };

    const handleEditClick = (cal) => {
        setEditingId(cal.id);
        setEditForm({ estrellas: cal.estrellas, comentario: cal.comentario });
    };

    const handleUpdate = async (id) => {
        try {
            await axios.patch(`http://127.0.0.1:8000/api/cliente/calificaciones/${id}`, editForm, {
                headers: { Authorization: `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }
            });
            setEditingId(null);
            fetchCalificaciones();
        } catch (error) { alert("Error al actualizar"); }
    };

    if (loading) return <div style={styles.loading}>Cargando...</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>Mis Reseñas</h2>
            <div style={styles.list}>
                {calificaciones.map((cal) => (
                    <div key={cal.id} style={styles.card}>
                        <div style={styles.productSection}>
                            <img 
                                src={cal.producto?.imagen ? `http://127.0.0.1:8000/storage/${cal.producto.imagen}` : 'https://via.placeholder.com/80'} 
                                alt={cal.producto?.nombre} 
                                style={styles.img}
                            />
                            <div>
                                <h4 style={styles.prodTitle}>{cal.producto?.nombre}</h4>
                                <p style={styles.prodDesc}>{cal.producto?.descripcion}</p>
                                <span style={styles.store}><FaStore /> {cal.producto?.empresa?.nombre_empresa}</span>
                            </div>
                        </div>

                        {editingId === cal.id ? (
                            <div style={styles.editArea}>
                                <select 
                                    value={editForm.estrellas} 
                                    onChange={(e) => setEditForm({...editForm, estrellas: e.target.value})}
                                    style={styles.select}
                                >
                                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Estrellas</option>)}
                                </select>
                                <textarea 
                                    value={editForm.comentario}
                                    onChange={(e) => setEditForm({...editForm, comentario: e.target.value})}
                                    style={styles.textarea}
                                />
                                <div style={styles.actions}>
                                    <button onClick={() => handleUpdate(cal.id)} style={styles.btnSave}><FaSave /> Guardar</button>
                                    <button onClick={() => setEditingId(null)} style={styles.btnCancel}><FaTimes /> Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.content}>
                                <div style={styles.stars}>
                                    {[...Array(5)].map((_, i) => <FaStar key={i} color={i < cal.estrellas ? "#FFD700" : "#ddd"} />)}
                                </div>
                                <p style={styles.comment}>"{cal.comentario}"</p>
                                <div style={styles.footerActions}>
                                    <button onClick={() => handleEditClick(cal)} style={styles.btnEdit}><FaEdit /> Editar</button>
                                    <button onClick={() => handleDelete(cal.id)} style={styles.btnDelete}><FaTrash /> Eliminar</button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '120px 20px', maxWidth: '800px', margin: '0 auto' },
    title: { textAlign: 'center', color: '#3e2723', marginBottom: '30px' },
    list: { display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { background: '#fff', borderRadius: '15px', padding: '20px', boxShadow: '0 5px 15px rgba(0,0,0,0.05)', border: '1px solid #efebe9' },
    productSection: { display: 'flex', gap: '20px', marginBottom: '15px', borderBottom: '1px solid #f5f5f5', paddingBottom: '15px' },
    img: { width: '80px', height: '80px', borderRadius: '10px', objectFit: 'cover' },
    prodTitle: { margin: 0, fontSize: '18px', color: '#3e2723' },
    prodDesc: { fontSize: '13px', color: '#757575', margin: '5px 0' },
    store: { fontSize: '12px', color: '#6F4E37', fontWeight: 'bold' },
    stars: { marginBottom: '10px' },
    comment: { fontStyle: 'italic', color: '#5d4037', fontSize: '14px' },
    footerActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' },
    btnEdit: { padding: '8px 15px', border: '1px solid #6F4E37', background: 'none', color: '#6F4E37', borderRadius: '5px', cursor: 'pointer' },
    btnDelete: { padding: '8px 15px', border: 'none', background: '#ffebee', color: '#c62828', borderRadius: '5px', cursor: 'pointer' },
    editArea: { display: 'flex', flexDirection: 'column', gap: '10px' },
    select: { padding: '8px', borderRadius: '5px', border: '1px solid #ddd' },
    textarea: { padding: '10px', borderRadius: '5px', border: '1px solid #ddd', minHeight: '80px' },
    actions: { display: 'flex', gap: '10px' },
    btnSave: { background: '#6F4E37', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
    btnCancel: { background: '#9e9e9e', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' },
    loading: { textAlign: 'center', padding: '100px', color: '#6F4E37' }
};

export default MisCalificaciones;