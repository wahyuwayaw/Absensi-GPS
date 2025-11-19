document.addEventListener('DOMContentLoaded', () => {
  // Role selection - trigger radio change event which will handle styling via inline JS
  document.querySelectorAll('label[data-role]').forEach(l => {
    l.addEventListener('click', () => {
      const radioInput = l.querySelector('input');
      if (radioInput) {
        radioInput.checked = true;
        
        // Trigger change event to update inline styles
        radioInput.dispatchEvent(new Event('change'));
        
        // Ubah placeholder berdasarkan peran yang dipilih
        const usernameInput = document.getElementById('username');
        if (radioInput.value === 'admin') {
          usernameInput.placeholder = 'Username';
        } else if (radioInput.value === 'karyawan') {
          usernameInput.placeholder = 'NIP';
        }
      }
    });
  });

  // Atur placeholder awal (no role selected by default)
  const usernameInput = document.getElementById('username');
  const initialChecked = document.querySelector('input[name=role]:checked');
  if (initialChecked) {
    // If somehow a role is pre-selected, set appropriate placeholder
    if (initialChecked.value === 'admin') {
      usernameInput.placeholder = 'Username';
    } else if (initialChecked.value === 'karyawan') {
      usernameInput.placeholder = 'NIP';
    }
  } else {
    // No role selected initially - default placeholder
    usernameInput.placeholder = 'Username / NIP';
  }

  // Login function
  const performLogin = async () => {
    const roleRadio = document.querySelector('input[name=role]:checked');
    if (!roleRadio) {
      toast('Pilih role terlebih dahulu (Admin atau Karyawan)', 'err');
      return;
    }
    const role = roleRadio.value;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (!username || !password) {
      toast('Lengkapi username & password', 'err');
      return;
    }
    
    console.log('===== LOGIN DEBUG =====');
    console.log('Role:', role);
    console.log('Username:', username);
    console.log('Current URL:', window.location.href);
    console.log('Current cookies:', document.cookie);
    console.log('Attempting login...');
    const r = await API.post('/api/login', {
      role,
      username,
      password
    });
    console.log('Login response:', r);
    if (!r.ok || r.data.status === false) {
      console.error('Login failed:', r.data);
      toast(r.data.message || 'Login gagal', 'err');
      return;
    }
    
    console.log('Login successful, verifying session...');
    toast('Login berhasil! Memuat dashboard...', 'info');
    
    // Wait for session to be saved, then verify
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify session by calling /api/me
    const verifyRes = await API.get('/api/me');
    console.log('Session verification response:', verifyRes);
    console.log('Cookies after login:', document.cookie);
    console.log('verifyRes.ok:', verifyRes.ok);
    console.log('verifyRes.data:', verifyRes.data);
    console.log('verifyRes.data.data:', verifyRes.data.data);
    console.log('verifyRes.data.status:', verifyRes.data.status);
    
    // Check if verification succeeded
    // Note: verifyRes.data.data might be null if cookies not sent (ngrok issue)
    // But if login response was OK, we can still proceed and let the dashboard handle auth check
    if (!verifyRes.ok) {
      console.error('Session verification failed!');
      console.error('Check failed: verifyRes.ok =', verifyRes.ok);
      console.error('Full Response:', verifyRes);
      toast('Login berhasil tapi session gagal. Coba login lagi.', 'err');
      
      // Show alert for debugging on mobile
      alert('LOGIN GAGAL!\n\nSession verification failed.\nCek Console (F12) untuk detail.\n\nverifyRes.ok: ' + verifyRes.ok + '\nverifyRes.data.data: ' + JSON.stringify(verifyRes.data.data) + '\n\nCookies: ' + (document.cookie || 'KOSONG'));
      return;
    }
    
    // If verifyRes.data.data is null but verifyRes.ok is true, it might be cookies not sent
    // Let's proceed anyway and let dashboard handle the auth check
    if (!verifyRes.data.data) {
      console.warn('⚠️  Session data is null (cookies might not be sent due to ngrok)');
      console.warn('Proceeding to dashboard anyway - it will redirect to login if auth fails');
    }
    
    console.log('Session verified successfully!');
    console.log('User data:', verifyRes.data.data);
    console.log('Redirecting to:', role === 'admin' ? 'admin/index.html' : 'karyawan/index.html');
    
    // Additional delay to ensure cookie is set
    await new Promise(resolve => setTimeout(resolve, 300));
    
    location.href = role === 'admin' ? 'admin/index.html' : 'karyawan/index.html';
  };

  // Login button click
  document.getElementById('btnLogin').onclick = performLogin;

  // Login on Enter key press
  document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performLogin();
    }
  });

  document.getElementById('password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performLogin();
    }
  });

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
      }
    }).finally(cleanup); // Attach cleanup to the promise's finally block
  }

  document.getElementById('btnFace').onclick = async () => {
    const roleRadio = document.querySelector('input[name=role]:checked');
    if (!roleRadio) {
      toast('Pilih role terlebih dahulu (Admin atau Karyawan)', 'err');
      return;
    }
    const role = roleRadio.value;
    const username = document.getElementById('username').value.trim();
    if (!username) {
      toast('Isi username/NIP dulu', 'err');
      return;
    }
    try {
      const image = await captureFaceImage(); // Use the interactive camera
      const r = await API.post('/api/face/login', {
        role,
        username,
        image: image
      });
      if (!r.ok || r.data.status === false) {
        toast(r.data.message || 'Face login gagal', 'err');
        return;
      }
      location.href = role === 'admin' ? 'admin/index.html' : 'karyawan/index.html';
    } catch (error) {
      console.error('Face login failed:', error);
      toast(error || 'Face login dibatalkan atau gagal.', 'err');
    }
  };
});