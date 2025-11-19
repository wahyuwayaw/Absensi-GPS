// public/frontend/assets/js/common.js

/**
 * Toast Notification System
 * Menampilkan notifikasi dengan berbagai tipe: success, error, warning, info
 */
window.toast = function(msg, type = 'info'){
  // Mapping type aliases
  if (type === 'err') type = 'error';
  
  // Create toast container if not exists
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon based on type
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  // Colors based on type
  const colors = {
    success: { bg: '#10B981', text: '#fff' },
    error: { bg: '#EF4444', text: '#fff' },
    warning: { bg: '#F59E0B', text: '#fff' },
    info: { bg: '#3B82F6', text: '#fff' }
  };
  
  const color = colors[type] || colors.info;
  
  toast.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 12px;
      background: ${color.bg};
      color: ${color.text};
      padding: 12px 16px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-size: 14px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
      min-width: 300px;
      max-width: 400px;
    ">
      <span style="
        font-size: 20px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
      ">${icons[type] || icons.info}</span>
      <span style="flex: 1;">${msg}</span>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: none;
        border: none;
        color: ${color.text};
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
      " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">×</button>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after 10 seconds (changed from 3 for debugging)
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 10000);
};

// Add CSS animations
if (!document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}



/**
 * Objek API untuk menangani semua request ke backend
 * Dibungkus dalam IIFE (Immediately Invoked Function Expression) async
 * untuk memastikan token CSRF diambil sebelum API siap digunakan.
 */
(async () => {
  // Fungsi untuk mendapatkan CSRF Token (Wajib untuk Sanctum)
  async function getCsrfToken() {
    try {
      // Cukup panggil endpoint ini, browser akan otomatis menyimpan cookie
      await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
      console.log('CSRF token fetched successfully.');
      return true;
    } catch (e) {
      console.error('Failed to fetch CSRF token:', e);
      // Jika gagal mendapatkan token, mungkin tampilkan pesan error ke user
      document.body.innerHTML = 'Error: Could not connect to the server. Please check your network and refresh the page.';
      return false;
    }
  }

  // Fungsi untuk membaca nilai cookie
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  }

  // Ambil token CSRF terlebih dahulu
  await getCsrfToken();

  // Definisikan objek API setelah token didapatkan
  const API = {
    // Fungsi dasar untuk fetch request
    async req(url, opt = {}){
      const res = await fetch(url, {
        credentials: 'include', // Wajib untuk mengirim cookie (termasuk session & XSRF)
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Pastikan server tahu kita mau JSON
          'X-XSRF-TOKEN': decodeURIComponent(getCookie('XSRF-TOKEN')), // Tambahkan header XSRF
          ...(opt.headers || {})
        }, 
        ...opt
      });
      
      const txt = await res.text();
      
      // Penanganan jika sesi berakhir -> redirect ke login
      if (res.status === 401 || res.status === 419) { // 401 Unauthorized, 419 CSRF Token Mismatch/Expired
        console.error('[AUTH ERROR]', 'Status:', res.status, 'Response:', txt);
        toast('ERROR ' + res.status + ': ' + (txt || 'Sesi berakhir. Cek Console (F12) untuk detail.'), 'err');
        
        // DISABLE AUTO REDIRECT FOR DEBUGGING
        console.log('[DEBUG] Auto redirect DISABLED. Please check error above and login manually.');
        console.log('[DEBUG] Response text:', txt);
        
        /* UNCOMMENT WHEN DONE DEBUGGING:
        setTimeout(() => {
          // Cek lokasi saat ini untuk menentukan path ke login.html
          if (window.location.pathname.includes('/admin/')) {
            window.location.href = '../login.html';
          } else if (window.location.pathname.includes('/karyawan/')) {
            window.location.href = '../login.html';
          } else {
            window.location.href = 'login.html';
          }
        }, 5000);
        */
        
        return {ok: false, code: res.status, data: {status: false, message: txt || 'Sesi berakhir.'}};
      }

      try { 
        const json = JSON.parse(txt);
        return {ok: res.ok, code: res.status, data: json}; 
      }
      catch(e){ 
        return {
          ok: false, 
          code: res.status, 
          data: {status: false, message: `Server error: ${txt.slice(0, 240)}`}
        }; 
      }
    },
    
    // Method GET (Sederhana)
    get: (url) => API.req(url),
    
    // Method POST (Dengan body JSON)
    post: (url, body) => API.req(url, {method: 'POST', body: JSON.stringify(body)}),
    
    // Method PUT (Dengan body JSON)
    put: (url, body) => API.req(url, {method: 'PUT', body: JSON.stringify(body)}),

    // Method PATCH (Dengan body JSON)
    patch: (url, body) => API.req(url, {method: 'PATCH', body: JSON.stringify(body)}),
    
    // Method POST untuk FormData (Multipart)
    async postForm(url, form){
      // Untuk FormData, browser akan set Content-Type secara otomatis
      const res = await fetch(url, {method: 'POST', credentials: 'include', body: form, headers: {'Accept': 'application/json'}});
      const t = await res.text(); 
      try{
          return {ok: res.ok, code: res.status, data: JSON.parse(t)}
      } catch {
          return {ok: false, code: res.status, data: {status: false, message: t}}
      } 
    }
  };

  // Pastikan API diexport ke window agar bisa diakses di file lain
  window.API = API;

  // Kirim event custom untuk menandakan bahwa API sudah siap
  document.dispatchEvent(new Event('api-ready'));
})();


// Fungsi helper untuk querySelector
if (typeof window.q === 'undefined') { // Pastikan hanya didefinisikan sekali
  window.q = (selector) => document.querySelector(selector);
}
// Fungsi helper untuk createElement
if (typeof window.el === 'undefined') { // Pastikan hanya didefinisikan sekali
  window.el = (tagName, innerHTML = '') => {
    const element = document.createElement(tagName);
    element.innerHTML = innerHTML;
    return element;
  };
}