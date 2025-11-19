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
        Schema::create('permohonans', function (Blueprint $t) {
            $t->id();
            $t->foreignId('karyawan_id')->constrained()->cascadeOnDelete();
            $t->enum('tipe',['izin','cuti','lembur']);
            $t->date('tanggal_mulai');
            $t->date('tanggal_selesai')->nullable();
            $t->integer('jam_lembur')->default(0);
            $t->text('alasan')->nullable();
            $t->string('bukti_path')->nullable();
            $t->enum('status',['pending','approved','rejected'])->default('pending');
            $t->text('catatan_admin')->nullable();
            $t->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permohonans');
    }
};
