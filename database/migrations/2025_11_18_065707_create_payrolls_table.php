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
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('karyawan_id');
            $table->integer('bulan'); // 1-12
            $table->integer('tahun'); // 2025, etc
            $table->decimal('gaji_pokok', 10, 2)->default(0); // Gaji dasar
            $table->integer('total_hadir')->default(0);
            $table->integer('total_telat_15')->default(0); // Telat 15 menit
            $table->integer('total_telat_30')->default(0); // Telat 30 menit
            $table->integer('total_tidak_masuk')->default(0); // Telat > 1 jam
            $table->decimal('potongan_telat', 10, 2)->default(0); // Total potongan
            $table->integer('jam_lembur')->default(0); // Total jam lembur
            $table->decimal('bonus_lembur', 10, 2)->default(0); // 50rb per jam
            $table->decimal('total_gaji', 10, 2)->default(0); // Gaji bersih
            $table->date('tanggal_gajian')->nullable(); // Tanggal pembayaran
            $table->enum('status', ['pending', 'paid'])->default('pending');
            $table->timestamps();
            
            $table->foreign('karyawan_id')->references('id')->on('karyawans')->onDelete('cascade');
            $table->unique(['karyawan_id', 'bulan', 'tahun']); // Prevent duplicate
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
