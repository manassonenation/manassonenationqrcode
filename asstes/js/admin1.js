// Admin Login System
const adminCredentials = {
    username: 'mns90003',
    password: 'manass24' // In production, use proper authentication
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        
        // Check if user is already logged in
        const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        if (isLoggedIn && window.location.pathname.includes('../admin/admin.html')) {
            window.location.href = '../admin/admin_dashboard.html';
        }
    }
    
    // If on dashboard, check authentication
    if (window.location.pathname.includes('../admin/admin_dashboard.html')) {
        checkAuth();
        initializeDashboard();
    }
});

function handleLogin(e) {
    e.preventDefault();    
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (username === adminCredentials.username && password === adminCredentials.password) {
        localStorage.setItem('adminLoggedIn', 'true');
        if (rememberMe) {
            localStorage.setItem('adminRememberMe', 'true');
            localStorage.setItem('adminUsername', username);
        }
        
        // Show success message
        alert('Login successful! Redirecting to dashboard...');
        window.location.href = '../admin/admin_dashboard.html';
    } else {
        alert('Invalid username or password');
    }
}

function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = '../admin/admin.html';
    }
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminRememberMe');
    window.location.href = '../admin/admin.html';
}

function initializeDashboard() {
    loadMembersTable();
    setupEventListeners();
    updateStats();
}

function loadMembersTable() {
    const membersDB = JSON.parse(localStorage.getItem('membersDB')) || [];
    const tableBody = document.querySelector('.members-table tbody');
    
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (membersDB.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 40px;">
                    <i class="fas fa-users" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px; display: block;"></i>
                    <p style="color: #64748b;">No members found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    membersDB.forEach((member, index) => {
        const row = document.createElement('tr');
        
        // Calculate status
        const expiryDate = new Date(member.expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        let status = 'active';
        let statusClass = 'status-active';
        
        if (daysUntilExpiry <= 0) {
            status = 'expired';
            statusClass = 'status-expired';
        } else if (daysUntilExpiry <= 30) {
            status = 'expiring';
            statusClass = 'status-expiring';
        }
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${member.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="18" fill="%23e0e0e0"/%3E%3Ctext x="20" y="22" text-anchor="middle" font-family="Arial" font-size="12" fill="%23999"%3EPhoto%3C/text%3E%3C/svg%3E'}" 
                         alt="${member.firstName}" 
                         class="member-photo-small">
                    <div>
                        <strong>${member.firstName} ${member.lastName}</strong><br>
                        <small style="color: #64748b;">${member.id}</small>
                    </div>
                </div>
            </td>
            <td>${member.rank}</td>
            <td>${member.phone}</td>
            <td>${member.email}</td>
            <td>${member.state}</td>
            <td>${formatDate(member.registrationDate, 'short')}</td>
            <td>${formatDate(member.expiryDate, 'short')}</td>
            <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
            <td class="table-actions-cell">
                <button class="action-btn view" onclick="viewMember('${member.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="action-btn edit" onclick="editMember('${member.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="action-btn delete" onclick="deleteMember('${member.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchMembers, 300));
    }
    
    // Export functionality
    const exportBtn = document.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', toggleExportDropdown);
    }
    
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Export options
    document.querySelectorAll('.export-option').forEach(option => {
        option.addEventListener('click', function() {
            const format = this.dataset.format;
            exportData(format);
        });
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function searchMembers() {
    const searchTerm = document.querySelector('.search-box input').value.toLowerCase();
    const rows = document.querySelectorAll('.members-table tbody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function updateStats() {
    const membersDB = JSON.parse(localStorage.getItem('membersDB')) || [];
    const today = new Date();
    
    const totalMembers = membersDB.length;
    let expiringSoon = 0;
    let expired = 0;
    
    membersDB.forEach(member => {
        const expiryDate = new Date(member.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
            expired++;
        } else if (daysUntilExpiry <= 30) {
            expiringSoon++;
        }
    });
    
    // Update stat cards
    document.querySelectorAll('.stat-content h3').forEach(stat => {
        if (stat.textContent.includes('Total')) {
            stat.textContent = totalMembers;
        } else if (stat.textContent.includes('Expiring')) {
            stat.textContent = expiringSoon;
        } else if (stat.textContent.includes('Inactive')) {
            stat.textContent = expired;
        }
    });
}

function viewMember(memberId) {
    const membersDB = JSON.parse(localStorage.getItem('membersDB')) || [];
    const member = membersDB.find(m => m.id === memberId);
    
    if (!member) {
        alert('Member not found');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-details';
    modal.innerHTML = `
        <div class="modal-details-content">
            <div class="modal-details-header">
                <h3>Member Details: ${member.firstName} ${member.lastName}</h3>
                <button class="modal-close" onclick="this.closest('.modal-details').remove()">&times;</button>
            </div>
            <div class="modal-details-body">
                <div>
                    <div class="member-detail-photo">
                        <img src="${member.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="100" y="110" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3ENo Photo%3C/text%3E%3C/svg%3E'}" 
                             alt="${member.firstName}">
                    </div>
                    <div class="qr-preview-modal">
                        <div id="memberQrCode"></div>
                        <button onclick="downloadMemberQR('${member.id}')" class="btn-download">
                            <i class="fas fa-download"></i> Download QR Code
                        </button>
                    </div>
                </div>
                <div>
                    <div class="detail-group">
                        <div class="detail-label">Member ID</div>
                        <div class="detail-value">${member.id}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Full Name</div>
                        <div class="detail-value">${member.firstName} ${member.middleName || ''} ${member.lastName}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Gender</div>
                        <div class="detail-value">${member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : '-'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Date of Birth</div>
                        <div class="detail-value">${formatDate(member.dob)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Blood Group</div>
                        <div class="detail-value">${member.bloodGroup || '-'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${member.email}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${member.phone}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">NIN</div>
                        <div class="detail-value">${member.nin}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Address</div>
                        <div class="detail-value">${member.address}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">State of Origin</div>
                        <div class="detail-value">${member.state}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Rank</div>
                        <div class="detail-value">${member.rank}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Guarantor Name</div>
                        <div class="detail-value">${member.guarantorName}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Guarantor Phone</div>
                        <div class="detail-value">${member.guarantorPhone}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Registration Date</div>
                        <div class="detail-value">${formatDate(member.registrationDate)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Expiry Date</div>
                        <div class="detail-value">${formatDate(member.expiryDate)}</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Generate QR code for this member
    setTimeout(() => {
        const qrData = JSON.stringify(member, null, 2);
        new QRCode(document.getElementById('memberQrCode'), {
            text: qrData,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }, 100);
}

function downloadMemberQR(memberId) {
    const membersDB = JSON.parse(localStorage.getItem('membersDB')) || [];
    const member = membersDB.find(m => m.id === memberId);
    
    if (!member) return;
    
    const qrCanvas = document.querySelector('#memberQrCode canvas');
    if (!qrCanvas) return;
    
    const link = document.createElement('a');
    link.download = `QR_${member.id}_${member.firstName}_${member.lastName}.png`;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
}

function editMember(memberId) {
    // Redirect to main page with member ID in URL
    window.location.href = `/index.html?edit=${memberId}`;
}

function deleteMember(memberId) {
    if (confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
        let membersDB = JSON.parse(localStorage.getItem('membersDB')) || [];
        membersDB = membersDB.filter(member => member.id !== memberId);
        localStorage.setItem('membersDB', JSON.stringify(membersDB));
        
        // Reload table
        loadMembersTable();
        updateStats();
        
        alert('Member deleted successfully');
    }
}

function toggleExportDropdown() {
    const dropdown = document.querySelector('.export-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

function exportData(format) {
    const membersDB = JSON.parse(localStorage.getItem('membersDB')) || [];
    
    if (membersDB.length === 0) {
        alert('No data to export');
        return;
    }
    
    switch (format) {
        case 'csv':
            exportToCSV(membersDB);
            break;
        case 'excel':
            exportToExcel(membersDB);
            break;
        case 'pdf':
            exportToJSON(membersDB);
            break;
        case 'pdf':
            exportToPDF(membersDB);
            break;
    }
}

function exportToCSV(data) {
    const headers = ['ID', 'First Name', 'Last Name', 'Gender', 'DOB', 'Email', 'Phone', 'State', 'Rank', 'Registration Date', 'Expiry Date'];
    
    const csvContent = [
        headers.join(','),
        ...data.map(member => [
            member.id,
            `"${member.firstName}"`,
            `"${member.lastName}"`,
            member.gender,
            member.dob,
            member.email,
            member.phone,
            member.state,
            member.rank,
            member.registrationDate,
            member.expiryDate
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `members_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

function exportToExcel(data) {
    // Simple implementation - in production, use a proper Excel library
    exportToCSV(data); // Fallback to CSV for now
}

function exportToJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `members_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function exportToPDF(data) {
    alert('PDF export feature requires additional libraries. Exporting as JSON instead.');
    exportToJSON(data); // Fallback to JSON
}

function formatDate(dateString, format = 'long') {
    if (!dateString) return '-';
    const date = new Date(dateString);
    
    if (format === 'short') {
        return date.toLocaleDateString('en-GB');
    }
    
    return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-details')) {
        e.target.remove();
    }
    
    // Close export dropdown when clicking outside
    if (!e.target.closest('.export-options')) {
        const dropdown = document.querySelector('.export-dropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }
});