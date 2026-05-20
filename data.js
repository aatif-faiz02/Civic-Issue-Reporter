// Data Management System
const DataStore = {
    init() {
        // Initialize complaints if not exists
        if (!localStorage.getItem('civic_complaints')) {
            const initialComplaints = [
                {
                    id: 'CIV-001',
                    type: 'authority',
                    title: 'Deep pothole on Main Street',
                    location: 'Main Street, near City Mall',
                    description: 'Large pothole causing accidents and traffic jams',
                    category: 'Pothole / Road Damage',
                    priority: 'high',
                    status: 'progress',
                    upvotes: 247,
                    date: '2025-01-10',
                    userId: 'user_001',
                    userName: 'Alex Chen',
                    anonymous: false,
                    timeline: [
                        { status: 'submitted', date: '2025-01-10', note: 'Report submitted' },
                        { status: 'assigned', date: '2025-01-11', note: 'Assigned to Public Works' }
                    ]
                },
                {
                    id: 'CIV-002',
                    type: 'authority',
                    title: 'Broken streetlight',
                    location: 'Park Avenue, Sector 12',
                    description: 'Streetlight not working for 2 weeks, dangerous at night',
                    category: 'Broken Streetlight',
                    priority: 'critical',
                    status: 'pending',
                    upvotes: 89,
                    date: '2025-01-12',
                    userId: 'user_002',
                    userName: 'Sarah Johnson',
                    anonymous: false,
                    timeline: [{ status: 'submitted', date: '2025-01-12', note: 'Report submitted' }]
                },
                {
                    id: 'CIV-003',
                    type: 'individual',
                    title: 'Graffiti on heritage wall',
                    location: 'Railway Station Underpass',
                    description: 'Offensive graffiti on heritage wall',
                    category: 'Vandalism / Graffiti',
                    priority: 'high',
                    status: 'verified',
                    upvotes: 456,
                    date: '2025-01-08',
                    userId: 'user_003',
                    userName: 'Mike Rodriguez',
                    anonymous: false,
                    reward: 50,
                    rewardStatus: 'pending',
                    timeline: [
                        { status: 'submitted', date: '2025-01-08', note: 'Report submitted' },
                        { status: 'verified', date: '2025-01-10', note: 'Verified - Fine issued' }
                    ]
                }
            ];
            localStorage.setItem('civic_complaints', JSON.stringify(initialComplaints));
        }

        // Initialize users if not exists
        if (!localStorage.getItem('civic_users')) {
            const initialUsers = [
                {
                    id: 'user_001',
                    name: 'Alex Chen',
                    email: 'alex@example.com',
                    password: '123456',
                    rewards: 175,
                    joinDate: '2025-01-01',
                    reportsCount: 5,
                    resolvedCount: 3,
                    avatar: '👤',
                    transactions: [
                        { id: 'tx_001', amount: 100, date: '2025-01-10', description: 'Illegal dumping report' },
                        { id: 'tx_002', amount: 50, date: '2025-01-08', description: 'Vandalism report' },
                        { id: 'tx_003', amount: 25, date: '2025-01-05', description: 'Littering report' }
                    ]
                }
            ];
            localStorage.setItem('civic_users', JSON.stringify(initialUsers));
        }
    },

    getComplaints() {
        return JSON.parse(localStorage.getItem('civic_complaints'));
    },

    saveComplaint(complaint) {
        const complaints = this.getComplaints();
        complaints.unshift(complaint);
        localStorage.setItem('civic_complaints', JSON.stringify(complaints));
    },

    updateComplaint(id, updates) {
        const complaints = this.getComplaints();
        const index = complaints.findIndex(c => c.id === id);
        if (index !== -1) {
            complaints[index] = { ...complaints[index], ...updates };
            localStorage.setItem('civic_complaints', JSON.stringify(complaints));
        }
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('civic_current_user'));
    },

    updateUserRewards(userId, amount, description) {
        const users = JSON.parse(localStorage.getItem('civic_users'));
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].rewards += amount;
            users[userIndex].transactions = users[userIndex].transactions || [];
            users[userIndex].transactions.unshift({
                id: 'tx_' + Date.now(),
                amount: amount,
                date: new Date().toISOString().split('T')[0],
                description: description
            });
            localStorage.setItem('civic_users', JSON.stringify(users));
            
            // Update current user
            const currentUser = this.getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                currentUser.rewards = users[userIndex].rewards;
                localStorage.setItem('civic_current_user', JSON.stringify(currentUser));
            }
            return true;
        }
        return false;
    },

    generateId() {
        const complaints = this.getComplaints();
        const num = complaints.length + 1;
        return `CIV-${String(num).padStart(3, '0')}`;
    },

    hasUpvoted(complaintId) {
        const upvotes = JSON.parse(localStorage.getItem('civic_upvotes') || '[]');
        return upvotes.includes(complaintId);
    },

    addUpvote(complaintId, userId) {
        let upvotes = JSON.parse(localStorage.getItem('civic_upvotes') || '[]');
        if (!upvotes.includes(complaintId)) {
            upvotes.push(complaintId);
            localStorage.setItem('civic_upvotes', JSON.stringify(upvotes));
            
            const complaints = this.getComplaints();
            const complaint = complaints.find(c => c.id === complaintId);
            if (complaint) {
                complaint.upvotes++;
                localStorage.setItem('civic_complaints', JSON.stringify(complaints));
            }
            return true;
        }
        return false;
    }
};

// Initialize on load
DataStore.init();