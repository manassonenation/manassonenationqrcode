// Membership QR Code Generator
// With complete member data in QR code and working print function

// Global variables
let membersDB = [];
let currentMemberId = null;
let memberPhotoBase64 = '';
let qrCodeInstance = null;
let cardQrInstance = null;

// Organization details
const organizationDetails = {
    name: "MANASS NATION KADUNA REGUS",
    address: "Dic FOOT-BALL filled trikania nassarawa kaduna (FILIN ACED)",
    phone: "+2347063849950, +2348144722911",
    email: "manassonenationkadunaregus@gmail.com",
    website: "www.manassonenation.vercel.app",
    registration: "RC: 1234567"
};

// Simple storage with fallback
const SimpleStorage = {
    memoryStorage: {},
    
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.log('localStorage not available, using memory storage');
            this.memoryStorage[key] = value;
        }
    },
    
    getItem(key) {
        try {
            return localStorage.getItem(key) || this.memoryStorage[key] || null;
        } catch (e) {
            return this.memoryStorage[key] || null;
        }
    },
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            // Ignore
        }
        delete this.memoryStorage[key];
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Membership QR System...');
    try {
        initializeApp();
        console.log('Membership QR System initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showAlert('System initialized. You can generate QR codes.', 'info');
    }
});

function initializeApp() {
    // Set up date constraints
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        const today = new Date();
        const minDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
        const maxDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
        dobInput.max = minDate.toISOString().split('T')[0];
        dobInput.min = maxDate.toISOString().split('T')[0];
    }
    
    // Load existing data
    loadData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize member ID dropdown with all IDs
    populateMemberDropdown();
}

function loadData() {
    try {
        // Load members
        const savedMembers = SimpleStorage.getItem('membersDB');
        if (savedMembers) {
            const parsedMembers = JSON.parse(savedMembers);
            
            // Filter out invalid members
            membersDB = Array.isArray(parsedMembers) ? 
                parsedMembers.filter(member => 
                    member && 
                    typeof member === 'object' && 
                    member.id && 
                    typeof member.id === 'string'
                ) : [];
            
            populateMemberDropdown();
            
            // Select first member if exists
            if (membersDB.length > 0) {
                const memberIdSelect = document.getElementById('memberId');
                if (memberIdSelect && memberIdSelect.options.length > 1) {
                    memberIdSelect.value = membersDB[0].id;
                    loadMemberData(membersDB[0]);
                    currentMemberId = membersDB[0].id;
                }
            }
        }
        
        // Load form draft
        const draftData = SimpleStorage.getItem('memberFormDraft');
        if (draftData) {
            const formData = JSON.parse(draftData);
            loadFormData(formData);
        }
    } catch (error) {
        console.log('Loading saved data failed:', error);
        membersDB = [];
    }
}

function loadFormData(formData) {
    if (!formData || typeof formData !== 'object') return;
    
    // Load form values
    document.getElementById('firstName').value = formData.firstName || '';
    document.getElementById('lastName').value = formData.lastName || '';
    document.getElementById('middleName').value = formData.middleName || '';
    setSelectedGender(formData.gender);
    document.getElementById('dob').value = formData.dob || '';
    document.getElementById('bloodGroup').value = formData.bloodGroup || '';
    document.getElementById('email').value = formData.email || '';
    document.getElementById('phone').value = formData.phone || '';
    document.getElementById('nin').value = formData.nin || '';
    document.getElementById('address').value = formData.address || '';
    document.getElementById('state').value = formData.state || '';
    document.getElementById('rank').value = formData.rank || '';
    document.getElementById('guarantorName').value = formData.guarantorName || '';
    document.getElementById('guarantorPhone').value = formData.guarantorPhone || '';
    
    // Load photo
    if (formData.photo && typeof formData.photo === 'string') {
        memberPhotoBase64 = formData.photo;
        const photoPreview = document.getElementById('photoPreview');
        const cardPhotoPreview = document.getElementById('cardPhotoPreview');
        if (photoPreview) photoPreview.src = formData.photo;
        if (cardPhotoPreview) cardPhotoPreview.src = formData.photo;
    }
}

function setSelectedGender(gender) {
    const radios = document.querySelectorAll('input[name="gender"]');
    radios.forEach(radio => {
        radio.checked = (radio.value === gender);
    });
}

function getSelectedGender() {
    const radios = document.querySelectorAll('input[name="gender"]');
    for (const radio of radios) {
        if (radio.checked) return radio.value;
    }
    return '';
}

function populateMemberDropdown() {
    const memberIdSelect = document.getElementById('memberId');
    if (!memberIdSelect) return;
    
    // Clear existing options
    memberIdSelect.innerHTML = '<option value="">Select Member ID</option>';
    
    // Generate all member IDs from 90001 to 91111
    for (let i = 90001; i <= 91111; i++) {
        const memberId = `MNS${i.toString().padStart(5, '0')}`;
        const existingMember = membersDB.find(member => 
            member && member.id && member.id.toUpperCase() === memberId.toUpperCase()
        );
        
        const option = document.createElement('option');
        option.value = memberId;
        
        if (existingMember) {
            option.textContent = `${memberId} - ${existingMember.firstName} ${existingMember.lastName}`;
            option.style.color = '#666';
        } else {
            option.textContent = `${memberId} - Available`;
            option.style.color = '#3b82f6';
            option.style.fontWeight = 'bold';
        }
        
        memberIdSelect.appendChild(option);
    }
}

function setupEventListeners() {
    // Member ID change
    const memberIdSelect = document.getElementById('memberId');
    if (memberIdSelect) {
        memberIdSelect.addEventListener('change', function() {
            const selectedId = this.value;
            if (selectedId) {
                currentMemberId = selectedId;
                
                // Find if this member exists in database
                const existingMember = membersDB.find(member => 
                    member && member.id && 
                    member.id.toUpperCase() === selectedId.toUpperCase()
                );
                
                if (existingMember) {
                    loadMemberData(existingMember);
                } else {
                    // Clear form for new member
                    clearFormForNewMember();
                }
            }
        });
    }
    
    // Photo upload
    const photoUploadArea = document.getElementById('photoUploadArea');
    const memberPhotoInput = document.getElementById('memberPhoto');
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    
    if (photoUploadArea && memberPhotoInput) {
        photoUploadArea.addEventListener('click', () => memberPhotoInput.click());
    }
    
    if (memberPhotoInput) {
        memberPhotoInput.addEventListener('change', handlePhotoUpload);
    }
    
    if (changePhotoBtn) {
        changePhotoBtn.addEventListener('click', () => memberPhotoInput.click());
    }
    
    // Form buttons
    const generateBtn = document.getElementById('generateBtn');
    const saveBtn = document.getElementById('saveBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    if (generateBtn) generateBtn.addEventListener('click', generateQRCode);
    if (saveBtn) saveBtn.addEventListener('click', saveMember);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadQRCode);
    if (printBtn) printBtn.addEventListener('click', printCard);
    if (clearBtn) clearBtn.addEventListener('click', clearForm);
    
    // Help modal
    const helpBtn = document.getElementById('helpBtn');
    const helpModal = document.getElementById('helpModal');
    const closeHelpModal = document.getElementById('closeHelpModal');
    
    if (helpBtn) helpBtn.addEventListener('click', () => showModal(helpModal));
    if (closeHelpModal) closeHelpModal.addEventListener('click', () => hideModal(helpModal));
    
    // Auto-save form
    setupAutoSave();
    
    // Form validation
    setupValidation();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

function setupAutoSave() {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', saveFormData);
        input.addEventListener('change', saveFormData);
    });
}

function saveFormData() {
    const formData = {
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        middleName: document.getElementById('middleName').value,
        gender: getSelectedGender(),
        dob: document.getElementById('dob').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        nin: document.getElementById('nin').value,
        address: document.getElementById('address').value,
        state: document.getElementById('state').value,
        rank: document.getElementById('rank').value,
        guarantorName: document.getElementById('guarantorName').value,
        guarantorPhone: document.getElementById('guarantorPhone').value,
        photo: memberPhotoBase64
    };
    
    SimpleStorage.setItem('memberFormDraft', JSON.stringify(formData));
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showAlert('Please upload an image file (JPG, PNG, GIF).', 'error');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showAlert('Image size should be less than 2MB.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        memberPhotoBase64 = e.target.result;
        document.getElementById('photoPreview').src = memberPhotoBase64;
        document.getElementById('cardPhotoPreview').src = memberPhotoBase64;
        saveFormData();
    };
    reader.readAsDataURL(file);
}

function setupValidation() {
    // Email validation
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.classList.add('error');
                showAlert('Please enter a valid email address', 'error');
            } else {
                this.classList.remove('error');
            }
        });
    }
    
    // Phone validation
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('blur', function() {
            const phoneDigits = this.value.replace(/\D/g, '');
            if (this.value && (phoneDigits.length < 10 || phoneDigits.length > 15)) {
                this.classList.add('error');
                showAlert('Please enter a valid phone number (10-15 digits)', 'error');
            } else {
                this.classList.remove('error');
            }
        });
    }
    
    // NIN validation
    const ninInput = document.getElementById('nin');
    if (ninInput) {
        ninInput.addEventListener('blur', function() {
            if (this.value && this.value.length !== 11) {
                this.classList.add('error');
                showAlert('NIN must be 11 digits', 'error');
            } else {
                this.classList.remove('error');
            }
        });
    }
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }
        
        // Ctrl+G: Generate QR
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            generateQRCode();
        }
        
        // Ctrl+S: Save
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            document.getElementById('saveBtn')?.click();
        }
    });
}

function validateForm() {
    const requiredFields = [
        { id: 'firstName', name: 'First Name' },
        { id: 'lastName', name: 'Last Name' },
        { id: 'dob', name: 'Date of Birth' },
        { id: 'bloodGroup', name: 'Blood Group' },
        { id: 'email', name: 'Email' },
        { id: 'phone', name: 'Phone Number' },
        { id: 'nin', name: 'NIN' },
        { id: 'address', name: 'Address' },
        { id: 'state', name: 'State' },
        { id: 'rank', name: 'Rank' },
        { id: 'guarantorName', name: 'Guarantor Name' },
        { id: 'guarantorPhone', name: 'Guarantor Phone' }
    ];
    
    // Check required fields
    for (const field of requiredFields) {
        const element = document.getElementById(field.id);
        if (!element || !element.value.trim()) {
            showAlert(`Please fill in ${field.name}`, 'error');
            if (element) {
                element.focus();
                element.classList.add('error');
            }
            return false;
        }
        if (element) element.classList.remove('error');
    }
    
    // Check gender
    if (!getSelectedGender()) {
        showAlert('Please select gender', 'error');
        return false;
    }
    
    // Validate email
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'error');
        document.getElementById('email').classList.add('error');
        return false;
    }
    
    // Validate phone
    const phone = document.getElementById('phone').value.replace(/\D/g, '');
    if (phone.length < 11 || phone.length > 11) {
        showAlert('Please enter a valid phone number (11 digits)', 'error');
        document.getElementById('phone').classList.add('error');
        return false;
    }
    
    // Validate NIN
    const nin = document.getElementById('nin').value;
    if (nin.length !== 11) {
        showAlert('NIN must be 11 digits', 'error');
        document.getElementById('nin').classList.add('error');
        return false;
    }
    
    // Check photo
    if (!memberPhotoBase64) {
        showAlert('Please upload a member photo', 'error');
        return false;
    }
    
    // Check member ID is selected
    if (!currentMemberId) {
        showAlert('Please select a Member ID', 'error');
        document.getElementById('memberId').focus();
        return false;
    }
    
    return true;
}

function generateQRCode() {
    if (!validateForm()) return;
    
    showLoading(true);
    
    // Use setTimeout to allow UI to update
    setTimeout(() => {
        try {
            const memberData = getMemberData();
            const qrData = createQRData(memberData);
            
            // Convert to string with line breaks for better readability when scanned
            const qrDataString = formatQRDataString(qrData);
            console.log('QR Data length:', qrDataString.length);
            
            // Generate main QR code
            const qrcodeDiv = document.getElementById('qrcode');
            if (qrcodeDiv) {
                qrcodeDiv.innerHTML = '';
                
                if (qrCodeInstance) {
                    try {
                        qrCodeInstance.clear();
                    } catch (e) {
                        // Ignore
                    }
                }
                
                // Use L correction level to allow more data
                qrCodeInstance = new QRCode(qrcodeDiv, {
                    text: qrDataString,
                    width: 220,
                    height: 220,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.L
                });
            }
            
            // Generate card QR code (same data, smaller size)
            const cardQrDiv = document.getElementById('cardQr');
            if (cardQrDiv) {
                cardQrDiv.innerHTML = '';
                
                if (cardQrInstance) {
                    try {
                        cardQrInstance.clear();
                    } catch (e) {
                        // Ignore
                    }
                }
                
                cardQrInstance = new QRCode(cardQrDiv, {
                    text: qrDataString,
                    width: 90,
                    height: 90,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.L
                });
            }
            
            // Update previews
            updatePreview();
            updateCardPreview();
            
            // Enable buttons
            const saveBtn = document.getElementById('saveBtn');
            const downloadBtn = document.getElementById('downloadBtn');
            const printBtn = document.getElementById('printBtn');
            
            if (saveBtn) saveBtn.disabled = false;
            if (downloadBtn) downloadBtn.disabled = false;
            if (printBtn) printBtn.disabled = false;
            
            showAlert('QR Code generated successfully! Contains all member and organization details.', 'success');
            
            // Scroll to preview
            setTimeout(() => {
                const previewSection = document.querySelector('.preview-section');
                if (previewSection) {
                    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 300);
            
        } catch (error) {
            console.error('Error generating QR code:', error);
            showAlert('Error generating QR code. Please try with shorter text fields.', 'error');
        } finally {
            showLoading(false);
        }
    }, 100);
}

function createQRData(memberData) {
    return {
        // Member Details
        MemberID: memberData.id,
        FullName: `${memberData.firstName} ${memberData.middleName || ''} ${memberData.lastName}`.trim(),
        Gender: memberData.gender,
        DateOfBirth: formatDateForQR(memberData.dob),
        BloodGroup: memberData.bloodGroup,
        Email: memberData.email,
        Phone: memberData.phone,
        NIN: memberData.nin,
        Address: memberData.address,
        State: memberData.state,
        Rank: memberData.rank,
        
        // Guarantor Details
        GuarantorName: memberData.guarantorName,
        GuarantorPhone: memberData.guarantorPhone,
        
        // Membership Details
        RegistrationDate: formatDateForQR(memberData.registrationDate),
        ExpiryDate: formatDateForQR(memberData.expiryDate),
        Status: memberData.status,
        
        // Organization Details
        Organization: organizationDetails.name,
        OrgAddress: organizationDetails.address,
        OrgPhone: organizationDetails.phone,
        OrgEmail: organizationDetails.email,
        OrgWebsite: organizationDetails.website,
        OrgRegistration: organizationDetails.registration,
        
        // Timestamp
        GeneratedOn: new Date().toISOString(),
        
        // Verification Info
        VerificationURL: `${organizationDetails.website}/verify/${memberData.id}`
    };
}

function formatQRDataString(qrData) {
    // Format as readable text for scanning
    return `
MEMBERSHIP CERTIFICATE
======================

MEMBER DETAILS:
---------------
Member ID: ${qrData.MemberID}
Full Name: ${qrData.FullName}
Gender: ${qrData.Gender}
Date of Birth: ${qrData.DateOfBirth}
Blood Group: ${qrData.BloodGroup}
Email: ${qrData.Email}
Phone: ${qrData.Phone}
NIN: ${qrData.NIN}
Address: ${qrData.Address}
State: ${qrData.State}
Rank: ${qrData.Rank}

GUARANTOR DETAILS:
------------------
Name: ${qrData.GuarantorName}
Phone: ${qrData.GuarantorPhone}

MEMBERSHIP STATUS:
------------------
Registration Date: ${qrData.RegistrationDate}
Expiry Date: ${qrData.ExpiryDate}
Status: ${qrData.Status}

ORGANIZATION DETAILS:
---------------------
Name: ${qrData.Organization}
Address: ${qrData.OrgAddress}
Phone: ${qrData.OrgPhone}
Email: ${qrData.OrgEmail}
Website: ${qrData.OrgWebsite}
Registration: ${qrData.OrgRegistration}

VERIFICATION:
-------------
Verify at: ${qrData.VerificationURL}
Generated: ${new Date(qrData.GeneratedOn).toLocaleString()}

This is an official membership certificate.
`;
}

function formatDateForQR(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

function getMemberData() {
    const registrationDate = new Date().toISOString();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5); // 5 years expiry
    
    // Use current member ID
    const memberId = currentMemberId || 'MNS90001';
    
    return {
        id: memberId,
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        gender: getSelectedGender(),
        dob: document.getElementById('dob').value,
        bloodGroup: document.getElementById('bloodGroup').value,
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        nin: document.getElementById('nin').value.trim(),
        address: document.getElementById('address').value.trim(),
        state: document.getElementById('state').value,
        rank: document.getElementById('rank').value,
        guarantorName: document.getElementById('guarantorName').value.trim(),
        guarantorPhone: document.getElementById('guarantorPhone').value.trim(),
        photo: memberPhotoBase64,
        registrationDate: registrationDate,
        expiryDate: expiryDate.toISOString(),
        status: 'active'
    };
}

function updatePreview() {
    try {
        const memberData = getMemberData();
        
        // Update preview elements
        const previewId = document.getElementById('preview-id');
        const previewName = document.getElementById('preview-name');
        const previewGender = document.getElementById('preview-gender');
        const previewDob = document.getElementById('preview-dob');
        const previewBlood = document.getElementById('preview-blood');
        const previewEmail = document.getElementById('preview-email');
        const previewPhone = document.getElementById('preview-phone');
        const previewNin = document.getElementById('preview-nin');
        const previewAddress = document.getElementById('preview-address');
        const previewState = document.getElementById('preview-state');
        const previewRank = document.getElementById('preview-rank');
        const previewGuarantor = document.getElementById('preview-guarantor');
        const previewGuarantorPhone = document.getElementById('preview-guarantor-phone');
        const previewRegistered = document.getElementById('preview-registered');
        const previewExpiry = document.getElementById('preview-expiry');
        
        if (previewId) previewId.textContent = memberData.id || '-';
        if (previewName) previewName.textContent = `${memberData.firstName || ''} ${memberData.middleName ? memberData.middleName + ' ' : ''}${memberData.lastName || ''}`.trim() || '-';
        if (previewGender) previewGender.textContent = memberData.gender ? memberData.gender.charAt(0).toUpperCase() + memberData.gender.slice(1) : '-';
        if (previewDob) previewDob.textContent = formatDate(memberData.dob) || '-';
        if (previewBlood) previewBlood.textContent = memberData.bloodGroup || '-';
        if (previewEmail) previewEmail.textContent = memberData.email || '-';
        if (previewPhone) previewPhone.textContent = memberData.phone || '-';
        if (previewNin) previewNin.textContent = memberData.nin || '-';
        if (previewAddress) previewAddress.textContent = memberData.address || '-';
        if (previewState) previewState.textContent = memberData.state || '-';
        if (previewRank) previewRank.textContent = memberData.rank || '-';
        if (previewGuarantor) previewGuarantor.textContent = memberData.guarantorName || '-';
        if (previewGuarantorPhone) previewGuarantorPhone.textContent = memberData.guarantorPhone || '-';
        if (previewRegistered) previewRegistered.textContent = formatDate(memberData.registrationDate) || '-';
        if (previewExpiry) previewExpiry.textContent = formatDate(memberData.expiryDate) || '-';
        
    } catch (error) {
        console.error('Error updating preview:', error);
    }
}

function updateCardPreview() {
    try {
        const memberData = getMemberData();
        
        // Update card preview elements
        const cardId = document.getElementById('card-id');
        const cardName = document.getElementById('card-name');
        const cardRank = document.getElementById('card-rank');
        const cardPhone = document.getElementById('card-phone');
        const cardExpiry = document.getElementById('card-expiry');
        const cardPhoto = document.getElementById('cardPhotoPreview');
        const cardOrg = document.getElementById('card-org');
        const cardOrgPhone = document.getElementById('card-org-phone');
        
        if (cardId) cardId.textContent = memberData.id || 'MNS00000';
        if (cardName) cardName.textContent = `${memberData.firstName || ''} ${memberData.lastName || ''}`.trim() || 'Member Name';
        if (cardRank) cardRank.textContent = memberData.rank || 'Rank';
        if (cardPhone) cardPhone.textContent = memberData.phone || '000-000-0000';
        if (cardExpiry) cardExpiry.textContent = formatDate(memberData.expiryDate, 'short') || '01/01/2025';
        if (cardPhoto && memberData.photo) cardPhoto.src = memberData.photo;
        if (cardOrg) cardOrg.textContent = organizationDetails.name || 'MANASS ONE NATION MEMBER IDENTITY CARD';
        if (cardOrgPhone) cardOrgPhone.textContent = organizationDetails.phone || '+2347063849950,+234817224911';
        
    } catch (error) {
        console.error('Error updating card preview:', error);
    }
}

function formatDate(dateString, format = 'long') {
    if (!dateString) return '-';
    
    try {
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return '-';
        }
        
        if (format === 'short') {
            // Format: DD/MM/YYYY
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }
        
        // Long format: 1st January 2025
        const day = date.getDate();
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        const year = date.getFullYear();
        const daySuffix = getDaySuffix(day);
        
        return `${day}${daySuffix} ${month} ${year}`;
    } catch (error) {
        return '-';
    }
}

function getDaySuffix(day) {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}

function saveMember() {
    if (!validateForm()) return;
    
    showLoading(true);
    
    setTimeout(() => {
        try {
            const memberData = getMemberData();
            
            // Validate member ID
            if (!memberData.id) {
                showAlert('Invalid Member ID. Please select a valid ID.', 'error');
                showLoading(false);
                return;
            }
            
            // Check if member already exists
            const existingIndex = membersDB.findIndex(member => 
                member && member.id && 
                member.id.toUpperCase() === memberData.id.toUpperCase()
            );
            
            if (existingIndex > -1) {
                // Update existing member
                membersDB[existingIndex] = memberData;
            } else {
                // Add new member
                membersDB.push(memberData);
            }
            
            // Save to storage
            SimpleStorage.setItem('membersDB', JSON.stringify(membersDB));
            
            // Update dropdown
            populateMemberDropdown();
            
            // Clear draft
            SimpleStorage.removeItem('memberFormDraft');
            
            showAlert(`Member ${memberData.firstName} ${memberData.lastName} (${memberData.id}) saved successfully!`, 'success');
            
        } catch (error) {
            console.error('Error saving member:', error);
            showAlert('Error saving member. Please try again.', 'error');
        } finally {
            showLoading(false);
        }
    }, 500);
}

function loadMemberData(member) {
    if (!member || typeof member !== 'object') return;
    
    document.getElementById('firstName').value = member.firstName || '';
    document.getElementById('lastName').value = member.lastName || '';
    document.getElementById('middleName').value = member.middleName || '';
    setSelectedGender(member.gender);
    document.getElementById('dob').value = member.dob || '';
    document.getElementById('bloodGroup').value = member.bloodGroup || '';
    document.getElementById('email').value = member.email || '';
    document.getElementById('phone').value = member.phone || '';
    document.getElementById('nin').value = member.nin || '';
    document.getElementById('address').value = member.address || '';
    document.getElementById('state').value = member.state || '';
    document.getElementById('rank').value = member.rank || '';
    document.getElementById('guarantorName').value = member.guarantorName || '';
    document.getElementById('guarantorPhone').value = member.guarantorPhone || '';
    
    if (member.photo && typeof member.photo === 'string') {
        memberPhotoBase64 = member.photo;
        document.getElementById('photoPreview').src = member.photo;
        document.getElementById('cardPhotoPreview').src = member.photo;
    }
    
    updatePreview();
    updateCardPreview();
}

function downloadQRCode() {
    try {
        const qrCanvas = document.querySelector('#qrcode canvas');
        if (!qrCanvas) {
            showAlert('Please generate a QR code first', 'error');
            return;
        }
        
        const memberData = getMemberData();
        const fileName = `Membership_QR_${memberData.id}_${memberData.firstName}_${memberData.lastName}.png`;
        
        // Create download link
        const link = document.createElement('a');
        link.download = fileName;
        link.href = qrCanvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showAlert('QR Code downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error downloading QR code:', error);
        showAlert('Error downloading QR code', 'error');
    }
}

function printCard() {
    try {
        // Get the card preview element
        const cardElement = document.querySelector('.member-card-preview');
        if (!cardElement) {
            showAlert('Card preview not found', 'error');
            return;
        }
        
        // Get QR code data URL
        const qrCanvas = document.querySelector('#cardQr canvas');
        if (!qrCanvas) {
            showAlert('Please generate a QR code first', 'error');
            return;
        }
        
        const qrDataURL = qrCanvas.toDataURL('image/png');
        const memberData = getMemberData();
        
        // Create print window
        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            showAlert('Please allow popups to print the card', 'warning');
            return;
        }
        
        // Write print content
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Membership Card - ${memberData.id}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                    
                    * { 
                        margin: 0; 
                        padding: 0; 
                        box-sizing: border-box; 
                    }
                    
                    body { 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        min-height: 100vh; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        padding: 20px;
                        font-family: 'Poppins', sans-serif;
                    }
                    
                    .print-container {
                        display: flex;
                        flex-direction: column;
                        gap: 30px;
                        align-items: center;
                        width: 100%;
                        max-width: 1000px;
                    }
                    
                    .card-container {
                        display: flex;
                        gap: 20px;
                        flex-wrap: wrap;
                        justify-content: center;
                    }
                    
                    .membership-card {
                        width: 400px;
                        height: 250px;
                        background: linear-gradient(135deg, #1a237e 0%, #311b92 100%);
                        border-radius: 20px;
                        padding: 25px;
                        color: white;
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .card-watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-45deg);
                        font-size: 80px;
                        font-weight: 900;
                        color: rgba(255,255,255,0.05);
                        white-space: nowrap;
                        user-select: none;
                    }
                    
                    .card-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                        position: relative;
                        z-index: 1;
                    }
                    
                    .card-logo {
                        font-weight: 700;
                        font-size: 18px;
                        color: #fff;
                        letter-spacing: 1px;
                    }
                    
                    .card-id {
                        font-size: 16px;
                        font-weight: 600;
                        background: rgba(255,255,255,0.2);
                        padding: 6px 12px;
                        border-radius: 30px;
                    }
                    
                    .card-body {
                        display: flex;
                        gap: 20px;
                        margin-bottom: 20px;
                        flex: 1;
                        position: relative;
                        z-index: 1;
                    }
                    
                    .card-photo-container {
                        width: 100px;
                        height: 120px;
                        border-radius: 10px;
                        overflow: hidden;
                        border: 3px solid rgba(255,255,255,0.3);
                        background: white;
                    }
                    
                    .card-photo {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                    
                    .card-details {
                        flex: 1;
                    }
                    
                    .card-name {
                        font-size: 22px;
                        font-weight: 700;
                        margin-bottom: 8px;
                        letter-spacing: 0.5px;
                    }
                    
                    .card-rank {
                        font-size: 16px;
                        font-weight: 500;
                        color: #bbdefb;
                        margin-bottom: 8px;
                    }
                    
                    .card-info {
                        font-size: 14px;
                        color: #e3f2fd;
                        margin-bottom: 4px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    }
                    
                    .card-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-top: 1px solid rgba(255,255,255,0.2);
                        padding-top: 15px;
                        position: relative;
                        z-index: 1;
                    }
                    
                    .card-qr-container {
                        width: 70px;
                        height: 70px;
                        background: white;
                        padding: 5px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    
                    .card-qr {
                        width: 60px;
                        height: 60px;
                    }
                    
                    .card-expiry {
                        font-size: 12px;
                        color: #bbdefb;
                    }
                    
                    .card-org-info {
                        text-align: right;
                    }
                    
                    .card-org {
                        font-size: 12px;
                        font-weight: 600;
                        margin-bottom: 4px;
                    }
                    
                    .card-org-contact {
                        font-size: 11px;
                        color: #bbdefb;
                    }
                    
                    .card-hologram {
                        position: absolute;
                        top: 20px;
                        right: 20px;
                        width: 60px;
                        height: 60px;
                        background: linear-gradient(45deg, 
                            rgba(255,255,255,0.3) 0%, 
                            rgba(255,255,255,0.1) 50%, 
                            rgba(255,255,255,0.3) 100%);
                        border-radius: 50%;
                        animation: hologram 3s infinite;
                    }
                    
                    @keyframes hologram {
                        0%, 100% { opacity: 0.7; }
                        50% { opacity: 0.3; }
                    }
                    
                    .print-info {
                        background: white;
                        padding: 25px;
                        border-radius: 15px;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                        width: 100%;
                        max-width: 850px;
                    }
                    
                    .print-info h3 {
                        color: #1a237e;
                        margin-bottom: 15px;
                        font-size: 20px;
                        border-bottom: 2px solid #1a237e;
                        padding-bottom: 8px;
                    }
                    
                    .info-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 15px;
                    }
                    
                    .info-item {
                        display: flex;
                        flex-direction: column;
                        gap: 5px;
                    }
                    
                    .info-label {
                        font-weight: 600;
                        color: #666;
                        font-size: 13px;
                    }
                    
                    .info-value {
                        font-weight: 500;
                        color: #333;
                        font-size: 14px;
                    }
                    
                    @media print {
                        body { 
                            background: none !important; 
                            padding: 0;
                        }
                        .membership-card { 
                            box-shadow: none !important; 
                            margin: 10px;
                        }
                        .print-info {
                            box-shadow: none !important;
                            border: 1px solid #ddd;
                        }
                        @page { 
                            size: A4 landscape; 
                            margin: 0; 
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                    
                    .print-button {
                        background: #1a237e;
                        color: white;
                        border: none;
                        padding: 12px 30px;
                        border-radius: 30px;
                        font-size: 16px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s;
                        margin-top: 20px;
                    }
                    
                    .print-button:hover {
                        background: #311b92;
                        transform: translateY(-2px);
                        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="card-container">
                        <div class="membership-card">
                            <div class="card-watermark">MANASS ONE NATION MEMBER IDENTITY CARD</div>
                            <div class="card-hologram"></div>
                            <div class="card-header">
                                <div class="card-logo">MANASS ONE NATION MEMBER IDENTITY CARD</div>
                                <div class="card-id">${memberData.id}</div>
                            </div>
                            <div class="card-body">
                                <div class="card-photo-container">
                                    <img src="${memberData.photo || 'https://via.placeholder.com/100x120?text=Photo'}" 
                                         alt="Member Photo" class="card-photo">
                                </div>
                                <div class="card-details">
                                    <div class="card-name">${memberData.firstName} ${memberData.lastName}</div>
                                    <div class="card-rank">${memberData.rank}</div>
                                    <div class="card-info">
                                        <span>📞 ${memberData.phone}</span>
                                    </div>
                                    <div class="card-info">
                                        <span>📧 ${memberData.email}</span>
                                    </div>
                                    <div class="card-info">
                                        <span>📍 ${memberData.state}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="card-footer">
                                <div class="card-qr-container">
                                    <img src="${qrDataURL}" alt="QR Code" class="card-qr">
                                </div>
                                <div class="card-expiry">
                                    Valid until: ${formatDate(memberData.expiryDate, 'short')}
                                </div>
                                <div class="card-org-info">
                                    <div class="card-org">${organizationDetails.name}</div>
                                    <div class="card-org-contact">${organizationDetails.phone}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="print-info">
                        <h3>Member Information</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Member ID</span>
                                <span class="info-value">${memberData.id}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Full Name</span>
                                <span class="info-value">${memberData.firstName} ${memberData.middleName || ''} ${memberData.lastName}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Gender</span>
                                <span class="info-value">${memberData.gender}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Date of Birth</span>
                                <span class="info-value">${formatDate(memberData.dob)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Blood Group</span>
                                <span class="info-value">${memberData.bloodGroup}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Email</span>
                                <span class="info-value">${memberData.email}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Phone</span>
                                <span class="info-value">${memberData.phone}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">NIN</span>
                                <span class="info-value">${memberData.nin}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Address</span>
                                <span class="info-value">${memberData.address}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">State</span>
                                <span class="info-value">${memberData.state}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Rank</span>
                                <span class="info-value">${memberData.rank}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Registration Date</span>
                                <span class="info-value">${formatDate(memberData.registrationDate)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Expiry Date</span>
                                <span class="info-value">${formatDate(memberData.expiryDate)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Guarantor</span>
                                <span class="info-value">${memberData.guarantorName}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Guarantor Phone</span>
                                <span class="info-value">${memberData.guarantorPhone}</span>
                            </div>
                        </div>
                    </div>
                    
                    <button class="print-button no-print" onclick="window.print()">Print Card & Information</button>
                    <button class="print-button no-print" onclick="window.close()" style="background: #666;">Close</button>
                </div>
                
                <script>
                    // Auto-print after loading
                    setTimeout(() => {
                        window.print();
                    }, 1000);
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
    } catch (error) {
        console.error('Error printing card:', error);
        showAlert('Error printing card. Please try again.', 'error');
    }
}

function clearFormForNewMember() {
    // Keep member ID but clear other fields
    document.getElementById('firstName').value = '';
    document.getElementById('lastName').value = '';
    document.getElementById('middleName').value = '';
    setSelectedGender('');
    document.getElementById('dob').value = '';
    document.getElementById('bloodGroup').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('nin').value = '';
    document.getElementById('address').value = '';
    document.getElementById('state').value = '';
    document.getElementById('rank').value = '';
    document.getElementById('guarantorName').value = '';
    document.getElementById('guarantorPhone').value = '';
    
    // Reset photo
    memberPhotoBase64 = '';
    const defaultPhoto = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3ENo Photo%3C/text%3E%3C/svg%3E';
    document.getElementById('photoPreview').src = defaultPhoto;
    document.getElementById('cardPhotoPreview').src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="12" fill="%23999"%3EPhoto%3C/text%3E%3C/svg%3E';
    
    // Clear QR codes
    const qrcodeDiv = document.getElementById('qrcode');
    const cardQrDiv = document.getElementById('cardQr');
    if (qrcodeDiv) qrcodeDiv.innerHTML = '';
    if (cardQrDiv) cardQrDiv.innerHTML = '';
    
    // Disable buttons
    const saveBtn = document.getElementById('saveBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');
    if (saveBtn) saveBtn.disabled = true;
    if (downloadBtn) downloadBtn.disabled = true;
    if (printBtn) printBtn.disabled = true;
    
    // Reset preview
    document.querySelectorAll('.preview-item span').forEach(span => {
        span.textContent = '-';
    });
    
    // Focus on first name
    document.getElementById('firstName').focus();
}

function clearForm() {
    if (!confirm('Are you sure you want to clear all form data?')) return;
    
    // Clear all inputs
    document.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="date"], textarea').forEach(input => {
        input.value = '';
        input.classList.remove('error');
    });
    
    document.querySelectorAll('select').forEach(select => {
        select.selectedIndex = 0;
        select.classList.remove('error');
    });
    
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.checked = false;
    });
    
    // Reset photo
    memberPhotoBase64 = '';
    const defaultPhoto = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%23999"%3ENo Photo%3C/text%3E%3C/svg%3E';
    document.getElementById('photoPreview').src = defaultPhoto;
    document.getElementById('cardPhotoPreview').src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="45" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="12" fill="%23999"%3EPhoto%3C/text%3E%3C/svg%3E';
    
    // Clear QR codes
    const qrcodeDiv = document.getElementById('qrcode');
    const cardQrDiv = document.getElementById('cardQr');
    if (qrcodeDiv) qrcodeDiv.innerHTML = '';
    if (cardQrDiv) cardQrDiv.innerHTML = '';
    
    // Disable buttons
    const saveBtn = document.getElementById('saveBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const printBtn = document.getElementById('printBtn');
    if (saveBtn) saveBtn.disabled = true;
    if (downloadBtn) downloadBtn.disabled = true;
    if (printBtn) printBtn.disabled = true;
    
    // Reset preview
    document.querySelectorAll('.preview-item span, .card-value').forEach(span => {
        span.textContent = '-';
    });
    
    // Reset member ID selection
    const memberIdSelect = document.getElementById('memberId');
    if (memberIdSelect) {
        memberIdSelect.value = '';
    }
    currentMemberId = null;
    
    // Remove draft
    SimpleStorage.removeItem('memberFormDraft');
    
    // Focus on first name
    document.getElementById('firstName').focus();
    
    showAlert('Form cleared successfully', 'success');
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

function showModal(modal) {
    if (modal) modal.style.display = 'flex';
}

function hideModal(modal) {
    if (modal) modal.style.display = 'none';
}

function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existing = document.querySelector('.alert-message');
    if (existing) existing.remove();
    
    const alert = document.createElement('div');
    alert.className = `alert-message ${type}`;
    alert.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles if not present
    if (!document.querySelector('#alert-styles')) {
        const style = document.createElement('style');
        style.id = 'alert-styles';
        style.textContent = `
            .alert-message {
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
            .alert-message.success { background: #10b981; }
            .alert-message.error { background: #ef4444; }
            .alert-message.warning { background: #f59e0b; }
            .alert-message.info { background: #3b82f6; }
            .alert-message button {
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
    
    document.body.appendChild(alert);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

// Add error styles
if (!document.querySelector('#error-styles')) {
    const style = document.createElement('style');
    style.id = 'error-styles';
    style.textContent = `
        .error {
            border-color: #ef4444 !important;
            background-color: #fef2f2 !important;
        }
        input.error, select.error, textarea.error {
            animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(style);
}

// Make functions globally available
window.clearAlert = function() {
    const alert = document.querySelector('.alert-message');
    if (alert) alert.remove();
};

// Initialize QRCode library if not already loaded
if (typeof QRCode === 'undefined') {
    console.warn('QRCode library not loaded. Make sure to include qrcode.js in your HTML.');
}