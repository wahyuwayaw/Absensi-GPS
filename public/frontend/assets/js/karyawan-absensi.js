document.addEventListener('api-ready', () => {
    const statusTodayEl = document.getElementById('statusToday');
    const waktuMasukTodayEl = document.getElementById('waktuMasukToday');
    const waktuPulangTodayEl = document.getElementById('waktuPulangToday');
    const telatTodayEl = document.getElementById('telatToday');
    const btnCheckin = document.getElementById('btnCheckin');
    const btnCheckout = document.getElementById('btnCheckout');
    const filterDays = document.getElementById('filterDays');
    const btnFilterHistory = document.getElementById('btnFilterHistory');
    const tblRiwayatAbsensiBody = document.querySelector('#tblRiwayatAbsensi tbody');

    let currentHistoryPage = 1;
    let historyRowsPerPage = 10; // Default rows per page

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
                        console.error('Error getting geolocation:', error); // Corrected error message
                        console.log('Geolocation error code:', error.code);
                        console.log('Geolocation error message:', error.message);
                        let errorMessage = 'Gagal mendapatkan lokasi.';
                        switch (error.code) {
                          case error.PERMISSION_DENIED:
                            errorMessage = 'Akses lokasi ditolak. Mohon izinkan akses lokasi di browser Anda.';
                            break;
                          case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Informasi lokasi tidak tersedia.';
                            break;
                          case error.TIMEOUT:
                            errorMessage = 'Permintaan lokasi habis waktu.';
                            break;
                          case error.UNKNOWN_ERROR:
                            errorMessage = 'Terjadi kesalahan yang tidak diketahui saat mendapatkan lokasi.';
                            break;
                        }
                        reject(errorMessage);
                                },
                                { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
                              );
        } else {
          reject('Geolocation tidak didukung oleh browser Anda.');
        }
      });
    }

    // --- Helper function to capture face image ---
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
              stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
              console.log('captureFaceImage: getUserMedia called');
    
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
                console.log('captureFaceImage: Image sent by user');
                resolve(imageData);
                console.log('Promise resolved with image data');
              };
    
              retakePhotoButton.onclick = showLiveCamera;
    
                        cancelButton.onclick = () => {
                          console.log('Batal button clicked');
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
              reject(errorMessage);
            } finally {
              // This finally block ensures cleanup runs after the promise settles (resolved or rejected)
              // The actual cleanup function is called when the promise resolves/rejects
              // by attaching it to the promise's .finally() method outside this constructor.
            }
          }).finally(cleanup); // Attach cleanup to the promise's finally block
        }

    async function loadTodayStatus() {
        const todayRes = await API.get('/api/karyawan/today');
        if (todayRes.ok && todayRes.data.status) {
            const data = todayRes.data.data;
            if (data) {
                statusTodayEl.textContent = data.status ? data.status.toUpperCase() : 'BELUM ABSEN';
                waktuMasukTodayEl.textContent = data.waktu_masuk || '--:--';
                waktuPulangTodayEl.textContent = data.waktu_pulang || '--:--';
                telatTodayEl.textContent = `${data.telat_menit > 0 ? data.telat_menit : '0'} menit`;

                // Enable/disable buttons based on status
                btnCheckin.disabled = !!data.waktu_masuk; // Disable if already checked in
                btnCheckout.disabled = !data.waktu_masuk || !!data.waktu_pulang; // Disable if not checked in or already checked out
            } else {
                statusTodayEl.textContent = 'BELUM ABSEN';
                waktuMasukTodayEl.textContent = '--:--';
                waktuPulangTodayEl.textContent = '--:--';
                telatTodayEl.textContent = '0 menit';
                btnCheckin.disabled = false;
                btnCheckout.disabled = true;
            }
        } else {
            toast(todayRes.data?.message || 'Gagal memuat status hari ini.', 'err');
            btnCheckin.disabled = true;
            btnCheckout.disabled = true;
        }
    }

    async function loadHistory(page = 1, rowsPerPage = historyRowsPerPage) {
        currentHistoryPage = page;
        historyRowsPerPage = rowsPerPage;
        const days = filterDays.value;
        const qs = new URLSearchParams({ page: String(currentHistoryPage), per_page: String(historyRowsPerPage), days: days });

        const historyRes = await API.get('/api/karyawan/absensi?' + qs.toString());
        if (historyRes.ok && historyRes.data.status && Array.isArray(historyRes.data.data)) {
            tblRiwayatAbsensiBody.innerHTML = historyRes.data.data.map(a => `
                <tr>
                    <td>${a.tanggal || '-'}</td>
                    <td>${a.waktu_masuk || '-'}</td>
                    <td>${a.waktu_pulang || '-'}</td>
                    <td><span class="badge ${a.status === 'hadir' ? 'approved' : (a.status === 'absen' ? 'rejected' : 'pending')}">${a.status.toUpperCase()}</span></td>
                    <td>${a.telat_menit > 0 ? a.telat_menit : '0'}</td>
                    <td>${a.lembur_menit > 0 ? a.lembur_menit : '0'}</td>
                </tr>
            `).join('');
            // Assuming renderPagination is available globally
            renderPagination(q('#pagination'), historyRes.data, loadHistory, (newRowsPerPage) => loadHistory(1, newRowsPerPage), historyRowsPerPage);
        } else {
            tblRiwayatAbsensiBody.innerHTML = `<tr><td colspan="6" class="td-text-center td-small-muted">Tidak ada riwayat absensi.</td></tr>`;
            renderPagination(q('#pagination'), { current_page: 1, last_page: 1, from: 0, to: 0, total: 0 }, loadHistory, (newRowsPerPage) => loadHistory(1, newRowsPerPage), historyRowsPerPage);
        }
    }

    btnCheckin.onclick = async () => {
        try {
            const { lat, lng } = await getGeolocation(); // Restored original call
            const image = await captureFaceImage(); // Capture face image
            console.log('Image data length (Checkin):', image ? image.length : 'null'); // Added log
            const res = await API.post('/api/absensi/checkin', { lat, lng, image });
            console.log('API response (Checkin):', res); // Added log
            if (res.ok && res.data.status) {
                toast('Check-in berhasil!');
                loadTodayStatus();
                loadHistory();
            } else {
                toast(res.data?.message || 'Check-in gagal.', 'err');
            }
        } catch (error) {
            console.log('Promise rejected with:', error);
            toast(error, 'err');
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
                loadHistory();
            } else {
                toast(res.data?.message || 'Check-out gagal.', 'err');
            }
        }
        catch (error) {
            console.log('Promise rejected with:', error);
            toast(error, 'err');
        }
    };

    if (btnFilterHistory) {
        btnFilterHistory.onclick = () => loadHistory(1);
    }

    // Initial loads
    loadTodayStatus();
    loadHistory();

    function qs(s){return document.querySelector(s)}
});