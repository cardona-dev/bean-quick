<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Calificacion;

class Producto extends Model
{
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'categoria_id',
        'nombre',
        'descripcion',
        'precio',
        'stock', // <--- Ya está listo aquí
        'imagen',
    ];

    protected $appends = ['imagen_url'];

    /**
     * Casts para asegurar tipos de datos correctos en React
     */
    protected $casts = [
        'precio' => 'float',
        'stock' => 'integer', // <--- Agregamos este para que React no reciba "10" sino 10
    ];

    // --- Métodos de Ayuda (Helpers) ---

    /**
     * Verifica si hay unidades disponibles
     */
    public function estaDisponible(): bool
    {
        return $this->stock > 0;
    }

    // --- Relaciones ---

    public function carritos()
    {
        return $this->belongsToMany(Carrito::class, 'carrito_productos')
                    ->withPivot('cantidad')
                    ->withTimestamps();
    }

    public function calificaciones()
    {
        return $this->hasMany(Calificacion::class);
    }

    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }

    public function categoria() 
    {
        return $this->belongsTo(Categoria::class);
    }

    public function pedidos()
    {
        return $this->belongsToMany(Pedido::class, 'pedido_productos');
    }

    // --- Accessors para React ---

    public function getImagenUrlAttribute()
    {
        return $this->imagen ? asset('storage/' . $this->imagen) : asset('images/placeholder-producto.png');
    }
}