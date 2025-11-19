<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permohonan_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('permohonan_id')->constrained()->cascadeOnDelete();
            $t->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $t->enum('action',['approve','reject']);
            $t->text('note')->nullable();
            $t->timestamps();
        });
        
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permohonan_logs');
    }
};
