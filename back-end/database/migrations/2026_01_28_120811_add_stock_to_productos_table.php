<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Agregamos la columna stock, por defecto 0 y que no sea negativa
            $table->unsignedInteger('stock')->default(0)->after('precio'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            // Si echamos para atrás la migración, eliminamos la columna
            $table->dropColumn('stock');
        });
    }
};