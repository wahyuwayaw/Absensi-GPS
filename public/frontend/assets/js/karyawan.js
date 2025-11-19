// public/frontend/assets/js/karyawan.js

// --- 1. SETUP & LOGOUT ---

// Logout - Handle all logout buttons (mobile + desktop)
const logoutButtons = document.querySelectorAll('#btnLogout');
if(logoutButtons.length > 0) {
  logoutButtons.forEach(btn => {
    btn.onclick = async (e)=>{
      e.preventDefault();
      console.log('Logout clicked (karyawan)'); // Debug
      try {
        await API.post('/api/logout',{});
        console.log('Logout successful, redirecting...'); // Debug
        location.href = '../login.html';
      } catch (error) {
        console.error('Logout error:', error);
        toast('Gagal logout', 'err');
      }
    };
  });
  console.log(`Logout handler attached to ${logoutButtons.length} buttons (karyawan)`); // Debug
}

// Sapaan dan Status Hari Ini
(async()=>{
  const me = await API.get('/api/me');
  const n = me?.data?.nama || me?.data?.nip || 'Karyawan'; // Fallback ke 'Karyawan'
  if(document.getElementById('hello')) document.getElementById('hello').textContent = 'Halo, ' + n;

  // ...
})();

// Lokasi Kantor
(async()=>{
    const r = await API.get('/api/settings/location');
    const d = r?.data;
    if (d && document.getElementById('officeLocation')) {
         document.getElementById('officeLocation').textContent = `Kantor terletak di Lat: ${d.lat || '-'}, Lng: ${d.lng || '-'} (Radius: ${d.radius || '0'}m).`;
    } else if (document.getElementById('officeLocation')) {
        document.getElementById('officeLocation').textContent = `Gagal memuat lokasi kantor.`;
    }
})();

// --- 2. LOGIKA GEOLOCATION MOCK/ABSEN ---

// Fungsi Mock Lokasi (Untuk pengujian PC)
async function getLocation(){
    // Mengembalikan koordinat HARDCODE/MOCK kantor untuk pengujian PC
    return new Promise((res,rej)=>{
        const mockLat = -6.244035; 
        const mockLng = 106.690876;
        res({lat: mockLat, lng: mockLng});
    });
}

// Absen Masuk
document.getElementById('btnIn').onclick = async ()=>{
  try{
    toast('Memverifikasi lokasi dan check-in...');
    const {lat,lng} = await getLocation(); // Menggunakan lokasi mock
    const r = await API.post('/api/absensi/checkin',{lat,lng});
    if(r.status) toast('Check-in Berhasil!'); else toast(r.message||'Gagal check-in');
    location.reload();
  }catch(err){ 
    toast('Error: Gagal mendapatkan lokasi.'); 
    console.error(err);
  }
};

// Absen Pulang
document.getElementById('btnOut').onclick = async ()=>{
  try{
    toast('Memverifikasi lokasi dan check-out...');
    const {lat,lng} = await getLocation(); // Menggunakan lokasi mock
    const r = await API.post('/api/absensi/checkout',{lat,lng});
    if(r.status) toast('Check-out Berhasil!'); else toast(r.message||'Gagal check-out');
    location.reload();
  }catch(err){ 
    toast('Error: Gagal mendapatkan lokasi.'); 
    console.error(err);
  }
};

// Enroll Wajah
document.getElementById('btnEnroll').onclick = async ()=>{
  const f = document.getElementById('faceFile').files[0]; 
  if(!f) return toast('Pilih foto/ambil dari kamera dulu');
  
  // Fungsi helper untuk konversi file ke base64
  const b64 = await new Promise(res=>{ const fr=new FileReader(); fr.onload=()=>res(fr.result); fr.readAsDataURL(f); });
  
  const me = await API.get('/api/me'); 
  const username = me?.data?.nip || me?.data?.username; // Ambil NIP sebagai username
  
  const r = await API.post('/api/face/enroll',{role:'karyawan',username,image:b64});
  
  if(r.status) toast('Wajah berhasil disimpan!'); else toast(r.message||'Gagal enroll wajah');
};