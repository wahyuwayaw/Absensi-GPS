<?php
// Test authentication session
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "TEST AUTH SESSION\n";
echo "========================================\n\n";

// Check database connection
try {
    DB::connection()->getPdo();
    echo "[OK] Database connected\n\n";
} catch (Exception $e) {
    echo "[ERROR] Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Check sessions table
echo "Checking sessions table...\n";
$sessions = DB::table('sessions')->get();
echo "Total active sessions: " . $sessions->count() . "\n\n";

if ($sessions->count() > 0) {
    echo "Recent sessions:\n";
    echo str_repeat("-", 80) . "\n";
    foreach ($sessions->take(5) as $session) {
        echo "ID: " . substr($session->id, 0, 20) . "...\n";
        echo "User ID: " . ($session->user_id ?? 'Guest') . "\n";
        echo "Last Activity: " . date('Y-m-d H:i:s', $session->last_activity) . "\n";
        echo str_repeat("-", 80) . "\n";
    }
}

// Check personal_access_tokens (Sanctum tokens)
echo "\nChecking Sanctum tokens...\n";
$tokens = DB::table('personal_access_tokens')
    ->select('tokenable_id', 'tokenable_type', 'name', 'last_used_at', 'created_at')
    ->orderBy('created_at', 'desc')
    ->get();

echo "Total Sanctum tokens: " . $tokens->count() . "\n\n";

if ($tokens->count() > 0) {
    echo "Recent tokens:\n";
    echo str_repeat("-", 80) . "\n";
    foreach ($tokens->take(5) as $token) {
        echo "User ID: " . $token->tokenable_id . "\n";
        echo "Type: " . $token->tokenable_type . "\n";
        echo "Name: " . $token->name . "\n";
        echo "Created: " . $token->created_at . "\n";
        echo "Last Used: " . ($token->last_used_at ?? 'Never') . "\n";
        echo str_repeat("-", 80) . "\n";
    }
}

// Check karyawan test account
echo "\nChecking karyawan account (NIP: 1212)...\n";
$karyawan = DB::table('karyawans')->where('nip', '1212')->first();

if ($karyawan) {
    echo "[OK] Karyawan found\n";
    echo "ID: " . $karyawan->id . "\n";
    echo "NIP: " . $karyawan->nip . "\n";
    echo "Nama: " . $karyawan->nama_lengkap . "\n";
    echo "Status: " . $karyawan->status . "\n";
} else {
    echo "[ERROR] Karyawan not found!\n";
}

echo "\n========================================\n";
echo "TIPS FOR DEBUGGING:\n";
echo "========================================\n";
echo "1. Open browser Console (F12)\n";
echo "2. Check Network tab for API calls\n";
echo "3. Look for 401/419 errors\n";
echo "4. Check if XSRF-TOKEN cookie exists\n";
echo "5. Try logout and login again\n";
echo "\n";
