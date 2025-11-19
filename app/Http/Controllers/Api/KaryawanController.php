<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str; // WAJIB ADA

class KaryawanController extends Controller {
    
    public function list(){ 
        return response()->json(['status'=>true,'data'=>DB::table('karyawans')->orderByDesc('created_at')->paginate(20)]); 
    }

    public function show(int $id){
        $karyawan = DB::table('karyawans')->where('id', $id)->first();
        if (!$karyawan) {
            return response()->json(['status'=>false,'message'=>'Karyawan tidak ditemukan'], 404);
        }
        return response()->json(['status'=>true,'data'=>$karyawan]);
    }

    public function create(Request $r){
        \Log::info('KaryawanController@create: Request received', $r->all());
        try {
            $data=$r->validate([
                'nip'=>'required|string|max:20|unique:karyawans,nip',
                'nama_lengkap'=>'required|string',
                'jabatan'=>'required|string',
                'departemen'=>'required|string',
                'email'=>'nullable|email',
                'password'=>'nullable|string',
                'lokasi_terdaftar'=>'nullable|string',
                'tanggal_gabung'=>'nullable|date',
                'status'=>'nullable|in:aktif,nonaktif',
            ]);
            $plain = $data['password'] ?? Str::random(10); 
            $id = DB::table('karyawans')->insertGetId([
                'nip'=>$data['nip'],'nama_lengkap'=>$data['nama_lengkap'],'jabatan'=>$data['jabatan'],'departemen'=>$data['departemen'],
                'email'=>$data['email']??null,'password'=>bcrypt($plain),'lokasi_terdaftar'=>$data['lokasi_terdaftar']??null,
                'tanggal_gabung'=>$data['tanggal_gabung']??null,'status'=>$data['status']??'aktif',
                'gaji_pokok'=>$data['gaji_pokok']??2000000,'tanggal_gajian'=>$data['tanggal_gajian']??25,
                'created_at'=>now(),'updated_at'=>now()
            ]);
            \Log::info('KaryawanController@create: Karyawan created successfully', ['id' => $id]);
            return response()->json(['status'=>true,'data'=>['id'=>$id,'credential'=>['username'=>$data['nip'],'password'=>$plain]]]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('KaryawanController@create: Validation failed', ['errors' => $e->errors()]);
            return response()->json(['status' => false, 'message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('KaryawanController@create: An error occurred', ['message' => $e->getMessage()]);
            return response()->json(['status' => false, 'message' => 'An unexpected error occurred.'], 500);
        }
    }

    public function update(Request $r,int $id){
        \Log::info('KaryawanController@update: Request received', ['id' => $id, 'request_data' => $r->all()]);
        
        // Check if karyawan exists
        $exists = DB::table('karyawans')->where('id',$id)->first();
        if (!$exists) {
            \Log::error('KaryawanController@update: Karyawan not found', ['id' => $id]);
            return response()->json(['status'=>false,'message'=>'Karyawan tidak ditemukan'], 404);
        }
        
        $data=$r->validate([
            'nama_lengkap'=>'sometimes|string',
            'jabatan'=>'sometimes|string',
            'departemen'=>'sometimes|string',
            'email'=>['sometimes','nullable','email', Rule::unique('karyawans')->ignore($id)],
            'status'=>'sometimes|in:aktif,nonaktif',
            'tanggal_gabung'=>'sometimes|nullable|date',
            'gaji_pokok'=>'sometimes|numeric|min:0',
            'tanggal_gajian'=>'sometimes|integer|min:1|max:31',
        ]);
        
        \Log::info('KaryawanController@update: Validated data', ['data' => $data]);
        
        $updated = DB::table('karyawans')->where('id',$id)->update(array_merge($data,['updated_at'=>now()]));
        
        // Get updated record to verify
        $after = DB::table('karyawans')->where('id',$id)->first();
        
        \Log::info('KaryawanController@update: Update completed', [
            'id' => $id, 
            'rows_affected' => $updated,
            'data_sent' => $data,
            'after_update' => $after
        ]);
        
        return response()->json(['status'=>true,'message'=>'Karyawan berhasil diupdate', 'data' => $after]);
    }

    public function setStatus(Request $r,int $id){
        $status=$r->validate(['status'=>'required|in:aktif,nonaktif'])['status'];
        DB::table('karyawans')->where('id',$id)->update(['status'=>$status,'updated_at'=>now()]);
        return response()->json(['status'=>true]);
    }

    public function resetPassword(Request $r,int $id){
        $plain = Str::random(10); 
        DB::table('karyawans')->where('id',$id)->update(['password'=>bcrypt($plain),'updated_at'=>now()]);
        return response()->json(['status'=>true,'data'=>['password'=>$plain]]);
    }

    // Karyawan (self)
    public function getProfile(Request $r){
        $u=session('user');
        $profile = DB::table('karyawans')->where('id',$u['id'])->first();
        return response()->json(['status'=>true,'data'=>$profile]);
    }

    public function updateSelf(Request $r){
        $u=session('user'); 
        $data=$r->validate([
            'nama_lengkap'=>'sometimes|string',
            'email'=>['sometimes','nullable','email', Rule::unique('karyawans')->ignore($u['id'])],
        ]);
        DB::table('karyawans')->where('id',$u['id'])->update(array_merge($data,['updated_at'=>now()]));
        return response()->json(['status'=>true]);
    }

    public function updatePasswordSelf(Request $r){
        $u=session('user'); 
        $v=$r->validate([
            'current_password'=>'required',
            'new_password'=>'required|min:6',
            'new_password_confirmation'=>'required|same:new_password'
        ]);
        $row=DB::table('karyawans')->where('id',$u['id'])->first();
        if(!$row||!Hash::check($v['current_password'],$row->password)) {
            return response()->json(['status'=>false,'message'=>'Password lama salah'],422);
        }
        DB::table('karyawans')->where('id',$u['id'])->update(['password'=>bcrypt($v['new_password']),'updated_at'=>now()]);
        return response()->json(['status'=>true,'message'=>'Password berhasil diubah']);
    }

    public function uploadFoto(Request $r){
        $u=session('user');
        $r->validate(['foto_profil'=>'required|image|max:2048']);
        
        // Delete old photo if exists
        $old = DB::table('karyawans')->where('id',$u['id'])->value('foto_profil');
        if($old && file_exists(public_path($old))){
            @unlink(public_path($old));
        }

        // Save new photo
        $file = $r->file('foto_profil');
        $filename = 'foto_'.time().'.'.$file->extension();
        $path = 'uploads/karyawan/'.$filename;
        $file->move(public_path('uploads/karyawan'), $filename);

        DB::table('karyawans')->where('id',$u['id'])->update(['foto_profil'=>'/'.$path,'updated_at'=>now()]);
        return response()->json(['status'=>true,'message'=>'Foto profil berhasil diupload','data'=>['foto_profil'=>'/'.$path]]);
    }

    public function removeFoto(Request $r){
        $u=session('user');
        $old = DB::table('karyawans')->where('id',$u['id'])->value('foto_profil');
        if($old && file_exists(public_path($old))){
            @unlink(public_path($old));
        }
        DB::table('karyawans')->where('id',$u['id'])->update(['foto_profil'=>null,'updated_at'=>now()]);
        return response()->json(['status'=>true,'message'=>'Foto profil berhasil dihapus']);
    }

    public function destroy(int $id){
        DB::table('karyawans')->where('id',$id)->delete();
        return response()->json(['status'=>true]);
    }
}