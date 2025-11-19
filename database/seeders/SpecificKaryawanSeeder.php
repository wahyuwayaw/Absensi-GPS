<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SpecificKaryawanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if the NIP already exists to prevent duplicates
        if (!DB::table('karyawans')->where('nip', '123')->exists()) {
            DB::table('karyawans')->insert([
                'nip' => '123',
                'nama_lengkap' => 'Karyawan NIP 123',
                'jabatan' => 'Staff Khusus',
                'departemen' => 'IT',
                'email' => 'karyawan123@example.com',
                'password' => Hash::make('wayaw'),
                'lokasi_terdaftar' => null,
                'tanggal_gabung' => now(),
                'status' => 'aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "Karyawan with NIP 123 created successfully.\n";
        } else {
            echo "Karyawan with NIP 123 already exists. Skipping creation.\n";
        }
    }
}

