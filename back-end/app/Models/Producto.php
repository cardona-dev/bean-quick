<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    use HasFactory;

    protected $fillable = [
        'empresa_id',
        'categoria_id',
        'nombre',
        'descripcion',
        'precio',
        'imagen',
    ];

    // Esto añade automáticamente la URL de la imagen al JSON enviado a React
    protected $appends = ['imagen_url'];

    /**
     * Casts para asegurar tipos de datos correctos en React
     */
    protected $casts = [
        'precio' => 'float',
    ];

    // --- Relaciones ---

    /**
     * Relación: un producto puede estar en muchos carritos
     */
    public function carritos()
    {
        return $this->belongsToMany(Carrito::class, 'carrito_productos')
                    ->withPivot('cantidad')
                    ->withTimestamps();
    }
public function calificaciones()
{
    // Esto le dice a Laravel que un producto tiene muchas calificaciones
    return $this->hasMany(Calificacion::class);
}
    /**
     * Relación: un producto pertenece a una empresa
     */public function empresa()
{
    return $this->belongsTo(Empresa::class, 'empresa_id');
}
    public function categoria() {
    return $this->belongsTo(Categoria::class);
    }
    // --- Accessors para React ---

    /**
     * Genera la URL completa para la imagen del producto
     */
    public function getImagenUrlAttribute()
    {
        return $this->imagen ? asset('storage/' . $this->imagen) : asset('images/placeholder-producto.png');
    }
}