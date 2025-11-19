<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller {
  public function rekap(){
    $today = now('Asia/Jakarta')->toDateString();
    $currentMonth = now('Asia/Jakarta')->format('Y-m');

    $totalKaryawan = DB::table('karyawans')->where('status', 'aktif')->count();

    $hadirToday = DB::table('absensis')
        ->where('tanggal', $today)
        ->whereNotNull('waktu_masuk')
        ->count();

    $absenToday = $totalKaryawan - $hadirToday;

    $cutiThisMonth = DB::table('permohonans')
        ->where('tipe', 'cuti')
        ->where('status', 'approved')
        ->where(function ($query) use ($currentMonth) {
            $query->whereRaw("DATE_FORMAT(tanggal_mulai, '%Y-%m') = ?", [$currentMonth])
                  ->orWhereRaw("DATE_FORMAT(tanggal_selesai, '%Y-%m') = ?", [$currentMonth])
                  ->orWhere(function ($query) use ($currentMonth) {
                      $query->whereRaw("DATE_FORMAT(tanggal_mulai, '%Y-%m') < ?", [$currentMonth])
                            ->whereRaw("DATE_FORMAT(tanggal_selesai, '%Y-%m') > ?", [$currentMonth]);
                  });
        })
        ->count();

    return response()->json(['status'=>true,'data'=>[
        'hadir' => $hadirToday,
        'absen' => $absenToday,
        'cuti' => $cutiThisMonth,
        'total_karyawan' => $totalKaryawan,
    ]]);
  }
  public function weekly(){ return response()->json(['status'=>true,'data'=>[5,4,6,6,5,2,1]]); }
  public function today(){
    $today = now('Asia/Jakarta')->toDateString();
    $hadir = DB::table('absensis')->where('tanggal',$today)->whereNotNull('waktu_masuk')->count();
    $absen = DB::table('karyawans')->where('status','aktif')->count() - $hadir; // Hanya hitung karyawan aktif
    return response()->json(['status'=>true,'data'=>compact('hadir','absen')]);
  }
  public function todayKaryawan(Request $r){
    $u = $r->user() ?? session('user');
    $today = now('Asia/Jakarta')->toDateString();
    $row = DB::table('absensis')->where('karyawan_id',$u->id)->where('tanggal',$today)->first();
    return response()->json(['status'=>true,'data'=>$row]);
  }
}