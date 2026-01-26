<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Empresa extends Model
{
    use HasFactory;

    protected $table = 'empresas';

    protected $fillable = [
        'user_id',
        'nombre',
        'nit',
        'direccion',
        'telefono',
        'descripcion',
        'logo',
        'foto_local',
    ];

    /**
     * Campos que NO se deben ocultar en el JSON
     */
    protected $hidden = [];

    /**
     * Accessors que se agregan automáticamente al JSON
     */
    protected $appends = [
        'logo_url',
        'foto_local_url',
    ];

    // ───────────── Relaciones ─────────────

    public function usuario()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function productos()
    {
        return $this->hasMany(Producto::class, 'empresa_id');
    }

    public function pedidos()
    {
        return $this->hasMany(Pedido::class, 'empresa_id');
    }

    // ───────────── Accessors (URLs públicas) ─────────────

    public function getLogoUrlAttribute()
    {
        if (!$this->logo) {
            return null;
        }

        return asset('storage/' . $this->logo);
    }

    public function getFotoLocalUrlAttribute()
    {
        if (!$this->foto_local) {
            return null;
        }

        return asset('storage/' . $this->foto_local);
    }
}
