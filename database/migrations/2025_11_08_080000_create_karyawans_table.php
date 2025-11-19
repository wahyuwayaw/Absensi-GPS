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
        Schema::create('karyawans', function (Blueprint $t) {
            $t->id();
            $t->string('nip',20)->unique();
            $t->string('nama_lengkap');
            $t->string('jabatan')->nullable();
            $t->string('departemen')->nullable();
            $t->string('email')->nullable();
            $t->string('password');
            $t->string('foto_wajah')->nullable();
            $t->string('foto_profil')->nullable();
            $t->string('lokasi_terdaftar')->nullable();
            $t->date('tanggal_gabung')->nullable();
            $t->enum('status',['aktif','nonaktif'])->default('aktif');
            $t->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('karyawans');
    }
};
