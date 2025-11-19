<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB; // <-- BARIS INI TAMBAHAN WAJIB
use Barryvdh\DomPDF\Facade\Pdf;

class PayrollController extends Controller {
  
  // Hitung gaji bulanan dan simpan ke database
  public function calculateMonthly(Request $r) {
    $kid = (int)($r->input('karyawan_id') ?? $r->user()->id);
    $bulan = (int)$r->input('bulan', now()->month);
    $tahun = (int)$r->input('tahun', now()->year);
    
    // Ambil data karyawan
    $karyawan = DB::table('karyawans')->where('id', $kid)->first();
    if (!$karyawan) {
      return response()->json(['status'=>false,'message'=>'Karyawan tidak ditemukan'], 404);
    }
    
    // Ambil rekap absensi bulan ini
    $rekap = DB::table('absensis as a')
        ->where('karyawan_id', $kid)
        ->whereYear('a.tanggal', $tahun)
        ->whereMonth('a.tanggal', $bulan)
        ->selectRaw('
          SUM(CASE WHEN a.status="hadir" THEN 1 ELSE 0 END) as total_hadir,
          SUM(a.late_15) as telat_15,
          SUM(a.late_30) as telat_30,
          SUM(a.late_over30) as tidak_masuk,
          SUM(a.lembur_menit) as total_lembur_menit
        ')
        ->first();
    
    $total_hadir = $rekap->total_hadir ?? 0;
    $telat_15 = $rekap->telat_15 ?? 0;
    $telat_30 = $rekap->telat_30 ?? 0;
    $tidak_masuk = $rekap->tidak_masuk ?? 0;
    $total_lembur_menit = $rekap->total_lembur_menit ?? 0;
    
    // Get settings from database
    $settings = DB::table('settings')->first();
    $rate_telat_15 = $settings ? $settings->potongan_telat_15 : 20000;
    $rate_telat_30 = $settings ? $settings->potongan_telat_30 : 35000;
    $rate_lembur = $settings ? $settings->bonus_lembur_perjam : 50000;
    
    // Hitung gaji berdasarkan hari kerja (Gaji Pokok ÷ 30 hari)
    $gaji_pokok = $karyawan->gaji_pokok;
    $gaji_per_hari = $gaji_pokok / 30;
    $gaji_dari_kehadiran = $total_hadir * $gaji_per_hari;
    
    // Hitung potongan telat (HANYA untuk yang hadir tapi telat)
    $potongan_telat = ($telat_15 * $rate_telat_15) + ($telat_30 * $rate_telat_30);
    
    // Potongan tidak masuk OTOMATIS = Gaji Per Hari × Jumlah Tidak Masuk
    // Ini untuk telat >1 jam yang dihitung tidak masuk (late_over30)
    $potongan_tidak_masuk = $tidak_masuk * $gaji_per_hari;
    
    // Hitung bonus lembur
    $jam_lembur = round($total_lembur_menit / 60, 2);
    $bonus_lembur = $jam_lembur * $rate_lembur;
    
    // Total gaji = Gaji dari kehadiran - Potongan telat - Potongan tidak masuk + Bonus lembur
    $total_gaji = $gaji_dari_kehadiran - $potongan_telat - $potongan_tidak_masuk + $bonus_lembur;
    
    // Simpan atau update ke database
    DB::table('payrolls')->updateOrInsert(
      ['karyawan_id' => $kid, 'bulan' => $bulan, 'tahun' => $tahun],
      [
        'gaji_pokok' => $gaji_pokok,
        'total_hadir' => $total_hadir,
        'total_telat_15' => $telat_15,
        'total_telat_30' => $telat_30,
        'total_tidak_masuk' => $tidak_masuk,
        'potongan_telat' => $potongan_telat,
        'jam_lembur' => $jam_lembur,
        'bonus_lembur' => $bonus_lembur,
        'total_gaji' => $total_gaji,
        'updated_at' => now()
      ]
    );
    
    return response()->json([
      'status' => true,
      'data' => [
        'bulan' => $bulan,
        'tahun' => $tahun,
        'gaji_pokok' => $gaji_pokok,
        'gaji_per_hari' => $gaji_per_hari,
        'gaji_dari_kehadiran' => $gaji_dari_kehadiran,
        'total_hadir' => $total_hadir,
        'telat_15' => $telat_15,
        'telat_30' => $telat_30,
        'tidak_masuk' => $tidak_masuk,
        'potongan_telat' => $potongan_telat,
        'potongan_tidak_masuk' => $potongan_tidak_masuk,
        'jam_lembur' => $jam_lembur,
        'bonus_lembur' => $bonus_lembur,
        'total_gaji' => $total_gaji
      ]
    ]);
  }
  
  // Get payroll history untuk karyawan (untuk tampil di dashboard)
  public function getPayroll(Request $r) {
    $kid = $r->user()->id;
    $bulan = (int)$r->input('bulan', now()->month);
    $tahun = (int)$r->input('tahun', now()->year);
    
    $payroll = DB::table('payrolls')
      ->where('karyawan_id', $kid)
      ->where('bulan', $bulan)
      ->where('tahun', $tahun)
      ->first();
    
    if (!$payroll) {
      return response()->json(['status'=>false,'message'=>'Data gaji belum tersedia'], 404);
    }
    
    return response()->json(['status'=>true,'data'=>$payroll]);
  }
  
  // Get payroll history (bulan ini dan sebelumnya)
  public function getHistory(Request $r) {
    $kid = $r->user()->id;
    
    $history = DB::table('payrolls')
      ->where('karyawan_id', $kid)
      ->orderByDesc('tahun')
      ->orderByDesc('bulan')
      ->limit(3)
      ->get();
    
    return response()->json(['status'=>true,'data'=>$history]);
  }
  
  public function calc(Request $r){
    $kid=(int)$r->query('karyawan_id'); $month=$r->query('month', now()->format('Y-m'));
    
    // Ambil data absensi untuk perhitungan real
    $rekap = DB::table('absensis as a')
        ->where('karyawan_id', $kid)
        ->whereYear('a.tanggal', explode('-', $month)[0])
        ->whereMonth('a.tanggal', explode('-', $month)[1])
        ->selectRaw('SUM(CASE WHEN a.status="hadir" THEN 1 ELSE 0 END) as hadir,
                     SUM(a.lembur_menit)/60 as lembur_jam,
                     SUM(a.late_15) as t15,
                     SUM(a.late_30) as t30,
                     SUM(a.late_over30) as t30p')
        ->first();
    
    $hadir = $rekap->hadir ?? 0;
    $lembur_jam = $rekap->lembur_jam ?? 0;
    $t15 = $rekap->t15 ?? 0;
    $t30 = $rekap->t30 ?? 0;
    $t30p = $rekap->t30p ?? 0;

    $OVT=(int)env('OVERTIME_RATE',55000); $L15=(int)env('LATE_15_PENALTY',0); $L30=(int)env('LATE_30_PENALTY',20000); $L30P=(int)env('LATE_OVER30_PENALTY',35000);
    
    $pot=$t15*$L15+$t30*$L30+$t30p*$L30P; 
    $lembur=$lembur_jam*$OVT; 
    $gaji_pokok=3000000; 
    $take_home=$gaji_pokok-$pot+$lembur;
    
    // Ambil detail karyawan
    $karyawan = DB::table('karyawans')->where('id', $kid)->first();

    return response()->json(['status'=>true,'data'=>compact('month', 'karyawan', 'hadir','lembur_jam','pot','lembur','gaji_pokok','take_home')]);
  }
  
  public function slipPdf(Request $r){
    $calc = $this->calc($r)->getData(true)['data'];
    $html = view('pdf.slip',compact('calc'))->render(); 
    return Pdf::loadHTML($html)->setPaper('a4','portrait')->download('slip.pdf');
  }
}