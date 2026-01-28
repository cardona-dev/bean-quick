import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const AgregarProducto = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;
    
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        precio: '',
        stock: '', // <--- NUEVO: Estado para el stock
        categoria_id: '',
        imagen: null
    });

    const token = localStorage.getItem('AUTH_TOKEN');

    useEffect(() => {
        const fetchCategorias = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/categorias');
                setCategorias(response.data);
            } catch (error) {
                console.error("Error al cargar categorías", error);
            }
        };

        const fetchProductoInfo = async () => {
            if (isEdit) {
                try {
                    const response = await axios.get(`http://127.0.0.1:8000/api/empresa/productos/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    
                    setFormData({
                        nombre: response.data.nombre || '',
                        descripcion: response.data.descripcion || '',
                        precio: response.data.precio || '',
                        stock: response.data.stock !== null ? response.data.stock : 0, // <--- NUEVO: Cargar stock existente
                        categoria_id: response.data.categoria_id || '',
                        imagen: null 
                    });

                    if (response.data.imagen_url) {
                        setPreview(response.data.imagen_url);
                    }
                } catch (error) {
                    console.error("Error al cargar producto:", error.response);
                }
            }
        };

        fetchCategorias();
        fetchProductoInfo();
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const data = new FormData();
        data.append('nombre', formData.nombre);
        data.append('descripcion', formData.descripcion);
        data.append('precio', formData.precio);
        data.append('stock', formData.stock); // <--- NUEVO: Enviar stock al Backend
        data.append('categoria_id', formData.categoria_id);
        
        if (formData.imagen) {
            data.append('imagen', formData.imagen);
        }

        try {
            if (isEdit) {
                data.append('_method', 'PUT'); 
                await axios.post(`http://127.0.0.1:8000/api/empresa/productos/${id}`, data, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                alert('¡Producto actualizado con éxito! ✨');
            } else {
                await axios.post('http://127.0.0.1:8000/api/empresa/productos', data, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                alert('¡Producto publicado con éxito! ☕');
            }
            navigate('/empresa/productos'); 
        } catch (error) {
            console.error("Error al guardar:", error.response?.data);
            alert('Hubo un error al guardar los cambios.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>{isEdit ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                
                <div style={styles.previewContainer}>
                    {preview ? (
                        <img src={preview} alt="Preview" style={styles.previewImage} />
                    ) : (
                        <div style={styles.noImage}>Sin imagen seleccionada</div>
                    )}
                </div>

                <form onSubmit={handleSubmit} style={styles.form}>
                    <input 
                        type="text" 
                        name="nombre" 
                        value={formData.nombre}
                        placeholder="Nombre del producto" 
                        onChange={handleChange} 
                        required 
                        style={styles.input} 
                    />
                    
                    <textarea 
                        name="descripcion" 
                        value={formData.descripcion}
                        placeholder="Descripción breve..." 
                        onChange={handleChange} 
                        style={styles.textarea} 
                    />

                    <div style={styles.row}>
                        <input 
                            type="number" 
                            name="precio" 
                            value={formData.precio}
                            placeholder="Precio ($)" 
                            onChange={handleChange} 
                            required 
                            style={{...styles.input, flex: 1}} 
                        />
                        
                        {/* NUEVO: Input de Stock al lado del precio */}
                        <input 
                            type="number" 
                            name="stock" 
                            value={formData.stock}
                            placeholder="Stock (Cant.)" 
                            onChange={handleChange} 
                            required 
                            min="0"
                            style={{...styles.input, flex: 1}} 
                        />
                    </div>

                    <select 
                        name="categoria_id" 
                        value={formData.categoria_id}
                        onChange={handleChange} 
                        required 
                        style={styles.input}
                    >
                        <option value="">Categoría...</option>
                        {categorias.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                    </select>

                    <label style={styles.fileLabel}>
                        📷 {isEdit ? 'Cambiar foto (opcional)' : 'Subir foto del producto'}
                        <input type="file" onChange={handleFileChange} accept="image/*" style={styles.fileInput} />
                    </label>

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Guardando...' : (isEdit ? 'Actualizar Producto' : 'Crear Producto')}
                    </button>
                    <button type="button" onClick={() => navigate(-1)} style={styles.cancelBtn}>Cancelar</button>
                </form>
            </div>
        </div>
    );
};
const styles = {
    container: { display: 'flex', justifyContent: 'center', padding: '40px', background: '#f8f9fa', minHeight: '100vh' },
    card: { background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '100%', maxWidth: '500px' },
    title: { textAlign: 'center', marginBottom: '20px', color: '#1a1a1a' },
    // Estilos para la vista previa
    previewContainer: { width: '100%', height: '200px', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    previewImage: { width: '100%', height: '100%', objectFit: 'cover' },
    noImage: { color: '#aaa', fontSize: '14px' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' },
    textarea: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px', minHeight: '80px', resize: 'vertical' },
    row: { display: 'flex', gap: '10px' },
    fileLabel: { padding: '15px', border: '2px dashed #6F4E37', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', color: '#6F4E37', fontWeight: 'bold' },
    fileInput: { display: 'none' },
    button: { padding: '15px', background: '#6F4E37', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' },
    cancelBtn: { background: 'none', border: 'none', color: '#999', cursor: 'pointer', marginTop: '5px' }
};

export default AgregarProducto;