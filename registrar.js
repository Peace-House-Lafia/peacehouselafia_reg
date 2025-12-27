// ==================== Tab Management ====================
function switchTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.tab-button');
  buttons.forEach(btn => btn.classList.remove('active'));

  // Show selected tab
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  // Add active class to clicked button
  event.target.classList.add('active');

  // Load data if needed
  if (tabName === 'my-registrations') {
    loadMyRegistrations();
  }
}

// ==================== Form Handling ====================
function handleOccupationChange() {
  const occupation = document.getElementById('occupation').value;
  const applicantInfo = document.getElementById('applicant-info');
  const studentInfo = document.getElementById('student-info');

  if (occupation === 'Applicant') {
    applicantInfo.style.display = 'block';
    studentInfo.style.display = 'none';
  } else if (occupation === 'Student') {
    applicantInfo.style.display = 'none';
    studentInfo.style.display = 'block';
  } else {
    applicantInfo.style.display = 'none';
    studentInfo.style.display = 'none';
  }
}

function handleStudentCategoryChange() {
  const category = document.getElementById('studentCategory').value;
  document.getElementById('primary-info').style.display = category === 'Primary' ? 'block' : 'none';
  document.getElementById('secondary-info').style.display = category === 'Secondary' ? 'block' : 'none';
  document.getElementById('tertiary-info').style.display = category === 'Tertiary' ? 'block' : 'none';
}

// ==================== Quick Registration ====================
document.getElementById('quickRegistrationForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // Collect form data
  const formData = {
    title: document.getElementById('title').value,
    surname: document.getElementById('surname').value,
    firstName: document.getElementById('firstName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    gender: document.getElementById('gender').value,
    dateOfBirth: document.getElementById('dob').value,
    town: document.getElementById('town').value,
    address: document.getElementById('address').value,
    lga: document.getElementById('lga').value,
    churchDenomination: document.getElementById('churchDenomination').value,
    churchAddress: document.getElementById('churchAddress').value,
    occupation: document.getElementById('occupation').value,
    eventName: document.getElementById('eventName').value,
    workshopGroup: document.getElementById('workshopGroup').value,
    specialNeeds: document.getElementById('specialNeeds').value,
  };

  // Add occupation-specific details
  if (formData.occupation === 'Applicant') {
    formData.occupationDetails = {
      certificate: document.getElementById('certificate').value,
      yearOfGraduation: document.getElementById('yearGraduation').value,
    };
  } else if (formData.occupation === 'Student') {
    formData.occupationDetails = {
      studentCategory: document.getElementById('studentCategory').value,
      schoolName: document.getElementById('primarySchool').value || 
                  document.getElementById('secondarySchool').value || 
                  document.getElementById('tertiarySchool').value,
      classLevel: document.getElementById('primaryClass').value || 
                  document.getElementById('secondaryClass').value || 
                  document.getElementById('level').value,
      courseOfStudy: document.getElementById('courseOfStudy').value,
    };
  }

  try {
    // Send to backend
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      const result = await response.json();
      showNotification('success', 'Attendee registered successfully!');
      document.getElementById('quickRegistrationForm').reset();
      
      // Update stats
      updateStats();
      
      // Reload registrations list
      loadMyRegistrations();
    } else {
      const error = await response.json();
      showNotification('error', error.message || 'Failed to register attendee');
    }
  } catch (error) {
    console.error('Registration error:', error);
    showNotification('error', 'An error occurred while registering attendee');
  }
});

// ==================== Bulk Upload ====================
const uploadArea = document.getElementById('uploadArea');
const csvFile = document.getElementById('csvFile');

uploadArea.addEventListener('click', () => csvFile.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.style.backgroundColor = 'rgba(59, 0, 41, 0.1)';
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.style.backgroundColor = '';
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.style.backgroundColor = '';
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFileUpload(files[0]);
  }
});

csvFile.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileUpload(e.target.files[0]);
  }
});

function handleFileUpload(file) {
  if (!file.name.endsWith('.csv')) {
    showNotification('error', 'Please upload a CSV file');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const csv = e.target.result;
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Show preview
    const previewTable = document.getElementById('previewTable');
    const thead = previewTable.querySelector('thead');
    const tbody = previewTable.querySelector('tbody');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // Add headers
    const headerRow = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Add first 5 data rows
    for (let i = 1; i < Math.min(6, lines.length); i++) {
      if (lines[i].trim() === '') continue;
      
      const row = document.createElement('tr');
      const cells = lines[i].split(',');
      cells.forEach(cell => {
        const td = document.createElement('td');
        td.textContent = cell.trim();
        row.appendChild(td);
      });
      tbody.appendChild(row);
    }
    
    // Show preview section
    document.getElementById('uploadPreview').style.display = 'block';
    uploadArea.style.display = 'none';
    
    // Store CSV data for upload
    window.csvData = csv;
  };
  
  reader.readAsText(file);
}

function uploadBulkRegistrations() {
  if (!window.csvData) return;
  
  const lines = window.csvData.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const registrations = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    
    const cells = lines[i].split(',');
    const registration = {};
    
    headers.forEach((header, index) => {
      registration[header] = cells[index] ? cells[index].trim() : '';
    });
    
    registrations.push(registration);
  }
  
  // Send to backend
  fetch('/api/registrations/bulk', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ registrations }),
  })
  .then(response => response.json())
  .then(result => {
    showNotification('success', `${result.successCount} attendees registered successfully`);
    cancelBulkUpload();
    updateStats();
    loadMyRegistrations();
  })
  .catch(error => {
    console.error('Bulk upload error:', error);
    showNotification('error', 'Failed to upload registrations');
  });
}

function cancelBulkUpload() {
  document.getElementById('uploadPreview').style.display = 'none';
  uploadArea.style.display = 'block';
  csvFile.value = '';
  window.csvData = null;
}

function downloadTemplate() {
  const headers = [
    'title', 'surname', 'firstName', 'email', 'phone', 'gender', 'dateOfBirth',
    'town', 'address', 'lga', 'churchDenomination', 'churchAddress',
    'occupation', 'eventName', 'workshopGroup', 'specialNeeds'
  ];
  
  const csv = headers.join(',') + '\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'registration_template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

// ==================== Registrations List ====================
async function loadMyRegistrations() {
  const searchTerm = document.getElementById('searchRegistrations').value;
  const eventFilter = document.getElementById('filterEvent').value;
  const statusFilter = document.getElementById('filterStatus').value;

  try {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (eventFilter) params.append('event', eventFilter);
    if (statusFilter) params.append('status', statusFilter);

    const response = await fetch(`/api/registrars/me/registrations?${params}`);
    const registrations = await response.json();

    const registrationsList = document.getElementById('registrationsList');
    
    if (registrations.length === 0) {
      registrationsList.innerHTML = '<p class="empty-state">No registrations found.</p>';
      return;
    }

    registrationsList.innerHTML = registrations.map(reg => `
      <div class="registration-item">
        <div class="registration-info">
          <div class="registration-name">${reg.title} ${reg.surname} ${reg.firstName}</div>
          <div class="registration-meta">
            <span>${reg.email}</span> | 
            <span>${reg.phone}</span> | 
            <span>${reg.eventName}</span>
          </div>
        </div>
        <div class="registration-status status-${reg.status}">
          ${reg.status}
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading registrations:', error);
    showNotification('error', 'Failed to load registrations');
  }
}

// Add event listeners for search and filter
document.getElementById('searchRegistrations')?.addEventListener('input', loadMyRegistrations);
document.getElementById('filterEvent')?.addEventListener('change', loadMyRegistrations);
document.getElementById('filterStatus')?.addEventListener('change', loadMyRegistrations);

// ==================== Stats Management ====================
async function updateStats() {
  try {
    const response = await fetch('/api/registrars/me/stats');
    const stats = await response.json();

    document.getElementById('totalRegistrations').textContent = stats.total || 0;
    document.getElementById('todayRegistrations').textContent = stats.today || 0;
    document.getElementById('pendingConfirmations').textContent = stats.pending || 0;
    document.getElementById('totalRegValue').textContent = stats.total || 0;
    document.getElementById('monthRegValue').textContent = stats.thisMonth || 0;
  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

// ==================== Profile Management ====================
async function loadRegistrarProfile() {
  try {
    const response = await fetch('/api/registrars/me');
    const registrar = await response.json();

    document.getElementById('registrarName').textContent = registrar.organizationName || 'Registrar';
    document.getElementById('registrarCode').textContent = registrar.registrarCode || '---';
    document.getElementById('registrarOrg').textContent = registrar.organizationName || '---';
    document.getElementById('registrarLocation').textContent = registrar.location || '---';
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

function editProfile() {
  // TODO: Implement profile editing
  showNotification('info', 'Profile editing coming soon');
}

function viewReports() {
  // TODO: Implement reports view
  showNotification('info', 'Reports coming soon');
}

// ==================== UI Utilities ====================
function toggleRightContent() {
  const rightContent = document.getElementById('right-content');
  rightContent.classList.toggle('show');
}

function showNotification(type, message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.4rem;
    background-color: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ==================== Authentication ====================
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    window.location.href = '/';
  }
}

// ==================== Initialization ====================
document.addEventListener('DOMContentLoaded', () => {
  loadRegistrarProfile();
  updateStats();

  // Add animation styles
  const style = document.createElement('style');
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
});
