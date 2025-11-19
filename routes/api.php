<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{
    AuthController, DashboardController, AbsensiController, PermohonanController,
    KaryawanController, SettingsController, PayrollController, AdminProfileController, 
    HealthController, FaceController, AnalyticsController
};

// --- Rute Umum (Auth) ---
Route::post('/login',[AuthController::class,'login']);
Route::post('/logout',[AuthController::class,'logout']);
Route::get('/me',[AuthController::class,'me']);

// Face enroll/login (opsional, bisa dipakai admin/karyawan)
Route::post('/face/enroll',[FaceController::class,'enroll']);
Route::post('/face/login',[FaceController::class,'loginByFace']);

// Settings (Shared: Admin can GET/PUT, Karyawan can only GET)
Route::middleware(['role:admin|karyawan'])->group(function(){
  Route::get('/settings',[SettingsController::class,'get']);
  Route::get('/settings/location',[SettingsController::class,'get']); // Legacy support
});
Route::middleware(['role:admin'])->group(function(){
  Route::put('/settings',[SettingsController::class,'update']);
  Route::post('/settings/location',[SettingsController::class,'save']); // Legacy support
});

// --- Area Karyawan (Dilindungi role:karyawan) ---
// PENTING: Route karyawan harus didefinisikan SEBELUM route admin /karyawan/{id}
// agar /karyawan/today tidak tertangkap sebagai /karyawan/{id} dengan id="today"

// Beranda/Status
Route::get('/karyawan/today',[DashboardController::class,'todayKaryawan'])->middleware('role:karyawan');

// Absen
Route::post('/absensi/checkin',[AbsensiController::class,'checkin'])->middleware('role:karyawan');
Route::post('/absensi/checkout',[AbsensiController::class,'checkout'])->middleware('role:karyawan');
Route::get('/karyawan/absensi',[AbsensiController::class,'riwayat'])->middleware('role:karyawan');

// Permohonan
Route::post('/karyawan/permohonan',[PermohonanController::class,'store'])->middleware('role:karyawan');
Route::get('/karyawan/permohonan',[PermohonanController::class,'listSelf'])->middleware('role:karyawan');

// Profil
Route::get('/karyawan/profile',[KaryawanController::class,'getProfile'])->middleware('role:karyawan');
Route::put('/karyawan/profile',[KaryawanController::class,'updateSelf'])->middleware('role:karyawan');
Route::post('/karyawan/change-password',[KaryawanController::class,'updatePasswordSelf'])->middleware('role:karyawan');
Route::post('/karyawan/upload-foto',[KaryawanController::class,'uploadFoto'])->middleware('role:karyawan');
Route::delete('/karyawan/remove-foto',[KaryawanController::class,'removeFoto'])->middleware('role:karyawan');

// Payroll - Karyawan
Route::get('/karyawan/payroll',[PayrollController::class,'getPayroll'])->middleware('role:karyawan');
Route::get('/karyawan/payroll/history',[PayrollController::class,'getHistory'])->middleware('role:karyawan');

// --- Area Admin (Dilindungi role:admin) ---
Route::middleware(['role:admin'])->group(function(){
  // Dashboard
  Route::get('/dashboard/rekap',[DashboardController::class,'rekap']);
  Route::get('/dashboard/weekly',[DashboardController::class,'weekly']);
  Route::get('/dashboard/today',[DashboardController::class,'today']);

  // Absensi
  Route::get('/absensi',[AbsensiController::class,'index']);
  Route::get('/absensi/rekap-bulanan',[AbsensiController::class,'rekapBulanan']);
  Route::get('/absensi/export.csv',[AbsensiController::class,'exportCsv']);
  Route::get('/absensi/export.pdf',[AbsensiController::class,'exportPdf']);
  Route::get('/absensi/export.excel',[AbsensiController::class,'exportExcel']);

  // Permohonan
  Route::get('/permohonan/pending',[PermohonanController::class,'pending']);
  Route::post('/permohonan/verify',[PermohonanController::class,'verify']);
  Route::get('/permohonan/history',[PermohonanController::class,'history']);

  // Karyawan (CRUD & Aksi)
  Route::get('/karyawan',[KaryawanController::class,'list']);
  Route::get('/karyawan/{id}',[KaryawanController::class,'show']); // Get single karyawan
  Route::post('/karyawan',[KaryawanController::class,'create']);
  Route::put('/karyawan/{id}',[KaryawanController::class,'update']);
  Route::patch('/karyawan/{id}/status',[KaryawanController::class,'setStatus']);
  Route::post('/karyawan/{id}/reset-password',[KaryawanController::class,'resetPassword']);
  Route::delete('/karyawan/{id}',[KaryawanController::class,'destroy']);

  // Penggajian
  Route::post('/payroll/calculate',[PayrollController::class,'calculateMonthly']);
  Route::get('/payroll/calc',[PayrollController::class,'calc']);
  Route::get('/payroll/slip.pdf',[PayrollController::class,'slipPdf']);

  // Pengaturan (Profil Admin & sesi)
  Route::put('/admin/profile',[AdminProfileController::class,'update']);
  Route::put('/admin/profile/password',[AdminProfileController::class,'updatePassword']);
  Route::post('/admin/sessions/logout-all',[AdminProfileController::class,'logoutAll']);

  // Health
  Route::get('/admin/health',[HealthController::class,'status']);
  
  // Analytics
  Route::get('/analytics/overview',[AnalyticsController::class,'overview']);
  Route::get('/analytics/monthly-trend',[AnalyticsController::class,'monthlyTrend']);
  Route::get('/analytics/top-latest',[AnalyticsController::class,'topLatest']);
  Route::get('/analytics/department-stats',[AnalyticsController::class,'departmentStats']);
  Route::get('/analytics/payroll-summary',[AnalyticsController::class,'payrollSummary']);
});