# AbsenV - Aplikasi Absensi Karyawan dengan Face Recognition

AbsenV adalah sistem informasi absensi karyawan berbasis web yang modern dan efisien. Aplikasi ini tidak hanya mencatat waktu kehadiran, tetapi juga dilengkapi dengan fitur validasi menggunakan teknologi pengenalan wajah (face recognition) untuk memastikan keakuratan data.

## Fitur Utama

-   **Dashboard Admin**: Monitoring absensi, persetujuan izin, dan manajemen data terpusat.
-   **Absensi Real-time**: Karyawan dapat melakukan absensi masuk dan pulang secara online.
-   **Validasi Wajah**: Sistem akan memvalidasi foto yang diunggah saat absensi dengan data wajah yang tersimpan untuk mencegah kecurangan.
-   **Manajemen Karyawan**: Pengelolaan data profil, jabatan, dan informasi personal karyawan.
-   **Sistem Pengajuan Izin/Cuti**: Karyawan dapat mengajukan permohonan izin atau cuti melalui aplikasi, dan admin dapat memberikan persetujuan.
-   **Manajemen Payroll**: Sistem untuk mengelola dan menghitung gaji pokok karyawan.
-   **Cetak Laporan**: Admin dapat mengunduh laporan absensi dalam format PDF.

## Teknologi yang Digunakan

-   **Backend**: PHP 8.x, Laravel 11.x
-   **Frontend**: JavaScript, Vite, Tailwind CSS
-   **Database**: SQLite (default)
-   **Face Recognition Service**: Python, Flask
-   **Web Server**: Disarankan menggunakan XAMPP/Laragon atau web server lokal lain yang mendukung PHP.

## Prasyarat

Sebelum memulai, pastikan Anda telah menginstal perangkat lunak berikut di sistem Anda:

-   [PHP](https://www.php.net/downloads.php) (versi 8.1 atau lebih tinggi)
-   [Composer](https://getcomposer.org/download/)
-   [Node.js dan NPM](https://nodejs.org/en/download/)
-   [Python](https://www.python.org/downloads/) (versi 3.8 atau lebih tinggi)

## Instalasi

Ikuti langkah-langkah berikut untuk menginstal dan menjalankan proyek ini di lingkungan lokal Anda.

1.  **Clone Repository**
    ```bash
    git clone <URL_REPOSITORY_ANDA>
    cd absenv-final-clean
    ```

2.  **Setup Backend (Laravel)**
    -   Install dependensi PHP:
        ```bash
        composer install
        ```
    -   Salin file environment:
        ```bash
        copy .env.example .env
        ```
    -   Generate kunci aplikasi:
        ```bash
        php artisan key:generate
        ```
    -   Konfigurasi file `.env` Anda, terutama untuk koneksi database. Proyek ini sudah dikonfigurasi untuk menggunakan SQLite secara default.
    -   Jalankan migrasi dan seeder untuk membuat tabel dan mengisi data awal (termasuk akun admin dan karyawan):
        ```bash
        php artisan migrate --seed
        ```

3.  **Setup Frontend**
    -   Install dependensi Node.js:
        ```bash
        npm install
        ```

4.  **Setup Face Recognition Service (Python)**
    -   Pindah ke direktori layanan:
        ```bash
        cd face_recognition_service
        ```
    -   Buat dan aktifkan virtual environment:
        ```bash
        # Buat environment
        python -m venv venv

        # Aktifkan di Windows
        .\venv\Scripts\activate

        # Aktifkan di macOS/Linux
        # source venv/bin/activate
        ```
    -   Install dependensi Python:
        ```bash
        pip install -r requirements.txt
        ```
    -   Kembali ke direktori utama proyek:
        ```bash
        cd ..
        ```

## Menjalankan Aplikasi

Aplikasi ini terdiri dari 3 bagian yang harus dijalankan secara bersamaan: Server Laravel, Vite Dev Server, dan Server Flask untuk Face Recognition.

1.  **Jalankan Server Backend Laravel**
    Buka terminal baru dan jalankan perintah:
    ```bash
    php artisan serve
    ```
    Server akan berjalan di `http://127.0.0.1:8000`.

2.  **Jalankan Frontend Dev Server (Vite)**
    Buka terminal baru dan jalankan perintah:
    ```bash
    npm run dev
    ```
    Vite akan memonitor perubahan pada file CSS dan JS.

3.  **Jalankan Face Recognition Service**
    -   Buka terminal baru dan aktifkan virtual environment Python seperti pada langkah instalasi.
    -   Pindah ke direktori layanan:
        ```bash
        cd face_recognition_service
        ```
    -   Jalankan server Flask:
        ```bash
        flask run
        ```
    Server akan berjalan di `http://127.0.0.1:5000`.

## Penggunaan

Setelah semua server berjalan, buka browser Anda dan akses aplikasi melalui URL server Laravel:
**`http://127.0.0.1:8000`**

Anda dapat login menggunakan akun default yang telah dibuat oleh seeder:

-   **Akun Admin:**
    -   **Username:** `admin2`
    -   **Password:** `password`

-   **Akun Karyawan:**
    -   **NIP:** `456`
    -   **Password:** `wayaw2`

## Menjalankan Testing

Untuk menjalankan unit dan feature tests, gunakan perintah berikut:
```bash
php artisan test
```
