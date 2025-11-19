q('#btnLogout').onclick = async () => {
  await API.post('/api/logout', {});
  location.href = '../login.html';
};

q('#btnLoad').onclick = async () => {
  const m = q('#month').value.trim();
  const r = await API.get('/api/karyawan/gaji?month=' + encodeURIComponent(m));
  q('#out').textContent = JSON.stringify(r?.data || r, null, 2);
  q('#btnSlip').href = '/api/payroll/slip.pdf?month=' + encodeURIComponent(m);
};
