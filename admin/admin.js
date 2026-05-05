const API_URL = 'http://192.168.8.102:5000/api';

// --- UI Navigation & Layout ---
document.addEventListener('DOMContentLoaded', () => {
    // Sidebar toggle
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('openSidebarBtn');
    const closeBtn = document.getElementById('closeSidebarBtn');

    openBtn.addEventListener('click', () => sidebar.classList.add('active'));
    closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));

    // View Switching
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active classes
            navItems.forEach(n => n.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));
            
            // Add active class
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            // Update Title
            pageTitle.textContent = item.textContent.trim();
            
            // On mobile, close sidebar
            if(window.innerWidth <= 992) sidebar.classList.remove('active');

            // Load specific view data
            loadViewData(targetId);
        });
    });

    // Initialize initial view data
    loadViewData('dashboard-view');
    
    // Set date inputs to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('bookingDateFilter').value = today;
    document.getElementById('calendarDateFilter').value = today;
});

// --- Data Loading Dispatcher ---
function loadViewData(viewId) {
    switch(viewId) {
        case 'dashboard-view': loadDashboard(); break;
        case 'bookings-view': loadBookings(); break;
        case 'calendar-view': loadCalendar(); break;
        case 'services-view': loadServices(); break;
    }
}

// Polling interval reference
let pollingInterval = null;

// --- API Helpers ---
async function fetchAPI(endpoint, options = {}) {
    try {
        const res = await fetch(`${API_URL}${endpoint}`, options);
        if (!res.ok) throw new Error('API Error');
        return await res.json();
    } catch (err) {
        console.warn(`Failed to fetch ${endpoint}`, err);
        return null;
    }
}

// --- Dashboard Logic ---
async function loadDashboard() {
    const list = document.getElementById('activityList');
    list.innerHTML = '';
    
    const bookings = await fetchAPI('/bookings') || [];
    
    // Stats calculation
    const narokCount = bookings.filter(b => b.location.includes('Narok')).length;
    const chukaCount = bookings.filter(b => b.location.includes('Chuka')).length;
    
    // Update stat cards if they exist
    const statsGrid = document.querySelector('.stats-grid');
    if (statsGrid) {
        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon purple">
                    <i class="ph ph-map-pin"></i>
                </div>
                <div class="stat-details">
                    <h3>Narok Branch</h3>
                    <p class="stat-value">${narokCount}</p>
                    <small>Total Bookings</small>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">
                    <i class="ph ph-map-pin"></i>
                </div>
                <div class="stat-details">
                    <h3>Chuka Branch</h3>
                    <p class="stat-value">${chukaCount}</p>
                    <small>Total Bookings</small>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">
                    <i class="ph ph-users"></i>
                </div>
                <div class="stat-details">
                    <h3>Total Clients</h3>
                    <p class="stat-value">${bookings.length}</p>
                    <small>All Locations</small>
                </div>
            </div>
        `;
    }
    
    bookings.slice(0, 5).forEach(b => {
        const icon = b.status === 'confirmed' ? 'ph-check' : 'ph-calendar-plus';
        const locationShort = b.location.split(' - ')[0];
        list.innerHTML += `
            <li class="activity-item">
                <div class="activity-icon"><i class="ph ${icon}"></i></div>
                <div class="activity-content">
                    <p><strong>${b.customer_name}</strong> booked in <strong>${locationShort}</strong>.</p>
                    <span>${new Date(b.booking_date).toLocaleDateString()} • ${b.start_time.slice(0,5)}</span>
                </div>
            </li>
        `;
    });
}

// --- Bookings Logic ---
async function loadBookings(isSilent = false) {
    const tbody = document.getElementById('bookingsTableBody');
    if (!isSilent) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Loading...</td></tr>';
    
    const dateFilter = document.getElementById('bookingDateFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    
    let endpoint = '/bookings';
    if (dateFilter) endpoint += `?date=${dateFilter}`;
    
    let data = await fetchAPI(endpoint) || [];
    
    // Client-side location filtering
    if (locationFilter) {
        data = data.filter(b => b.location === locationFilter);
    }
    
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No bookings found.</td></tr>';
        return;
    }

    data.forEach(b => {
        const tr = document.createElement('tr');
        const badgeClass = b.status === 'confirmed' ? 'badge-confirmed' : (b.status === 'pending' ? 'badge-pending' : 'badge-cancelled');
        
        // Shorten location for display
        const locationShort = b.location.split(' - ')[0];

        tr.innerHTML = `
            <td><strong>${b.customer_name}</strong><br><span style="font-size:0.8rem;color:var(--color-text-muted)">${b.phone}</span></td>
            <td><span class="location-tag">📍 ${locationShort}</span></td>
            <td>${b.service_name || '-'}</td>
            <td>${new Date(b.booking_date).toLocaleDateString()} <br> <span style="font-size:0.8rem">${b.start_time.slice(0,5)}</span></td>
            <td><span class="badge-status ${badgeClass}">${b.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon success" title="Confirm" onclick="updateBookingStatus(${b.id}, 'confirmed')"><i class="ph ph-check"></i></button>
                    <button class="btn-icon danger" title="Cancel" onclick="updateBookingStatus(${b.id}, 'cancelled')"><i class="ph ph-x"></i></button>
                    <button class="btn-icon" title="View" onclick="viewBooking(${b.id})"><i class="ph ph-eye"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Auto-refresh logic (Polling)
    if (!pollingInterval && document.getElementById('bookings-view').classList.contains('active')) {
        pollingInterval = setInterval(() => {
            if (document.getElementById('bookings-view').classList.contains('active')) {
                loadBookings(true);
            }
        }, 5000);
    }
}

async function updateBookingStatus(id, status) {
    const res = await fetchAPI(`/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    showToast(`Booking ${status}!`, status === 'confirmed' ? 'success' : 'error');
    loadBookings();
}

function viewBooking(id) {
    const modalBody = document.getElementById('bookingModalBody');
    modalBody.innerHTML = `<p>Loading details for ID ${id}...</p>`;
    openModal('bookingModal');
    // Implementation for full details view goes here
}

// --- Calendar Logic ---
async function loadCalendar() {
    const timeline = document.getElementById('dailyTimeline');
    timeline.innerHTML = '';
    
    // Generate 9 AM to 8 PM slots
    for(let hour = 9; hour <= 20; hour++) {
        const displayHour = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        
        timeline.innerHTML += `
            <div class="time-slot" id="slot-${hour}">
                <div class="time-label">${displayHour}:00 ${ampm}</div>
                <div class="slot-content" id="content-${hour}"></div>
            </div>
        `;
    }
    
    // Populate with API bookings
    const bookings = await fetchAPI('/bookings') || [];
    
    bookings.forEach(b => {
        if(b.status === 'cancelled') return;
        const hour = parseInt(b.start_time.split(':')[0]);
        const contentDiv = document.getElementById(`content-${hour}`);
        if(contentDiv) {
            contentDiv.innerHTML += `
                <div class="booking-block" onclick="viewBooking(${b.id})">
                    <strong>${b.customer_name}</strong>
                    <span>${b.service_name || 'Service'} • ${b.start_time.slice(0,5)}</span>
                </div>
            `;
        }
    });
}

// --- Services Logic ---
async function loadServices() {
    const tbody = document.getElementById('servicesTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">Loading...</td></tr>';
    
    const data = await fetchAPI('/services') || [];
    
    tbody.innerHTML = '';
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">No services found.</td></tr>';
        return;
    }
    
    data.forEach(s => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.name}</strong></td>
            <td style="text-transform:capitalize">${s.category}</td>
            <td>${s.duration_minutes || 0} min</td>
            <td>$${Number(s.price).toFixed(2)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" title="Edit"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-icon danger" title="Delete" onclick="deleteService(${s.id})"><i class="ph ph-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById('serviceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        name: document.getElementById('serviceName').value,
        category: document.getElementById('serviceCategory').value,
        duration_minutes: parseInt(document.getElementById('serviceDuration').value),
        price: parseFloat(document.getElementById('servicePrice').value)
    };
    
    await fetchAPI('/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    showToast('Service saved successfully!', 'success');
    closeModal('serviceModal');
    loadServices();
});

async function deleteService(id) {
    if(confirm('Are you sure you want to delete this service?')) {
        await fetchAPI(`/services/${id}`, { method: 'DELETE' });
        showToast('Service deleted.', 'success');
        loadServices();
    }
}

// --- Modals ---
function openServiceModal() {
    document.getElementById('serviceForm').reset();
    document.getElementById('serviceId').value = '';
    openModal('serviceModal');
}

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// --- Toasts ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';
    toast.innerHTML = `<i class="ph ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
