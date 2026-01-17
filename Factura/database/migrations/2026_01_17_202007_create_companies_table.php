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
        Schema::create('companies', function (Blueprint $table) {
            $table->id('id_company');
            $table->string('razon_social', 100);
            $table->string('ruc', 11)->unique();
            $table->string('direccion', 255);
            $table->string('logo_url', 255)->nullable();
            $table->string('sol_user', 50);
            $table->string('sol_pass', 50);
            $table->string('cert_path', 255);
            $table->string('client_id', 50)->nullable();
            $table->string('client_secret', 50)->nullable();
            $table->boolean('production')->default(false);
            $table->string('reniec_api_key', 255)->nullable();
            $table->integer('id_user');
            $table->timestamp('creado_en')->useCurrent();
            $table->timestamp('actualizado_en')->useCurrent()->useCurrentOnUpdate();

            // Indexes
            $table->index('id_user');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('companies');
    }
};
