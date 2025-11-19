<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PermohonanController extends Controller {
  public function pending(){
    $rows = DB::table('permohonans as p')
      ->join('karyawans as k','k.id','=','p.karyawan_id')
      ->where('p.status','pending')
      ->select('p.*','k.nip','k.nama_lengkap')->orderByDesc('p.created_at')->paginate(20);
    return response()->json(['status'=>true,'data'=>$rows]);
  }

  public function verify(Request $r){
    $id=(int)$r->input('id',0);
    $raw_act=trim($r->input('action'));
    $note=$r->input('note') ?? '';

    // Normalisasi input action
    $act = null;
    if (in_array($raw_act, ['approve', 'approved'])) {
        $act = 'approve';
    } elseif (in_array($raw_act, ['reject', 'rejected'])) {
        $act = 'reject';
    }

    if(!$id || !$act) {
      \Log::warning('PermohonanController@verify: Invalid action received', ['id' => $id, 'action' => $raw_act]);
      return response()->json(['status'=>false,'message'=>'invalid action'],400);
    }

    $status = $act === 'approve' ? 'approved' : 'rejected';
    
    // Perbaikan: Ambil data permohonan sebelum update
    $permohonan = DB::table('permohonans')->where('id',$id)->first();
    if (!$permohonan) {
      \Log::warning('PermohonanController@verify: Permohonan not found', ['id' => $id]);
      return response()->json(['status'=>false,'message'=>'Permohonan tidak ditemukan'],404);
    }

    DB::table('permohonans')->where('id',$id)->update(['status'=>$status,'catatan_admin'=>$note,'updated_at'=>now()]);
    
    // Log persetujuan
    DB::table('permohonan_logs')->insert(['permohonan_id'=>$id,'admin_id'=>($r->user()->id ?? session('user')['id']), 'action'=>$act,'note'=>$note,'created_at'=>now(),'updated_at'=>now()]);
    
    // Tambahan: Jika disetujui, update status di tabel absensi (untuk Izin/Cuti)
    if ($status === 'approved' && in_array($permohonan->tipe, ['izin', 'cuti'])) {
        $startDate = new \DateTime($permohonan->tanggal_mulai);
        $endDate = $permohonan->tanggal_selesai ? new \DateTime($permohonan->tanggal_selesai) : $startDate;
        $interval = new \DateInterval('P1D');
        $period = new \DatePeriod($startDate, $interval, $endDate->modify('+1 day'));

        foreach ($period as $date) {
            DB::table('absensis')->updateOrInsert(
                ['karyawan_id' => $permohonan->karyawan_id, 'tanggal' => $date->format('Y-m-d')],
                ['status' => $permohonan->tipe, 'updated_at' => now()]
            );
        }
    }
    
    return response()->json(['status'=>true]);
  }

  public function history(Request $r){
    $q = DB::table('permohonans as p')->join('karyawans as k','k.id','=','p.karyawan_id')
      ->select('p.*','k.nip','k.nama_lengkap')->orderByDesc('p.updated_at');
    if($r->filled('status')) $q->where('p.status',$r->input('status'));
    if($r->filled('tipe'))   $q->where('p.tipe',$r->input('tipe'));
    return response()->json(['status'=>true,'data'=>$q->paginate(20)]);
  }

  // karyawan: ajukan & list sendiri
  public function store(Request $r){
    $u = $r->user() ?? session('user');
    $data = $r->validate([
      'tipe'=>'required|in:izin,cuti,lembur',
      'tanggal_mulai'=>'required|date',
      'tanggal_selesai'=>'nullable|date',
      'alasan'=>'nullable|string',
      'bukti'=>'nullable|file|max:4096'
    ]);
    
    $path=null;
    if($r->hasFile('bukti')) {
      $path = $r->file('bukti')->store('bukti', 'public');
    }
    
    $id = DB::table('permohonans')->insertGetId([
      'karyawan_id'=>$u->id,'tipe'=>$data['tipe'],'tanggal_mulai'=>$data['tanggal_mulai'],
      'tanggal_selesai'=>$data['tanggal_selesai']??null,'alasan'=>$data['alasan']??null,
      'bukti_path'=>$path,'status'=>'pending','created_at'=>now(),'updated_at'=>now()
    ]);
    \Log::info('Permohonan baru diajukan', ['id' => $id, 'karyawan_id' => $u->id, 'tipe' => $data['tipe'], 'status' => 'pending']);
    return response()->json(['status'=>true,'data'=>['id'=>$id,'bukti'=>$path]]);
  }
  
  public function listSelf(Request $r){
    $u = $r->user() ?? session('user');
    $q = DB::table('permohonans')->where('karyawan_id',$u->id)->orderByDesc('created_at');
    if($r->filled('status')) $q->where('status',$r->input('status'));
    return response()->json(['status'=>true,'data'=>$q->paginate(20)]);
  }
}