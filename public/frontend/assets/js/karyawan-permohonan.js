q('#btnLogout').onclick = async () => {
  await API.post('/api/logout', {});
  location.href = '../login.html';
};

q('#btnAjukan').onclick = async (e) => { // Tambahkan parameter event 'e'
  e.preventDefault(); // Mencegah submit form standar

  // Validasi Frontend
  const tanggalMulai = q('#mulai').value;
  const tanggalSelesai = q('#selesai').value;

  if (!tanggalMulai) {
    toast('Tanggal Mulai wajib diisi.', 'err');
    return;
  }
  // Jika tipe bukan lembur, tanggal selesai juga wajib diisi
  if (q('#tipe').value !== 'lembur' && !tanggalSelesai) {
    toast('Tanggal Selesai wajib diisi untuk tipe ini.', 'err');
    return;
  }
  // Tambahkan validasi jika tanggal selesai lebih awal dari tanggal mulai
  if (tanggalSelesai && tanggalMulai > tanggalSelesai) {
    toast('Tanggal Selesai tidak boleh lebih awal dari Tanggal Mulai.', 'err');
    return;
  }

  // Pastikan CSRF token dimuat sebelum mengirim form
  await API.getCsrfToken(); 

  const form = new FormData();
  form.append('tipe', q('#tipe').value);
  form.append('tanggal_mulai', tanggalMulai);
  if (tanggalSelesai) form.append('tanggal_selesai', tanggalSelesai); // Gunakan variabel yang sudah divalidasi
  if (q('#alasan').value) form.append('alasan', q('#alasan').value);
  if (q('#bukti').files[0]) form.append('bukti', q('#bukti').files[0]);
  
  console.log('Mengirim permohonan dengan data:', Object.fromEntries(form.entries())); // Debugging
  const r = await API.postForm('/api/karyawan/permohonan', form);
  console.log('Respons API permohonan:', r); // Debugging
  
  if (r.status) {
    toast('Permohonan dikirim');
    // Mungkin perlu reload data riwayat setelah sukses
    load(); 
  } else {
    toast(r.message || 'Gagal mengajukan permohonan');
  }
};

async function load() {
  const st = q('#fStatus').value;
  const r = await API.get('/api/karyawan/permohonan?status=' + encodeURIComponent(st));
  // Sesuaikan cara mengambil 'rows' agar sesuai dengan struktur respons API
  const rows = r?.data?.data?.data || []; // Mengambil dari r.data.data.data
  
  console.log('Data riwayat permohonan yang dimuat:', rows); // Debugging
  
  const tb = q('#tbl tbody');
  tb.innerHTML = '';
  if (rows.length === 0) {
    tb.innerHTML = '<tr><td colspan="3" class="td-text-center">Tidak ada riwayat permohonan.</td></tr>';
  } else {
    rows.forEach(x => tb.appendChild(el('tr', `<td>${(x.created_at || '').slice(0, 10)}</td><td>${x.tipe}</td><td>${x.status}</td>`)));
  }
}

q('#btnLoad').onclick = load;
load();
