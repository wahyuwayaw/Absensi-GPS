<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PermohonanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $karyawanIds = DB::table('karyawans')->pluck('id')->toArray();

        if (empty($karyawanIds)) {
            echo "No Karyawan found to seed Permohonan. Please ensure KaryawanSeeder runs first.\n";
            return;
        }

        $permohonanData = [];
        $today = Carbon::now();

        foreach ($karyawanIds as $karyawanId) {
            // Pending Permohonan (e.g., for today or tomorrow)
            $permohonanData[] = [
                'karyawan_id' => $karyawanId,
                'tipe' => 'izin',
                'tanggal_mulai' => $today->copy()->addDays(rand(0, 2))->toDateString(),
                'tanggal_selesai' => $today->copy()->addDays(rand(0, 2))->toDateString(),
                'jam_lembur' => 0,
                'alasan' => 'Izin keperluan keluarga',
                'bukti_path' => null,
                'status' => 'pending',
                'catatan_admin' => null,
                'created_at' => $today->copy()->subDays(rand(1, 3))->toDateTimeString(),
                'updated_at' => $today->copy()->subDays(rand(1, 3))->toDateTimeString(),
            ];
        }

        DB::table('permohonans')->insert($permohonanData);
    }
}
