// Admin Dashboard Management System

// Configuration
const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let allMembers = [];
let filteredMembers = [];
let currentAction = null;
let currentMemberId = null;

// DOM Elements
const totalMembersEl = document.getElementById('totalMembers');
const expiringSoonEl = document.getElementById('expiringSoon');
const expiredMembersEl = document.getElementById('expiredMembers');
const activeMembersEl = document.getElementById('activeMembers');
const membersTableBody = document.getElementById('membersTableBody');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const exportBtn = document.querySelector('.export-btn');
const exportDropdown = document.querySelector('.export-dropdown');
const exportOptions = document.querySelectorAll('.export-option');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const logoutBtn = document.querySelector('.logout-btn');
const memberModal = document.getElementById('memberModal');
const closeMemberModal = document.getElementById('closeMemberModal');
const memberModalBody = document.getElementById('memberModalBody');
const confirmModal = document.getElementById('confirmModal');
const closeConfirmModal = document.getElementById('closeConfirmModal');
const confirmMessage = document.getElementById('confirmMessage');
const cancelConfirm = document.getElementById('cancelConfirm');
const confirmActionBtn = document.getElementById('confirmAction');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Dashboard initializing...');
    
    // Check authentication
    checkAuth();
    
    // Load members data
    loadMembersData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup export dropdown
    setupExportDropdown();
    
    console.log('Admin Dashboard initialized');
});

function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = '/index.html';
    }
}

function logout() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminRememberMe');
    window.location.href = '/index.html';
}

function loadMembersData() {
    try {
        // Try localStorage first
        let membersData = localStorage.getItem('membersDB');
        
        if (!membersData) {
            // Try sessionStorage
            membersData = sessionStorage.getItem('membersDB');
        }
        
        if (!membersData) {
            // Check memory storage
            if (window.sessionData && window.sessionData.membersDB) {
                membersData = window.sessionData.membersDB;
            }
        }
        
        if (membersData) {
            allMembers = JSON.parse(membersData);
            updateStats();
            filterMembers();
        } else {
            allMembers = [];
            showEmptyTable();
        }
    } catch (error) {
        console.error('Error loading members data:', error);
        allMembers = [];
        showEmptyTable();
    }
}

function updateStats() {
    const today = new Date();
    
    let total = allMembers.length;
    let expiringSoon = 0;
    let expired = 0;
    let active = 0;
    
    allMembers.forEach(member => {
        if (!member.expiryDate) {
            active++;
            return;
        }
        
        const expiryDate = new Date(member.expiryDate);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry <= 0) {
            expired++;
        } else if (daysUntilExpiry <= 30) {
            expiringSoon++;
            active++;
        } else {
            active++;
        }
    });
    
    totalMembersEl.textContent = total;
    expiringSoonEl.textContent = expiringSoon;
    expiredMembersEl.textContent = expired;
    activeMembersEl.textContent = active;
}

function filterMembers() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    if (!searchTerm) {
        filteredMembers = [...allMembers];
    } else {
        filteredMembers = allMembers.filter(member => {
            return (
                (member.id && member.id.toLowerCase().includes(searchTerm)) ||
                (member.firstName && member.firstName.toLowerCase().includes(searchTerm)) ||
                (member.lastName && member.lastName.toLowerCase().includes(searchTerm)) ||
                (member.email && member.email.toLowerCase().includes(searchTerm)) ||
                (member.phone && member.phone.includes(searchTerm)) ||
                (member.state && member.state.toLowerCase().includes(searchTerm)) ||
                (member.rank && member.rank.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    currentPage = 1;
    renderTable();
    updatePagination();
}

function renderTable() {
    if (!membersTableBody) return;
    
    if (filteredMembers.length === 0) {
        showEmptyTable();
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredMembers.length);
    const pageMembers = filteredMembers.slice(startIndex, endIndex);
    
    membersTableBody.innerHTML = '';
    
    pageMembers.forEach((member, index) => {
        const row = document.createElement('tr');
        const actualIndex = startIndex + index + 1;
        
        // Calculate status
        const status = getMemberStatus(member);
        
        row.innerHTML = `
            <td>${actualIndex}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${member.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="18" fill="%23e0e0e0"/%3E%3Ctext x="20" y="22" text-anchor="middle" font-family="Arial" font-size="12" fill="%23999"%3EPhoto%3C/text%3E%3C/svg%3E'}" 
                         alt="${member.firstName}" 
                         style="width: 40px; height: 40px; border-radius: 8px; object-fit: cover; border: 2px solid #e2e8f0;">
                    <div>
                        <strong>${member.firstName} ${member.lastName}</strong><br>
                        <small style="color: #64748b;">${member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : ''}</small>
                    </div>
                </div>
            </td>
            <td>${member.id || 'N/A'}</td>
            <td>${member.rank || 'N/A'}</td>
            <td>${member.phone || 'N/A'}</td>
            <td>${member.email || 'N/A'}</td>
            <td>${member.state || 'N/A'}</td>
            <td>${formatDate(member.registrationDate, 'short')}</td>
            <td>${formatDate(member.expiryDate, 'short')}</td>
            <td><span class="status-badge ${status.class}">${status.text}</span></td>
            <td>
                <div class="table-actions-cell">
                    <button class="action-btn view" onclick="viewMember('${member.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editMember('${member.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteMember('${member.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        membersTableBody.appendChild(row);
    });
}

function showEmptyTable() {
    if (!membersTableBody) return;
    
    membersTableBody.innerHTML = `
        <tr>
            <td colspan="11" style="text-align: center; padding: 40px;">
                <i class="fas fa-users" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 15px; display: block;"></i>
                <p style="color: #64748b; margin-bottom: 15px;">No members found</p>
                ${allMembers.length === 0 ? '<p style="color: #94a3b8;">Add members using the QR Code Generator</p>' : ''}
            </td>
        </tr>
    `;
}

function getMemberStatus(member) {
    if (!member.expiryDate) {
        return { class: 'status-active', text: 'ACTIVE' };
    }
    
    const today = new Date();
    const expiryDate = new Date(member.expiryDate);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 0) {
        return { class: 'status-expired', text: 'EXPIRED' };
    } else if (daysUntilExpiry <= 30) {
        return { class: 'status-expiring', text: 'EXPIRING' };
    } else {
        return { class: 'status-active', text: 'ACTIVE' };
    }
}

function formatDate(dateString, format = 'long') {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return 'N/A';
        }
        
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
    } catch (error) {
        return 'N/A';
    }
}

function updatePagination() {
    if (!prevBtn || !nextBtn || !pageInfo) return;
    
    const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
}

function setupEventListeners() {
    // Search
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterMembers, 300));
    }
    
    // Refresh
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadMembersData();
            showNotification('Members list refreshed', 'success');
        });
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    }
    
    // Pagination
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                updatePagination();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                updatePagination();
            }
        });
    }
    
    // Modals
    if (closeMemberModal && memberModal) {
        closeMemberModal.addEventListener('click', () => hideModal(memberModal));
    }
    
    if (closeConfirmModal && confirmModal) {
        closeConfirmModal.addEventListener('click', () => hideModal(confirmModal));
    }
    
    if (cancelConfirm && confirmModal) {
        cancelConfirm.addEventListener('click', () => hideModal(confirmModal));
    }
    
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', performAction);
    }
    
    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target === memberModal) hideModal(memberModal);
        if (e.target === confirmModal) hideModal(confirmModal);
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideModal(memberModal);
            hideModal(confirmModal);
        }
    });
}

function setupExportDropdown() {
    if (exportBtn && exportDropdown) {
        exportBtn.addEventListener('click', function() {
            exportDropdown.style.display = exportDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }
    
    exportOptions.forEach(option => {
        option.addEventListener('click', function() {
            const format = this.getAttribute('data-format');
            exportData(format);
            if (exportDropdown) exportDropdown.style.display = 'none';
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (exportDropdown && exportBtn && 
            !exportDropdown.contains(e.target) && 
            !exportBtn.contains(e.target)) {
            exportDropdown.style.display = 'none';
        }
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

function viewMember(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) {
        showNotification('Member not found', 'error');
        return;
    }
    
    const status = getMemberStatus(member);
    
    memberModalBody.innerHTML = `
        <div class="modal-details-body">
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="${member.photo || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="100" y="110" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3ENo Photo%3C/text%3E%3C/svg%3E'}" 
                     alt="${member.firstName}" 
                     style="width: 150px; height: 150px; border-radius: 10px; object-fit: cover; border: 3px solid #e2e8f0; margin-bottom: 15px;">
                <h3 style="margin: 10px 0 5px 0;">${member.firstName} ${member.lastName}</h3>
                <p style="color: #64748b; margin-bottom: 15px;">${member.id}</p>
                <span class="status-badge ${status.class}" style="font-size: 0.9rem;">${status.text}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <div class="detail-group">
                        <div class="detail-label">Full Name</div>
                        <div class="detail-value">${member.firstName} ${member.middleName || ''} ${member.lastName}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Gender</div>
                        <div class="detail-value">${member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Date of Birth</div>
                        <div class="detail-value">${formatDate(member.dob)}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Blood Group</div>
                        <div class="detail-value">${member.bloodGroup || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${member.email || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${member.phone || 'N/A'}</div>
                    </div>
                </div>
                
                <div>
                    <div class="detail-group">
                        <div class="detail-label">NIN</div>
                        <div class="detail-value">${member.nin || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Address</div>
                        <div class="detail-value">${member.address || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">State of Origin</div>
                        <div class="detail-value">${member.state || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Rank</div>
                        <div class="detail-value">${member.rank || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Guarantor Name</div>
                        <div class="detail-value">${member.guarantorName || 'N/A'}</div>
                    </div>
                    <div class="detail-group">
                        <div class="detail-label">Guarantor Phone</div>
                        <div class="detail-value">${member.guarantorPhone || 'N/A'}</div>
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
            
            <div style="margin-top: 30px; text-align: center;">
                <button class="btn-primary" onclick="downloadMemberQR('${member.id}')" style="margin-right: 10px;">
                    <i class="fas fa-qrcode"></i> Download QR Code
                </button>
                <button class="btn-secondary" onclick="printMemberCard('${member.id}')">
                    <i class="fas fa-print"></i> Print Card
                </button>
            </div>
        </div>
    `;
    
    showModal(memberModal);
}

function editMember(memberId) {
    // Redirect to main page with edit parameter
    window.location.href = `/index.html?edit=${memberId}`;
}

function deleteMember(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) {
        showNotification('Member not found', 'error');
        return;
    }
    
    currentAction = 'delete';
    currentMemberId = memberId;
    
    confirmMessage.textContent = `Are you sure you want to delete member ${member.firstName} ${member.lastName} (${member.id})? This action cannot be undone.`;
    showModal(confirmModal);
}

function performAction() {
    if (currentAction === 'delete' && currentMemberId) {
        deleteMemberConfirmed();
    }
    
    hideModal(confirmModal);
    currentAction = null;
    currentMemberId = null;
}

function deleteMemberConfirmed() {
    const memberIndex = allMembers.findIndex(m => m.id === currentMemberId);
    if (memberIndex === -1) {
        showNotification('Member not found', 'error');
        return;
    }
    
    // Remove member
    allMembers.splice(memberIndex, 1);
    
    // Save updated data
    saveMembersData();
    
    // Update UI
    updateStats();
    filterMembers();
    
    showNotification('Member deleted successfully', 'success');
}

function saveMembersData() {
    try {
        localStorage.setItem('membersDB', JSON.stringify(allMembers));
    } catch (e) {
        try {
            sessionStorage.setItem('membersDB', JSON.stringify(allMembers));
        } catch (e2) {
            if (window.sessionData) {
                window.sessionData.membersDB = JSON.stringify(allMembers);
            }
        }
    }
}

function exportData(format) {
    if (filteredMembers.length === 0) {
        showNotification('No data to export', 'warning');
        return;
    }
    
    switch (format) {
        case 'csv':
            exportToCSV();
            break;
        case 'json':
            exportToJSON();
            break;
        case 'pdf':
            exportToPDF();
            break;
    }
}

function exportToCSV() {
    const headers = ['ID', 'First Name', 'Last Name', 'Gender', 'Email', 'Phone', 'State', 'Rank', 'Registration Date', 'Expiry Date', 'Status'];
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add data rows
    filteredMembers.forEach(member => {
        const status = getMemberStatus(member);
        const row = [
            member.id || '',
            `"${member.firstName || ''}"`,
            `"${member.lastName || ''}"`,
            member.gender || '',
            member.email || '',
            member.phone || '',
            member.state || '',
            member.rank || '',
            formatDate(member.registrationDate, 'short'),
            formatDate(member.expiryDate, 'short'),
            status.text
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `members_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported as CSV', 'success');
}

function exportToJSON() {
    const jsonContent = JSON.stringify(filteredMembers, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `members_export_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported as JSON', 'success');
}

function exportToPDF() {
    showNotification('PDF export requires additional libraries. Exporting as JSON instead.', 'info');
    exportToJSON();
}

function downloadMemberQR(memberId) {
    const member = allMembers.find(m => m.id === memberId);
    if (!member) {
        showNotification('Member not found', 'error');
        return;
    }
    
    // Create a temporary QR code
    const tempDiv = document.createElement('div');
    document.body.appendChild(tempDiv);
    
    try {
        // Generate QR code
        const qrCode = new QRCode(tempDiv, {
            text: JSON.stringify(member, null, 2),
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        
        // Wait for QR code to generate
        setTimeout(() => {
            const canvas = tempDiv.querySelector('canvas');
            if (canvas) {
                const link = document.createElement('a');
                link.download = `QR_${member.id}_${member.firstName}_${member.lastName}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                showNotification('QR Code downloaded', 'success');
            } else {
                showNotification('Failed to generate QR code', 'error');
            }
            
            // Clean up
            document.body.removeChild(tempDiv);
        }, 500);
    } catch (error) {
        document.body.removeChild(tempDiv);
        showNotification('Error generating QR code', 'error');
        console.error('QR generation error:', error);
    }
}

function printMemberCard(memberId) {
    showNotification('Print feature requires the main application', 'info');
    // Redirect to main page for printing
    window.location.href = `/index.html?print=${memberId}`;
}

function showModal(modal) {
    if (modal) modal.style.display = 'flex';
}

function hideModal(modal) {
    if (modal) modal.style.display = 'none';
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles if not present
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 300px;
                max-width: 400px;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
                font-family: Arial, sans-serif;
            }
            .notification.success { background: #10b981; }
            .notification.error { background: #ef4444; }
            .notification.warning { background: #f59e0b; }
            .notification.info { background: #3b82f6; }
            .notification button {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0 0 0 10px;
                line-height: 1;
            }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Make functions globally available
window.viewMember = viewMember;
window.editMember = editMember;
window.deleteMember = deleteMember;
window.downloadMemberQR = downloadMemberQR;
window.printMemberCard = printMemberCard;