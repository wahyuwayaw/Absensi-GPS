document.addEventListener('api-ready', () => {
    // Memastikan navbar menggunakan button yang benar
    activateAdminNavbar();
    
    // --- Fungsi Utama untuk Memuat Data ---
    let currentAbsensiPage = 1;
    let absensiRowsPerPage = 10; // Default rows per page

    // Memuat data absensi saat halaman pertama kali dibuka
    loadAbsensiData();

    async function loadAbsensiData(page = 1, rowsPerPage) { 
        // Ensure rowsPerPage is set, using the global default if not provided
        const effectiveRowsPerPage = rowsPerPage === undefined ? absensiRowsPerPage : rowsPerPage;
        currentAbsensiPage = page;
        absensiRowsPerPage = effectiveRowsPerPage; // Update the global variable

        const tableBody = document.querySelector('#tblAbsensi tbody');
        tableBody.innerHTML = '<tr><td colspan="9" class="td-text-center td-small-muted">Memuat data...</td></tr>';

        // Ambil nilai filter
        const from = document.getElementById('dateFrom').value;
        const to = document.getElementById('dateTo').value;
        const q = document.getElementById('searchAbsensi').value.trim();

        // Build query with filters
        const query = new URLSearchParams({ page: String(currentAbsensiPage), per_page: String(absensiRowsPerPage) });
        if (from) query.set('from', from);
        if (to) query.set('to', to);
        if (q) query.set('q', q);

        const url = `/api/absensi?${query.toString()}`;
        
        const res = await API.get(url);
        console.log('Full Absensi Response:', res);
        console.log('Absensi data part (res.data):', res.data);
        console.log('Absensi list candidate (res.data?.data):', res.data?.data);
        console.log('Absensi list candidate (res.data?.data?.data):', res.data?.data?.data);

        let absensis = res.data?.data?.data;
        if (!Array.isArray(absensis)) {
            absensis = []; // Pastikan absensis adalah array
        }
        const meta = res.data?.data?.meta;

        if (!absensis || absensis.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="9" class="td-text-center td-small-muted">Tidak ada data absensi yang ditemukan.</td></tr>';
            renderPagination(document.querySelector('#paginationAbsensi'), { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 }, loadAbsensiData, (newRowsPerPage) => loadAbsensiData(1, newRowsPerPage), absensiRowsPerPage);
            return;
        }

        tableBody.innerHTML = '';
        absensis.forEach(a => {
            const tr = document.createElement('tr');
            const statusClass = a.status === 'hadir' ? 'approved' : (a.status === 'absen' ? 'rejected' : 'pending');
            
            const fotoMasukHtml = a.foto_masuk ? `<a href="${a.foto_masuk}" class="enlargeable-image"><img src="${a.foto_masuk}" alt="Foto Masuk" style="height: 50px; cursor: pointer;"></a>` : '-';
            const fotoPulangHtml = a.foto_pulang ? `<a href="${a.foto_pulang}" class="enlargeable-image"><img src="${a.foto_pulang}" alt="Foto Pulang" style="height: 50px; cursor: pointer;"></a>` : '-';

            tr.innerHTML = `
                <td>${a.tanggal}</td>
                <td>${a.nip || '-'}</td>
                <td>${a.nama_lengkap || 'N/A'}</td>
                <td>${a.waktu_masuk || '-'}</td>
                <td>${a.waktu_pulang || '-'}</td>
                <td><span class="badge ${statusClass}">${a.status.toUpperCase()}</span></td>
                <td>${fotoMasukHtml}</td>
                <td>${fotoPulangHtml}</td>
                <td>${a.telat_menit > 0 ? a.telat_menit : '0'}</td>
            `;
            tableBody.appendChild(tr);
        });
        if (meta) {
            renderPagination(document.querySelector('#paginationAbsensi'), meta, loadAbsensiData, (newRowsPerPage) => loadAbsensiData(1, newRowsPerPage), absensiRowsPerPage);
        }
    }

    // --- Image Enlargement Modal Logic ---
    document.addEventListener('click', (e) => {
        if (e.target.closest('.enlargeable-image')) {
            e.preventDefault();
            const imageUrl = e.target.closest('.enlargeable-image').href;

            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '10000';
            modal.style.cursor = 'pointer'; // Make modal clickable to close

            const img = document.createElement('img');
            img.src = imageUrl;
            img.style.maxWidth = '90%';
            img.style.maxHeight = '90%';
            img.style.objectFit = 'contain';
            img.style.border = '2px solid white';

            modal.appendChild(img);
            document.body.appendChild(modal);

            modal.onclick = () => {
                document.body.removeChild(modal);
            };
        }
    });
    // --- Event Listeners untuk Filter & Export ---
    // Filter button
    const btnFilter = document.getElementById('btnFilter');
    if (btnFilter) {
        btnFilter.addEventListener('click', () => {
            loadAbsensiData(1); // Reset to page 1 when filtering
        });
    }

    // Export CSV button
    const btnExportCsv = document.getElementById('btnExportCsv');
    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', (e) => handleExport(e, 'csv'));
    }

    // Export PDF button
    const btnExportPdf = document.getElementById('btnExportPdf');
    if (btnExportPdf) {
        btnExportPdf.addEventListener('click', (e) => handleExport(e, 'pdf'));
    }

    // Export Excel button
    const btnExportExcel = document.getElementById('btnExportExcel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', (e) => handleExport(e, 'excel'));
    }

    // Search input - filter on Enter key
    const searchInput = document.getElementById('searchAbsensi');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadAbsensiData(1);
            }
        });
    }

    // --- Fungsi untuk Export (CSV/PDF) ---
    function handleExport(event, type) {
        event.preventDefault();
        
        const from = document.getElementById('dateFrom').value;
        const to = document.getElementById('dateTo').value;
        const q = document.getElementById('searchAbsensi').value.trim();

        const query = new URLSearchParams();
        if (from) query.set('from', from);
        if (to) query.set('to', to);
        if (q) query.set('q', q);
        
        const url = `/api/absensi/export.${type}?${query.toString()}`;
        
        // Membuka URL di tab baru untuk men-download file
        window.open(url, '_blank');
    }

    // --- Logout Handler ---
    const logoutButtons = document.querySelectorAll('#btnLogout');
    if(logoutButtons.length > 0) {
      logoutButtons.forEach(btn => {
        btn.onclick = async (e)=>{
          e.preventDefault();
          console.log('Logout clicked (admin-absensi)');
          try {
            await API.post('/api/logout',{});
            console.log('Logout successful, redirecting...');
            location.href='../login.html';
          } catch (error) {
            console.error('Logout error:', error);
            toast('Gagal logout', 'err');
          }
        };
      });
      console.log(`Logout handler attached to ${logoutButtons.length} buttons (admin-absensi)`);
    }

    // --- Fungsi untuk Mengaktifkan Navbar (Diambil dari admin.js) ---
    function activateAdminNavbar() {
        const navlinks = document.querySelectorAll('.navlinks a');
        const buttons = document.querySelectorAll('.navlinks button');
        
        // Mengubah semua tautan <a> di navbar menjadi tombol modern
        // Code ini memastikan tampilan tombol btn-nav diterapkan di semua halaman
        navlinks.forEach(a => {
            if (a.id !== 'btnLogout') {
                const button = document.createElement('button');
                button.className = a.className.includes('active') ? 'btn-nav active' : 'btn-nav';
                button.textContent = a.textContent;
                button.setAttribute('onclick', `location.href='${a.getAttribute('href')}'`);
                
                // Menggantikan tautan <a> dengan <button>
                a.parentNode.replaceChild(button, a);
            }
        });
    }
});