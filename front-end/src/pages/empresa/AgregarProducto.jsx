import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaImage } from 'react-icons/fa';

// IMPORTAMOS EL LAYOUT
import LayoutEmpresa from '../components/LayoutEmpresa';

const AgregarProducto = () => {
        // Maneja el envío del formulario para crear o editar producto
        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
                const data = new FormData();
                data.append('nombre', formData.nombre);
                data.append('descripcion', formData.descripcion);
                data.append('precio', formData.precio);
                data.append('stock', formData.stock);
                data.append('categoria_id', formData.categoria_id);
                if (formData.imagen) {
                    data.append('imagen', formData.imagen);
                }
                if (isEdit) {
                    data.append('_method', 'PUT');
                    await api.post(`/api/empresa/productos/${id}`, data, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    alert('¡Producto actualizado con éxito!');
                } else {
                    await api.post('/api/empresa/productos', data, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    alert('¡Producto creado con éxito!');
                }
                navigate('/empresa/productos');
            } catch (error) {
                console.error('Error al guardar:', error);
                alert('Error al guardar: ' + (error.response?.data?.message || 'Revisa los campos'));
            } finally {
                setLoading(false);
            }
        };
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [empresa, setEmpresa] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '', 
        categoria_id: '',
        imagen: null
    });

    const token = localStorage.getItem('AUTH_TOKEN');

    useEffect(() => {
        const cargarDatosIniciales = async () => {
            if (!token) return;
            setLoading(true);
            try {
                // 1. Cargamos Info Empresa y Categorías siempre
                const [resEmpresa, resCats] = await Promise.all([
                    api.get('/api/empresa/dashboard', {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    api.get('/api/categorias')
                ]);
                
                setEmpresa(resEmpresa.data.empresa);
                setCategorias(resCats.data);

                // 2. Si hay ID, es EDICIÓN: Traemos los datos del producto
                if (isEdit) {
                    const resProd = await api.get(`/api/empresa/productos/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    const p = resProd.data;
                    setFormData({
                        nombre: p.nombre || '',
                        descripcion: p.descripcion || '',
                        precio: p.precio || '',
                        stock: p.stock || '',
                        categoria_id: p.categoria_id || '',
                        imagen: null 
                    });

                    // Mostramos la imagen actual si existe
                    if (p.imagen) {
                        setPreview(`${import.meta.env.VITE_API_URL}/storage/${p.imagen}`);
                    }
                }
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setLoading(false);
            }
        };

        cargarDatosIniciales();
    }, [id, isEdit, token]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };


    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, imagen: file });
            setPreview(URL.createObjectURL(file));
        }
    };

    if (loading && !empresa) return <div style={{padding: '50px', textAlign: 'center'}}>Cargando...</div>;

    return (
        <LayoutEmpresa empresa={empresa}>
            <div style={styles.header}>
                <button onClick={() => navigate('/empresa/productos')} style={styles.backLink}>
                    <FaArrowLeft /> Volver a mis productos
                </button>
                <h2 style={styles.title}>{isEdit ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
            </div>

            <div style={styles.formContainer}>
                <form onSubmit={handleSubmit} style={styles.gridForm}>
                    {/* COLUMNA IZQUIERDA: IMAGEN */}
                    <div style={styles.imageCol}>
                        <div style={styles.previewBox}>
                            {preview ? (
                                <img src={preview} alt="Preview" style={styles.previewImage} />
                            ) : (
                                <div style={styles.noImage}><FaImage size={40} /><br/>Sin imagen</div>
                            )}
                        </div>
                        <label style={styles.fileLabel}>
                            {isEdit ? 'Cambiar Imagen' : 'Subir Imagen'}
                            <input type="file" onChange={handleFileChange} accept="image/*" style={{display: 'none'}} />
                        </label>
                    </div>

                    {/* COLUMNA DERECHA: DATOS */}
                    <div style={styles.dataCol}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Nombre del Producto</label>
                            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={styles.input} placeholder="Ej: Capuchino Vainilla" />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Descripción</label>
                            <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} style={styles.textarea} placeholder="Describe tu producto..." />
                        </div>

                        <div style={styles.row}>
                            <div style={{flex: 1}}>
                                <label style={styles.label}>Precio ($)</label>
                                <input type="number" name="precio" value={formData.precio} onChange={handleChange} required style={styles.input} />
                            </div>
                            <div style={{flex: 1}}>
                                <label style={styles.label}>Stock Disponible</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} required style={styles.input} />
                            </div>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Categoría</label>
                            <select name="categoria_id" value={formData.categoria_id} onChange={handleChange} required style={styles.input}>
                                <option value="">Seleccionar categoría...</option>
                                {categorias.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <button type="submit" disabled={loading} style={styles.submitBtn}>
                            <FaSave /> {loading ? 'Procesando...' : (isEdit ? 'Guardar Cambios' : 'Publicar Producto')}
                        </button>
                    </div>
                </form>
            </div>
        </LayoutEmpresa>
    );
};

const styles = {
    header: { marginBottom: '25px' },
    backLink: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontWeight: '600', fontSize: '14px' },
    title: { fontSize: '26px', fontWeight: '800', color: '#1e293b', margin: 0 },
    formContainer: { background: 'white', padding: '35px', borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
    gridForm: { display: 'flex', gap: '40px', flexWrap: 'wrap' },
    imageCol: { flex: '1', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '15px' },
    previewBox: { width: '100%', height: '280px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    previewImage: { width: '100%', height: '100%', objectFit: 'cover' },
    noImage: { textAlign: 'center', color: '#94a3b8', fontSize: '14px' },
    fileLabel: { background: '#f1f5f9', color: '#475569', padding: '14px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.3s' },
    dataCol: { flex: '2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '700', color: '#475569', marginLeft: '4px' },
    input: { padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', background: '#fcfcfc' },
    textarea: { padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '15px', minHeight: '120px', resize: 'none', outline: 'none', background: '#fcfcfc' },
    row: { display: 'flex', gap: '20px' },
    submitBtn: { background: '#6f4e37', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', fontSize: '16px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px', boxShadow: '0 4px 12px rgba(111, 78, 55, 0.2)' }
};

export default AgregarProducto;