// karyawan-profile.js
document.addEventListener('api-ready', async () => {
    // Check authentication
    try {
        const meRes = await API.get('/api/me');
        if (!meRes.ok || !meRes.data.data || meRes.data.data.role !== 'karyawan') {
            toast('Akses ditolak. Silakan login sebagai karyawan.', 'err');
            setTimeout(() => location.href = '../login.html', 1000);
            return;
        }
    } catch (error) {
        console.error('Auth check error:', error);
        toast('Gagal memeriksa autentikasi.', 'err');
        setTimeout(() => location.href = '../login.html', 1000);
        return;
    }

    // Tab switching
    const tabs = document.querySelectorAll('.segmented-control button');
    const profilCard = document.getElementById('profilCard');
    const editDataCard = document.getElementById('editDataCard');
    const gantiPasswordCard = document.getElementById('gantiPasswordCard');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active to clicked tab
            tab.classList.add('active');

            // Show corresponding card
            const tabName = tab.getAttribute('data-tab');
            profilCard.style.display = tabName === 'profil' ? 'block' : 'none';
            editDataCard.style.display = tabName === 'editData' ? 'block' : 'none';
            gantiPasswordCard.style.display = tabName === 'gantiPassword' ? 'block' : 'none';
        });
    });

    // Back to home button
    const btnBack = document.getElementById('btnBackToHome');
    if (btnBack) {
        btnBack.addEventListener('click', () => {
            location.href = 'index.html';
        });
    }

    // Load profile data
    async function loadProfile() {
        try {
            const res = await API.get('/api/karyawan/profile');
            if (res.ok && res.data.data) {
                const profile = res.data.data;
                
                // Display profile data
                document.getElementById('viewNip').textContent = profile.nip || '-';
                document.getElementById('viewNamaLengkap').textContent = profile.nama_lengkap || '-';
                document.getElementById('viewJabatan').textContent = profile.jabatan || '-';
                document.getElementById('viewDepartemen').textContent = profile.departemen || '-';
                document.getElementById('viewEmail').textContent = profile.email || '-';
                document.getElementById('viewStatus').textContent = profile.status || '-';

                // Populate edit form
                document.getElementById('editNip').value = profile.nip || '';
                document.getElementById('editNamaLengkap').value = profile.nama_lengkap || '';
                document.getElementById('editJabatan').value = profile.jabatan || '';
                document.getElementById('editDepartemen').value = profile.departemen || '';
                document.getElementById('editEmail').value = profile.email || '';
                document.getElementById('editStatus').value = profile.status || '';

                // Set initials
                const initials = (profile.nama_lengkap || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
                document.getElementById('profileInitials').textContent = initials;
                
                // Load photo if exists
                if (profile.foto_profil) {
                    const img = document.getElementById('profileImagePreview');
                    img.src = profile.foto_profil;
                    img.style.display = 'block';
                    document.getElementById('profileInitials').style.display = 'none';
                    document.getElementById('btnRemovePhoto').style.display = 'inline-block';
                    
                    // Update avatar in header with photo
                    const userAvatar = document.getElementById('userAvatar');
                    if (userAvatar) {
                        userAvatar.style.backgroundImage = `url('${profile.foto_profil}')`;
                        userAvatar.style.backgroundSize = 'cover';
                        userAvatar.style.backgroundPosition = 'center';
                        userAvatar.textContent = ''; // Clear initials
                    }
                } else {
                    // Set user avatar in header with initials
                    const userAvatar = document.getElementById('userAvatar');
                    if (userAvatar) {
                        userAvatar.style.backgroundImage = 'none';
                        userAvatar.textContent = initials;
                    }
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            toast('Gagal memuat data profil.', 'err');
        }
    }

    // Upload photo button
    const btnUploadPhoto = document.getElementById('btnUploadPhoto');
    const photoInput = document.getElementById('photoUploadInput');
    
    if (btnUploadPhoto) {
        btnUploadPhoto.addEventListener('click', () => {
            photoInput.click();
        });
    }

    if (photoInput) {
        photoInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                toast('Harap pilih file gambar.', 'err');
                return;
            }

            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                toast('Ukuran file maksimal 2MB.', 'err');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('foto_profil', file);

                const res = await API.postForm('/api/karyawan/upload-foto', formData);

                if (res.ok && res.data.status) {
                    toast('Foto profil berhasil diupload.');
                    loadProfile(); // Reload profile to show new photo
                } else {
                    toast(res.data?.message || 'Gagal upload foto.', 'err');
                }
            } catch (error) {
                console.error('Error uploading photo:', error);
                toast('Terjadi kesalahan saat upload foto.', 'err');
            }
        });
    }

    // Remove photo button
    const btnRemovePhoto = document.getElementById('btnRemovePhoto');
    if (btnRemovePhoto) {
        btnRemovePhoto.addEventListener('click', async () => {
            if (!confirm('Apakah Anda yakin ingin menghapus foto profil?')) return;

            try {
                const res = await fetch('/api/karyawan/remove-foto', {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'X-XSRF-TOKEN': decodeURIComponent(document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1] || '')
                    }
                });
                const data = await res.json();

                if (res.ok && data.status) {
                    toast('Foto profil berhasil dihapus.');
                    document.getElementById('profileImagePreview').style.display = 'none';
                    document.getElementById('profileInitials').style.display = 'flex';
                    btnRemovePhoto.style.display = 'none';
                    photoInput.value = '';
                    
                    // Reset avatar in header to initials
                    loadProfile();
                } else {
                    toast(data?.message || 'Gagal hapus foto.', 'err');
                }
            } catch (error) {
                console.error('Error removing photo:', error);
                toast('Terjadi kesalahan saat hapus foto.', 'err');
            }
        });
    }

    // Edit profile form submission
    const formEditProfile = document.getElementById('formEditProfile');
    if (formEditProfile) {
        formEditProfile.addEventListener('submit', async (e) => {
            e.preventDefault();

            const payload = {
                nama_lengkap: document.getElementById('editNamaLengkap').value.trim(),
                email: document.getElementById('editEmail').value.trim() || null
            };

            try {
                const res = await API.put('/api/karyawan/profile', payload);

                if (res.ok && res.data.status) {
                    toast('Profil berhasil diupdate.');
                    loadProfile(); // Reload profile
                } else {
                    toast(res.data?.message || 'Gagal update profil.', 'err');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                toast('Terjadi kesalahan saat update profil.', 'err');
            }
        });
    }

    // Reset edit profile button
    const btnResetEditProfile = document.getElementById('btnResetEditProfile');
    if (btnResetEditProfile) {
        btnResetEditProfile.addEventListener('click', () => {
            loadProfile(); // Reload original data
        });
    }

    // Change password form submission
    const formChangePassword = document.getElementById('formChangePassword');
    if (formChangePassword) {
        formChangePassword.addEventListener('submit', async (e) => {
            e.preventDefault();

            const currentPassword = document.getElementById('current_password').value;
            const newPassword = document.getElementById('new_password').value;
            const confirmPassword = document.getElementById('confirm_new_password').value;

            // Validate passwords match
            if (newPassword !== confirmPassword) {
                toast('Password baru dan konfirmasi tidak cocok.', 'err');
                return;
            }

            // Validate password length
            if (newPassword.length < 6) {
                toast('Password minimal 6 karakter.', 'err');
                return;
            }

            try {
                const res = await API.post('/api/karyawan/change-password', {
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword
                });

                if (res.ok && res.data.status) {
                    toast('Password berhasil diubah.');
                    formChangePassword.reset();
                    // Switch back to profile tab
                    tabs.forEach(t => t.classList.remove('active'));
                    tabs[0].classList.add('active');
                    profilCard.style.display = 'block';
                    editDataCard.style.display = 'none';
                    gantiPasswordCard.style.display = 'none';
                } else {
                    toast(res.data?.message || 'Gagal mengubah password.', 'err');
                }
            } catch (error) {
                console.error('Error changing password:', error);
                toast('Terjadi kesalahan saat mengubah password.', 'err');
            }
        });
    }

    // Avatar dropdown from navbar
    const btnChangePasswordDropdown = document.getElementById('btnChangePasswordDropdown');
    if (btnChangePasswordDropdown) {
        btnChangePasswordDropdown.addEventListener('click', () => {
            // Switch to password tab
            tabs.forEach(t => t.classList.remove('active'));
            tabs[2].classList.add('active'); // Password tab is 3rd
            profilCard.style.display = 'none';
            editDataCard.style.display = 'none';
            gantiPasswordCard.style.display = 'block';
            
            // Close dropdown
            document.getElementById('userAvatarDropdown').classList.remove('show');
        });
    }

    const btnChangePhoto = document.getElementById('btnChangePhoto');
    if (btnChangePhoto) {
        btnChangePhoto.addEventListener('click', () => {
            photoInput.click();
            // Close dropdown
            document.getElementById('userAvatarDropdown').classList.remove('show');
        });
    }

    // User Avatar Dropdown Logic
    const userAvatar = document.getElementById('userAvatar');
    const userAvatarDropdown = document.getElementById('userAvatarDropdown');
    
    if (userAvatar && userAvatarDropdown) {
        userAvatar.addEventListener('click', () => {
            userAvatarDropdown.classList.toggle('show');
        });
        
        // Close dropdown if clicked outside
        window.addEventListener('click', (e) => {
            if (!userAvatar.contains(e.target) && !userAvatarDropdown.contains(e.target)) {
                userAvatarDropdown.classList.remove('show');
            }
        });
    }

    // Logout Handler for all logout buttons
    const allLogoutButtons = document.querySelectorAll('#btnLogout');
    allLogoutButtons.forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            console.log('Logout clicked (karyawan-profile)');
            try {
                await API.post('/api/logout', {});
                console.log('Logout successful, redirecting...');
                location.href = '../login.html';
            } catch (error) {
                console.error('Logout error:', error);
                toast('Gagal logout', 'err');
            }
        };
    });

    // Initial load
    loadProfile();
});
