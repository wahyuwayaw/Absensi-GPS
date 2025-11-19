document.addEventListener('api-ready', () => {
    const tblPermohonanBody = document.querySelector('#tblPermohonan tbody');

    let currentPermohonanPage = 1;
    let permohonanRowsPerPage = 10;

    async function loadPermohonanHistory(page = 1, rowsPerPage = permohonanRowsPerPage) {
        currentPermohonanPage = page;
        permohonanRowsPerPage = rowsPerPage;
        const qs = new URLSearchParams({ page: String(currentPermohonanPage), per_page: String(permohonanRowsPerPage) });

        try { // Moved try block inside the function
            const historyRes = await API.get('/api/karyawan/permohonan?' + qs.toString());
            if (historyRes.ok && historyRes.data.status && Array.isArray(historyRes.data.data.data)) {
                tblPermohonanBody.innerHTML = historyRes.data.data.data.map(p => `
                    <tr>
                        <td>${p.created_at?.slice(0,10) || '-'}</td>
                        <td>${p.tipe || '-'}</td>
                        <td>${p.tanggal_mulai || '-'}</td>
                        <td>${p.tanggal_selesai || '-'}</td>
                        <td>${p.alasan || '-'}</td>
                        <td><span class="badge ${p.status === 'approved' ? 'approved' : (p.status === 'rejected' ? 'rejected' : 'pending')}">${p.status.toUpperCase()}</span></td>
                        <td>${p.catatan_admin || '-'}</td>
                        <td>${p.bukti_path ? `<a href="/storage/${p.bukti_path}" target="_blank">Lihat Bukti</a>` : '-'}</td>
                    </tr>
                `).join('');
                renderPagination(q('#pagination'), historyRes.data.data, loadPermohonanHistory, (newRowsPerPage) => loadPermohonanHistory(1, newRowsPerPage), permohonanRowsPerPage);
            } else {
                tblPermohonanBody.innerHTML = `<tr><td colspan="8" class="td-text-center td-small-muted">Tidak ada riwayat permohonan.</td></tr>`;
                renderPagination(q('#pagination'), { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 }, loadPermohonanHistory, (newRowsPerPage) => loadPermohonanHistory(1, newRowsPerPage), permohonanRowsPerPage);
            }
        } catch (error) { // Moved catch block inside the function
            console.error('loadPermohonanHistory failed:', error);
            toast('Gagal memuat riwayat permohonan.', 'err');
            tblPermohonanBody.innerHTML = `<tr><td colspan="8" class="td-text-center td-small-muted">Gagal memuat riwayat permohonan.</td></tr>`;
            renderPagination(q('#pagination'), { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 }, loadPermohonanHistory, (newRowsPerPage) => loadPermohonanHistory(1, newRowsPerPage), permohonanRowsPerPage);
        }
    }

    // Initial load
    loadPermohonanHistory();

    // Modal controls
    const btnTambahPermohonan = document.getElementById('btnTambahPermohonan');
    const modalPermohonan = document.getElementById('modalPermohonan');
    const closeModalPermohonan = document.getElementById('closeModalPermohonan');
    const btnBatalPermohonan = document.getElementById('btnBatalPermohonan');
    const formPermohonan = document.getElementById('formPermohonan');

    if (btnTambahPermohonan) {
        btnTambahPermohonan.addEventListener('click', () => {
            modalPermohonan.style.display = 'flex';
        });
    }

    if (closeModalPermohonan) {
        closeModalPermohonan.addEventListener('click', () => {
            modalPermohonan.style.display = 'none';
            formPermohonan.reset();
        });
    }

    if (btnBatalPermohonan) {
        btnBatalPermohonan.addEventListener('click', () => {
            modalPermohonan.style.display = 'none';
            formPermohonan.reset();
        });
    }

    // Close modal when clicking outside
    if (modalPermohonan) {
        modalPermohonan.addEventListener('click', (e) => {
            if (e.target === modalPermohonan) {
                modalPermohonan.style.display = 'none';
                formPermohonan.reset();
            }
        });
    }

    // Form submission
    if (formPermohonan) {
        formPermohonan.addEventListener('submit', async (e) => {
            e.preventDefault();

            const tipe = document.getElementById('tipe').value;
            const tanggalMulai = document.getElementById('tanggal_mulai').value;
            const tanggalSelesai = document.getElementById('tanggal_selesai').value;
            const alasan = document.getElementById('alasan').value.trim();
            const buktiFile = document.getElementById('bukti').files[0];

            // Validate dates
            if (new Date(tanggalSelesai) < new Date(tanggalMulai)) {
                toast('Tanggal selesai tidak boleh lebih awal dari tanggal mulai.', 'err');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('tipe', tipe);
                formData.append('tanggal_mulai', tanggalMulai);
                formData.append('tanggal_selesai', tanggalSelesai);
                formData.append('alasan', alasan);
                if (buktiFile) {
                    formData.append('bukti', buktiFile);
                }

                const res = await API.req('/api/karyawan/permohonan', {
                    method: 'POST',
                    body: formData
                });

                if (res.ok && res.data.status) {
                    toast('Permohonan berhasil diajukan.');
                    modalPermohonan.style.display = 'none';
                    formPermohonan.reset();
                    loadPermohonanHistory(1); // Reload data
                } else {
                    toast(res.data?.message || 'Gagal mengajukan permohonan.', 'err');
                }
            } catch (error) {
                console.error('Error submitting permohonan:', error);
                toast('Terjadi kesalahan saat mengajukan permohonan.', 'err');
            }
        });
    }

    function qs(s){return document.querySelector(s)}
});