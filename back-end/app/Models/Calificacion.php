<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Calificacion extends Model
{
    use HasFactory;

    // Nombre de la tabla (opcional si sigue la convención)
    protected $table = 'calificaciones';

    protected $fillable = [
        'user_id',
        'pedido_id',
        'producto_id',
        'estrellas',
        'comentario'
    ];

    /**
     * Relación: Una calificación pertenece a un usuario.
     */
    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relación: Una calificación pertenece a un producto.
     */
    public function producto()
    {
        return $this->belongsTo(Producto::class);
    }

    /**
     * Relación: Una calificación pertenece a un pedido.
     */
    public function pedido()
    {
        return $this->belongsTo(Pedido::class);
    }
}