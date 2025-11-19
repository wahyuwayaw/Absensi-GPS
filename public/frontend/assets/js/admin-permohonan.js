// admin-permohonan.js
document.addEventListener('api-ready', () => {
    const tblPendingBody = document.querySelector('#tblPending tbody');
    const tblHistoryBody = document.querySelector('#tblHistory tbody');
    const filterStatus = document.getElementById('statusFilter');
    const filterTipe = document.getElementById('tipeFilter');
    const btnFilter = document.getElementById('btnFilterHistory');
  
    // Guard jika elemen tidak ada (hindari Cannot set properties of null)
    if (!tblPendingBody || !tblHistoryBody) return;
  
    let currentPendingPage = 1;
    let pendingRowsPerPage = 10; // Default rows per page
    async function loadPendingApplications(page = 1, rowsPerPage = pendingRowsPerPage) {
      try {
        currentPendingPage = page;
        pendingRowsPerPage = rowsPerPage;
        const qs = new URLSearchParams({ page: String(currentPendingPage), per_page: String(pendingRowsPerPage) });
        // GET /api/permohonan/pending
        const { data } = await API.get('/api/permohonan/pending?' + qs.toString());
        console.log('Pending Applications API Response:', data); // Debugging line
        renderPending(data.data.data || []);
        renderPagination(q('#paginationPending'), data.data, loadPendingApplications, (newRowsPerPage) => loadPendingApplications(1, newRowsPerPage), pendingRowsPerPage);
      } catch (e) {
        renderPending([], true);
        console.error('loadPendingApplications failed:', e);
      }
    }
  
    let currentHistoryPage = 1;
    let historyRowsPerPage = 10; // Default rows per page
    async function loadHistoryApplications(page = 1, rowsPerPage = historyRowsPerPage) {
      try {
        currentHistoryPage = page;
        historyRowsPerPage = rowsPerPage;
        const qs = new URLSearchParams();
        qs.set('page', String(currentHistoryPage));
        qs.set('per_page', String(historyRowsPerPage));
        if (filterStatus && filterStatus.value) qs.set('status', filterStatus.value);
        if (filterTipe && filterTipe.value) qs.set('tipe', filterTipe.value);
  
        const url = '/api/permohonan/history?' + qs.toString();
        const { data } = await API.get(url);
        console.log('History Applications API Response:', data); // Debugging line
        renderHistory(data.data.data || []);
        renderPagination(q('#paginationHistory'), data.data, loadHistoryApplications, (newRowsPerPage) => loadHistoryApplications(1, newRowsPerPage), historyRowsPerPage);
      } catch (e) {
        renderHistory([], true);
        console.error('loadHistoryApplications failed:', e);
      }
    }
  
    function renderPending(rows, isError = false) {
      console.log('Rendering Pending Applications with rows:', rows); // Debugging line
      if (!rows.length) {
        tblPendingBody.innerHTML = `<tr><td class="td-text-center" colspan="5">${
          isError ? 'Gagal memuat data.' : 'Tidak ada permohonan pending.'
        }</td></tr>`;
        return;
      }
      tblPendingBody.innerHTML = rows.map((r) => `
        <tr>
          <td>${r.created_at?.slice(0,10)||'-'}</td>
          <td>${r.nama_lengkap||'-'}</td>
          <td>${r.tipe || '-'}</td>
          <td>${r.alasan || '-'}</td>
          <td>
            <button class="btn btn-sm btn-primary" data-id="${r.id}" data-act="approve">Setujui</button>
            <button class="btn btn-sm btn-danger" data-id="${r.id}" data-act="reject">Tolak</button>
          </td>
        </tr>
      `).join('');
      // aksi
      tblPendingBody.querySelectorAll('button[data-id]').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.getAttribute('data-id');
          const act = btn.getAttribute('data-act');
          try {
            await API.post('/api/permohonan/verify', { id, action: act });
            toast('Keputusan berhasil disimpan.');
            await loadPendingApplications();
            await loadHistoryApplications();
          } catch (e) {
            alert('Gagal mengirim keputusan.');
            console.error(e);
          }
        };
      });
    }
  
    function renderHistory(rows, isError = false) {
      console.log('Rendering History Applications with rows:', rows); // Debugging line
      if (!rows.length) {
        tblHistoryBody.innerHTML = `<tr><td class="td-text-center" colspan="6">${
          isError ? 'Gagal memuat data.' : 'Belum ada riwayat keputusan.'
        }</td></tr>`;
        return;
      }
      tblHistoryBody.innerHTML = rows.map((r) => `
        <tr>
          <td>${r.created_at?.slice(0,10)||'-'}</td>
          <td>${r.nama_lengkap||'-'}</td>
          <td>${r.tipe || '-'}</td>
          <td><span class="badge ${statusClass(r.status)}">${r.status || '-'}</span></td>
          <td>${r.catatan_admin || '-'}</td>
          <td>${r.aksi || '-'}</td>
        </tr>
      `).join('');
    }
  
    function statusClass(s) {
      if (!s) return 'pending';
      s = String(s).toLowerCase();
      if (s.includes('setuju') || s === 'approved') return 'approved';
      if (s.includes('tolak') || s === 'rejected') return 'rejected';
      return 'pending';
    }
  
    if (btnFilter) btnFilter.onclick = () => loadHistoryApplications(1);
  
    // initial load
    loadPendingApplications();
    loadHistoryApplications();
  });
  