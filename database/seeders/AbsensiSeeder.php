<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AbsensiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $karyawanIds = DB::table('karyawans')->pluck('id')->toArray();

        if (empty($karyawanIds)) {
            echo "No Karyawan found to seed Absensi. Please ensure KaryawanSeeder runs first.\n";
            return;
        }

        $absensiData = [];
        $today = Carbon::now();

        foreach ($karyawanIds as $karyawanId) {
            // Seed data for the last 2 days
            for ($i = 0; $i < 2; $i++) {
                $date = $today->copy()->subDays($i);
                $status = (rand(0, 10) < 8) ? 'hadir' : 'absen'; // 80% hadir, 20% absen

                $waktu_masuk = null;
                $waktu_pulang = null;
                $telat_menit = 0;
                $lembur_menit = 0;
                $late_15 = 0;
                $late_30 = 0;
                $late_over30 = 0;

                if ($status === 'hadir') {
                    // Simulate check-in between 08:30 and 09:30
                    $checkinHour = rand(8, 9);
                    $checkinMinute = rand(0, 59);
                    if ($checkinHour === 9 && $checkinMinute > 30) {
                        $checkinMinute = rand(0, 30); // Ensure most check-ins are before 9:30
                    }
                    $waktu_masuk = $date->copy()->setTime($checkinHour, $checkinMinute, rand(0, 59))->format('H:i:s');

                    // Simulate checkout between 17:00 and 19:00
                    $checkoutHour = rand(17, 19);
                    $checkoutMinute = rand(0, 59);
                    $waktu_pulang = $date->copy()->setTime($checkoutHour, $checkoutMinute, rand(0, 59))->format('H:i:s');

                    // Calculate late minutes
                    $workStart = Carbon::parse('09:00:00');
                    $actualCheckin = Carbon::parse($waktu_masuk);
                    if ($actualCheckin->greaterThan($workStart)) {
                        $telat_menit = $actualCheckin->diffInMinutes($workStart);
                        if ($telat_menit > 0 && $telat_menit <= 15) $late_15 = 1;
                        elseif ($telat_menit > 15 && $telat_menit <= 30) $late_30 = 1;
                        elseif ($telat_menit > 30) $late_over30 = 1;
                    }

                    // Calculate lembur minutes (overtime)
                    $workEnd = Carbon::parse('18:00:00');
                    $actualCheckout = Carbon::parse($waktu_pulang);
                    if ($actualCheckout->greaterThan($workEnd)) {
                        $lembur_menit = $actualCheckout->diffInMinutes($workEnd);
                    }
                }

                $absensiData[] = [
                    'karyawan_id' => $karyawanId,
                    'tanggal' => $date->toDateString(),
                    'waktu_masuk' => $waktu_masuk,
                    'waktu_pulang' => $waktu_pulang,
                    'status' => $status,
                    'telat_menit' => $telat_menit,
                    'lembur_menit' => $lembur_menit,
                    'late_15' => $late_15,
                    'late_30' => $late_30,
                    'late_over30' => $late_over30,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }

        DB::table('absensis')->insert($absensiData);
    }
}
