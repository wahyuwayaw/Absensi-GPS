/* public/frontend/assets/js/av-table-pager.js */

(function() {
  /**
   * Fungsi helper untuk merender paginasi
   * @param {HTMLElement} containerElement Elemen DOM tempat paginasi akan dirender
   * @param {Object} meta Objek meta dari respons API (current_page, last_page, dll.)
   * @param {Function} callback Fungsi yang akan dipanggil saat tombol paginasi diklik (menerima nomor halaman sebagai argumen)
   * @param {Function} [onRowsPerPageChange] Callback opsional saat 'Rows/page' berubah (menerima jumlah baris sebagai argumen)
   * @param {number} [currentRowsPerPage] Jumlah baris saat ini per halaman (opsional)
   */
  window.renderPagination = (containerElement, meta, callback, onRowsPerPageChange = null, currentRowsPerPage = 10) => {
    containerElement.innerHTML = ''; // Bersihkan paginasi sebelumnya

    const paginationWrapper = el('div', '', 'pagination-wrapper');
    containerElement.appendChild(paginationWrapper);

    // Info kecil di kiri: “Menampilkan X–Y dari Z”
    const infoDiv = el('div', '', 'pagination-info');
    infoDiv.textContent = `Menampilkan ${meta.from}–${meta.to} dari ${meta.total}`;
    paginationWrapper.appendChild(infoDiv);

    // Kontrol Rows/page
    if (onRowsPerPageChange) {
      const rowsPerPageControl = el('div', '', 'rows-per-page-control');
      const label = el('label', 'Baris/halaman:', 'rows-per-page-label');
      const select = el('select', '', 'input rows-per-page-select');
      [10, 25, 50].forEach(val => {
        const option = el('option');
        option.value = val;
        option.textContent = val;
        if (val === currentRowsPerPage) option.selected = true;
        select.appendChild(option);
      });
      select.onchange = (e) => onRowsPerPageChange(parseInt(e.target.value));
      rowsPerPageControl.appendChild(label);
      rowsPerPageControl.appendChild(select);
      paginationWrapper.appendChild(rowsPerPageControl);
    }

    if (meta.last_page <= 1) return; // Tidak perlu paginasi jika hanya ada 1 halaman atau kurang

    const ul = el('ul', '', 'pagination'); // Buat elemen <ul> dengan class pagination

    // Tombol Previous
    const prevLi = el('li');
    const prevBtn = el('button', '&laquo;', 'btn-pagination');
    if (meta.current_page === 1) {
      prevBtn.disabled = true;
    } else {
      prevBtn.onclick = () => callback(meta.current_page - 1);
    }
    prevLi.appendChild(prevBtn);
    ul.appendChild(prevLi);

    // Tombol Halaman dengan Ellipsis
    const maxPagesToShow = 5;
    let startPage = Math.max(1, meta.current_page - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(meta.last_page, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
      ul.appendChild(el('li', el('button', '1', 'btn-pagination', () => callback(1))));
      if (startPage > 2) ul.appendChild(el('li', el('span', '...', 'pagination-ellipsis')));
    }

    for (let i = startPage; i <= endPage; i++) {
      const li = el('li');
      const btn = el('button', String(i), 'btn-pagination');
      if (i === meta.current_page) {
        btn.classList.add('active');
        btn.disabled = true;
      } else {
        btn.onclick = () => callback(i);
      }
      li.appendChild(btn);
      ul.appendChild(li);
    }

    if (endPage < meta.last_page) {
      if (endPage < meta.last_page - 1) ul.appendChild(el('li', el('span', '...', 'pagination-ellipsis')));
      ul.appendChild(el('li', el('button', String(meta.last_page), 'btn-pagination', () => callback(meta.last_page))));
    }

    // Tombol Next
    const nextLi = el('li');
    const nextBtn = el('button', '&raquo;', 'btn-pagination');
    if (meta.current_page === meta.last_page) {
      nextBtn.disabled = true;
    } else {
      nextBtn.onclick = () => callback(meta.current_page + 1);
    }
    nextLi.appendChild(nextBtn);
    ul.appendChild(nextLi);

    paginationWrapper.appendChild(ul);
  };

  /**
   * Fungsi untuk menginisialisasi paginasi client-side pada tabel dengan data-paginate="true"
   * @param {HTMLElement} tableElement Elemen tabel yang akan dipaginasi
   * @param {number} defaultRowsPerPage Jumlah baris default per halaman
   */
  window.initClientSidePagination = (tableElement, defaultRowsPerPage = 10) => {
    const tbody = tableElement.querySelector('tbody');
    if (!tbody) return;

    const allRows = Array.from(tbody.children); // Semua baris data
    let currentPage = 1;
    let rowsPerPage = defaultRowsPerPage;

    const renderTable = () => {
      const start = (currentPage - 1) * rowsPerPage;
      const end = start + rowsPerPage;
      const paginatedRows = allRows.slice(start, end);

      tbody.innerHTML = '';
      if (paginatedRows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${tableElement.querySelectorAll('thead th').length}" class="td-text-center td-small-muted">Tidak ada data.</td></tr>`;
      } else {
        paginatedRows.forEach(row => tbody.appendChild(row));
      }
      renderClientPagination();
    };

    const renderClientPagination = () => {
      const totalPages = Math.ceil(allRows.length / rowsPerPage);
      const paginationContainer = tableElement.nextElementSibling; // Asumsi container paginasi setelah tabel

      if (!paginationContainer) return;

      const meta = {
        current_page: currentPage,
        last_page: totalPages,
        from: (currentPage - 1) * rowsPerPage + 1,
        to: Math.min(currentPage * rowsPerPage, allRows.length),
        total: allRows.length,
      };

      window.renderPagination(paginationContainer, meta, (page) => {
        currentPage = page;
        renderTable();
      }, (newRowsPerPage) => {
        rowsPerPage = newRowsPerPage;
        currentPage = 1; // Reset ke halaman pertama saat rows per page berubah
        renderTable();
      }, rowsPerPage);
    };

    // Initial render
    renderTable();
  };

  // Helper function to create element with class and optional onclick
  function el(tagName, innerHTML = '', className = '', onclick = null) {
    const element = document.createElement(tagName);
    element.innerHTML = innerHTML;
    if (className) element.className = className;
    if (onclick) element.onclick = onclick;
    return element;
  }

  // Inisialisasi paginasi client-side untuk semua tabel dengan data-paginate="true"
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('table[data-paginate="true"]').forEach(table => {
      window.initClientSidePagination(table);
    });
  });
})();