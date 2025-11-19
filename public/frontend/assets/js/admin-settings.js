document.addEventListener('api-ready', () => {
  // Logout - Handle all logout buttons (mobile + desktop)
  const logoutButtons = document.querySelectorAll('#btnLogout');
  if(logoutButtons.length > 0) {
    logoutButtons.forEach(btn => {
      btn.onclick = async (e)=>{
        e.preventDefault();
        console.log('Logout clicked (admin-settings)');
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
    console.log(`Logout handler attached to ${logoutButtons.length} buttons (admin-settings)`);
  }

  (async () => {
    const me = await API.get('/api/me');
    q('#adminNamaInput').value = me?.data?.data?.nama || '';
    q('#adminUsernameInput').value = me?.data?.data?.username || '';
  })();

  q('#formAdminProfile').onsubmit = async (e) => {
    e.preventDefault();
    const r = await API.put('/api/admin/profile', {
      nama: q('#adminNamaInput').value,
      username: q('#adminUsernameInput').value
    });
    
    if (r.ok && r.data.status) {
      toast('Profil berhasil diupdate');
    } else {
      toast(r.data?.message || 'Gagal mengupdate profil', 'err');
    }
  };

  q('#formAdminPassword').onsubmit = async (e) => {
    e.preventDefault();
    const current = q('[name="current"]').value;
    const newPass = q('[name="new"]').value;
    const confirm = q('[name="confirm"]').value;
    
    if (newPass !== confirm) {
      toast('Password baru dan konfirmasi tidak sama', 'err');
      return;
    }
    
    const r = await API.put('/api/admin/profile/password', {
      current: current,
      new: newPass
    });
    
    if (r.ok && r.data.status) {
      toast('Password berhasil diubah');
      q('#formAdminPassword').reset();
    } else {
      toast(r.data?.message || 'Gagal mengubah password', 'err');
    }
  };

  q('#btnHealthCheck').onclick = async () => {
    const statusDiv = q('#healthStatus');
    statusDiv.style.display = 'block';
    statusDiv.textContent = 'Checking server health...';
    
    try {
      const r = await API.get('/api/admin/health');
      statusDiv.textContent = JSON.stringify(r?.data || r, null, 2);
      statusDiv.style.background = '#f0fdf4';
      statusDiv.style.borderLeft = '4px solid #10B981';
    } catch (error) {
      statusDiv.textContent = 'Error: ' + error.message;
      statusDiv.style.background = '#fef2f2';
      statusDiv.style.borderLeft = '4px solid #EF4444';
    }
  };

  q('#btnLogoutAll').onclick = async () => {
    const r = await API.post('/api/admin/sessions/logout-all', {});
    r.status ? toast('Semua sesi logout') : toast(r.message || 'Gagal');
  };

  // Load payroll settings
  async function loadPayrollSettings() {
    try {
      const r = await API.get('/api/settings');
      if (r.ok && r.data.status) {
        const settings = r.data.data;
        q('#potonganTelat15').value = settings.potongan_telat_15 || 20000;
        q('#potonganTelat30').value = settings.potongan_telat_30 || 35000;
        // potongan_tidak_masuk dihitung otomatis, tidak perlu load
        q('#bonusLemburPerjam').value = settings.bonus_lembur_perjam || 50000;
        q('#gajiDefaultStaff').value = settings.gaji_default_staff || 2000000;
        q('#gajiDefaultKepalaCabang').value = settings.gaji_default_kepala_cabang || 2500000;
        q('#tanggalGajianDefault').value = settings.tanggal_gajian_default || 25;
      }
    } catch (error) {
      console.error('Error loading payroll settings:', error);
    }
  }

  // Save payroll settings
  q('#formPayrollSettings').onsubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      potongan_telat_15: parseInt(q('#potonganTelat15').value),
      potongan_telat_30: parseInt(q('#potonganTelat30').value),
      // potongan_tidak_masuk dihitung otomatis, tidak perlu save
      bonus_lembur_perjam: parseInt(q('#bonusLemburPerjam').value),
      gaji_default_staff: parseInt(q('#gajiDefaultStaff').value),
      gaji_default_kepala_cabang: parseInt(q('#gajiDefaultKepalaCabang').value),
      tanggal_gajian_default: parseInt(q('#tanggalGajianDefault').value)
    };

    try {
      const r = await API.put('/api/settings', payload);
      if (r.ok && r.data.status) {
        toast('Pengaturan gaji berhasil disimpan!', 'success');
      } else {
        toast(r.data?.message || 'Gagal menyimpan pengaturan', 'err');
      }
    } catch (error) {
      console.error('Error saving payroll settings:', error);
      toast('Terjadi kesalahan saat menyimpan', 'err');
    }
  };

  // Load payroll settings on page load
  loadPayrollSettings();
});