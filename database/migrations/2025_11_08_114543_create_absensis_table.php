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
        Schema::create('absensis', function (Blueprint $t) {
            $t->id();
            $t->foreignId('karyawan_id')->constrained()->cascadeOnDelete();
            $t->date('tanggal');
            $t->time('waktu_masuk')->nullable();
            $t->time('waktu_pulang')->nullable();
            $t->integer('telat_menit')->default(0);
            $t->integer('lembur_menit')->default(0);
            $t->enum('status',['hadir','absen','izin','cuti'])->default('hadir');
            // optional cache bucket agar rekap cepat
            $t->boolean('late_15')->default(false);
            $t->boolean('late_30')->default(false);
            $t->boolean('late_over30')->default(false);
            $t->timestamps();
            $t->unique(['karyawan_id','tanggal']);
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('absensis');
    }
};
