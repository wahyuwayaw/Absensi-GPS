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
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            
            // Lokasi & Radius Kantor
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->integer('radius')->default(100); // meter
            
            // Jam Kerja
            $table->time('work_start')->default('08:00:00');
            $table->time('work_end')->default('17:00:00');
            
            // Potongan Telat
            $table->decimal('potongan_telat_15', 10, 2)->default(20000);
            $table->decimal('potongan_telat_30', 10, 2)->default(35000);
            $table->decimal('potongan_tidak_masuk', 10, 2)->default(100000);
            
            // Bonus Lembur
            $table->decimal('bonus_lembur_perjam', 10, 2)->default(50000);
            
            // Gaji Default
            $table->decimal('gaji_default_staff', 10, 2)->default(2000000);
            $table->decimal('gaji_default_kepala_cabang', 10, 2)->default(2500000);
            
            // Tanggal Gajian Default
            $table->integer('tanggal_gajian_default')->default(25);
            
            $table->timestamps();
        });
        
        // Insert default settings
        DB::table('settings')->insert([
            'latitude' => -6.200000,
            'longitude' => 106.816666,
            'radius' => 100,
            'work_start' => '08:00:00',
            'work_end' => '17:00:00',
            'potongan_telat_15' => 20000,
            'potongan_telat_30' => 35000,
            'potongan_tidak_masuk' => 100000,
            'bonus_lembur_perjam' => 50000,
            'gaji_default_staff' => 2000000,
            'gaji_default_kepala_cabang' => 2500000,
            'tanggal_gajian_default' => 25,
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
