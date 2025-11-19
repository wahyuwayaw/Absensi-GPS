<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AbsensiSystemTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Buat admin & karyawan dummy
        DB::table('admins')->insert([
            'id' => 1,
            'username' => 'admin',
            'nama' => 'Super Admin',
            'password' => Hash::make('admin123'),
            'created_at' => now(),
            'updated_at' => now()
        ]);

        DB::table('karyawans')->insert([
            'id' => 1,
            'nip' => 'EMP001',
            'nama_lengkap' => 'Wahyu Sugiarto',
            'jabatan' => 'IT Support',
            'departemen' => 'Teknologi',
            'email' => 'wahyu@example.com',
            'password' => Hash::make('123456'),
            'status' => 'aktif',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /** @test */
    public function admin_can_login_successfully()
    {
        $response = $this->postJson('/api/login', [
            'role' => 'admin',
            'username' => 'admin',
            'password' => 'admin123'
        ]);

        $response->assertStatus(200)
                 ->assertJson(['status' => true]);
    }

    /** @test */
    public function karyawan_can_login_successfully()
    {
        $response = $this->postJson('/api/login', [
            'role' => 'karyawan',
            'username' => 'EMP001',
            'password' => '123456'
        ]);

        $response->assertStatus(200)
                 ->assertJson(['status' => true]);
    }

    /** @test */
    public function admin_can_fetch_dashboard_data()
    {
        // login dulu
        $this->withSession([
            'user' => ['role' => 'admin', 'id' => 1, 'username' => 'admin']
        ]);

        $response = $this->getJson('/api/dashboard/rekap');
        $response->assertStatus(200)
                 ->assertJson(['status' => true]);
    }

    /** @test */
    public function karyawan_can_checkin_and_checkout()
    {
        $this->withSession([
            'user' => ['role' => 'karyawan', 'id' => 1, 'nip' => 'EMP001']
        ]);

        // Check-in
        $checkin = $this->postJson('/api/absensi/checkin', [
            'lat' => -6.244035,
            'lng' => 106.690876
        ]);

        $checkin->assertStatus(200)
                ->assertJson(['status' => true]);

        // Check-out
        $checkout = $this->postJson('/api/absensi/checkout', [
            'lat' => -6.244035,
            'lng' => 106.690876
        ]);

        $checkout->assertStatus(200)
                 ->assertJson(['status' => true]);
    }

    /** @test */
    public function admin_can_access_karyawan_list()
    {
        $this->withSession([
            'user' => ['role' => 'admin', 'id' => 1, 'username' => 'admin']
        ]);

        $response = $this->getJson('/api/karyawan');
        $response->assertStatus(200)
                 ->assertJson(['status' => true]);
    }

    /** @test */
    public function karyawan_can_submit_permohonan_izin()
    {
        $this->withSession([
            'user' => ['role' => 'karyawan', 'id' => 1, 'nip' => 'EMP001']
        ]);

        $response = $this->postJson('/api/karyawan/permohonan', [
            'tipe' => 'izin',
            'tanggal_mulai' => now()->toDateString(),
            'alasan' => 'Sakit ringan'
        ]);

        $response->assertStatus(200)
                 ->assertJson(['status' => true]);
    }
}
