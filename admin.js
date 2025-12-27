// ==================== Global State ====================
let currentPage = {
  registrations: 1,
  users: 1,
  registrars: 1
};

let charts = {};

// ==================== View Management ====================
function switchView(viewName) {
  // Hide all views
  const views = document.querySelectorAll('.view');
  views.forEach(view => view.classList.remove('active'));

  // Remove active class from menu items
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => item.classList.remove('active'));

  // Show selected view
  const selectedView = document.getElementById(viewName);
  if (selectedView) {
    selectedView.classList.add('active');
  }

  // Add active class to clicked menu item
  event.target.closest('.menu-item').classList.add('active');

  // Load data for the view
  if (viewName === 'dashboard') {
    loadDashboard();
  } else if (viewName === 'registrations') {
    loadRegistrations();
  } else if (viewName === 'users') {
    loadUsers();
  } else if (viewName === 'registrars') {
    loadRegistrars();
  } else if (viewName === 'events') {
    loadEvents();
  } else if (viewName === 'analytics') {
    loadAnalytics();
  } else if (viewName === 'audit-log') {
    loadAuditLog();
  }
}

// ==================== Dashboard ====================
async function loadDashboard() {
  try {
    const response = await fetch('/api/admin/dashboard');
    const data = await response.json();

    // Update stats
    document.getElementById('totalRegStat').textContent = data.totalRegistrations || 0;
    document.getElementById('totalUsersStat').textContent = data.totalUsers || 0;
    document.getElementById('activeEventsStat').textContent = data.activeEvents || 0;
    document.getElementById('activeRegistrarsStat').textContent = data.activeRegistrars || 0;

    // Load charts
    loadTrendChart(data.trendData);
    loadEventChart(data.eventData);
    loadOccupationChart(data.occupationData);
    loadGenderChart(data.genderData);

    // Load recent activity
    loadRecentActivity(data.recentRegistrations);
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

function loadTrendChart(data) {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;

  if (charts.trend) charts.trend.destroy();

  charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data?.labels || [],
      datasets: [{
        label: 'Registrations',
        data: data?.values || [],
        borderColor: 'rgba(59, 0, 41, 0.959)',
        backgroundColor: 'rgba(59, 0, 41, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function loadEventChart(data) {
  const ctx = document.getElementById('eventChart');
  if (!ctx) return;

  if (charts.event) charts.event.destroy();

  charts.event = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data?.labels || [],
      datasets: [{
        data: data?.values || [],
        backgroundColor: [
          'rgba(52, 152, 219, 0.8)',
          'rgba(46, 204, 113, 0.8)',
          'rgba(241, 196, 15, 0.8)',
          'rgba(231, 76, 60, 0.8)',
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function loadOccupationChart(data) {
  const ctx = document.getElementById('occupationChart');
  if (!ctx) return;

  if (charts.occupation) charts.occupation.destroy();

  charts.occupation = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data?.labels || [],
      datasets: [{
        label: 'Count',
        data: data?.values || [],
        backgroundColor: 'rgba(59, 0, 41, 0.7)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { beginAtZero: true }
      }
    }
  });
}

function loadGenderChart(data) {
  const ctx = document.getElementById('genderChart');
  if (!ctx) return;

  if (charts.gender) charts.gender.destroy();

  charts.gender = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: ['Male', 'Female'],
      datasets: [{
        data: data?.values || [],
        backgroundColor: [
          'rgba(52, 152, 219, 0.8)',
          'rgba(231, 76, 60, 0.8)',
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function loadRecentActivity(registrations) {
  const tbody = document.getElementById('recentActivityBody');
  if (!tbody) return;

  if (!registrations || registrations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No recent registrations</td></tr>';
    return;
  }

  tbody.innerHTML = registrations.slice(0, 5).map(reg => `
    <tr>
      <td>${reg.title} ${reg.surname} ${reg.firstName}</td>
      <td>${reg.eventName}</td>
      <td>${new Date(reg.createdAt).toLocaleDateString()}</td>
      <td><span class="status-badge status-${reg.status}">${reg.status}</span></td>
      <td><button class="btn btn-small" onclick="viewRegistration('${reg._id}')">View</button></td>
    </tr>
  `).join('');
}

// ==================== Registrations Management ====================
async function loadRegistrations() {
  const searchTerm = document.getElementById('regSearchInput')?.value || '';
  const eventFilter = document.getElementById('regEventFilter')?.value || '';
  const statusFilter = document.getElementById('regStatusFilter')?.value || '';
  const dateFilter = document.getElementById('regDateFilter')?.value || '';

  try {
    const params = new URLSearchParams({
      page: currentPage.registrations,
      search: searchTerm,
      event: eventFilter,
      status: statusFilter,
      date: dateFilter
    });

    const response = await fetch(`/api/registrations?${params}`);
    const data = await response.json();

    const tbody = document.getElementById('registrationsTableBody');
    if (!tbody) return;

    if (!data.registrations || data.registrations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No registrations found</td></tr>';
      return;
    }

    tbody.innerHTML = data.registrations.map(reg => `
      <tr>
        <td>${reg._id.substring(0, 8)}</td>
        <td>${reg.title} ${reg.surname} ${reg.firstName}</td>
        <td>${reg.email}</td>
        <td>${reg.phone}</td>
        <td>${reg.eventName}</td>
        <td>${new Date(reg.createdAt).toLocaleDateString()}</td>
        <td><span class="status-badge status-${reg.status}">${reg.status}</span></td>
        <td>
          <button class="btn btn-small" onclick="viewRegistration('${reg._id}')">View</button>
          <button class="btn btn-small" onclick="editRegistration('${reg._id}')">Edit</button>
        </td>
      </tr>
    `).join('');

    document.getElementById('pageInfo').textContent = `Page ${currentPage.registrations} of ${data.totalPages}`;
  } catch (error) {
    console.error('Error loading registrations:', error);
  }
}

function exportRegistrations() {
  const format = document.getElementById('exportFormat')?.value || 'csv';
  window.location.href = `/api/registrations/export?format=${format}`;
}

// ==================== Users Management ====================
async function loadUsers() {
  const searchTerm = document.getElementById('userSearchInput')?.value || '';
  const roleFilter = document.getElementById('userRoleFilter')?.value || '';
  const statusFilter = document.getElementById('userStatusFilter')?.value || '';

  try {
    const params = new URLSearchParams({
      page: currentPage.users,
      search: searchTerm,
      role: roleFilter,
      status: statusFilter
    });

    const response = await fetch(`/api/users?${params}`);
    const data = await response.json();

    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;

    if (!data.users || data.users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No users found</td></tr>';
      return;
    }

    tbody.innerHTML = data.users.map(user => `
      <tr>
        <td>${user._id.substring(0, 8)}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.phone}</td>
        <td><span class="status-badge status-${user.role}">${user.role}</span></td>
        <td><span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-small" onclick="editUser('${user._id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteUser('${user._id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

function openUserModal() {
  document.getElementById('userId').value = '';
  document.getElementById('userForm').reset();
  document.getElementById('userModal').classList.add('show');
}

function editUser(userId) {
  // TODO: Load user data and open modal
  openUserModal();
}

async function saveUser(event) {
  event.preventDefault();
  
  const userId = document.getElementById('userId').value;
  const userData = {
    name: document.getElementById('userName').value,
    email: document.getElementById('userEmail').value,
    phone: document.getElementById('userPhone').value,
    role: document.getElementById('userRole').value,
  };

  try {
    const method = userId ? 'PUT' : 'POST';
    const url = userId ? `/api/users/${userId}` : '/api/users';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      closeModal('userModal');
      loadUsers();
      showNotification('success', 'User saved successfully');
    } else {
      showNotification('error', 'Failed to save user');
    }
  } catch (error) {
    console.error('Error saving user:', error);
    showNotification('error', 'An error occurred');
  }
}

function deleteUser(userId) {
  if (confirm('Are you sure you want to delete this user?')) {
    fetch(`/api/users/${userId}`, { method: 'DELETE' })
      .then(() => {
        loadUsers();
        showNotification('success', 'User deleted successfully');
      })
      .catch(error => {
        console.error('Error deleting user:', error);
        showNotification('error', 'Failed to delete user');
      });
  }
}

// ==================== Registrars Management ====================
async function loadRegistrars() {
  const searchTerm = document.getElementById('registrarSearchInput')?.value || '';
  const statusFilter = document.getElementById('registrarStatusFilter')?.value || '';

  try {
    const params = new URLSearchParams({
      search: searchTerm,
      status: statusFilter
    });

    const response = await fetch(`/api/registrars?${params}`);
    const data = await response.json();

    const tbody = document.getElementById('registrarsTableBody');
    if (!tbody) return;

    if (!data.registrars || data.registrars.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No registrars found</td></tr>';
      return;
    }

    tbody.innerHTML = data.registrars.map(reg => `
      <tr>
        <td>${reg.registrarCode}</td>
        <td>${reg.organizationName}</td>
        <td>${reg.location}</td>
        <td>${reg.registrationsCount}</td>
        <td><span class="status-badge status-${reg.status}">${reg.status}</span></td>
        <td>${reg.approvedAt ? 'Yes' : 'Pending'}</td>
        <td>
          <button class="btn btn-small" onclick="editRegistrar('${reg._id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteRegistrar('${reg._id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading registrars:', error);
  }
}

function openRegistrarModal() {
  document.getElementById('registrarId').value = '';
  document.getElementById('registrarForm').reset();
  document.getElementById('registrarModal').classList.add('show');
}

function editRegistrar(registrarId) {
  openRegistrarModal();
}

async function saveRegistrar(event) {
  event.preventDefault();
  
  const registrarId = document.getElementById('registrarId').value;
  const registrarData = {
    organizationName: document.getElementById('registrarOrgName').value,
    location: document.getElementById('registrarLocation').value,
    email: document.getElementById('registrarEmail').value,
    phone: document.getElementById('registrarPhone').value,
  };

  try {
    const method = registrarId ? 'PUT' : 'POST';
    const url = registrarId ? `/api/registrars/${registrarId}` : '/api/registrars';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrarData)
    });

    if (response.ok) {
      closeModal('registrarModal');
      loadRegistrars();
      showNotification('success', 'Registrar saved successfully');
    } else {
      showNotification('error', 'Failed to save registrar');
    }
  } catch (error) {
    console.error('Error saving registrar:', error);
    showNotification('error', 'An error occurred');
  }
}

function deleteRegistrar(registrarId) {
  if (confirm('Are you sure you want to delete this registrar?')) {
    fetch(`/api/registrars/${registrarId}`, { method: 'DELETE' })
      .then(() => {
        loadRegistrars();
        showNotification('success', 'Registrar deleted successfully');
      })
      .catch(error => {
        console.error('Error deleting registrar:', error);
        showNotification('error', 'Failed to delete registrar');
      });
  }
}

// ==================== Events Management ====================
async function loadEvents() {
  try {
    const response = await fetch('/api/events');
    const data = await response.json();

    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;

    if (!data.events || data.events.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No events found</td></tr>';
      return;
    }

    tbody.innerHTML = data.events.map(event => `
      <tr>
        <td>${event.eventName}</td>
        <td>${event.eventCode}</td>
        <td>${new Date(event.eventDate).toLocaleDateString()}</td>
        <td>${event.currentRegistrations}</td>
        <td>${event.maxCapacity}</td>
        <td><span class="status-badge status-${event.status}">${event.status}</span></td>
        <td>
          <button class="btn btn-small" onclick="editEvent('${event._id}')">Edit</button>
          <button class="btn btn-small btn-danger" onclick="deleteEvent('${event._id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading events:', error);
  }
}

function openEventModal() {
  document.getElementById('eventId').value = '';
  document.getElementById('eventForm').reset();
  document.getElementById('eventModal').classList.add('show');
}

function editEvent(eventId) {
  openEventModal();
}

async function saveEvent(event) {
  event.preventDefault();
  
  const eventId = document.getElementById('eventId').value;
  const eventData = {
    eventName: document.getElementById('eventName').value,
    eventCode: document.getElementById('eventCode').value,
    eventDate: document.getElementById('eventDate').value,
    maxCapacity: document.getElementById('eventCapacity').value,
  };

  try {
    const method = eventId ? 'PUT' : 'POST';
    const url = eventId ? `/api/events/${eventId}` : '/api/events';
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (response.ok) {
      closeModal('eventModal');
      loadEvents();
      showNotification('success', 'Event saved successfully');
    } else {
      showNotification('error', 'Failed to save event');
    }
  } catch (error) {
    console.error('Error saving event:', error);
    showNotification('error', 'An error occurred');
  }
}

function deleteEvent(eventId) {
  if (confirm('Are you sure you want to delete this event?')) {
    fetch(`/api/events/${eventId}`, { method: 'DELETE' })
      .then(() => {
        loadEvents();
        showNotification('success', 'Event deleted successfully');
      })
      .catch(error => {
        console.error('Error deleting event:', error);
        showNotification('error', 'Failed to delete event');
      });
  }
}

// ==================== Analytics ====================
async function loadAnalytics() {
  try {
    const response = await fetch('/api/admin/analytics');
    const data = await response.json();

    loadLgaChart(data.lgaData);
    loadAgeChart(data.ageData);
    loadWorkshopChart(data.workshopData);
    loadAttendanceChart(data.attendanceData);
  } catch (error) {
    console.error('Error loading analytics:', error);
  }
}

function loadLgaChart(data) {
  const ctx = document.getElementById('lgaChart');
  if (!ctx) return;

  if (charts.lga) charts.lga.destroy();

  charts.lga = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data?.labels || [],
      datasets: [{
        label: 'Registrations',
        data: data?.values || [],
        backgroundColor: 'rgba(59, 0, 41, 0.7)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function loadAgeChart(data) {
  const ctx = document.getElementById('ageChart');
  if (!ctx) return;

  if (charts.age) charts.age.destroy();

  charts.age = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data?.labels || [],
      datasets: [{
        label: 'Count',
        data: data?.values || [],
        borderColor: 'rgba(59, 0, 41, 0.959)',
        backgroundColor: 'rgba(59, 0, 41, 0.1)',
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function loadWorkshopChart(data) {
  const ctx = document.getElementById('workshopChart');
  if (!ctx) return;

  if (charts.workshop) charts.workshop.destroy();

  charts.workshop = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data?.labels || [],
      datasets: [{
        data: data?.values || [],
        backgroundColor: [
          'rgba(52, 152, 219, 0.8)',
          'rgba(46, 204, 113, 0.8)',
          'rgba(241, 196, 15, 0.8)',
          'rgba(231, 76, 60, 0.8)',
          'rgba(155, 89, 182, 0.8)',
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

function loadAttendanceChart(data) {
  const ctx = document.getElementById('attendanceChart');
  if (!ctx) return;

  if (charts.attendance) charts.attendance.destroy();

  charts.attendance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data?.labels || [],
      datasets: [{
        label: 'Attendance Rate (%)',
        data: data?.values || [],
        backgroundColor: 'rgba(46, 204, 113, 0.7)',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, max: 100 } }
    }
  });
}

function generateReport() {
  const reportType = document.getElementById('reportType').value;
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;

  if (!startDate || !endDate) {
    showNotification('error', 'Please select both start and end dates');
    return;
  }

  window.location.href = `/api/admin/reports/generate?type=${reportType}&startDate=${startDate}&endDate=${endDate}`;
}

// ==================== Exports ====================
function exportAllRegistrations() {
  const format = document.getElementById('exportFormat').value;
  window.location.href = `/api/registrations/export?format=${format}`;
}

function exportByEvent() {
  const eventId = document.getElementById('exportEventFilter').value;
  if (!eventId) {
    showNotification('error', 'Please select an event');
    return;
  }
  window.location.href = `/api/registrations/export?event=${eventId}&format=csv`;
}

function exportAttendeeList() {
  const eventId = document.getElementById('exportAttendeeEvent').value;
  if (!eventId) {
    showNotification('error', 'Please select an event');
    return;
  }
  window.location.href = `/api/registrations/export?event=${eventId}&format=attendee-list`;
}

function exportUsers() {
  window.location.href = '/api/users/export?format=csv';
}

// ==================== Audit Log ====================
async function loadAuditLog() {
  const actionFilter = document.getElementById('auditActionFilter')?.value || '';
  const userFilter = document.getElementById('auditUserFilter')?.value || '';
  const dateFilter = document.getElementById('auditDateFilter')?.value || '';

  try {
    const params = new URLSearchParams({
      action: actionFilter,
      user: userFilter,
      date: dateFilter
    });

    const response = await fetch(`/api/admin/audit-log?${params}`);
    const data = await response.json();

    const tbody = document.getElementById('auditLogBody');
    if (!tbody) return;

    if (!data.logs || data.logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No audit logs found</td></tr>';
      return;
    }

    tbody.innerHTML = data.logs.map(log => `
      <tr>
        <td>${new Date(log.timestamp).toLocaleString()}</td>
        <td>${log.userName}</td>
        <td>${log.action}</td>
        <td>${log.resource}</td>
        <td>${log.details || '-'}</td>
        <td>${log.ipAddress}</td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading audit log:', error);
  }
}

// ==================== Modal Management ====================
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('show');
}

window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.classList.remove('show');
  }
};

// ==================== Pagination ====================
function nextPage(section) {
  currentPage[section]++;
  if (section === 'registrations') loadRegistrations();
  else if (section === 'users') loadUsers();
  else if (section === 'registrars') loadRegistrars();
}

function previousPage(section) {
  if (currentPage[section] > 1) {
    currentPage[section]--;
    if (section === 'registrations') loadRegistrations();
    else if (section === 'users') loadUsers();
    else if (section === 'registrars') loadRegistrars();
  }
}

// ==================== Utilities ====================
function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 1rem 1.5rem;
    border-radius: 0.4rem;
    background-color: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
    color: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function viewRegistration(registrationId) {
  // TODO: Implement view registration details
  showNotification('info', 'View registration details coming soon');
}

function editRegistration(registrationId) {
  // TODO: Implement edit registration
  showNotification('info', 'Edit registration coming soon');
}

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

  // Load initial dashboard
  loadDashboard();

  // Add search event listeners
  document.getElementById('regSearchInput')?.addEventListener('input', loadRegistrations);
  document.getElementById('userSearchInput')?.addEventListener('input', loadUsers);
  document.getElementById('registrarSearchInput')?.addEventListener('input', loadRegistrars);
});
