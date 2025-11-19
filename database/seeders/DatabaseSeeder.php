<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Buat 2 Admin
        DB::table('admins')->insert([
            'username' => 'admin',
            'password' => Hash::make('admin'), // Updated password
            'nama' => 'Admin Utama',
        ]);
        DB::table('admins')->insert([
            'username' => 'admin2',
            'password' => Hash::make('password'),
            'nama' => 'Admin Kedua',
        ]);

        // Buat 5 Karyawan
        User::factory()->create([
            'nip' => '11', // Updated NIP
            'nama_lengkap' => 'Karyawan NIP 11',
            'email' => 'karyawan11@example.com',
            'password' => Hash::make('wayaw'),
        ]);
        User::factory()->create([
            'nip' => '456',
            'nama_lengkap' => 'Karyawan NIP 456',
            'email' => 'karyawan456@example.com',
            'password' => Hash::make('wayaw2'),
        ]);
        User::factory(3)->create(); // Create 3 more, totaling 5

        $this->call([
            AbsensiSeeder::class,
            PermohonanSeeder::class,
        ]);
    }
}
