<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminProfileController extends Controller {
  public function update(Request $r){
    $u=session('user'); 
    $v=$r->validate(['nama'=>'sometimes|string','username'=>'sometimes|string|unique:admins,username,'.$u['id']]);
    DB::table('admins')->where('id',$u['id'])->update(array_merge($v,['updated_at'=>now()]));
    session(['user'=>array_merge($u,$v)]); 
    return response()->json(['status'=>true]);
  }
  
  public function updatePassword(Request $r){
    $u=session('user');
    \Log::info('Update password attempt', ['admin_id' => $u['id'] ?? null, 'request' => $r->all()]);
    
    if (!$u || !isset($u['id'])) {
      \Log::error('Update password failed: No session user');
      return response()->json(['status'=>false,'message'=>'Sesi tidak valid'], 401);
    }
    
    try {
      $v=$r->validate(['current'=>'required','new'=>'required|min:6']);
    } catch (\Exception $e) {
      \Log::error('Update password validation failed', ['error' => $e->getMessage()]);
      return response()->json(['status'=>false,'message'=>'Validasi gagal: ' . $e->getMessage()], 422);
    }
    
    $row=DB::table('admins')->where('id',$u['id'])->first();
    
    if(!$row) {
      \Log::error('Update password failed: Admin not found', ['admin_id' => $u['id']]);
      return response()->json(['status'=>false,'message'=>'Admin tidak ditemukan'], 404);
    }
    
    if(!Hash::check($v['current'],$row->password)) {
      \Log::warning('Update password failed: Wrong current password', ['admin_id' => $u['id']]);
      return response()->json(['status'=>false,'message'=>'Password lama salah'], 422);
    }
    
    DB::table('admins')->where('id',$u['id'])->update(['password'=>bcrypt($v['new']),'updated_at'=>now()]);
    \Log::info('Password updated successfully', ['admin_id' => $u['id']]);
    
    return response()->json(['status'=>true, 'message'=>'Password berhasil diubah']);
  }
  
  public function logoutAll(){
    DB::table('sessions')->truncate(); 
    return response()->json(['status'=>true,'message'=>'All sessions cleared']);
  }
}