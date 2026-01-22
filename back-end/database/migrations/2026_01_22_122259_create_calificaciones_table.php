<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::create('calificaciones', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->foreignId('pedido_id')->constrained()->onDelete('cascade');
        $table->foreignId('producto_id')->constrained()->onDelete('cascade'); // Si quieres calificar por producto
        $table->integer('estrellas')->comment('Del 1 al 5');
        $table->text('comentario')->nullable();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calificaciones');
    }
};
