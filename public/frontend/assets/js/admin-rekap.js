// admin-rekap.js
document.addEventListener('api-ready', () => {
  let currentRekapPage = 1;
  let rekapRowsPerPage = 10; // Default rows per page
  const tbody = document.querySelector('#tblRekap tbody'); // Assuming this is the tbody for rekap
  const btnLihat = document.getElementById('btnLihat');
  const bulan = document.getElementById('monthSelect'); // Fixed: was 'bulan', should be 'monthSelect'
  async function loadRekap(page = 1, rowsPerPage = rekapRowsPerPage) {
    try {
      currentRekapPage = page;
      rekapRowsPerPage = rowsPerPage;
      const params = new URLSearchParams({ page: String(currentRekapPage), per_page: String(rekapRowsPerPage) });
      if (bulan && bulan.value) {
        params.set('month', bulan.value);
        console.log('Month filter:', bulan.value); // Debug
      } else {
        console.log('No month selected, using current month'); // Debug
      }
      const url = '/api/absensi/rekap-bulanan?' + params.toString();
      console.log('Request URL:', url); // Debug
      const { data } = await API.get(url);
      console.log('Rekap Bulanan API Response:', data); // Debugging line
      render(data.data.data || []); // Pass the actual data array for rendering
      renderPagination(q('#paginationRekap'), data.data, loadRekap, (newRowsPerPage) => loadRekap(1, newRowsPerPage), rekapRowsPerPage);
    } catch (e) {
      render([], true);
      console.error('loadRekap failed:', e);
    }
  }

  function render(rows, isError = false) {
    console.log('Rendering Rekap with rows:', rows); // Debugging line
    if (rows.length > 0) console.log('First Rekap row data:', rows[0]); // Log first row data
    if (!rows.length) {
      tbody.innerHTML = `<tr><td class="td-text-center td-small-muted" colspan="7">${
        isError ? 'Gagal memuat rekap.' : 'Belum ada data.'
      }</td></tr>`;
      renderPagination(q('#paginationRekap'), { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 }, loadRekap, (newRowsPerPage) => loadRekap(1, newRowsPerPage), rekapRowsPerPage);
      return;
    }
    tbody.innerHTML = rows.map((r) => `
      <tr>
        <td>${r.nip || '-'}</td>
        <td>${r.nama_lengkap || '-'}</td>
        <td>${r.total_hadir ?? '-'}</td>
        <td>${r.lembur_jam ?? '-'}</td>
        <td>${r.telat_15 ?? '-'}</td>
        <td>${r.telat_30 ?? '-'}</td>
        <td>${r.telat_over30 ?? '-'}</td>
      </tr>
    `).join('');
  }

  if (btnLihat) btnLihat.onclick = () => loadRekap(1);
  
  // Also check for btnRekap (button id in HTML)
  const btnRekap = document.getElementById('btnRekap');
  if (btnRekap) btnRekap.onclick = () => loadRekap(1);
  
  // Set default month to current month
  if (bulan) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    bulan.value = `${year}-${month}`;
    console.log('Default month set to:', bulan.value);
  }
  
  // Bulan change listener
  if (bulan) bulan.onchange = () => loadRekap(1);
  
  // Helper function
  function q(s) { return document.querySelector(s); }
  
  loadRekap(1);
});