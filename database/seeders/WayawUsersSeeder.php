<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class WayawUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin wayaw
        if (!DB::table('admins')->where('username', 'wayaw')->exists()) {
            DB::table('admins')->insert([
                'username' => 'wayaw',
                'password' => Hash::make('wayaw'),
                'nama' => 'Admin Wayaw',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "Admin 'wayaw' berhasil dibuat.\n";
        } else {
            echo "Admin 'wayaw' sudah ada. Skip.\n";
        }

        // Create Karyawan wayaw
        if (!DB::table('karyawans')->where('nip', 'wayaw')->exists()) {
            DB::table('karyawans')->insert([
                'nip' => 'wayaw',
                'nama_lengkap' => 'Karyawan Wayaw',
                'jabatan' => 'Staff',
                'departemen' => 'IT',
                'email' => 'wayaw@example.com',
                'password' => Hash::make('wayaw'),
                'foto_wajah' => null,
                'foto_profil' => null,
                'lokasi_terdaftar' => null,
                'tanggal_gabung' => now(),
                'status' => 'aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "Karyawan dengan NIP 'wayaw' berhasil dibuat.\n";
        } else {
            echo "Karyawan dengan NIP 'wayaw' sudah ada. Skip.\n";
        }

        echo "\n=== Data Login ===\n";
        echo "Admin:\n";
        echo "  Username: wayaw\n";
        echo "  Password: wayaw\n";
        echo "\nKaryawan:\n";
        echo "  NIP: wayaw\n";
        echo "  Password: wayaw\n";
        echo "==================\n";
    }
}
