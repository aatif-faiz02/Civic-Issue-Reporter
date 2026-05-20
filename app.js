// Global Variables
let currentUser = null;
let currentFilter = 'all';
let currentLocation = null;
let allComplaints = [];

// Check authentication on load
document.addEventListener('DOMContentLoaded', () => {
    currentUser = DataStore.getCurrentUser();
    
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update UI with user info
    document.getElementById('userName').innerHTML = currentUser.name;
    document.getElementById('userAvatar').innerHTML = currentUser.avatar || '👤';
    document.getElementById('walletAmount').innerHTML = `$${currentUser.rewards || 0}`;
    
    // Load data
    loadComplaints();
    updateStats();
    setupEventListeners();
});

function setupEventListeners() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('userDropdown');
        const userMenu = document.querySelector('.user-menu');
        if (dropdown && userMenu && !userMenu.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

function logout() {
    localStorage.removeItem('civic_current_user');
    window.location.href = 'login.html';
}

function loadComplaints() {
    allComplaints = DataStore.getComplaints();
    renderComplaints();
}

function renderComplaints() {
    let filtered = [...allComplaints];
    
    if (currentFilter === 'authority') {
        filtered = filtered.filter(c => c.type === 'authority');
    } else if (currentFilter === 'individual') {
        filtered = filtered.filter(c => c.type === 'individual');
    } else if (currentFilter === 'high') {
        filtered = filtered.filter(c => c.priority === 'high' || c.priority === 'critical');
    }
    
    const container = document.getElementById('complaintsContainer');
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <h3>No complaints found</h3>
                <p>Be the first to report an issue</p>
                <button class="btn btn-primary" onclick="openReportModal('authority')" style="margin-top: 16px;">+ Create Report</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(complaint => `
        <div class="complaint-card" onclick="viewComplaintDetail('${complaint.id}')">
            <div class="card-header">
                <div style="display: flex; gap: 8px;">
                    <span class="status-badge status-${complaint.status}">
                        ${getStatusText(complaint.status)}
                    </span>
                    <span class="priority-badge priority-${complaint.priority}">
                        ${getPriorityText(complaint.priority)}
                    </span>
                </div>
                <button class="upvote-btn" onclick="event.stopPropagation(); upvoteComplaint('${complaint.id}')">
                    👍 ${complaint.upvotes}
                </button>
            </div>
            <div class="complaint-title">${escapeHtml(complaint.title)}</div>
            <div class="complaint-location">
                📍 ${escapeHtml(complaint.location)}
            </div>
            <div class="complaint-desc">
                ${escapeHtml(complaint.description.substring(0, 100))}${complaint.description.length > 100 ? '...' : ''}
            </div>
            <div class="complaint-footer">
                <span>📅 ${complaint.date}</span>
                <span>👤 ${complaint.anonymous ? 'Anonymous' : complaint.userName}</span>
                ${complaint.reward ? `<span class="reward-badge">💰 $${complaint.reward}</span>` : ''}
            </div>
        </div>
    `).join('');
}

function renderMyReports() {
    const myReports = allComplaints.filter(c => c.userId === currentUser.id);
    const container = document.getElementById('myReportsContainer');
    
    if (myReports.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📋</div><p>You haven\'t filed any reports yet</p></div>';
        return;
    }
    
    container.innerHTML = myReports.map(complaint => `
        <div class="complaint-card" onclick="viewComplaintDetail('${complaint.id}')">
            <div class="card-header">
                <span class="status-badge status-${complaint.status}">${getStatusText(complaint.status)}</span>
                ${complaint.reward ? `<span class="reward-badge">💰 $${complaint.reward}</span>` : ''}
            </div>
            <div class="complaint-title">${escapeHtml(complaint.title)}</div>
            <div class="complaint-location">📍 ${escapeHtml(complaint.location)}</div>
            <div class="complaint-footer">
                <span>📅 ${complaint.date}</span>
                <span>👍 ${complaint.upvotes} upvotes</span>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('totalReports').innerHTML = allComplaints.length;
    document.getElementById('resolvedReports').innerHTML = allComplaints.filter(c => c.status === 'resolved').length;
    document.getElementById('totalRewards').innerHTML = `$${currentUser.rewards || 0}`;
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'progress': 'In Progress',
        'resolved': 'Resolved',
        'verified': 'Verified',
        'rejected': 'Rejected'
    };
    return statusMap[status] || status;
}

function getPriorityText(priority) {
    const priorityMap = {
        'low': '🟢 Low',
        'medium': '🟡 Medium',
        'high': '🔴 High',
        'critical': '⚫ Critical'
    };
    return priorityMap[priority] || priority;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function navigateTo(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}View`).classList.add('active');
    
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    if (view === 'reports') {
        renderMyReports();
    } else if (view === 'track') {
        renderTrackView();
    } else if (view === 'home') {
        loadComplaints();
        updateStats();
    }
}

function filterComplaints(filter, element) {
    currentFilter = filter;
    document.querySelectorAll('.chip').forEach(chip => chip.classList.remove('active'));
    element.classList.add('active');
    renderComplaints();
}

function searchComplaints() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allComplaints.filter(c => 
        c.title.toLowerCase().includes(searchTerm) || 
        c.location.toLowerCase().includes(searchTerm)
    );
    
    const container = document.getElementById('complaintsContainer');
    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>No matching complaints</p></div>';
        return;
    }
    
    container.innerHTML = filtered.map(complaint => `
        <div class="complaint-card" onclick="viewComplaintDetail('${complaint.id}')">
            <div class="card-header">
                <span class="status-badge status-${complaint.status}">${getStatusText(complaint.status)}</span>
                <button class="upvote-btn" onclick="event.stopPropagation(); upvoteComplaint('${complaint.id}')">👍 ${complaint.upvotes}</button>
            </div>
            <div class="complaint-title">${escapeHtml(complaint.title)}</div>
            <div class="complaint-location">📍 ${escapeHtml(complaint.location)}</div>
            <div class="complaint-desc">${escapeHtml(complaint.description.substring(0, 100))}...</div>
        </div>
    `).join('');
}

function upvoteComplaint(id) {
    if (DataStore.hasUpvoted(id)) {
        showToast('You already upvoted this!');
        return;
    }
    
    DataStore.addUpvote(id, currentUser.id);
    showToast('👍 Thanks for your upvote!');
    loadComplaints();
}

function openReportModal(type) {
    const modal = document.getElementById('reportModal');
    const title = document.getElementById('modalTitle');
    const rewardAlert = document.getElementById('rewardAlert');
    
    if (type === 'authority') {
        title.innerHTML = '🏛️ Report Authority Issue';
        rewardAlert.style.display = 'none';
    } else {
        title.innerHTML = '👤 Report Individual';
        rewardAlert.style.display = 'block';
    }
    
    document.getElementById('reportForm').dataset.type = type;
    modal.classList.add('active');
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('active');
    document.getElementById('reportForm').reset();
    document.getElementById('locationStatus').innerHTML = '';
}

function getCurrentLocation() {
    const statusDiv = document.getElementById('locationStatus');
    statusDiv.innerHTML = '📍 Fetching location...';
    statusDiv.style.color = '#64748b';
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                statusDiv.innerHTML = '✅ Location detected!';
                statusDiv.style.color = '#10b981';
                document.getElementById('reportLocation').value = 
                    `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`;
            },
            (error) => {
                statusDiv.innerHTML = '❌ Unable to get location. Please enter manually.';
                statusDiv.style.color = '#ef4444';
            }
        );
    } else {
        statusDiv.innerHTML = '❌ Geolocation not supported';
    }
}

// Form submission
document.getElementById('reportForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const type = this.dataset.type;
    const title = document.getElementById('reportTitle').value;
    const location = document.getElementById('reportLocation').value;
    const category = document.getElementById('reportCategory').value;
    const priority = document.getElementById('reportPriority').value;
    const description = document.getElementById('reportDesc').value;
    const anonymous = document.getElementById('anonymousReport').checked;
    
    if (!title || !location || !description) {
        showToast('Please fill all required fields');
        return;
    }
    
    const newComplaint = {
        id: DataStore.generateId(),
        type: type,
        title: title,
        location: location,
        description: description,
        category: category,
        priority: priority,
        status: 'pending',
        upvotes: 0,
        date: new Date().toISOString().split('T')[0],
        userId: currentUser.id,
        userName: anonymous ? 'Anonymous' : currentUser.name,
        anonymous: anonymous,
        reward: type === 'individual' ? 25 : null,
        rewardStatus: type === 'individual' ? 'pending' : null,
        timeline: [
            { status: 'submitted', date: new Date().toISOString().split('T')[0], note: 'Report submitted' }
        ]
    };
    
    DataStore.saveComplaint(newComplaint);
    closeReportModal();
    showToast('✅ Report submitted successfully! ID: ' + newComplaint.id);
    
    // Update user stats
    const users = JSON.parse(localStorage.getItem('civic_users'));
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        users[userIndex].reportsCount++;
        localStorage.setItem('civic_users', JSON.stringify(users));
        currentUser.reportsCount++;
    }
    
    loadComplaints();
    navigateTo('home');
});

function viewComplaintDetail(id) {
    const complaint = allComplaints.find(c => c.id === id);
    if (!complaint) return;
    
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');
    
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <div class="card-header" style="margin-bottom: 16px;">
                <span class="status-badge status-${complaint.status}">${getStatusText(complaint.status)}</span>
                <span class="priority-badge priority-${complaint.priority}">${getPriorityText(complaint.priority)}</span>
            </div>
            
            <h3 style="font-size: 20px; margin-bottom: 12px;">${escapeHtml(complaint.title)}</h3>
            
            <div style="display: flex; gap: 16px; margin-bottom: 16px; color: var(--gray-500); font-size: 13px;">
                <span>📅 ${complaint.date}</span>
                <span>🆔 ${complaint.id}</span>
                <span>👤 ${complaint.userName}</span>
            </div>
            
            <div style="background: var(--gray-100); padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px;">
                <strong>📍 Location</strong><br>
                ${escapeHtml(complaint.location)}
            </div>
            
            <div style="margin-bottom: 16px;">
                <strong>📝 Description</strong><br>
                <p style="margin-top: 8px; line-height: 1.5;">${escapeHtml(complaint.description)}</p>
            </div>
            
            ${complaint.reward ? `
                <div class="reward-alert" style="margin: 0 0 16px 0;">
                    💰 <strong>Reward: $${complaint.reward}</strong><br>
                    Status: ${complaint.rewardStatus === 'paid' ? '✅ Paid' : '⏳ Pending verification'}
                </div>
            ` : ''}
            
            <div style="margin-top: 20px;">
                <strong>📊 Timeline</strong>
                <div class="detail-timeline">
                    ${complaint.timeline.map(event => `
                        <div class="timeline-item">
                            <div>●</div>
                            <div>
                                <div><strong>${getStatusText(event.status)}</strong></div>
                                <div style="font-size: 12px; color: var(--gray-500);">${event.date}</div>
                                <div style="font-size: 13px;">${event.note}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button class="btn btn-outline" onclick="upvoteComplaint('${complaint.id}'); closeDetailModal();">👍 Upvote (${complaint.upvotes})</button>
                <button class="btn btn-primary" onclick="shareComplaint('${complaint.id}')">📤 Share</button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

function shareComplaint(id) {
    const complaint = allComplaints.find(c => c.id === id);
    if (navigator.share) {
        navigator.share({
            title: complaint.title,
            text: complaint.description,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(`${complaint.title} - ${complaint.location}`);
        showToast('Copied to clipboard!');
    }
}

function renderTrackView() {
    const markersContainer = document.getElementById('mapMarkers');
    const markers = allComplaints.slice(0, 6);
    
    markersContainer.innerHTML = markers.map((marker, index) => `
        <div class="map-marker" style="top: ${30 + (index * 50)}px; left: ${50 + (index * 70)}px;" 
             onclick="viewComplaintDetail('${marker.id}')">
            ${marker.type === 'authority' ? '🏛️' : '👤'}
        </div>
    `).join('');
    
    const nearbyContainer = document.getElementById('nearbyList');
    nearbyContainer.innerHTML = allComplaints.slice(0, 3).map(complaint => `
        <div class="complaint-card" onclick="viewComplaintDetail('${complaint.id}')">
            <div class="card-header">
                <span class="status-badge status-${complaint.status}">${getStatusText(complaint.status)}</span>
                <span>📍 ~${Math.floor(Math.random() * 500)}m away</span>
            </div>
            <div class="complaint-title">${escapeHtml(complaint.title)}</div>
            <div class="complaint-location">${escapeHtml(complaint.location)}</div>
        </div>
    `).join('');
}

function getNearbyReports() {
    if (!navigator.geolocation) {
        showToast('Location services not supported');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            showToast('📍 Showing nearby reports based on your location');
            filterComplaints('all', document.querySelector('.chip.active'));
        },
        () => {
            showToast('Please enable location to see nearby reports');
        }
    );
}

function showWallet() {
    const modal = document.getElementById('walletModal');
    document.getElementById('walletBalanceAmount').innerHTML = `$${currentUser.rewards || 0}`;
    
    const transactions = document.getElementById('transactionsList');
    const userTransactions = currentUser.transactions || [];
    
    if (userTransactions.length === 0) {
        transactions.innerHTML = '<div style="text-align: center; color: var(--gray-400); padding: 20px;">No transactions yet</div>';
    } else {
        transactions.innerHTML = userTransactions.map(tx => `
            <div class="transaction-item">
                <div>
                    <div style="font-weight: 500;">${tx.description}</div>
                    <div style="font-size: 11px; color: var(--gray-500);">${tx.date}</div>
                </div>
                <div style="color: var(--success); font-weight: 600;">+$${tx.amount}</div>
            </div>
        `).join('');
    }
    
    modal.classList.add('active');
}

function closeWalletModal() {
    document.getElementById('walletModal').classList.remove('active');
}

function withdrawRewards() {
    if (currentUser.rewards > 0) {
        showToast(`Withdrawal of $${currentUser.rewards} requested! (Demo)`);
    } else {
        showToast('No rewards to withdraw');
    }
}

function donateRewards() {
    showToast('❤️ Thank you for donating to civic causes!');
}