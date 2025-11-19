document.addEventListener('api-ready', () => {
  (async function init(){
    // Check if user is authenticated as admin
    try {
      console.log('===== ADMIN DASHBOARD AUTH CHECK =====');
      console.log('Current URL:', window.location.href);
      console.log('Current cookies:', document.cookie);
      
      const me = await API.get('/api/me');
      console.log('API /me response:', me);
      console.log('me.ok:', me.ok);
      console.log('me.data:', me.data);
      console.log('me.data.data:', me.data.data);
      
      if (!me.ok || !me.data.data) {
        console.error('===== AUTH FAILED =====');
        console.error('No user data, redirecting to login');
        console.error('Cookies:', document.cookie);
        console.error('Expected: laravel_session=... but got:', document.cookie);
        toast('Sesi tidak valid. Silakan login kembali.', 'err');
        
        // Show alert for mobile debugging
        alert('SESI TIDAK VALID!\n\nCookies: ' + document.cookie + '\n\nme.data.data: ' + JSON.stringify(me.data.data));
        
        setTimeout(() => location.href = '../login.html', 3000);
        return;
      }
      
      const userData = me.data.data;
      console.log('User data:', userData, 'Role:', userData.role);
      
      // Check role - must be admin
      if (!userData.role || userData.role !== 'admin') {
        console.error('Not admin (role=' + userData.role + '), redirecting to login');
        toast('Akses ditolak. Halaman ini hanya untuk admin.', 'err');
        setTimeout(() => location.href = '../login.html', 1500);
        return;
      }
      
      console.log('User authenticated as admin');
    } catch (error) {
      console.error('Auth check error:', error);
      toast('Gagal memeriksa autentikasi. Silakan login kembali.', 'err');
      setTimeout(() => location.href = '../login.html', 1000);
      return;
    }

    // KPI
    const r = await API.get('/api/dashboard/rekap');
    console.log('Dashboard Rekap API Response:', r); // Debugging line
    if(r.ok && r.data.status){ // PERBAIKAN: Cek r.data.status dan ambil dari r.data
        const d = r.data.data;
        qs('#kpiHadir').textContent = (d.hadir ?? '0') + ' / ' + (d.total_karyawan ?? '0');
        qs('#kpiAbsen').textContent = d.absen ?? '0';
        qs('#kpiCuti').textContent = d.cuti ?? '0';
    }

    // Weekly chart
    const w = await API.get('/api/dashboard/weekly');
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    if(window.Chart) Chart.defaults.animation = false;
    new Chart(ctx,{type:'bar',
      data:{labels:['Sen','Sel','Rab','Kam','Jum','Sab','Min'],datasets:[{data:w.ok?w.data.data:[0,0,0,0,0,0,0],backgroundColor:'rgba(45,125,255,0.7)',borderRadius:8}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false}},y:{grid:{color:'rgba(255,255,255,.06)'},ticks:{precision:0,color:'#aab0bb'}}}}
    });

    // Notif pending
    const p = await API.get('/api/permohonan/pending');
    console.log('Pending Permohonan API Response:', p); // Debugging line
    console.log('Pending Permohonan API Response:', p); // Debugging line
    const tb = qs('#tblNotif tbody'); tb.innerHTML='';
    const pendingPermohonans = p.data?.data?.data || [];
    if(p.ok && p.data.status && Array.isArray(pendingPermohonans) && pendingPermohonans.length > 0){
      pendingPermohonans.forEach(x=>{
        const tr=document.createElement('tr');
        tr.innerHTML = `
          <td>${x.created_at?.slice(0,10)||'-'}</td>
          <td>${x.nama_lengkap||'-'}</td>
          <td><span class="badge bg-info">${x.tipe?.toUpperCase()}</span></td>
          <td>${x.bukti_path?`<a href="/storage/${x.bukti_path}" target="_blank">Bukti</a>`:'-'}</td>
          <td class="td-flex-gap-6">
            <button class="btn btn-primary" data-act="approve" data-id="${x.id}">Approve</button>
            <button class="btn btn-danger" data-act="reject" data-id="${x.id}">Tolak</button>
          </td>`;
        tb.appendChild(tr);
      });
    }else{
      tb.innerHTML = `<tr><td colspan="5" class="small td-text-center td-small-muted">Tidak ada permohonan pending.</td></tr>`;
    }

    tb.addEventListener('click', async (e)=>{
      const btn=e.target.closest('button'); if(!btn) return;
      const id=btn.dataset.id, action=btn.dataset.act;
      const note= action==='reject' ? prompt('Catatan penolakan (opsional):','') : '';
      if (action === 'reject' && note === null) return; // Batal jika user klik cancel di prompt

      const v = await API.post('/api/permohonan/verify',{id,action,note});
      if(!v.ok || v.data.status===false){ toast(v.data.message||'Gagal verifikasi','err'); return; }
      toast('Tersimpan'); btn.closest('tr').remove();
      // Jika setelah remove tidak ada lagi notif, tampilkan pesan
      if (tb.children.length === 0) {
        tb.innerHTML = `<tr><td colspan="5" class="small td-text-center td-small-muted">Tidak ada permohonan pending.</td></tr>`;
      }
    });

    // Logout - Handle all logout buttons (mobile + desktop)
    const logoutButtons = document.querySelectorAll('#btnLogout');
    if(logoutButtons.length > 0) {
      logoutButtons.forEach(btn => {
        btn.onclick = async (e)=>{
          e.preventDefault();
          console.log('Logout clicked (admin-index)');
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
      console.log(`Logout handler attached to ${logoutButtons.length} buttons (admin-index)`);
    }
  })();
  function qs(s){return document.querySelector(s)}
});