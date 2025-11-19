<?php
require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "========================================\n";
echo "CHECK SESSIONS TABLE\n";
echo "========================================\n\n";

$sessions = DB::table('sessions')
    ->orderBy('last_activity', 'desc')
    ->limit(10)
    ->get();

echo "Total sessions: " . $sessions->count() . "\n\n";

if ($sessions->count() > 0) {
    echo "Recent sessions:\n";
    echo str_repeat("-", 100) . "\n";
    printf("%-40s %-10s %-20s %-20s\n", "ID (first 40 chars)", "User ID", "Last Activity", "IP Address");
    echo str_repeat("-", 100) . "\n";
    
    foreach ($sessions as $session) {
        $id = substr($session->id, 0, 40);
        $userId = $session->user_id ?? 'NULL';
        $lastActivity = date('Y-m-d H:i:s', $session->last_activity);
        $ipAddress = $session->ip_address ?? 'N/A';
        
        printf("%-40s %-10s %-20s %-20s\n", $id, $userId, $lastActivity, $ipAddress);
        
        // Show payload preview
        if ($session->payload) {
            $payload = base64_decode($session->payload);
            $preview = substr($payload, 0, 200);
            echo "  Payload preview: " . $preview . "...\n";
        }
        echo "\n";
    }
} else {
    echo "⚠️  NO SESSIONS FOUND!\n";
    echo "\n";
    echo "Possible causes:\n";
    echo "1. Session tidak tersimpan (cookies issue)\n";
    echo "2. Table sessions kosong\n";
    echo "3. Login belum pernah berhasil\n";
}

echo "\n========================================\n";
echo "DONE\n";
echo "========================================\n";
