document.addEventListener('api-ready', () => {
  // --- 1. CORE & LOGOUT ---
  (async()=>{
      const me = await API.get('/api/me');
      const n = me?.data?.data?.nama || me?.data?.data?.username;
      if(n && document.getElementById('adminName')) {
        document.getElementById('adminName').textContent = n;
      }
      
      // LOGIKA MODAL TAMBAH KARYAWAN
      const modal = document.getElementById('modalTambahKaryawan');
      const btnOpen = document.getElementById('btnOpenModalTambah'); 
      const formTambah = document.getElementById('formTambahKaryawan');
      
      if (btnOpen) btnOpen.onclick = () => { if(modal) modal.style.display = 'block'; };
      
      if(formTambah) formTambah.onsubmit = async (e) => {
          e.preventDefault();
          const formData = new FormData(formTambah);
          const data = Object.fromEntries(formData.entries());
          const btn = formTambah.querySelector('button[type="submit"]');
          btn.disabled = true;
    
          const res = await API.post('/api/karyawan', data);
          btn.disabled = false;
    
          if (res.ok && res.data.status) {
              const cred = res.data.data.credential;
              alert(`Karyawan Berhasil Didaftarkan!\nNIP: ${cred.username}\nPassword: ${cred.password}`);
              if(modal) modal.style.display = 'none';
              formTambah.reset(); 
              if(typeof loadKaryawan === 'function') {
                loadKaryawan(); // Jika ada fungsi loadKaryawan, panggil lagi
              } else {
                location.reload(); 
              }
          } else {
              const errorMessages = Object.values(res.data.errors || {}).join('\n');
              toast(res.data.message || errorMessages || 'Gagal mendaftarkan karyawan.', 'err');
          }
      };
    
    })();
    
    // Logout - Handle all logout buttons (mobile + desktop)
    const logoutButtons = document.querySelectorAll('#btnLogout');
    if(logoutButtons.length > 0) {
      logoutButtons.forEach(btn => {
        btn.onclick = async (e)=>{
          e.preventDefault();
          console.log('Logout clicked'); // Debug
          try {
            await API.post('/api/logout',{});
            console.log('Logout successful, redirecting...'); // Debug
            // Sesuaikan path ke login.html berdasarkan lokasi file saat ini
            if (window.location.pathname.includes('/admin/')) {
              window.location.href = '../login.html';
            } else {
              window.location.href = 'login.html';
            }
          } catch (error) {
            console.error('Logout error:', error);
            toast('Gagal logout', 'err');
          }
        };
      });
      console.log(`Logout handler attached to ${logoutButtons.length} buttons`); // Debug
    }
});
