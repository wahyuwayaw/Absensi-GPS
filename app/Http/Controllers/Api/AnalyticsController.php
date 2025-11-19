<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller {
  
  // Get overview statistics
  public function overview(Request $r) {
    $bulan = (int)$r->input('bulan', now()->month);
    $tahun = (int)$r->input('tahun', now()->year);
    
    // Total karyawan aktif
    $totalKaryawan = DB::table('karyawans')->where('status', 'aktif')->count();
    
    // Kehadiran hari ini
    $hariIni = now()->format('Y-m-d');
    $hadirHariIni = DB::table('absensis')
      ->whereDate('tanggal', $hariIni)
      ->where('status', 'hadir')
      ->count();
    
    $tidakHadirHariIni = $totalKaryawan - $hadirHariIni;
    
    // Kehadiran bulan ini
    $hadirBulanIni = DB::table('absensis')
      ->whereYear('tanggal', $tahun)
      ->whereMonth('tanggal', $bulan)
      ->where('status', 'hadir')
      ->count();
    
    // Cuti/Izin bulan ini
    $cutiIzinBulanIni = DB::table('permohonans')
      ->whereYear('tanggal_mulai', $tahun)
      ->whereMonth('tanggal_mulai', $bulan)
      ->whereIn('tipe', ['cuti', 'izin'])
      ->where('status', 'approved')
      ->count();
    
    // Telat bulan ini
    $telatBulanIni = DB::table('absensis')
      ->whereYear('tanggal', $tahun)
      ->whereMonth('tanggal', $bulan)
      ->where(function($q) {
        $q->where('late_15', 1)
          ->orWhere('late_30', 1)
          ->orWhere('late_over30', 1);
      })
      ->count();
    
    // Lembur bulan ini (total jam)
    $lemburBulanIni = DB::table('absensis')
      ->whereYear('tanggal', $tahun)
      ->whereMonth('tanggal', $bulan)
      ->sum('lembur_menit');
    
    $jamLemburBulanIni = round($lemburBulanIni / 60, 2);
    
    // Average kehadiran rate bulan ini
    $hariKerjaBulanIni = DB::table('absensis')
      ->whereYear('tanggal', $tahun)
      ->whereMonth('tanggal', $bulan)
      ->distinct('tanggal')
      ->count('tanggal');
    
    $kehadiranRate = $hariKerjaBulanIni > 0 
      ? round(($hadirBulanIni / ($totalKaryawan * $hariKerjaBulanIni)) * 100, 2)
      : 0;
    
    return response()->json([
      'status' => true,
      'data' => [
        'total_karyawan' => $totalKaryawan,
        'hadir_hari_ini' => $hadirHariIni,
        'tidak_hadir_hari_ini' => $tidakHadirHariIni,
        'hadir_bulan_ini' => $hadirBulanIni,
        'cuti_izin_bulan_ini' => $cutiIzinBulanIni,
        'telat_bulan_ini' => $telatBulanIni,
        'jam_lembur_bulan_ini' => $jamLemburBulanIni,
        'kehadiran_rate' => $kehadiranRate,
        'bulan' => $bulan,
        'tahun' => $tahun
      ]
    ]);
  }
  
  // Get monthly trend (12 bulan terakhir)
  public function monthlyTrend(Request $r) {
    $data = [];
    
    for ($i = 11; $i >= 0; $i--) {
      $date = now()->subMonths($i);
      $bulan = $date->month;
      $tahun = $date->year;
      
      $hadir = DB::table('absensis')
        ->whereYear('tanggal', $tahun)
        ->whereMonth('tanggal', $bulan)
        ->where('status', 'hadir')
        ->count();
      
      $telat = DB::table('absensis')
        ->whereYear('tanggal', $tahun)
        ->whereMonth('tanggal', $bulan)
        ->where(function($q) {
          $q->where('late_15', 1)
            ->orWhere('late_30', 1)
            ->orWhere('late_over30', 1);
        })
        ->count();
      
      $cuti = DB::table('permohonans')
        ->whereYear('tanggal_mulai', $tahun)
        ->whereMonth('tanggal_mulai', $bulan)
        ->whereIn('tipe', ['cuti', 'izin'])
        ->where('status', 'approved')
        ->count();
      
      $data[] = [
        'month' => $date->format('M Y'),
        'month_num' => $bulan,
        'year' => $tahun,
        'hadir' => $hadir,
        'telat' => $telat,
        'cuti' => $cuti
      ];
    }
    
    return response()->json([
      'status' => true,
      'data' => $data
    ]);
  }
  
  // Get top 10 karyawan telat
  public function topLatest(Request $r) {
    $bulan = (int)$r->input('bulan', now()->month);
    $tahun = (int)$r->input('tahun', now()->year);
    
    $data = DB::table('absensis as a')
      ->join('karyawans as k', 'a.karyawan_id', '=', 'k.id')
      ->select('k.id', 'k.nip', 'k.nama_lengkap', 'k.jabatan')
      ->selectRaw('
        SUM(a.late_15) as telat_15,
        SUM(a.late_30) as telat_30,
        SUM(a.late_over30) as telat_over30,
        (SUM(a.late_15) + SUM(a.late_30) + SUM(a.late_over30)) as total_telat
      ')
      ->whereYear('a.tanggal', $tahun)
      ->whereMonth('a.tanggal', $bulan)
      ->groupBy('k.id', 'k.nip', 'k.nama_lengkap', 'k.jabatan')
      ->having('total_telat', '>', 0)
      ->orderByDesc('total_telat')
      ->limit(10)
      ->get();
    
    return response()->json([
      'status' => true,
      'data' => $data
    ]);
  }
  
  // Get department statistics
  public function departmentStats(Request $r) {
    $bulan = (int)$r->input('bulan', now()->month);
    $tahun = (int)$r->input('tahun', now()->year);
    
    $data = DB::table('karyawans as k')
      ->leftJoin('absensis as a', function($join) use ($bulan, $tahun) {
        $join->on('k.id', '=', 'a.karyawan_id')
             ->whereYear('a.tanggal', '=', $tahun)
             ->whereMonth('a.tanggal', '=', $bulan);
      })
      ->select('k.departemen')
      ->selectRaw('
        COUNT(DISTINCT k.id) as total_karyawan,
        COUNT(CASE WHEN a.status = "hadir" THEN 1 END) as total_hadir,
        SUM(a.lembur_menit) as total_lembur_menit
      ')
      ->where('k.status', 'aktif')
      ->groupBy('k.departemen')
      ->get();
    
    // Transform data
    $result = $data->map(function($item) {
      $jamLembur = $item->total_lembur_menit ? round($item->total_lembur_menit / 60, 2) : 0;
      return [
        'departemen' => $item->departemen ?: 'Tidak Ada Departemen',
        'total_karyawan' => $item->total_karyawan,
        'total_hadir' => $item->total_hadir,
        'jam_lembur' => $jamLembur
      ];
    });
    
    return response()->json([
      'status' => true,
      'data' => $result
    ]);
  }
  
  // Get payroll summary
  public function payrollSummary(Request $r) {
    $bulan = (int)$r->input('bulan', now()->month);
    $tahun = (int)$r->input('tahun', now()->year);
    
    $summary = DB::table('payrolls')
      ->where('bulan', $bulan)
      ->where('tahun', $tahun)
      ->selectRaw('
        COUNT(*) as total_processed,
        SUM(gaji_pokok) as total_gaji_pokok,
        SUM(potongan_telat) as total_potongan,
        SUM(bonus_lembur) as total_bonus,
        SUM(total_gaji) as total_gaji_bersih
      ')
      ->first();
    
    return response()->json([
      'status' => true,
      'data' => $summary ?: [
        'total_processed' => 0,
        'total_gaji_pokok' => 0,
        'total_potongan' => 0,
        'total_bonus' => 0,
        'total_gaji_bersih' => 0
      ]
    ]);
  }
}
