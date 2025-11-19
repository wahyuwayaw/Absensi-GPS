<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller {
  
  // Get all settings from database
  public function get(){
    $settings = DB::table('settings')->first();
    
    if (!$settings) {
      // Return default values if no settings found
      return response()->json([
        'status' => true,
        'data' => [
          'latitude' => -6.200000,
          'longitude' => 106.816666,
          'radius' => 100,
          'work_start' => '08:00:00',
          'work_end' => '17:00:00',
          'potongan_telat_15' => 20000,
          'potongan_telat_30' => 35000,
          'potongan_tidak_masuk' => 100000,
          'bonus_lembur_perjam' => 50000,
          'gaji_default_staff' => 2000000,
          'gaji_default_kepala_cabang' => 2500000,
          'tanggal_gajian_default' => 25
        ]
      ]);
    }
    
    return response()->json(['status' => true, 'data' => $settings]);
  }
  
  // Update settings (location + payroll)
  public function update(Request $r){
    $data = $r->validate([
      'latitude' => 'sometimes|numeric',
      'longitude' => 'sometimes|numeric',
      'radius' => 'sometimes|integer|min:1',
      'work_start' => 'sometimes|date_format:H:i:s',
      'work_end' => 'sometimes|date_format:H:i:s',
      'potongan_telat_15' => 'sometimes|numeric|min:0',
      'potongan_telat_30' => 'sometimes|numeric|min:0',
      'potongan_tidak_masuk' => 'sometimes|numeric|min:0',
      'bonus_lembur_perjam' => 'sometimes|numeric|min:0',
      'gaji_default_staff' => 'sometimes|numeric|min:0',
      'gaji_default_kepala_cabang' => 'sometimes|numeric|min:0',
      'tanggal_gajian_default' => 'sometimes|integer|min:1|max:31'
    ]);
    
    // Update or create settings (there should only be one row)
    $settings = DB::table('settings')->first();
    if ($settings) {
      DB::table('settings')->where('id', $settings->id)->update(array_merge($data, ['updated_at' => now()]));
    } else {
      DB::table('settings')->insert(array_merge($data, ['created_at' => now(), 'updated_at' => now()]));
    }
    
    return response()->json(['status' => true, 'message' => 'Pengaturan berhasil disimpan']);
  }
  
  // Legacy: save location only (for backwards compatibility)
  public function save(Request $r){
    return $this->update($r);
  }
}