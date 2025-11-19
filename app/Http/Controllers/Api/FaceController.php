<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log; // Ditambahkan

class FaceController extends Controller {
  public function enroll(Request $r){
    Log::info('Face enroll requested', $r->all());
    return response()->json(['status'=>true,'message'=>'Enroll wajah berhasil (demo)']);
  }
  public function loginByFace(Request $r){
    Log::info('Face login requested', $r->all());
    // Simulate a successful face recognition for the demo
    if ($r->filled('username') && $r->filled('image')) { // Changed 'id' to 'username'
        return response()->json(['status' => true, 'message' => 'Autentikasi wajah berhasil (demo)']);
    }
    return response()->json(['status' => false, 'message' => 'Username atau gambar tidak ada (demo)'], 400); // Updated message
  }
}