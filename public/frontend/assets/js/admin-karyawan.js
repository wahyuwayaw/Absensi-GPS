// admin-karyawan.js
document.addEventListener('api-ready', () => {
    const search = document.getElementById('searchInput');
    const tbody = document.querySelector('#tblKaryawan tbody');
    const btnTambah = document.getElementById('btnOpenModalTambahPegawai');
    const modalKaryawan = document.getElementById('modalKaryawan');
    const closeModalBtn = document.getElementById('closeModal');
    const btnBatal = document.getElementById('btnBatal');
    const formKaryawan = document.getElementById('formKaryawan'); // Get form reference

    // Guard jika elemen tidak ada (hindari Cannot set properties of null)
    if (!tbody || !formKaryawan) return;

    let page = 1, lastQuery = '';
    let karyawanRowsPerPage = 10; // Default rows per page

    async function loadKaryawan(p = 1, rowsPerPage = karyawanRowsPerPage) {
      try {
        page = p;
        karyawanRowsPerPage = rowsPerPage;
        const qs = new URLSearchParams({ page: String(page), per_page: String(karyawanRowsPerPage) });
        if (search && search.value) {
          qs.set('q', search.value.trim());
          lastQuery = search.value.trim();
        } else lastQuery = '';

        const { data } = await API.get('/api/karyawan?' + qs.toString());
        console.log('Karyawan API Response:', data); // Debugging line
        render(data.data.data || []);
        renderPagination(q('#pagination'), data.data, loadKaryawan, (newRowsPerPage) => loadKaryawan(1, newRowsPerPage), karyawanRowsPerPage);
      } catch (e) {
        render([], true);
        console.error('loadKaryawan failed:', e);
      }
    }

    function render(rows, isError = false) {
      console.log('Rendering Karyawan with rows:', rows); // Debugging line
      if (!rows.length) {
        tbody.innerHTML = `<tr><td class="td-text-center" colspan="7">${
          isError ? 'Gagal memuat data.' : 'Tidak ada data karyawan.'
        }</td></tr>`;
        return;
      }
      tbody.innerHTML = rows.map((r) => `
        <tr>
          <td>${r.nip || '-'}</td>
          <td>${r.nama_lengkap || '-'}</td>
          <td>${r.jabatan || '-'}</td>
          <td>${r.departemen || '-'}</td>
          <td><span class="badge ${r.status === 'aktif' ? 'approved' : 'rejected'}">${r.status || '-'}</span></td>
          <td>
            <button class="btn btn-sm btn-primary" data-id="${r.id}" data-act="edit">Edit</button>
            <button class="btn btn-sm btn-danger" data-id="${r.id}" data-act="hapus">Hapus</button>
          </td>
        </tr>
      `).join('');
      // binding aksi secukupnya
      tbody.querySelectorAll('button[data-id]').forEach((b) => {
        b.onclick = async () => {
          const id = b.getAttribute('data-id');
          const act = b.getAttribute('data-act');

          if (act === 'hapus') {
            if (!confirm('Apakah Anda yakin ingin menghapus karyawan ini?')) return;
            try {
              const res = await API.req(`/api/karyawan/${id}`, { method: 'DELETE' });
              if (res.ok) {
                toast('Karyawan berhasil dihapus.');
                loadKaryawan(page); // Muat ulang halaman saat ini
              } else {
                toast(res.data?.message || 'Gagal menghapus karyawan.', 'err');
              }
            } catch (e) {
              console.error('Error deleting karyawan:', e);
              toast('Terjadi kesalahan saat menghapus karyawan.', 'err');
            }
          } else if (act === 'edit') {
            // Load karyawan data and populate form
            try {
              const res = await API.get(`/api/karyawan/${id}`);
              if (res.ok && res.data.data) {
                const k = res.data.data;
                document.getElementById('karyawanId').value = k.id;
                document.getElementById('nip').value = k.nip || '';
                document.getElementById('nip').readOnly = true; // ✅ NIP cannot be changed
                document.getElementById('nama_lengkap').value = k.nama_lengkap || '';
                document.getElementById('jabatan').value = k.jabatan || '';
                document.getElementById('departemen').value = k.departemen || '';
                document.getElementById('email').value = k.email || '';
                document.getElementById('password').value = ''; // Don't show password
                document.getElementById('password').placeholder = 'Kosongkan jika tidak ingin mengubah password';
                document.getElementById('tanggal_gabung').value = k.tanggal_gabung || '';
                document.getElementById('status').value = k.status || 'aktif';
                document.getElementById('gaji_pokok').value = k.gaji_pokok || 2000000;
                document.getElementById('tanggal_gajian').value = k.tanggal_gajian || 25;
                
                document.getElementById('modalTitle').textContent = 'Edit Karyawan';
                modalKaryawan.style.display = 'flex';
              } else {
                toast('Gagal memuat data karyawan.', 'err');
              }
            } catch (e) {
              console.error('Error loading karyawan:', e);
              toast('Terjadi kesalahan saat memuat data karyawan.', 'err');
            }
          }
        };
      });
    }

    // Fungsi untuk membuka modal
    function openModal() {
      modalKaryawan.style.display = 'flex';
      document.getElementById('modalTitle').textContent = 'Tambah Karyawan';
      formKaryawan.reset(); // Clear form fields
      document.getElementById('karyawanId').value = ''; // Clear hidden ID
      document.getElementById('nip').readOnly = false; // ✅ NIP can be entered for new karyawan
      document.getElementById('password').placeholder = 'Password';
    }

    // Fungsi untuk menutup modal
    function closeModal() {
      modalKaryawan.style.display = 'none';
    }

    // Event Listeners
    if (btnTambah) btnTambah.onclick = openModal;
    if (closeModalBtn) closeModalBtn.onclick = closeModal;
    if (btnBatal) btnBatal.onclick = closeModal;

    // Form submission for adding/editing karyawan
    formKaryawan.addEventListener('submit', async (e) => {
      e.preventDefault(); // Prevent default form submission

      const karyawanId = document.getElementById('karyawanId').value;
      const nip = document.getElementById('nip').value.trim();
      const nama_lengkap = document.getElementById('nama_lengkap').value.trim();
      const jabatan = document.getElementById('jabatan').value.trim();
      const departemen = document.getElementById('departemen').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      const tanggal_gabung = document.getElementById('tanggal_gabung').value;
      const status = document.getElementById('status').value;
      const gaji_pokok = document.getElementById('gaji_pokok').value;
      const tanggal_gajian = document.getElementById('tanggal_gajian').value;

      let payload;
      
      if (karyawanId) {
        // For update, only send fields that can be updated
        payload = {
          nama_lengkap,
          jabatan,
          departemen,
          email: email || null,
          status,
          tanggal_gabung: tanggal_gabung || null,
          gaji_pokok: gaji_pokok ? parseInt(gaji_pokok) : null,
          tanggal_gajian: tanggal_gajian ? parseInt(tanggal_gajian) : null
        };
      } else {
        // For create, send all fields including NIP and password
        payload = {
          nip,
          nama_lengkap,
          jabatan,
          departemen,
          email: email || null,
          password: password || null,
          tanggal_gabung: tanggal_gabung || null,
          status,
          gaji_pokok: gaji_pokok ? parseInt(gaji_pokok) : 2000000,
          tanggal_gajian: tanggal_gajian ? parseInt(tanggal_gajian) : 25
        };
      }

      try {
        let res;
        if (karyawanId) {
          // Update existing karyawan
          console.log('Updating karyawan ID:', karyawanId);
          console.log('Update payload:', payload);
          res = await API.req(`/api/karyawan/${karyawanId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('Update response:', res);
        } else {
          // Create new karyawan
          console.log('Creating new karyawan');
          console.log('Create payload:', payload);
          res = await API.post('/api/karyawan', payload);
          console.log('Create response:', res);
        }

        if (res.ok && res.data.status) {
          const successMsg = karyawanId ? 'Karyawan berhasil diupdate.' : 'Karyawan berhasil ditambahkan.';
          toast(successMsg);
          console.log('Save successful, updated data:', res.data.data);
          closeModal();
          loadKaryawan(page); // Reload current page
        } else {
          toast(res.data?.message || 'Gagal menyimpan karyawan.', 'err');
          console.error('Save failed:', res.data);
        }
      } catch (error) {
        console.error('Error saving karyawan:', error);
        toast('Terjadi kesalahan saat menyimpan karyawan.', 'err');
      }
    });

    if (search) {
      let t;
      search.oninput = () => {
        clearTimeout(t);
        t = setTimeout(() => loadKaryawan(1), 300);
      };
    }

    // Initial load
    loadKaryawan(1);
  });