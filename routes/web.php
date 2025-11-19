<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;

Route::get('/', function () {
    // Dev-only auto-login as the first admin.
    // WARNING: Do not use in production.
    if (app()->isLocal()) {
        $admin = DB::table('admins')->first();

        if ($admin) {
            // Manually set the session for the admin role
            session(['user' => [
                'role' => 'admin',
                'id' => $admin->id,
                'username' => $admin->username,
                'nama' => $admin->nama
            ]]);
            
            // Redirect to the admin dashboard
            return redirect('/frontend/login.html');
        }
    }

    // Fallback to the static login page if not local or no admin found
    return redirect('/frontend/login.html');
});


