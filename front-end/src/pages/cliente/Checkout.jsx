import React, { useState } from 'react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';

const Checkout = ({ carrito, setCarrito }) => {
    const [direccion, setDireccion] = useState('');
    const [enviando, setEnviando] = useState(false);
    const navigate = useNavigate();
    const token = localStorage.getItem('AUTH_TOKEN');

    const total = carrito.reduce((acc, p) => acc + (p.precio * p.cantidad), 0);

    const realizarPedido = async () => {
        if (!direccion) return alert("Por favor ingresa una dirección");
        
        setEnviando(true);
        try {
            await api.post('/api/cliente/pedidos/crear', 
                { direccion },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("¡Pedido enviado a la cafetería! ☕");
            setCarrito([]); // Limpiar carrito en el estado global
            navigate('/cliente/dashboard');
        } catch (error) {
            console.error(error);
            alert("Error al procesar el pedido");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div style={styles.container}>
            <h2>Finalizar Pedido</h2>
            <div style={styles.resumen}>
                {carrito.map(p => (
                    <p key={p.id}>{p.nombre} x {p.cantidad} - ${p.precio * p.cantidad}</p>
                ))}
                <h3>Total: ${total.toLocaleString()}</h3>
            </div>
            
            <input 
                type="text" 
                placeholder="Dirección de entrega" 
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                style={styles.input}
            />
            
            <button 
                onClick={realizarPedido} 
                disabled={enviando || carrito.length === 0}
                style={styles.btn}
            >
                {enviando ? 'Procesando...' : 'Confirmar y Pagar'}
            </button>
        </div>
    );
};

const styles = {
    container: { padding: '40px', maxWidth: '600px', margin: '0 auto' },
    resumen: { background: '#fff', padding: '20px', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #ccc' },
    btn: { width: '100%', padding: '15px', background: '#6f4e37', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Checkout;