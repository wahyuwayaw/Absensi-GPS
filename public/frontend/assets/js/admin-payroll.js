document.addEventListener('api-ready', () => {
  q('#btnLogout').onclick = async (e) => {
    e.preventDefault();
    await API.post('/api/logout', {});
    location.href = '../login.html';
  };

  // Set default bulan dan tahun ke bulan ini
  const now = new Date();
  q('#bulanPayroll').value = now.getMonth() + 1; // Month is 0-indexed
  q('#tahunPayroll').value = now.getFullYear();

  // Fungsi untuk memuat daftar karyawan ke select
  async function loadKaryawanList() {
    const selectKaryawan = q('#karyawanSelect');
    selectKaryawan.innerHTML = '<option value="">Memuat...</option>';
    
    try {
      const res = await API.get('/api/karyawan');
      console.log('Karyawan List API Response:', res);
      
      const karyawans = res.data?.data?.data || [];
      
      selectKaryawan.innerHTML = '<option value="">Pilih Karyawan</option>';
      if (karyawans.length === 0) {
        selectKaryawan.innerHTML = '<option value="">Tidak ada karyawan</option>';
        selectKaryawan.disabled = true;
      } else {
        selectKaryawan.disabled = false;
        karyawans.forEach(k => {
          const option = el('option');
          option.value = k.id;
          option.textContent = `${k.nip} - ${k.nama_lengkap} (${k.jabatan})`;
          selectKaryawan.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading karyawan:', error);
      toast('Gagal memuat daftar karyawan', 'err');
    }
  }

  // Fungsi untuk format rupiah
  function formatRupiah(number) {
    return 'Rp ' + parseInt(number).toLocaleString('id-ID');
  }

  // Fungsi untuk nama bulan
  const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
                     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  q('#btnCalculate').onclick = async () => {
    const karyawanId = q('#karyawanSelect').value;
    const bulan = parseInt(q('#bulanPayroll').value);
    const tahun = parseInt(q('#tahunPayroll').value);

    if (!karyawanId) {
      toast('Pilih karyawan terlebih dahulu!', 'err');
      return;
    }

    if (!bulan || !tahun) {
      toast('Pilih bulan dan tahun!', 'err');
      return;
    }

    try {
      // Show loading
      const btnCalculate = q('#btnCalculate');
      btnCalculate.disabled = true;
      btnCalculate.textContent = 'Menghitung...';

      // Call API to calculate payroll
      const res = await API.req('/api/payroll/calculate', {
        method: 'POST',
        body: JSON.stringify({
          karyawan_id: karyawanId,
          bulan: bulan,
          tahun: tahun
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Calculate Payroll Response:', res);

      if (res.ok && res.data?.status) {
        const data = res.data.data;
        
        // Debug: Log all data received
        console.log('Payroll Data Received:', {
          gaji_pokok: data.gaji_pokok,
          total_hadir: data.total_hadir,
          telat_15: data.telat_15,
          telat_30: data.telat_30,
          tidak_masuk: data.tidak_masuk,
          jam_lembur: data.jam_lembur,
          potongan_telat: data.potongan_telat,
          bonus_lembur: data.bonus_lembur,
          total_gaji: data.total_gaji
        });
        
        // Show result table
        const resultDiv = q('#payrollResult');
        const resultBody = q('#payrollResultBody');
        
        // Extract values with defaults
        const totalHadir = data.total_hadir || 0;
        const telat15 = data.telat_15 || 0;
        const telat30 = data.telat_30 || 0;
        const tidakMasuk = data.tidak_masuk || 0;
        const jamLembur = data.jam_lembur || 0;
        const gajiPokok = data.gaji_pokok || 0;
        const gajiPerHari = data.gaji_per_hari || 0;
        const gajiDariKehadiran = data.gaji_dari_kehadiran || 0;
        const potonganTelat = data.potongan_telat || 0;
        const potonganTidakMasuk = data.potongan_tidak_masuk || 0;
        const bonusLembur = data.bonus_lembur || 0;
        const totalGaji = data.total_gaji || 0;
        
        resultBody.innerHTML = `
          <tr><td style="width:250px;"><strong>Periode</strong></td><td><strong>${namaBulan[bulan]} ${tahun}</strong></td></tr>
          <tr><td colspan="2"><hr style="margin:10px 0;border:none;border-top:1px solid #eee;"></td></tr>
          <tr><td><strong>REKAP KEHADIRAN</strong></td><td></td></tr>
          <tr><td>Total Hadir</td><td><strong>${totalHadir}</strong> hari (dari 30 hari)</td></tr>
          <tr><td>Tidak Masuk</td><td><strong style="color:#EF4444;">${tidakMasuk}</strong> hari</td></tr>
          <tr><td>Telat 15 menit</td><td><strong>${telat15}</strong> kali</td></tr>
          <tr><td>Telat 30 menit</td><td><strong>${telat30}</strong> kali</td></tr>
          <tr><td>Jam Lembur</td><td><strong style="color:#10B981;">${jamLembur}</strong> jam</td></tr>
          <tr><td colspan="2"><hr style="margin:10px 0;border:none;border-top:1px solid #eee;"></td></tr>
          <tr><td><strong>PERHITUNGAN GAJI</strong></td><td></td></tr>
          <tr><td>Gaji Pokok / Bulan</td><td>${formatRupiah(gajiPokok)}</td></tr>
          <tr><td style="padding-left:20px;font-size:12px;color:#6b7280;">Gaji per hari</td><td style="font-size:12px;color:#6b7280;">${formatRupiah(gajiPokok)} ÷ 30 = ${formatRupiah(gajiPerHari)}</td></tr>
          <tr><td>Gaji dari Kehadiran</td><td style="color:#10B981;"><strong>+${formatRupiah(gajiDariKehadiran)}</strong></td></tr>
          <tr><td style="padding-left:20px;font-size:12px;">• ${totalHadir} hari × ${formatRupiah(gajiPerHari)}</td><td style="font-size:12px;">${formatRupiah(gajiDariKehadiran)}</td></tr>
          <tr><td>Potongan Telat</td><td style="color:#EF4444;"><strong>-${formatRupiah(potonganTelat)}</strong></td></tr>
          <tr><td style="padding-left:20px;font-size:12px;">• Telat 15 menit</td><td style="font-size:12px;">${telat15} kali = ${formatRupiah(telat15 * 20000)}</td></tr>
          <tr><td style="padding-left:20px;font-size:12px;">• Telat 30 menit</td><td style="font-size:12px;">${telat30} kali = ${formatRupiah(telat30 * 35000)}</td></tr>
          <tr><td>Potongan Tidak Masuk</td><td style="color:#EF4444;"><strong>-${formatRupiah(potonganTidakMasuk)}</strong></td></tr>
          <tr><td style="padding-left:20px;font-size:12px;">• ${tidakMasuk} hari tidak masuk</td><td style="font-size:12px;">${formatRupiah(potonganTidakMasuk)}</td></tr>
          <tr><td>Bonus Lembur</td><td style="color:#10B981;"><strong>+${formatRupiah(bonusLembur)}</strong></td></tr>
          <tr><td style="padding-left:20px;font-size:12px;">• ${jamLembur} jam lembur</td><td style="font-size:12px;">${formatRupiah(bonusLembur)}</td></tr>
          <tr><td colspan="2"><hr style="margin:10px 0;border:none;border-top:2px solid #333;"></td></tr>
          <tr><td><strong style="font-size:16px;">TOTAL GAJI BERSIH</strong></td><td><strong style="font-size:18px;color:#10B981;">${formatRupiah(totalGaji)}</strong></td></tr>
        `;
        
        resultDiv.style.display = 'block';
        toast('Gaji berhasil dihitung dan disimpan!', 'success');
      } else {
        toast(res.data?.message || 'Gagal menghitung gaji', 'err');
        q('#payrollResult').style.display = 'none';
      }
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast('Terjadi kesalahan saat menghitung gaji', 'err');
    } finally {
      // Reset button
      const btnCalculate = q('#btnCalculate');
      btnCalculate.disabled = false;
      btnCalculate.textContent = 'Hitung & Simpan Gaji';
    }
  };

  // Panggil fungsi untuk memuat daftar karyawan saat halaman dimuat
  loadKaryawanList();
});
