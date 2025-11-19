q('#btnLogout').onclick = async () => {
  await API.post('/api/logout', {});
  location.href = '../login.html';
};

(async () => {
  const me = await API.get('/api/me');
  if (me?.data) {
    q('#nama').value = me.data.nama || me.data.username || '';
    q('#email').value = me.data.email || '';
  }
})();

q('#btnSave').onclick = async () => {
  const r = await API.put('/api/karyawan/profile', {
    nama_lengkap: q('#nama').value,
    email: q('#email').value
  });
  r.status ? toast('Profil diperbarui') : toast(r.message || 'Gagal');
};

q('#btnPwd').onclick = async () => {
  const r = await API.put('/api/karyawan/profile/password', {
    current: q('#old').value,
    new: q('#new').value
  });
  r.status ? toast('Password diubah') : toast(r.message || 'Gagal');
};
