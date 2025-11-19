<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdditionalUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create another Admin
        if (!DB::table('admins')->where('username', 'admin2')->exists()) {
            DB::table('admins')->insert([
                'username' => 'admin2',
                'password' => Hash::make('password'),
                'nama' => 'Admin Kedua',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "Admin 'admin2' created successfully.\n";
        } else {
            echo "Admin 'admin2' already exists. Skipping creation.\n";
        }

        // Create another Karyawan
        if (!DB::table('karyawans')->where('nip', '456')->exists()) {
            DB::table('karyawans')->insert([
                'nip' => '456',
                'nama_lengkap' => 'Karyawan NIP 456',
                'jabatan' => 'Staff Marketing',
                'departemen' => 'Marketing',
                'email' => 'karyawan456@example.com',
                'password' => Hash::make('wayaw2'),
                'lokasi_terdaftar' => null,
                'tanggal_gabung' => now(),
                'status' => 'aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "Karyawan with NIP 456 created successfully.\n";
        } else {
            echo "Karyawan with NIP 456 already exists. Skipping creation.\n";
        }
    }
}
