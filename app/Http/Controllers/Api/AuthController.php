<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller {
  public function login(Request $r)
  {
      $role     = $r->input('role', 'admin');
      $username = trim($r->input('username', ''));
      $password = (string) $r->input('password', '');
      
      \Log::info('Login attempt', ['role' => $role, 'username' => $username]);
  
      if (!$username || !$password) {
          return response()->json(['status' => false, 'message' => 'role, username, password wajib'], 400);
      }
  
      // --- penting: mulai sesi & ganti ID untuk memastikan cookie dibuat
      $r->session()->regenerate();
      \Log::info('Session regenerated', ['session_id' => $r->session()->getId()]);
  
      if ($role === 'admin') {
          // Check if username exists in karyawan table (wrong role)
          $isKaryawan = DB::table('karyawans')->where('nip', $username)->orWhere('email', $username)->exists();
          if ($isKaryawan) {
              \Log::warning('Admin login failed', ['username' => $username, 'reason' => 'wrong_role']);
              return response()->json(['status' => false, 'message' => 'Username ini adalah karyawan. Pilih role "Karyawan" untuk login'], 401);
          }
          
          $adm = DB::table('admins')->where('username', $username)->first();
          \Log::info('Admin lookup', ['found' => !!$adm, 'username' => $username]);
          
          if (!$adm) {
              \Log::warning('Admin login failed', ['username' => $username, 'reason' => 'not_found']);
              return response()->json(['status' => false, 'message' => 'Username admin tidak ditemukan'], 401);
          }
          
          if (!Hash::check($password, $adm->password)) {
              \Log::warning('Admin login failed', ['username' => $username, 'reason' => 'wrong_password']);
              return response()->json(['status' => false, 'message' => 'Password salah'], 401);
          }
  
          $user = [
              'role'     => 'admin',
              'id'       => $adm->id,
              'username' => $adm->username,
              'nama'     => $adm->nama,
          ];
          
          \Log::info('Admin user created', ['user' => $user]);
      } else {
          // Check if username exists in admin table (wrong role)
          $isAdmin = DB::table('admins')->where('username', $username)->exists();
          if ($isAdmin) {
              \Log::warning('Karyawan login failed', ['username' => $username, 'reason' => 'wrong_role']);
              return response()->json(['status' => false, 'message' => 'Username ini adalah admin. Pilih role "Admin" untuk login'], 401);
          }
          
          $karyawan = \App\Models\User::where(fn($q) => $q->where('nip', $username)->orWhere('email', $username))
              ->first();
          
          \Log::info('Karyawan lookup', ['found' => !!$karyawan, 'username' => $username]);
  
          if (!$karyawan) {
              \Log::warning('Karyawan login failed', ['username' => $username, 'reason' => 'not_found']);
              return response()->json(['status' => false, 'message' => 'NIP/Email karyawan tidak ditemukan'], 401);
          }
          
          if ($karyawan->status !== 'aktif') {
              \Log::warning('Karyawan login failed', ['username' => $username, 'reason' => 'inactive', 'status' => $karyawan->status]);
              return response()->json(['status' => false, 'message' => 'Akun karyawan tidak aktif'], 401);
          }
          
          if (!Hash::check($password, $karyawan->password)) {
              \Log::warning('Karyawan login failed', ['username' => $username, 'reason' => 'wrong_password']);
              return response()->json(['status' => false, 'message' => 'Password salah'], 401);
          }
          
          // Use Laravel's standard authentication
          Auth::login($karyawan);
          
          // Also save to session for middleware compatibility
          $user = [
              'role'         => 'karyawan',
              'id'           => $karyawan->id,
              'nip'          => $karyawan->nip,
              'nama_lengkap' => $karyawan->nama_lengkap,
              'email'        => $karyawan->email,
          ];
          
          $r->session()->put('user', $user);
          $r->session()->save();
          
          \Log::info('Karyawan logged in', ['user' => $user]);
          
          return response()->json(['status' => true, 'data' => $user]);
      }
  
      // simpan user ke session (pakai object Session request) - ONLY FOR ADMIN
      $r->session()->put('user', $user);
      $r->session()->save(); // pastikan persisten
      
      \Log::info('Admin session saved', ['user' => $user, 'session_id' => $r->session()->getId()]);
  
      return response()->json(['status' => true, 'data' => $user]);
  }
  
  public function me(Request $r){
      $user = $r->user() ?? session('user');
      \Log::info('API /me called', ['user' => $user, 'session_id' => $r->session()->getId()]);
      return response()->json(['status' => true, 'data' => $user]);
  }
  public function logout(Request $r){ $r->session()->invalidate(); $r->session()->regenerateToken(); return response()->json(['status'=>true]); }
}