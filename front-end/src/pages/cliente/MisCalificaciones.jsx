import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { FaStar, FaStore, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const MisCalificaciones = () => {
    const [calificaciones, setCalificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ estrellas: 5, comentario: '' });
    const [hoverStars, setHoverStars] = useState(null); // Para el efecto visual al pasar el mouse

    const fetchCalificaciones = async () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        try {
            const res = await api.get('/api/cliente/mis-calificaciones', {
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
            await api.delete(`/api/cliente/calificaciones/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }
            });
            fetchCalificaciones();
        } catch (error) { alert("Error al eliminar"+error); }
    };

    const handleEditClick = (cal) => {
        setEditingId(cal.id);
        setEditForm({ estrellas: cal.estrellas, comentario: cal.comentario });
    };

    const handleUpdate = async (id) => {
        try {
            await api.patch(`/api/cliente/calificaciones/${id}`, editForm, {
                headers: { Authorization: `Bearer ${localStorage.getItem('AUTH_TOKEN')}` }
            });
            setEditingId(null);
            fetchCalificaciones();
        } catch (error) { alert("Error al actualizar"+error); }
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
                                src={cal.producto?.imagen ? `${import.meta.env.VITE_API_URL}/storage/${cal.producto.imagen}` : 'https://via.placeholder.com/80'} 
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
                                <label style={styles.label}>Tu nueva calificación:</label>
                                <div style={styles.interactiveStars}>
                                    {[...Array(5)].map((_, i) => {
                                        const ratingValue = i + 1;
                                        return (
                                            <label key={i}>
                                                <input
                                                    type="radio"
                                                    name="rating"
                                                    value={ratingValue}
                                                    onClick={() => setEditForm({ ...editForm, estrellas: ratingValue })}
                                                    style={{ display: 'none' }}
                                                />
                                                <FaStar
                                                    size={25}
                                                    style={{ cursor: 'pointer', transition: 'color 200ms' }}
                                                    color={ratingValue <= (hoverStars || editForm.estrellas) ? "#FFD700" : "#ddd"}
                                                    onMouseEnter={() => setHoverStars(ratingValue)}
                                                    onMouseLeave={() => setHoverStars(null)}
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                                <textarea 
                                    placeholder="Escribe tu comentario aquí..."
                                    value={editForm.comentario}
                                    onChange={(e) => setEditForm({...editForm, comentario: e.target.value})}
                                    style={styles.textarea}
                                />
                                <div style={styles.actions}>
                                    <button onClick={() => handleUpdate(cal.id)} style={styles.btnSave}><FaSave /> Guardar cambios</button>
                                    <button onClick={() => setEditingId(null)} style={styles.btnCancel}><FaTimes /> Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.content}>
                                <div style={styles.stars}>
                                    {[...Array(5)].map((_, i) => <FaStar key={i} color={i < cal.estrellas ? "#FFD700" : "#ddd"} />)}
                                </div>
                                <p style={styles.comment}>{cal.comentario ? `"${cal.comentario}"` : "Sin comentario"}</p>
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

// Estilos mejorados
const styles = {
    container: { padding: '120px 20px', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' },
    title: { textAlign: 'center', color: '#3e2723', marginBottom: '40px', fontSize: '2rem' },
    list: { display: 'flex', flexDirection: 'column', gap: '20px' },
    card: { background: '#fff', borderRadius: '20px', padding: '25px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #efebe9' },
    productSection: { display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #f5f5f5', paddingBottom: '20px' },
    img: { width: '90px', height: '90px', borderRadius: '15px', objectFit: 'cover', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' },
    prodTitle: { margin: 0, fontSize: '20px', color: '#3e2723', fontWeight: 'bold' },
    prodDesc: { fontSize: '14px', color: '#757575', margin: '8px 0' },
    store: { fontSize: '12px', color: '#6F4E37', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' },
    stars: { marginBottom: '12px', display: 'flex', gap: '3px' },
    interactiveStars: { display: 'flex', gap: '8px', marginBottom: '15px' },
    comment: { fontStyle: 'italic', color: '#5d4037', fontSize: '15px', lineHeight: '1.5' },
    footerActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' },
    btnEdit: { padding: '10px 18px', border: '1px solid #6F4E37', background: 'none', color: '#6F4E37', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', transition: '0.3s' },
    btnDelete: { padding: '10px 18px', border: 'none', background: '#ffebee', color: '#c62828', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' },
    editArea: { display: 'flex', flexDirection: 'column', gap: '12px', background: '#fdfaf8', padding: '20px', borderRadius: '15px' },
    label: { fontSize: '14px', fontWeight: 'bold', color: '#6F4E37' },
    textarea: { padding: '15px', borderRadius: '12px', border: '1px solid #d7ccc8', minHeight: '100px', fontSize: '14px', outline: 'none', resize: 'vertical' },
    actions: { display: 'flex', gap: '12px', marginTop: '5px' },
    btnSave: { background: '#6F4E37', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', flex: 1 },
    btnCancel: { background: '#bdbdbd', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' },
    loading: { textAlign: 'center', padding: '100px', color: '#6F4E37', fontSize: '1.2rem' }
};

export default MisCalificaciones;