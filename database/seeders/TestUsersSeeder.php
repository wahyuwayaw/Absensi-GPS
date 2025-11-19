<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "=== Creating Test Admin Accounts ===\n\n";
        
        // Admin test
        if (!DB::table('admins')->where('username', 'admin')->exists()) {
            DB::table('admins')->insert([
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'nama' => 'Admin Test',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "✅ Admin 'admin' berhasil dibuat\n";
        } else {
            echo "⚠️  Admin 'admin' sudah ada. Skip.\n";
        }

        // Admin super
        if (!DB::table('admins')->where('username', 'superadmin')->exists()) {
            DB::table('admins')->insert([
                'username' => 'superadmin',
                'password' => Hash::make('super123'),
                'nama' => 'Super Admin',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "✅ Admin 'superadmin' berhasil dibuat\n";
        } else {
            echo "⚠️  Admin 'superadmin' sudah ada. Skip.\n";
        }

        echo "\n=== Creating Test Karyawan Accounts ===\n\n";

        // Karyawan 1
        if (!DB::table('karyawans')->where('nip', 'KRY001')->exists()) {
            DB::table('karyawans')->insert([
                'nip' => 'KRY001',
                'nama_lengkap' => 'Budi Santoso',
                'jabatan' => 'Staff IT',
                'departemen' => 'IT',
                'email' => 'budi@example.com',
                'password' => Hash::make('budi123'),
                'foto_wajah' => null,
                'foto_profil' => null,
                'lokasi_terdaftar' => null,
                'tanggal_gabung' => now(),
                'status' => 'aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "✅ Karyawan 'KRY001 - Budi Santoso' berhasil dibuat\n";
        } else {
            echo "⚠️  Karyawan 'KRY001' sudah ada. Skip.\n";
        }

        // Karyawan 2
        if (!DB::table('karyawans')->where('nip', 'KRY002')->exists()) {
            DB::table('karyawans')->insert([
                'nip' => 'KRY002',
                'nama_lengkap' => 'Siti Nurhaliza',
                'jabatan' => 'Staff Marketing',
                'departemen' => 'Marketing',
                'email' => 'siti@example.com',
                'password' => Hash::make('siti123'),
                'foto_wajah' => null,
                'foto_profil' => null,
                'lokasi_terdaftar' => null,
                'tanggal_gabung' => now(),
                'status' => 'aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "✅ Karyawan 'KRY002 - Siti Nurhaliza' berhasil dibuat\n";
        } else {
            echo "⚠️  Karyawan 'KRY002' sudah ada. Skip.\n";
        }

        // Karyawan 3
        if (!DB::table('karyawans')->where('nip', 'KRY003')->exists()) {
            DB::table('karyawans')->insert([
                'nip' => 'KRY003',
                'nama_lengkap' => 'Ahmad Fauzi',
                'jabatan' => 'Supervisor HRD',
                'departemen' => 'HRD',
                'email' => 'ahmad@example.com',
                'password' => Hash::make('ahmad123'),
                'foto_wajah' => null,
                'foto_profil' => null,
                'lokasi_terdaftar' => null,
                'tanggal_gabung' => now(),
                'status' => 'aktif',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            echo "✅ Karyawan 'KRY003 - Ahmad Fauzi' berhasil dibuat\n";
        } else {
            echo "⚠️  Karyawan 'KRY003' sudah ada. Skip.\n";
        }

        echo "\n=== Data Login Test Accounts ===\n\n";
        echo "┌─────────────────────────────────────────────────────────┐\n";
        echo "│                    ADMIN ACCOUNTS                       │\n";
        echo "├─────────────────────────────────────────────────────────┤\n";
        echo "│ 1. Username: admin          Password: admin123         │\n";
        echo "│    Nama: Admin Test                                     │\n";
        echo "│                                                         │\n";
        echo "│ 2. Username: superadmin     Password: super123         │\n";
        echo "│    Nama: Super Admin                                    │\n";
        echo "│                                                         │\n";
        echo "│ 3. Username: wayaw          Password: wayaw            │\n";
        echo "│    Nama: Admin Wayaw                                    │\n";
        echo "└─────────────────────────────────────────────────────────┘\n\n";
        
        echo "┌─────────────────────────────────────────────────────────┐\n";
        echo "│                  KARYAWAN ACCOUNTS                      │\n";
        echo "├─────────────────────────────────────────────────────────┤\n";
        echo "│ 1. NIP: KRY001              Password: budi123          │\n";
        echo "│    Nama: Budi Santoso                                   │\n";
        echo "│    Jabatan: Staff IT                                    │\n";
        echo "│                                                         │\n";
        echo "│ 2. NIP: KRY002              Password: siti123          │\n";
        echo "│    Nama: Siti Nurhaliza                                 │\n";
        echo "│    Jabatan: Staff Marketing                             │\n";
        echo "│                                                         │\n";
        echo "│ 3. NIP: KRY003              Password: ahmad123         │\n";
        echo "│    Nama: Ahmad Fauzi                                    │\n";
        echo "│    Jabatan: Supervisor HRD                              │\n";
        echo "│                                                         │\n";
        echo "│ 4. NIP: wayaw               Password: wayaw            │\n";
        echo "│    Nama: Karyawan Wayaw                                 │\n";
        echo "│    Jabatan: Staff IT                                    │\n";
        echo "└─────────────────────────────────────────────────────────┘\n\n";
    }
}
