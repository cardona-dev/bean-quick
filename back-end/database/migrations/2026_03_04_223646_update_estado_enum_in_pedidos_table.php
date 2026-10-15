<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("
            ALTER TABLE pedidos 
            MODIFY estado ENUM(
                'Pendiente',
                'Pagado',
                'Preparando',
                'Listo',
                'Entregado',
                'Cancelado'
            ) NOT NULL DEFAULT 'Pendiente'
        ");
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("
            ALTER TABLE pedidos 
            MODIFY estado ENUM(
                'Pendiente',
                'Preparando',
                'Listo',
                'Entregado',
                'Cancelado'
            ) NOT NULL DEFAULT 'Pendiente'
        ");
    }
};