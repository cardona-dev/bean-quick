<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            
            // Relaciones
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Cliente
            $table->foreignId('empresa_id')->constrained()->onDelete('cascade'); // Empresa
            
            // Datos del pedido
            $table->decimal('total', 10, 2);
            $table->time('hora_recogida')->nullable();
            // En el archivo de migración de la tabla pedidos
$table->enum('estado', ['Pendiente', 'Pagado', 'Preparando', 'Listo', 'Entregado', 'Cancelado'])->default('Pendiente');
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedidos');
    }
};
