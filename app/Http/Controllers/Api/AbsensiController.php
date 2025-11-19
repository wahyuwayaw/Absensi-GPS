<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Api\FaceController; // Added
use Rap2hpoutre\FastExcel\FastExcel; // Added for Excel export

class AbsensiController extends Controller {
  public function index(Request $r){
    $q = DB::table('absensis as a')->join('karyawans as k','k.id','=','a.karyawan_id')
      ->select('a.*','k.nip','k.nama_lengkap');

    if($r->filled('from')) $q->where('a.tanggal','>=',$r->input('from'));
    if($r->filled('to'))   $q->where('a.tanggal','<=',$r->input('to'));
    if($s = $r->input('q')) $q->where(function($qq)use($s){ $qq->where('k.nip','like',"%$s%")->orWhere('k.nama_lengkap','like',"%$s%"); });

    $rows = $q->orderByDesc('a.tanggal')->paginate(20);
    return response()->json(['status'=>true,'data'=>$rows]);
  }

  public function exportCsv(Request $r){
    $rows = $this->fetchRows($r)->get();
    $csv = implode(",",['Tanggal','NIP','Nama','Masuk','Pulang','Status'])."\n";
    foreach($rows as $x){
      $csv .= implode(",",[$x->tanggal,$x->nip,$x->nama_lengkap,$x->waktu_masuk,$x->waktu_pulang,strtoupper($x->status)])."\n";
    }
    return response($csv,200,['Content-Type'=>'text/csv','Content-Disposition'=>'attachment; filename="absensi.csv"']);
  }

  public function exportPdf(Request $r){
    $rows = $this->fetchRows($r)->get();
    $html = view('pdf.absensi',compact('rows'))->render(); 
    $pdf = Pdf::loadHTML($html)->setPaper('a4','portrait');
    return $pdf->download('absensi.pdf');
  }

  public function exportExcel(Request $r){
    $rows = $this->fetchRows($r)->get();
    
    // Transform data untuk Excel
    $data = $rows->map(function($row) {
      return [
        'Tanggal' => $row->tanggal,
        'NIP' => $row->nip,
        'Nama Lengkap' => $row->nama_lengkap,
        'Waktu Masuk' => $row->waktu_masuk ?? '-',
        'Waktu Pulang' => $row->waktu_pulang ?? '-',
        'Status' => strtoupper($row->status),
        'Telat (menit)' => $row->telat_menit ?? 0,
        'Lembur (menit)' => $row->lembur_menit ?? 0,
      ];
    });
    
    $filename = 'absensi_' . now()->format('Y-m-d_His') . '.xlsx';
    return (new FastExcel($data))->download($filename);
  }

  private function fetchRows(Request $r){
    $q = DB::table('absensis as a')->join('karyawans as k','k.id','=','a.karyawan_id')
      ->select('a.*','k.nip','k.nama_lengkap');
    if($r->filled('from')) $q->where('a.tanggal','>=',$r->input('from'));
    if($r->filled('to'))   $q->where('a.tanggal','<=',$r->input('to'));
    if($s = $r->input('q')) $q->where(function($qq)use($s){ $qq->where('k.nip','like',"%$s%")->orWhere('k.nama_lengkap','like',"%$s%"); });
    return $q->orderByDesc('a.tanggal');
  }

  public function rekapBulanan(Request $r){
    $month = $r->input('month', now()->format('Y-m'));
    [$y,$m] = explode('-',$month);
    
    \Log::info('rekapBulanan called', ['month' => $month, 'year' => $y, 'month_num' => $m]);
    
    $rows = DB::table('absensis as a')
      ->join('karyawans as k','k.id','=','a.karyawan_id')
      ->selectRaw('k.id as karyawan_id, k.nip, k.nama_lengkap,
        COUNT(*) as total_hari,
        SUM(CASE WHEN a.status="hadir" THEN 1 ELSE 0 END) as total_hadir,
        SUM(a.lembur_menit)/60 as lembur_jam,
        SUM(a.late_15) as telat_15,
        SUM(a.late_30) as telat_30,
        SUM(a.late_over30) as telat_over30')
      ->whereYear('a.tanggal',$y)->whereMonth('a.tanggal',$m)
      ->groupBy('k.id','k.nip','k.nama_lengkap')
      ->paginate(20); // Changed from ->get() to ->paginate(20)
    return response()->json(['status'=>true,'data'=>$rows]);
  }

  public function checkin(Request $r){
    $u = $r->user(); $now = now('Asia/Jakarta');
    $today = $now->toDateString(); $time = $now->format('H:i:s');

    // Validate image data for face recognition and GPS coordinates
    $r->validate([
        'image' => 'required|string', // Base64 encoded image
        'lat' => 'required|numeric',
        'lng' => 'required|numeric',
    ]);

    // Geofence check with backend validation
    [$ok,$telat,$distance] = $this->withinGeofenceAndLate($r,$time);
    if(!$ok) {
        return response()->json([
            'status'=>false,
            'message'=>"Anda berada di luar radius kantor. Jarak Anda: ".round($distance)." meter"
        ],422);
    }

    // Face verification - DISABLED FOR TESTING
    // TODO: Enable this when face recognition is ready
    /*
    $faceController = new FaceController();
    // Create a new Request instance for the FaceController, passing the necessary data
    $faceVerificationRequest = Request::create('/api/face/login', 'POST', [
        'id' => $u->id, // Pass employee ID for verification
        'image' => $r->input('image'),
    ]);
    $faceVerificationResponse = $faceController->loginByFace($faceVerificationRequest);
    $faceVerificationData = $faceVerificationResponse->getData();

    if (!isset($faceVerificationData->status) || !$faceVerificationData->status) {
        return response()->json(['status'=>false,'message'=>'Verifikasi wajah gagal: ' . ($faceVerificationData->message ?? 'Wajah tidak dikenali.')],401);
    }
    */
    
    // TEMPORARY: Skip face verification for testing
    \Log::info('Face verification SKIPPED (disabled for testing)', ['user_id' => $u->id]);

    DB::table('absensis')->updateOrInsert(
      ['karyawan_id'=>$u->id,'tanggal'=>$today],
      ['waktu_masuk'=>$time,'status'=>'hadir','foto_masuk' => $r->input('image'),'updated_at'=>now()]
    );

    // hitung bucket keterlambatan
    $this->updateLateBuckets($u->id,$today,$time);

    return response()->json(['status'=>true]);
  }

  public function checkout(Request $r){
    $u = $r->user(); $now = now('Asia/Jakarta');
    $today = $now->toDateString(); $time = $now->format('H:i:s');

    // Validate image data for face recognition and GPS coordinates
    $r->validate([
        'image' => 'required|string', // Base64 encoded image
        'lat' => 'required|numeric',
        'lng' => 'required|numeric',
    ]);

    // Geofence check (optional for checkout, but good for consistency)
    [$ok,$telat,$distance] = $this->withinGeofenceAndLate($r,$time);
    if(!$ok) {
        return response()->json([
            'status'=>false,
            'message'=>"Anda berada di luar radius kantor. Jarak Anda: ".round($distance)." meter"
        ],422);
    }

    // Face verification - DISABLED FOR TESTING
    // TODO: Enable this when face recognition is ready
    /*
    $faceController = new FaceController();
    $faceVerificationRequest = Request::create('/api/face/login', 'POST', [
        'id' => $u->id, // Pass employee ID for verification
        'image' => $r->input('image'),
    ]);
    $faceVerificationResponse = $faceController->loginByFace($faceVerificationRequest);
    $faceVerificationData = $faceVerificationResponse->getData();

    if (!isset($faceVerificationData->status) || !$faceVerificationData->status) {
        return response()->json(['status'=>false,'message'=>'Verifikasi wajah gagal: ' . ($faceVerificationData->message ?? 'Wajah tidak dikenali.')],401);
    }
    */
    
    // TEMPORARY: Skip face verification for testing
    \Log::info('Face verification SKIPPED (disabled for testing) - checkout', ['user_id' => $u->id]);

    $OFF_END = config('absensi.work_end');
    $lembur = max(0, (strtotime($time)-strtotime($OFF_END))/60); // menit
    DB::table('absensis')->where(['karyawan_id'=>$u->id,'tanggal'=>$today])
      ->update(['waktu_pulang'=>$time,'lembur_menit'=>$lembur, 'foto_pulang' => $r->input('image'), 'updated_at'=>now()]);
    return response()->json(['status'=>true]);
  }

  public function riwayat(Request $r){
    $u = $r->user();
    $days = (int)$r->query('days',30);
    $from = now('Asia/Jakarta')->subDays($days)->toDateString();
    $rows = DB::table('absensis')->where('karyawan_id',$u->id)
      ->where('tanggal','>=',$from)->orderByDesc('tanggal')->get();
    return response()->json(['status'=>true,'data'=>$rows]);
  }

  private function withinGeofenceAndLate(Request $r, string $time): array {
    $lat=(float)$r->input('lat',0); $lng=(float)$r->input('lng',0);
    
    // Get office location from settings database
    $settings = DB::table('settings')->first();
    $OFF_LAT = $settings ? (float)$settings->latitude : (float)config('absensi.office_latitude'); 
    $OFF_LNG = $settings ? (float)$settings->longitude : (float)config('absensi.office_longitude'); 
    $RADIUS = $settings ? (int)$settings->radius : (int)config('absensi.office_radius');
    
    // Periksa apakah lat/lng valid
    if (!$lat || !$lng) {
        Log::warning('Checkin tanpa koordinat');
        return [false, 0, 0];
    }
    
    // Calculate distance using Haversine formula
    $R=6371000; // Earth radius in meters
    $dLat=deg2rad($lat-$OFF_LAT); 
    $dLon=deg2rad($lng-$OFF_LNG);
    $a=sin($dLat/2)**2 + cos(deg2rad($OFF_LAT))*cos(deg2rad($lat))*sin($dLon/2)**2;
    $c=2*atan2(sqrt($a), sqrt(1-$a)); 
    $dist=$R*$c; // Distance in meters
    
    Log::info('GPS Check', [
        'user_lat' => $lat,
        'user_lng' => $lng,
        'office_lat' => $OFF_LAT,
        'office_lng' => $OFF_LNG,
        'distance' => round($dist, 2),
        'radius' => $RADIUS,
        'within_radius' => $dist <= $RADIUS
    ]);
    
    $ok = $dist <= $RADIUS;
    $telat = max(0, (strtotime($time)-strtotime(config('absensi.work_start')))/60); // menit
    return [$ok, $telat, $dist];
  }

  private function updateLateBuckets(int $kid,string $tgl,string $time): void {
    $late = max(0, (strtotime($time)-strtotime(config('absensi.work_start','09:00:00')))/60);
    $flags = ['late_15'=>0,'late_30'=>0,'late_over30'=>0];
    if ($late>0 && $late<=15) $flags['late_15']=1;
    elseif ($late>15 && $late<=30) $flags['late_30']=1;
    elseif ($late>30) $flags['late_over30']=1;

    DB::table('absensis')->where(['karyawan_id'=>$kid,'tanggal'=>$tgl])->update(array_merge([
      'telat_menit'=>$late
    ], $flags));
  }
}