q('#btnLogout').onclick = async () => {
  await API.post('/api/logout', {});
  location.href = '../login.html';
};

(async () => {
  const r = await API.get('/api/karyawan/absensi?days=30');
  const rows = r?.data || [];
  const tb = q('#tbl tbody');
  tb.innerHTML = '';
  rows.forEach(x => tb.appendChild(el('tr', `<td>${x.tanggal}</td><td>${x.waktu_masuk||'-'}</td><td>${x.waktu_pulang||'-'}</td><td>${x.telat_menit||0}</td><td>${x.lembur_menit||0}</td><td>${(x.status||'').toUpperCase()}</td>`)));
})();
