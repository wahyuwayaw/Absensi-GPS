// Admin Dashboard Analytics
document.addEventListener('api-ready', async () => {
  
  // Get current month/year
  const now = new Date();
  let currentMonth = now.getMonth() + 1;
  let currentYear = now.getFullYear();
  
  // Month selector
  const monthSelect = document.getElementById('analyticsMonth');
  const yearSelect = document.getElementById('analyticsYear');
  
  if (monthSelect && yearSelect) {
    monthSelect.value = currentMonth;
    yearSelect.value = currentYear;
    
    monthSelect.addEventListener('change', loadAnalytics);
    yearSelect.addEventListener('change', loadAnalytics);
  }
  
  // Load all analytics
  async function loadAnalytics() {
    const month = monthSelect ? parseInt(monthSelect.value) : currentMonth;
    const year = yearSelect ? parseInt(yearSelect.value) : currentYear;
    
    await Promise.all([
      loadOverview(month, year),
      loadMonthlyTrend(),
      loadTopLatest(month, year),
      loadDepartmentStats(month, year),
      loadPayrollSummary(month, year)
    ]);
  }
  
  // Load overview KPIs
  async function loadOverview(month, year) {
    try {
      const response = await API.get(`/api/analytics/overview?bulan=${month}&tahun=${year}`);
      if (response.ok && response.data.status) {
        const data = response.data.data;
        
        // Update KPI cards
        if (q('#totalKaryawan')) q('#totalKaryawan').textContent = data.total_karyawan;
        if (q('#hadirHariIni')) q('#hadirHariIni').textContent = `${data.hadir_hari_ini} / ${data.total_karyawan}`;
        if (q('#tidakHadirHariIni')) q('#tidakHadirHariIni').textContent = data.tidak_hadir_hari_ini;
        if (q('#hadirBulanIni')) q('#hadirBulanIni').textContent = data.hadir_bulan_ini;
        if (q('#cutiIzinBulanIni')) q('#cutiIzinBulanIni').textContent = data.cuti_izin_bulan_ini;
        if (q('#telatBulanIni')) q('#telatBulanIni').textContent = data.telat_bulan_ini;
        if (q('#jamLemburBulanIni')) q('#jamLemburBulanIni').textContent = data.jam_lembur_bulan_ini + ' jam';
        if (q('#kehadiranRate')) q('#kehadiranRate').textContent = data.kehadiran_rate + '%';
      }
    } catch (error) {
      console.error('Error loading overview:', error);
    }
  }
  
  // Load monthly trend chart
  let monthlyTrendChart = null;
  async function loadMonthlyTrend() {
    try {
      const response = await API.get('/api/analytics/monthly-trend');
      if (response.ok && response.data.status) {
        const data = response.data.data;
        
        const labels = data.map(d => d.month);
        const hadirData = data.map(d => d.hadir);
        const telatData = data.map(d => d.telat);
        const cutiData = data.map(d => d.cuti);
        
        const ctx = document.getElementById('trendChart');
        if (ctx) {
          if (monthlyTrendChart) {
            monthlyTrendChart.destroy();
          }
          
          monthlyTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Hadir',
                  data: hadirData,
                  borderColor: '#10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  tension: 0.4
                },
                {
                  label: 'Telat',
                  data: telatData,
                  borderColor: '#f59e0b',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  tension: 0.4
                },
                {
                  label: 'Cuti/Izin',
                  data: cutiData,
                  borderColor: '#3b82f6',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  tension: 0.4
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                },
                title: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading monthly trend:', error);
    }
  }
  
  // Load top latest employees
  async function loadTopLatest(month, year) {
    try {
      const response = await API.get(`/api/analytics/top-latest?bulan=${month}&tahun=${year}`);
      if (response.ok && response.data.status) {
        const data = response.data.data;
        const tbody = q('#tblTopLatest tbody');
        
        if (tbody) {
          if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">Tidak ada data keterlambatan</td></tr>';
          } else {
            tbody.innerHTML = data.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.nip}</td>
                <td>${item.nama_lengkap}</td>
                <td>${item.jabatan || '-'}</td>
                <td><span class="status-badge status-rejected">${item.total_telat}x</span></td>
              </tr>
            `).join('');
          }
        }
      }
    } catch (error) {
      console.error('Error loading top latest:', error);
    }
  }
  
  // Load department statistics chart
  let departmentChart = null;
  async function loadDepartmentStats(month, year) {
    try {
      const response = await API.get(`/api/analytics/department-stats?bulan=${month}&tahun=${year}`);
      if (response.ok && response.data.status) {
        const data = response.data.data;
        
        const labels = data.map(d => d.departemen);
        const karyawanData = data.map(d => d.total_karyawan);
        const hadirData = data.map(d => d.total_hadir);
        const lemburData = data.map(d => d.jam_lembur);
        
        const ctx = document.getElementById('departmentChart');
        if (ctx) {
          if (departmentChart) {
            departmentChart.destroy();
          }
          
          departmentChart = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Kehadiran',
                  data: hadirData,
                  backgroundColor: 'rgba(16, 185, 129, 0.8)',
                  borderColor: '#10b981',
                  borderWidth: 1
                },
                {
                  label: 'Jam Lembur',
                  data: lemburData,
                  backgroundColor: 'rgba(59, 130, 246, 0.8)',
                  borderColor: '#3b82f6',
                  borderWidth: 1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: 'top'
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error loading department stats:', error);
    }
  }
  
  // Load payroll summary
  async function loadPayrollSummary(month, year) {
    try {
      const response = await API.get(`/api/analytics/payroll-summary?bulan=${month}&tahun=${year}`);
      if (response.ok && response.data.status) {
        const data = response.data.data;
        
        if (q('#payrollProcessed')) q('#payrollProcessed').textContent = data.total_processed + ' karyawan';
        if (q('#payrollGajiPokok')) q('#payrollGajiPokok').textContent = formatRupiah(data.total_gaji_pokok);
        if (q('#payrollPotongan')) q('#payrollPotongan').textContent = formatRupiah(data.total_potongan);
        if (q('#payrollBonus')) q('#payrollBonus').textContent = formatRupiah(data.total_bonus);
        if (q('#payrollTotal')) q('#payrollTotal').textContent = formatRupiah(data.total_gaji_bersih);
      }
    } catch (error) {
      console.error('Error loading payroll summary:', error);
    }
  }
  
  // Helper function
  function formatRupiah(num) {
    return 'Rp ' + parseFloat(num || 0).toLocaleString('id-ID');
  }
  
  // Initial load
  loadAnalytics();
});
