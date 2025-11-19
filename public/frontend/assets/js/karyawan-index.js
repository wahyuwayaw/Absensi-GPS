document.addEventListener('api-ready', async () => {
  // Check if user is authenticated as karyawan
  try {
    console.log('===== KARYAWAN DASHBOARD AUTH CHECK =====');
    console.log('Current URL:', window.location.href);
    console.log('Current cookies:', document.cookie);
    
    const meRes = await API.get('/api/me');
    console.log('API /me response:', meRes);
    console.log('meRes.ok:', meRes.ok);
    console.log('meRes.data:', meRes.data);
    console.log('meRes.data.data:', meRes.data.data);
    
    if (!meRes.ok || !meRes.data.data) {
      console.error('===== AUTH FAILED =====');
      console.error('No user data, redirecting to login');
      console.error('Cookies:', document.cookie);
      console.error('Expected: laravel_session=... but got:', document.cookie);
      toast('Sesi tidak valid. Silakan login kembali.', 'err');
      
      // Show alert for mobile debugging
      alert('SESI TIDAK VALID!\n\nCookies: ' + document.cookie + '\n\nmeRes.data.data: ' + JSON.stringify(meRes.data.data));
      
      setTimeout(() => location.href = '../login.html', 3000);
      return;
    }
    
    const userData = meRes.data.data;
    console.log('User data:', userData, 'Role:', userData.role);
    
    // Check role - must be karyawan
    if (!userData.role || userData.role !== 'karyawan') {
      console.error('Not karyawan (role=' + userData.role + '), redirecting to login');
      toast('Akses ditolak. Halaman ini hanya untuk karyawan.', 'err');
      setTimeout(() => location.href = '../login.html', 1500);
      return;
    }
    
    console.log('User authenticated as karyawan');
  } catch (error) {
    console.error('Auth check error:', error);
    toast('Gagal memeriksa autentikasi. Silakan login kembali.', 'err');
    setTimeout(() => location.href = '../login.html', 1000);
    return;
  }

  const digitalClock = document.getElementById('digitalClock');
  const btnCheckin = document.getElementById('btnCheckin');
  const btnCheckout = document.getElementById('btnCheckout');
  const statusHariIniEl = document.getElementById('statusHariIni');
  const tblRiwayatTerbaruBody = document.querySelector('#tblRiwayatTerbaru tbody');
  const userAvatar = document.getElementById('userAvatar');
  const userAvatarDropdown = document.getElementById('userAvatarDropdown');
  const btnLogout = document.getElementById('btnLogout');

  // Permohonan Form Elements
  const formPermohonanDashboard = document.getElementById('formPermohonanDashboard');
  const tipePermohonanDashboard = document.getElementById('tipePermohonanDashboard');
  const tanggalMulaiDashboard = document.getElementById('tanggalMulaiDashboard');
  const tanggalSelesaiDashboard = document.getElementById('tanggalSelesaiDashboard');
  const alasanPermohonanDashboard = document.getElementById('alasanPermohonanDashboard');
  const buktiPermohonanDashboard = document.getElementById('buktiPermohonanDashboard');

  const tblRiwayatPermohonanTerbaruBody = document.querySelector('#tblRiwayatPermohonanTerbaru tbody');


  let currentUser = null; // To store current user data

  // --- Helper function to querySelector ---
  function qs(s){return document.querySelector(s)}

  // --- Digital Clock ---
  function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    digitalClock.textContent = `${hours}:${minutes}:${seconds}`;
  }
  setInterval(updateClock, 1000);
  updateClock(); // Initial call

  // --- User Avatar Dropdown Logic ---
  userAvatar.addEventListener('click', () => {
      userAvatarDropdown.classList.toggle('show');
  });
  // Close dropdown if clicked outside
  window.addEventListener('click', (e) => {
      if (!userAvatar.contains(e.target) && !userAvatarDropdown.contains(e.target)) {
          userAvatarDropdown.classList.remove('show');
      }
  });

  // --- Load User Data for Avatar ---
  async function loadUserData() {
      try {
          // Get full profile data including photo
          const profileRes = await API.get('/api/karyawan/profile');
          if (profileRes.ok && profileRes.data.data) {
              const profile = profileRes.data.data;
              currentUser = profile;
              
              if (profile.nama_lengkap) {
                  const initials = profile.nama_lengkap.charAt(0).toUpperCase();
                  
                  // Check if user has profile photo
                  if (profile.foto_profil) {
                      userAvatar.style.backgroundImage = `url('${profile.foto_profil}')`;
                      userAvatar.style.backgroundSize = 'cover';
                      userAvatar.style.backgroundPosition = 'center';
                      userAvatar.textContent = ''; // Clear initials
                  } else {
                      userAvatar.style.backgroundImage = 'none';
                      userAvatar.textContent = initials;
                  }
              } else {
                  userAvatar.style.backgroundImage = 'none';
                  userAvatar.textContent = '?';
              }
          } else {
              // Fallback to /api/me if profile endpoint fails
              const meRes = await API.get('/api/me');
              if (meRes.ok && meRes.data.data) {
                  currentUser = meRes.data.data;
                  const initials = currentUser.nama_lengkap ? currentUser.nama_lengkap.charAt(0).toUpperCase() : '?';
                  userAvatar.style.backgroundImage = 'none';
                  userAvatar.textContent = initials;
              }
          }
      } catch (error) {
          console.error('Error loading user data:', error);
          userAvatar.textContent = '?';
      }
  }

  // --- Load Today's Status ---
  async function loadTodayStatus() {
    try {
      const todayRes = await API.get('/api/karyawan/today');
      console.log('Today status response:', todayRes); // Debug
      if (todayRes.ok && todayRes.data.status) {
      const data = todayRes.data.data;
      if (data) {
        statusHariIniEl.textContent = data.status ? data.status.toUpperCase() : 'BELUM ABSEN';
        btnCheckin.disabled = !!data.waktu_masuk; // Disable if already checked in
        btnCheckout.disabled = !data.waktu_masuk || !!data.waktu_pulang; // Disable if not checked in or already checked out
      } else {
        statusHariIniEl.textContent = 'BELUM ABSEN';
        btnCheckin.disabled = false;
        btnCheckout.disabled = true;
      }
      } else {
        console.error('Failed to load today status:', todayRes.data);
        toast(todayRes.data?.message || 'Gagal memuat status hari ini.', 'err');
        btnCheckin.disabled = true;
        btnCheckout.disabled = true;
      }
    } catch (error) {
      console.error('Error loading today status:', error);
      toast('Gagal memuat status. Silakan refresh halaman.', 'err');
      btnCheckin.disabled = true;
      btnCheckout.disabled = true;
    }
  }

  // --- Load Latest History ---
  async function loadLatestHistory() {
    try {
      const historyRes = await API.get('/api/karyawan/absensi?days=7'); // Last 7 days
      console.log('History response:', historyRes); // Debug
      if (historyRes.ok && historyRes.data.status && Array.isArray(historyRes.data.data)) {
      tblRiwayatTerbaruBody.innerHTML = historyRes.data.data.slice(0, 5).map(a => `
        <tr>
          <td>${a.tanggal || '-'}</td>
          <td>${a.waktu_masuk || '-'}</td>
          <td>${a.waktu_pulang || '-'}</td>
        </tr>
      `).join('');
      } else {
        console.error('Failed to load history:', historyRes.data);
        tblRiwayatTerbaruBody.innerHTML = `<tr><td colspan="3" class="td-text-center td-small-muted">Tidak ada riwayat absensi.</td></tr>`;
      }
    } catch (error) {
      console.error('Error loading history:', error);
      tblRiwayatTerbaruBody.innerHTML = `<tr><td colspan="3" class="td-text-center td-small-muted">Gagal memuat riwayat.</td></tr>`;
    }
  }

  // --- Load Latest Permohonan History ---
  async function loadLatestPermohonanHistory() {
    const permohonanRes = await API.get('/api/karyawan/permohonan?per_page=5'); // Get latest 5 applications
    if (permohonanRes.ok && permohonanRes.data.status && Array.isArray(permohonanRes.data.data.data)) {
        tblRiwayatPermohonanTerbaruBody.innerHTML = permohonanRes.data.data.data.map(p => `
            <tr>
                <td>${p.tipe || '-'}</td>
                <td><span class="badge ${p.status === 'approved' ? 'approved' : (p.status === 'rejected' ? 'rejected' : 'pending')}">${p.status.toUpperCase()}</span></td>
            </tr>
        `).join('');
    } else {
        tblRiwayatPermohonanTerbaruBody.innerHTML = `<tr><td colspan="2" class="td-text-center td-small-muted">Tidak ada permohonan.</td></tr>`;
    }
  }

  // --- Permohonan Form Submission Logic (Integrated from permohonan.js) ---
  formPermohonanDashboard.addEventListener('submit', async (e) => {
      e.preventDefault();

      const tipe = tipePermohonanDashboard.value;
      const tanggal_mulai = tanggalMulaiDashboard.value;
      const tanggal_selesai = tanggalSelesaiDashboard.value;
      const alasan = alasanPermohonanDashboard.value.trim();
      const buktiFile = buktiPermohonanDashboard.files[0];

      const formData = new FormData();
      formData.append('tipe', tipe);
      formData.append('tanggal_mulai', tanggal_mulai);
      if (tanggal_selesai) formData.append('tanggal_selesai', tanggal_selesai);
      if (alasan) formData.append('alasan', alasan);
      if (buktiFile) formData.append('bukti', buktiFile);

      try {
          const res = await API.postForm('/api/karyawan/permohonan', formData); // Use postForm for FormData
          if (res.ok && res.data.status) {
              toast('Permohonan berhasil diajukan.');
              formPermohonanDashboard.reset(); // Clear form fields
              loadLatestPermohonanHistory(); // Reload latest permohonan history
          } else {
              toast(res.data?.message || 'Gagal mengajukan permohonan.', 'err');
          }
      } catch (error) {
          console.error('Error submitting permohonan:', error);
          toast('Terjadi kesalahan saat mengajukan permohonan.', 'err');
      }
  });


  // --- Helper function to get geolocation ---
  function getGeolocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            console.error('===== GPS ERROR =====');
            console.error('Error getting geolocation:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            let errorMessage = 'Gagal mendapatkan lokasi.';
            let errorDetails = '';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Akses lokasi ditolak!';
                errorDetails = 'Klik icon 🔒 di address bar → Izinkan lokasi';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'GPS tidak tersedia!';
                errorDetails = 'Pastikan GPS aktif di HP. Coba keluar ruangan (outdoor) untuk sinyal GPS lebih baik.';
                break;
              case error.TIMEOUT:
                errorMessage = 'GPS timeout!';
                errorDetails = 'GPS tidak dapat lokasi dalam 30 detik. Coba lagi di tempat terbuka.';
                break;
              default:
                errorMessage = 'Error GPS tidak diketahui.';
                errorDetails = 'Code: ' + error.code + ', Message: ' + error.message;
                break;
            }
            
            console.error('Error message:', errorMessage);
            console.error('Error details:', errorDetails);
            
            reject(errorMessage + '\n\n' + errorDetails);
          },
          { 
            enableHighAccuracy: true,  // Changed to true for better GPS accuracy
            timeout: 30000,            // Increased to 30 seconds
            maximumAge: 10000          // Allow cached position up to 10 seconds old
          }
        );
      } else {
        reject('Geolocation tidak didukung oleh browser Anda.');
      }
    });
  }

  // --- Helper function to capture face image (Interactive Version) ---
  async function captureFaceImage() {
    console.log('captureFaceImage: Function started');
    let stream = null;
    let video = null;
    let canvas = null;
    let cameraContainer = null;
    let takePhotoButton = null;
    let cancelButton = null;
    let sendPhotoButton = null;
    let retakePhotoButton = null;

    const cleanup = () => {
      console.log('Performing cleanup...');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (cameraContainer && cameraContainer.parentNode === document.body) {
        document.body.removeChild(cameraContainer);
      }
    };

    return new Promise(async (resolve, reject) => {
      try {
        console.log('captureFaceImage: Requesting camera access...');
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        console.log('captureFaceImage: Camera access granted, stream obtained');

        cameraContainer = document.createElement('div');
        cameraContainer.id = 'camera-container';
        cameraContainer.style.position = 'fixed';
        cameraContainer.style.top = '0';
        cameraContainer.style.left = '0';
        cameraContainer.style.width = '100%';
        cameraContainer.style.height = '100%';
        cameraContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
        cameraContainer.style.display = 'flex';
        cameraContainer.style.flexDirection = 'column';
        cameraContainer.style.justifyContent = 'center';
        cameraContainer.style.alignItems = 'center';
        cameraContainer.style.zIndex = '9999';
        document.body.appendChild(cameraContainer);

        video = document.createElement('video');
        video.style.width = '80%';
        video.style.maxWidth = '640px';
        video.style.height = 'auto';
        video.style.backgroundColor = 'black';
        video.style.marginBottom = '10px';
        cameraContainer.appendChild(video);

        video.srcObject = stream;
        await video.play();

        canvas = document.createElement('canvas');
        canvas.style.display = 'none'; // Initially hidden, used for preview
        canvas.style.width = '80%';
        canvas.style.maxWidth = '640px';
        canvas.style.height = 'auto';
        canvas.style.backgroundColor = 'black';
        canvas.style.marginBottom = '10px';
        cameraContainer.appendChild(canvas);

        const context = canvas.getContext('2d');

        takePhotoButton = document.createElement('button');
        takePhotoButton.textContent = 'Ambil Foto';
        takePhotoButton.style.padding = '10px 20px';
        takePhotoButton.style.fontSize = '1.2em';
        takePhotoButton.style.margin = '5px';
        cameraContainer.appendChild(takePhotoButton);

        cancelButton = document.createElement('button');
        cancelButton.textContent = 'Batal';
        cancelButton.style.padding = '10px 20px';
        cancelButton.style.fontSize = '1.2em';
        cancelButton.style.margin = '5px';
        cancelButton.style.backgroundColor = '#dc3545';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.cursor = 'pointer';
        cameraContainer.appendChild(cancelButton);

        sendPhotoButton = document.createElement('button');
        sendPhotoButton.textContent = 'Kirim Foto';
        sendPhotoButton.style.padding = '10px 20px';
        sendPhotoButton.style.fontSize = '1.2em';
        sendPhotoButton.style.margin = '5px';
        sendPhotoButton.style.display = 'none'; // Initially hidden
        cameraContainer.appendChild(sendPhotoButton);

        retakePhotoButton = document.createElement('button');
        retakePhotoButton.textContent = 'Ulangi';
        retakePhotoButton.style.padding = '10px 20px';
        retakePhotoButton.style.fontSize = '1.2em';
        retakePhotoButton.style.margin = '5px';
        retakePhotoButton.style.backgroundColor = '#ffc107'; // Yellow for retake
        retakePhotoButton.style.color = 'white';
        retakePhotoButton.style.border = 'none';
        retakePhotoButton.style.borderRadius = '5px';
        retakePhotoButton.style.cursor = 'pointer';
        retakePhotoButton.style.display = 'none'; // Initially hidden
        cameraContainer.appendChild(retakePhotoButton);

        const showLiveCamera = () => {
          video.style.display = 'block';
          canvas.style.display = 'none';
          takePhotoButton.style.display = 'block';
          cancelButton.style.display = 'block';
          sendPhotoButton.style.display = 'none';
          retakePhotoButton.style.display = 'none';
          video.play();
        };

        const showCapturedImage = () => {
          video.pause();
          video.style.display = 'none';
          canvas.style.display = 'block';
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          takePhotoButton.style.display = 'none';
          cancelButton.style.display = 'none';
          sendPhotoButton.style.display = 'block';
          retakePhotoButton.style.display = 'block';
        };

        takePhotoButton.onclick = showCapturedImage;

        sendPhotoButton.onclick = () => {
          console.log('Kirim Foto button clicked');
          const imageData = canvas.toDataURL('image/jpeg');
          console.log('captureFaceImage: Image data created, length:', imageData.length);
          console.log('captureFaceImage: Closing camera and resolving promise');
          cleanup(); // Close camera immediately
          resolve(imageData);
          console.log('captureFaceImage: Promise resolved with image data');
        };

        retakePhotoButton.onclick = showLiveCamera;

        cancelButton.onclick = () => {
          console.log('Batal button clicked');
          cleanup(); // Close camera immediately
          reject('Pengambilan foto dibatalkan.');
          console.log('Promise explicitly rejected with:', 'Pengambilan foto dibatalkan.');
        };

      } catch (error) {
        console.error('captureFaceImage: Error in try block:', error);
        let errorMessage = 'Gagal mengakses kamera.';
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Akses kamera ditolak. Mohon izinkan akses kamera di browser Anda.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Kamera tidak ditemukan.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Kamera sedang digunakan oleh aplikasi lain.';
        }
        cleanup(); // Cleanup on error
        reject(errorMessage);
      }
    });
  }

  // --- Check In/Check Out Actions ---
  btnCheckin.onclick = async () => {
    console.log('[CHECKIN] START - Button clicked');
    console.log('[CHECKIN] Current cookies:', document.cookie);
    console.log('[CHECKIN] Current URL:', window.location.href);
    try {
      console.log('[CHECKIN] Getting geolocation...');
      const { lat, lng } = await getGeolocation();
      console.log('[CHECKIN] GPS:', { lat, lng });
      
      console.log('[CHECKIN] Capturing face image...');
      const image = await captureFaceImage();
      console.log('[CHECKIN] Image captured, length:', image ? image.length : 'null');
      
      console.log('[CHECKIN] Sending API request...');
      console.log('[CHECKIN] Request payload:', { 
        lat, 
        lng, 
        imageLength: image ? image.length : 0 
      });
      
      const res = await API.post('/api/absensi/checkin', { lat, lng, image });
      
      console.log('[CHECKIN] ===== API RESPONSE =====');
      console.log('[CHECKIN] Response code:', res.code);
      console.log('[CHECKIN] Response ok:', res.ok);
      console.log('[CHECKIN] Response data:', res.data);
      console.log('[CHECKIN] Data status:', res.data?.status);
      console.log('[CHECKIN] Data message:', res.data?.message);
      console.log('[CHECKIN] ===== END RESPONSE =====');
      
      if (res.ok && res.data.status) {
        console.log('[CHECKIN] SUCCESS!');
        toast('Check-in berhasil!');
        loadTodayStatus();
        loadLatestHistory();
      } else {
        console.error('[CHECKIN] FAILED:', res.data);
        const errorMsg = res.data?.message || 'Check-in gagal.';
        console.error('[CHECKIN] Error message:', errorMsg);
        toast(errorMsg, 'err');
      }
    } catch (error) {
      console.error('[CHECKIN] EXCEPTION:', error);
      const errorMsg = String(error);
      console.error('[CHECKIN] Error string:', errorMsg);
      
      // Show both toast and alert for debugging
      toast(errorMsg, 'err');
      alert('ERROR CHECK-IN:\n\n' + errorMsg + '\n\nCek Console (F12) untuk detail lengkap.');
    }
  };

  btnCheckout.onclick = async () => {
    try {
      const { lat, lng } = await getGeolocation(); // Restored original call
      const image = await captureFaceImage(); // Capture face image
      console.log('Image data length (Checkout):', image ? image.length : 'null'); // Added log
      const res = await API.post('/api/absensi/checkout', { lat, lng, image });
      console.log('API response (Checkout):', res); // Added log
      if (res.ok && res.data.status) {
        toast('Check-out berhasil!');
        loadTodayStatus();
        loadLatestHistory();
      } else {
        toast(res.data?.message || 'Check-out gagal.', 'err');
      }
    } catch (error) {
      console.log('Promise rejected with:', error);
      toast(error, 'err');
    }
  };

  // --- Load Map for Lokasi & Radius ---
  async function loadMapKantor() {
    try {
      const res = await API.get('/api/settings/location');
      if (res.ok && res.data.status && res.data.data) {
        const loc = res.data.data;
        const lat = parseFloat(loc.latitude);
        const lng = parseFloat(loc.longitude);
        const rad = parseInt(loc.radius);

        if (!lat || !lng) {
          document.getElementById('statusLokasi').textContent = 'Lokasi kantor belum diatur.';
          return;
        }

        // Load Leaflet CSS and JS dynamically
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        if (!window.L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = () => renderMapKaryawan(lat, lng, rad);
          document.head.appendChild(script);
        } else {
          renderMapKaryawan(lat, lng, rad);
        }
      } else {
        document.getElementById('statusLokasi').textContent = 'Gagal memuat lokasi kantor.';
      }
    } catch (e) {
      console.error('Failed to load map:', e);
      document.getElementById('statusLokasi').textContent = 'Gagal memuat lokasi kantor.';
    }
  }

  function renderMapKaryawan(lat, lng, rad) {
    const mapElement = document.getElementById('mapKaryawan');
    if (!mapElement) return;

    const map = L.map('mapKaryawan').setView([lat, lng], 15);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(map);

    // Add marker for office
    L.marker([lat, lng]).addTo(map)
      .bindPopup('Lokasi Kantor')
      .openPopup();

    // Add circle for radius
    L.circle([lat, lng], {
      color: '#2D7DFF',
      fillColor: '#2D7DFF',
      fillOpacity: 0.2,
      radius: rad
    }).addTo(map);

    // Check user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        // Add user marker
        L.marker([userLat, userLng], {
          icon: L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        }).addTo(map).bindPopup('Lokasi Anda');

        // Calculate distance
        const distance = map.distance([lat, lng], [userLat, userLng]);
        const statusEl = document.getElementById('statusLokasi');
        if (distance <= rad) {
          statusEl.textContent = `✓ Anda berada dalam radius kantor (${Math.round(distance)}m dari kantor)`;
          statusEl.style.color = '#10B981';
        } else {
          statusEl.textContent = `✗ Anda berada di luar radius kantor (${Math.round(distance)}m dari kantor)`;
          statusEl.style.color = '#EF4444';
        }
      }, () => {
        document.getElementById('statusLokasi').textContent = 'Tidak dapat mengakses lokasi Anda.';
      });
    }
  }

  // --- Logout Handler for all buttons ---
  const allLogoutButtons = document.querySelectorAll('#btnLogout');
  allLogoutButtons.forEach(btn => {
    btn.onclick = async (e) => {
      e.preventDefault();
      console.log('Logout clicked (karyawan-index)');
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

  // --- Load Riwayat Gaji (only show H-1, H, H+1 tanggal gajian) ---
  async function loadRiwayatGaji() {
    try {
      // Get tanggal gajian dari profile karyawan
      const profileRes = await API.get('/api/karyawan/profile');
      if (!profileRes.ok || !profileRes.data.data) return;
      
      const tanggalGajian = profileRes.data.data.tanggal_gajian || 25;
      const today = new Date();
      const currentDate = today.getDate();
      
      // Tampilkan hanya jika dalam rentang H-1, H, H+1
      if (currentDate >= tanggalGajian - 1 && currentDate <= tanggalGajian + 1) {
        document.getElementById('cardRiwayatGaji').style.display = 'block';
        
        const res = await API.get('/api/karyawan/payroll/history');
        if (res.ok && res.data.data) {
          const tbody = document.querySelector('#tblRiwayatGaji tbody');
          tbody.innerHTML = '';
          
          const namaBulan = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          
          res.data.data.forEach(gaji => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td>${namaBulan[gaji.bulan]} ${gaji.tahun}</td>
              <td>Rp ${parseInt(gaji.gaji_pokok).toLocaleString('id-ID')}</td>
              <td>Rp ${parseInt(gaji.potongan_telat).toLocaleString('id-ID')}</td>
              <td>Rp ${parseInt(gaji.bonus_lembur).toLocaleString('id-ID')}</td>
              <td><strong>Rp ${parseInt(gaji.total_gaji).toLocaleString('id-ID')}</strong></td>
            `;
            tbody.appendChild(tr);
          });
          
          if (res.data.data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum ada data gaji</td></tr>';
          }
        }
      } else {
        document.getElementById('cardRiwayatGaji').style.display = 'none';
      }
    } catch (error) {
      console.error('Error loading riwayat gaji:', error);
    }
  }

  // --- Initial Loads ---
  loadUserData(); // Load user data for avatar
  loadTodayStatus();
  loadLatestHistory();
  loadLatestPermohonanHistory(); // Load new permohonan history
  loadMapKantor(); // Load map with office location
  loadRiwayatGaji(); // Load riwayat gaji (muncul hanya H-1, H, H+1)
});