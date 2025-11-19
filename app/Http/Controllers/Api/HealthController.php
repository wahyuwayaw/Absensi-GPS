<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller {
  public function status(){
    $okDb = true; try{ DB::select('select 1'); }catch(\Throwable $e){ $okDb=false; }
    $okGd = extension_loaded('gd');
    $okStorage = Storage::disk('public')->put('health.txt','ok'); 
    if($okStorage) Storage::disk('public')->delete('health.txt');
    return response()->json(['status'=>true,'data'=>['db'=>$okDb,'gd'=>$okGd,'storage'=>$okStorage]]);
  }
}