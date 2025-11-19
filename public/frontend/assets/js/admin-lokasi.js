// admin-lokasi.js
document.addEventListener('api-ready', () => {
  const lat = document.getElementById('lat');
  const lng = document.getElementById('lng');
  const radius = document.getElementById('radius');
  const formLokasi = document.getElementById('formLokasi');
  const currentLoc = document.getElementById('currentLoc');
  const mapArea = document.getElementById('mapArea');

  let map = null;
  let marker = null;
  let circle = null;

  // Load current location settings
  async function loadLocation() {
    try {
      const res = await API.get('/api/settings/location');
      if (res.ok && res.data.status && res.data.data) {
        const loc = res.data.data;
        lat.value = loc.latitude || '';
        lng.value = loc.longitude || '';
        radius.value = loc.radius || 100;
        updateCurrentLoc();
        if (loc.latitude && loc.longitude) {
          initMap(parseFloat(loc.latitude), parseFloat(loc.longitude), parseInt(loc.radius));
        }
      }
    } catch (e) {
      console.error('Failed to load location:', e);
    }
  }

  function updateCurrentLoc() {
    if (currentLoc) {
      currentLoc.textContent = (lat.value && lng.value) ? `${lat.value}, ${lng.value}` : '-';
    }
  }

  // Initialize map using Leaflet.js (free, no API key needed)
  function initMap(latitude, longitude, rad) {
    // Clear existing map
    if (map) {
      map.remove();
    }

    // Create map HTML with Leaflet
    mapArea.innerHTML = '<div id="map" style="width:100%;height:400px;border-radius:8px;"></div>';
    
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
      script.onload = () => renderMap(latitude, longitude, rad);
      document.head.appendChild(script);
    } else {
      renderMap(latitude, longitude, rad);
    }
  }

  function renderMap(latitude, longitude, rad) {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    map = L.map('map').setView([latitude, longitude], 15);
    
    // Add OpenStreetMap tiles (free)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add marker
    marker = L.marker([latitude, longitude]).addTo(map)
      .bindPopup('Lokasi Kantor')
      .openPopup();

    // Add circle for radius
    circle = L.circle([latitude, longitude], {
      color: '#2D7DFF',
      fillColor: '#2D7DFF',
      fillOpacity: 0.2,
      radius: rad
    }).addTo(map);

    // Allow clicking on map to set location
    map.on('click', function(e) {
      const newLat = e.latlng.lat.toFixed(6);
      const newLng = e.latlng.lng.toFixed(6);
      lat.value = newLat;
      lng.value = newLng;
      updateCurrentLoc();
      
      // Update marker and circle
      if (marker) map.removeLayer(marker);
      if (circle) map.removeLayer(circle);
      
      marker = L.marker([newLat, newLng]).addTo(map)
        .bindPopup('Lokasi Kantor Baru')
        .openPopup();
      
      circle = L.circle([newLat, newLng], {
        color: '#2D7DFF',
        fillColor: '#2D7DFF',
        fillOpacity: 0.2,
        radius: parseInt(radius.value) || 100
      }).addTo(map);
    });
  }

  // Update map when radius changes
  if (radius) {
    radius.addEventListener('input', () => {
      if (circle && map) {
        circle.setRadius(parseInt(radius.value) || 100);
      }
    });
  }

  // Form submission
  if (formLokasi) {
    formLokasi.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const payload = {
        latitude: parseFloat(lat.value),
        longitude: parseFloat(lng.value),
        radius: parseInt(radius.value)
      };

      try {
        const res = await API.post('/api/settings/location', payload);
        if (res.ok && res.data.status) {
          toast('Lokasi kantor berhasil disimpan.');
          loadLocation(); // Reload to confirm
        } else {
          toast(res.data?.message || 'Gagal menyimpan lokasi.', 'err');
        }
      } catch (error) {
        console.error('Error saving location:', error);
        toast('Terjadi kesalahan saat menyimpan lokasi.', 'err');
      }
    });
  }

  // Input listeners for coordinate display
  if (lat) lat.addEventListener('input', updateCurrentLoc);
  if (lng) lng.addEventListener('input', updateCurrentLoc);

  // Initial load
  loadLocation();
});
