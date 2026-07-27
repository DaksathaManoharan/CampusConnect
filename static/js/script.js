// ================================================================
// Campus Connect — Event Management System
// script.js  |  Pro upgraded script
// ================================================================

// ================================================================
// DATA STORE with localStorage
// ================================================================
let DB = { users: [], events: [], registrations: [], clubs: [] };
let currentUser = null;
let currentFilter = 'All';
let nextId = { user: 1, event: 1, registration: 1, club: 1 };
let categoryChartInstance = null;
let registrationsChartInstance = null;
let activeDashboardTab = 'overview';

function loadData() {
    const saved = localStorage.getItem('campusDB_v2');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            DB.users         = parsed.users         || [];
            DB.events        = parsed.events        || [];
            DB.registrations = parsed.registrations || [];
            DB.clubs         = parsed.clubs         || [];
            nextId           = parsed.nextId        || { user: 1, event: 1, registration: 1, club: 1 };
            DB.events.forEach(e => { if (!e.status) e.status = 'approved'; });
        } catch (e) {
            console.warn('Invalid data, resetting');
            resetDefaultData();
        }
    } else {
        resetDefaultData();
    }
    ensureAdminExists();
    saveData();
}

function resetDefaultData() {
    DB.users         = [];
    DB.registrations = [];
    nextId           = { user: 1, event: 1, registration: 1, club: 1 };
    
    // Seed clubs
    DB.clubs = [
        { id: nextId.club++, name: 'Coding Club', desc: 'Code fests, hackathons, and software projects.', category: 'Technical', members: 128 },
        { id: nextId.club++, name: 'Cultural Society', desc: 'Music, dance, theatre, and arts celebrations.', category: 'Cultural', members: 312 },
        { id: nextId.club++, name: 'Sports Board', desc: 'Football, basketball, athletics, and annual cups.', category: 'Sports', members: 215 },
        { id: nextId.club++, name: 'IEEE Student Branch', desc: 'Workshops, paper presentations, and tech talks.', category: 'Workshops', members: 94 }
    ];
    
    // Add default events for a rich visual landing page
    DB.events = [
        {
            id: nextId.event++,
            name: 'CodeStorm Hackathon',
            category: 'Technical',
            date: '2026-08-02',
            time: '09:00',
            venue: 'Innovation Hub',
            description: '24-hour coding storm where students compete to build real-world software solutions.',
            limit: 120,
            fee: 0,
            deadline: '2026-08-01',
            organizerId: 1,
            status: 'approved',
            registrations: 45
        },
        {
            id: nextId.event++,
            name: 'Vaibhav Cultural Fest',
            category: 'Cultural',
            date: '2026-08-05',
            time: '17:30',
            venue: 'Open Air Theatre',
            description: 'The ultimate celebration of music, dance, and arts with national artists performing live.',
            limit: 500,
            fee: 0,
            deadline: '2026-08-04',
            organizerId: 1,
            status: 'approved',
            registrations: 380
        },
        {
            id: nextId.event++,
            name: 'Inter-College Football Cup',
            category: 'Sports',
            date: '2026-08-08',
            time: '15:00',
            venue: 'Main Ground',
            description: 'Cheer for your team in the high-stakes annual football tournament finals.',
            limit: 250,
            fee: 0,
            deadline: '2026-08-07',
            organizerId: 1,
            status: 'approved',
            registrations: 98
        },
        {
            id: nextId.event++,
            name: 'Generative AI Workshop',
            category: 'Workshops',
            date: '2026-08-12',
            time: '10:30',
            venue: 'Seminar Hall 3',
            description: 'Hands-on training session on integrating modern LLMs and building agentic coding workflows.',
            limit: 60,
            fee: 0,
            deadline: '2026-08-11',
            organizerId: 1,
            status: 'approved',
            registrations: 58
        }
    ];
}

function ensureAdminExists() {
    const adminExists = DB.users.some(u => u.role === 'admin');
    if (!adminExists) {
        const admin = {
            id: nextId.user++,
            name: 'Admin User',
            email: 'admin@campus.edu',
            password: 'admin123',
            role: 'admin',
            regNumber: 'ADMIN001',
            department: 'Administration',
            year: 0,
            phone: '+91 99999 99999',
            registeredAt: new Date().toISOString()
        };
        DB.users.push(admin);
    }
}

function saveData() {
    localStorage.setItem('campusDB_v2', JSON.stringify({
        users: DB.users,
        events: DB.events,
        registrations: DB.registrations,
        clubs: DB.clubs,
        nextId: nextId
    }));
}

function findUserByRegNo(regNo) {
    return DB.users.find(u => u.regNumber && u.regNumber.toLowerCase() === regNo.toLowerCase());
}

function findUserByEmail(email) {
    return DB.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function getEvent(id) { return DB.events.find(e => e.id === id); }

function getRegistrationsForUser(userId) {
    return DB.registrations.filter(r => r.userId === userId);
}

function isRegistered(userId, eventId) {
    return DB.registrations.some(r => r.userId === userId && r.eventId === eventId);
}

// ================================================================
// TOAST NOTIFICATION SYSTEM
// ================================================================
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.classList.add('toast-out'); setTimeout(() => this.parentElement.remove(), 300)">✕</button>
    `;
    container.appendChild(toast);
    
    // Auto dismiss after 4 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

// ================================================================
// NOTIFICATIONS SYSTEM
// ================================================================
function addNotification(text, type = 'info') {
    if (!currentUser) return;
    const user = DB.users.find(u => u.id === currentUser.id);
    if (!user) return;
    user.notifications = user.notifications || [];
    user.notifications.unshift({
        id: Date.now() + Math.random(),
        text,
        type,
        time: new Date().toISOString(),
        unread: true
    });
    saveData();
    renderNotifications();
}

function toggleNotifPanel(event) {
    if (event) event.stopPropagation();
    const panel = document.getElementById('notifPanel');
    if (!panel) return;
    panel.classList.toggle('open');
    
    // Mark as read when opening panel
    if (panel.classList.contains('open') && currentUser) {
        const user = DB.users.find(u => u.id === currentUser.id);
        if (user && user.notifications) {
            user.notifications.forEach(n => n.unread = false);
            saveData();
            renderNotifications();
        }
    }
}

function clearNotifications() {
    if (!currentUser) return;
    const user = DB.users.find(u => u.id === currentUser.id);
    if (user) {
        user.notifications = [];
        saveData();
        renderNotifications();
        showToast('Cleared all notifications.', 'info');
    }
}

function renderNotifications() {
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    const container = document.getElementById('notifContainer');
    
    if (!currentUser) {
        if (container) container.style.display = 'none';
        return;
    }
    
    if (container) container.style.display = 'block';
    const user = DB.users.find(u => u.id === currentUser.id);
    const notifications = user ? (user.notifications || []) : [];
    const unreadCount = notifications.filter(n => n.unread).length;
    
    if (badge) {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
    
    if (list) {
        if (notifications.length === 0) {
            list.innerHTML = '<div class="notif-empty">No notifications yet.</div>';
        } else {
            list.innerHTML = notifications.map(n => `
                <div class="notif-item ${n.unread ? 'unread' : ''}">
                    <div class="notif-text">${n.text}</div>
                    <div class="notif-time">${formatTimeAgo(n.time)}</div>
                </div>
            `).join('');
        }
    }
}

function formatTimeAgo(isoString) {
    const diffMs = new Date() - new Date(isoString);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

// ================================================================
// BOOKMARKS (WISHLIST)
// ================================================================
function getBookmarksForUser(userId) {
    const user = DB.users.find(u => u.id === userId);
    return user ? (user.bookmarks || []) : [];
}

function isBookmarked(eventId) {
    if (!currentUser) return false;
    const bookmarks = getBookmarksForUser(currentUser.id);
    return bookmarks.includes(eventId);
}

function toggleBookmark(eventId, event) {
    if (event) event.stopPropagation(); // Stop card click
    if (!currentUser) {
        showToast('⚠️ Please login first to bookmark events.', 'warning');
        return;
    }
    const user = DB.users.find(u => u.id === currentUser.id);
    if (!user) return;
    user.bookmarks = user.bookmarks || [];
    const index = user.bookmarks.indexOf(eventId);
    if (index === -1) {
        user.bookmarks.push(eventId);
        showToast('❤️ Added to bookmarks!', 'success');
        addNotification(`Bookmarked event: "${getEvent(eventId).name}"`, 'info');
    } else {
        user.bookmarks.splice(index, 1);
        showToast('🤍 Removed from bookmarks.', 'info');
    }
    saveData();
    renderAll();
}

// ================================================================
// AUTH
// ================================================================
function handleLogin(e) {
    e.preventDefault();
    const regNo   = document.getElementById('loginRegNo').value.trim();
    const roleBtn = document.querySelector('#loginRoleTabs .role-btn.active');
    const role    = roleBtn ? roleBtn.dataset.role : 'student';

    if (!regNo) { showToast('⚠️ Please enter your Register Number.', 'warning'); return; }

    const user = findUserByRegNo(regNo);
    if (!user) {
        showToast('❌ No account found with this Register Number. Please register first.', 'error');
        return;
    }
    if (user.role !== role) {
        showToast('❌ This account is registered as ' + user.role + '. Please select the correct role.', 'error');
        return;
    }

    currentUser = user;
    updateUI();
    closeLogin();
    showToast('Welcome ' + user.name + '!', 'success');
    showPage('home');
}

function handleRegister(e) {
    e.preventDefault();
    const name      = document.getElementById('regName').value.trim();
    const regNumber = document.getElementById('regNumber').value.trim();
    const dept      = document.getElementById('regDept').value;
    const year      = document.getElementById('regYear').value;
    const email     = document.getElementById('regEmail').value.trim();
    const phone     = document.getElementById('regPhone').value.trim();
    const password  = document.getElementById('regPassword').value.trim();
    const confirm   = document.getElementById('regConfirm').value.trim();

    if (!name || !regNumber || !dept || !year || !email || !phone || !password || !confirm) {
        showToast('⚠️ Please fill in all fields.', 'warning');
        return;
    }
    const regRegex = /^\d{12}$/;
    if (!regRegex.test(regNumber)) {
        showToast('⚠️ Register Number must contain exactly 12 digits (numbers only).', 'warning');
        return;
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
        showToast('⚠️ Phone Number must contain exactly 10 digits (numbers only).', 'warning');
        return;
    }
    if (!email.includes('@'))     { showToast('⚠️ Valid email required.', 'warning');              return; }
    if (password.length < 8)      { showToast('⚠️ Password must be at least 8 characters.', 'warning'); return; }
    if (password !== confirm)     { showToast('⚠️ Passwords do not match.', 'warning');            return; }
    if (findUserByRegNo(regNumber)) { showToast('⚠️ Register Number already taken.', 'warning');  return; }
    if (findUserByEmail(email))   { showToast('⚠️ Email already registered.', 'warning');          return; }

    const newUser = {
        id: nextId.user++,
        name,
        email,
        password,
        role: 'student',
        regNumber,
        department: dept,
        year: parseInt(year),
        phone,
        bookmarks: [],
        notifications: [],
        registeredAt: new Date().toISOString()
    };
    DB.users.push(newUser);
    saveData();
    currentUser = newUser;
    updateUI();
    closeRegister();
    showToast('🎉 Welcome ' + name + '! Your account has been created.', 'success');
    showPage('home');
}

function logout() {
    currentUser = null;
    updateUI();
    showPage('home');
    const links = document.getElementById('navLinks');
    if (window.innerWidth <= 640) links.style.display = 'none';
}

// ================================================================
// ADMIN — Create Event
// ================================================================
function openAdminCreateEvent() {
    if (!currentUser || currentUser.role !== 'admin') { showToast('⚠️ Admin access required.', 'error'); return; }
    document.getElementById('adminCreateEventOverlay').classList.add('open');
}

function closeAdminCreateEvent() {
    document.getElementById('adminCreateEventOverlay').classList.remove('open');
}

function openAdminCreateClub() {
    if (!currentUser || currentUser.role !== 'admin') { showToast('⚠️ Admin access required.', 'error'); return; }
    document.getElementById('adminCreateClubOverlay').classList.add('open');
}

function closeAdminCreateClub() {
    document.getElementById('adminCreateClubOverlay').classList.remove('open');
}

function handleAdminCreateEvent(e) {
    e.preventDefault();
    try {
        const name     = document.getElementById('aevName').value.trim();
        const category = document.getElementById('aevCategory').value;
        const date     = document.getElementById('aevDate').value;
        const time     = document.getElementById('aevTime').value;
        const venue    = document.getElementById('aevVenue').value.trim();
        const desc     = document.getElementById('aevDesc').value.trim();
        const limit    = parseInt(document.getElementById('aevLimit').value) || 100;
        const deadline = document.getElementById('aevDeadline').value;

        if (!name || !category || !date || !time || !venue || !deadline) {
            showToast('⚠️ Please fill in all required fields.', 'warning');
            return;
        }

        const newEvent = {
            id: nextId.event++,
            name,
            category,
            date,
            time,
            venue,
            description: desc,
            limit,
            fee: 0,
            deadline,
            organizerId: currentUser ? currentUser.id : 1,
            status: 'approved',
            registrations: 0
        };

        const brochureInput = document.getElementById('aevBrochure');
        const brochureFile = brochureInput ? brochureInput.files[0] : null;

        // Limit brochure to 1MB to prevent QuotaExceededError in localStorage
        if (brochureFile && brochureFile.size > 1 * 1024 * 1024) {
            showToast('⚠️ Brochure file is too large! Please upload a file under 1MB to fit in local storage.', 'warning');
            return;
        }

        if (brochureFile) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    newEvent.brochure = event.target.result;
                    newEvent.brochureName = brochureFile.name;
                    
                    DB.events.push(newEvent);
                    saveData();
                    closeAdminCreateEvent();
                    if (brochureInput) brochureInput.value = '';
                    showToast('Event created successfully with brochure!', 'success');
                    renderAll();
                } catch (saveErr) {
                    console.error(saveErr);
                    showToast('❌ Error saving event: Local storage quota exceeded. Try a smaller file.', 'error');
                }
            };
            reader.onerror = function() {
                showToast('❌ Failed to read brochure file.', 'error');
            };
            reader.readAsDataURL(brochureFile);
        } else {
            DB.events.push(newEvent);
            saveData();
            closeAdminCreateEvent();
            showToast('Event created successfully!', 'success');
            renderAll();
        }
    } catch (err) {
        console.error(err);
        showToast('❌ Error creating event: ' + err.message, 'error');
    }
}

function handleAdminCreateClub(e) {
    e.preventDefault();
    try {
        const name     = document.getElementById('aclubName').value.trim();
        const category = document.getElementById('aclubCategory').value;
        const desc     = document.getElementById('aclubDesc').value.trim();
        const members  = parseInt(document.getElementById('aclubMembers').value) || 0;

        if (!name || !category || !desc) {
            showToast('⚠️ Please fill in all fields.', 'warning');
            return;
        }

        const newClub = {
            id: nextId.club++,
            name,
            category,
            desc,
            members
        };

        DB.clubs.push(newClub);
        saveData();
        closeAdminCreateClub();
        
        // Reset form
        document.getElementById('aclubName').value = '';
        document.getElementById('aclubCategory').value = '';
        document.getElementById('aclubDesc').value = '';
        document.getElementById('aclubMembers').value = '0';
        
        showToast('Club created successfully!', 'success');
        renderClubs();
        renderAll();
    } catch (err) {
        console.error(err);
        showToast('❌ Error creating club: ' + err.message, 'error');
    }
}

// ================================================================
// REGISTER for event
// ================================================================
function registerForEvent(eventId) {
    if (!currentUser)                     { showToast('⚠️ Please login first.', 'warning');          return; }
    if (currentUser.role !== 'student')   { showToast('⚠️ Only students can register.', 'warning'); return; }

    const event = getEvent(eventId);
    if (!event)                                 { showToast('❌ Event not found.', 'error');                     return; }
    if (event.registrations >= event.limit)     { showToast('❌ Event is full!', 'error');                      return; }
    if (isRegistered(currentUser.id, eventId))  { showToast('⚠️ Already registered.', 'warning');               return; }
    if (event.deadline && new Date(event.deadline) < new Date()) {
        showToast('❌ Registration deadline has passed.', 'error');
        return;
    }

    const reg = {
        id: nextId.registration++,
        eventId,
        userId: currentUser.id,
        status: 'confirmed',
        attendanceStatus: 'registered',
        qrCode: 'QR-' + String(eventId).padStart(3, '0') + String(currentUser.id).padStart(3, '0'),
        paymentStatus: 'paid',
        registeredAt: new Date().toISOString()
    };
    DB.registrations.push(reg);
    event.registrations++;
    awardPoints(currentUser.id, 10, `Registered for event: "${event.name}"`);
    saveData();
    showToast('Registered successfully!', 'success');
    addNotification(`Registered for event: "${event.name}"`, 'success');
    renderAll();
}

function cancelRegistration(regId) {
    if (!confirm('Cancel your registration?')) return;
    const reg = DB.registrations.find(r => r.id === regId);
    if (!reg) return;
    const event = getEvent(reg.eventId);
    if (event) event.registrations--;
    DB.registrations = DB.registrations.filter(r => r.id !== regId);
    saveData();
    showToast('Registration cancelled.', 'info');
    if (event) {
        addNotification(`Cancelled registration for event: "${event.name}"`, 'warning');
    }
    renderAll();
}

// ================================================================
// ADMIN — Delete event
// ================================================================
function deleteEvent(eventId) {
    if (!currentUser || currentUser.role !== 'admin') { showToast('⚠️ Admin access required.', 'error'); return; }
    if (!confirm('Delete this event and all its registrations?')) return;
    DB.events        = DB.events.filter(e => e.id !== eventId);
    DB.registrations = DB.registrations.filter(r => r.eventId !== eventId);
    saveData();
    showToast('Event deleted successfully.', 'info');
    renderAll();
}

// ================================================================
// ADMIN — Manage Attendance (Attendance Marking)
// ================================================================
function markAttendance(regId, status) {
    const reg = DB.registrations.find(r => r.id === regId);
    if (!reg) return;
    reg.attendanceStatus = status;
    saveData();
    
    // Send dynamic notification to the student if marked present/attended
    if (status === 'attended') {
        const student = DB.users.find(u => u.id === reg.userId);
        const ev = getEvent(reg.eventId);
        if (student && ev) {
            student.notifications = student.notifications || [];
            student.notifications.unshift({
                id: Date.now() + Math.random(),
                text: `🎓 Congratulations! You have completed "${ev.name}" and your certificate has been issued. Check the Certificates tab in your dashboard.`,
                type: 'success',
                time: new Date().toISOString(),
                unread: true
            });
            // Award 50 points to student
            student.points = (student.points || 0) + 50;
            student.notifications.unshift({
                id: Date.now() + Math.random(),
                text: `🏆 Earned +50 points: Attended event "${ev.name}"`,
                type: 'success',
                time: new Date().toISOString(),
                unread: true
            });
            saveData();
        }
    }
    
    showToast(`Attendance marked as ${status}.`, 'success');
    renderAll();
}

// ================================================================
// EXPORTS (CSV EXPORT)
// ================================================================
function exportStudentCSV() {
    if (!currentUser) return;
    const myRegs = getRegistrationsForUser(currentUser.id);
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Event Name,Category,Date,Time,Venue,Registered Date,Attendance Status\n";
    
    myRegs.forEach(r => {
        const ev = getEvent(r.eventId);
        if (ev) {
            const row = [
                `"${ev.name.replace(/"/g, '""')}"`,
                `"${ev.category}"`,
                `"${ev.date}"`,
                `"${ev.time}"`,
                `"${ev.venue.replace(/"/g, '""')}"`,
                `"${r.registeredAt ? r.registeredAt.split('T')[0] : '-'}"`,
                `"${r.attendanceStatus || 'registered'}"`
            ].join(",");
            csvContent += row + "\n";
        }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentUser.name.replace(/\s+/g, '_')}_event_history.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Event history exported successfully!", "success");
}

function exportAdminCSV() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Student Name,Register Number,Department,Year,Email,Phone,Event Name,Category,Event Date,Registration Date,Attendance Status\n";
    
    DB.registrations.forEach(r => {
        const student = DB.users.find(u => u.id === r.userId);
        const ev = getEvent(r.eventId);
        if (student && ev) {
            const row = [
                `"${student.name.replace(/"/g, '""')}"`,
                `"=""${student.regNumber || '-'}"""`,
                `"${student.department || '-'}"`,
                `"${student.year || '-'}"`,
                `"${student.email}"`,
                `"=""${student.phone || '-'}"""`,
                `"${ev.name.replace(/"/g, '""')}"`,
                `"${ev.category}"`,
                `"${ev.date}"`,
                `"${r.registeredAt ? r.registeredAt.split('T')[0] : '-'}"`,
                `"${r.attendanceStatus || 'registered'}"`
            ].join(",");
            csvContent += row + "\n";
        }
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campus_connect_all_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("All registrations exported successfully!", "success");
}

// ================================================================
// DASHBOARD TABS NAVIGATION
// ================================================================
function switchDashboardTab(tabId) {
    activeDashboardTab = tabId;
    document.querySelectorAll('.dashboard-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `tabBtn-${tabId}`);
    });
    document.querySelectorAll('.dashboard-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });
    
    if (tabId === 'calendar') {
        renderCalendarView();
    } else if (tabId === 'certificates') {
        renderCertificatesView();
    } else if (tabId === 'leaderboard') {
        renderLeaderboard();
    } else {
        renderAll();
    }
}

function renderCalendarView() {
    const container = document.getElementById('calendarTimeline');
    if (!container) return;
    if (!currentUser) return;
    
    const myRegs = getRegistrationsForUser(currentUser.id);
    const myEvents = myRegs.map(r => getEvent(r.eventId)).filter(Boolean);
    
    // Sort chronologically
    myEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (myEvents.length === 0) {
        container.innerHTML = '<p class="text-muted" style="text-align:center; padding: 40px 0;">No events in your schedule yet.</p>';
        return;
    }
    
    const MONTHS_SHORT = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    
    // Group by date
    const grouped = {};
    myEvents.forEach(e => {
        if (!grouped[e.date]) grouped[e.date] = [];
        grouped[e.date].push(e);
    });
    
    container.innerHTML = Object.keys(grouped).map(dateStr => {
        const parts = dateStr.split('-');
        const dayNum = parts[2];
        const monText = MONTHS_SHORT[parseInt(parts[1]) - 1] || '';
        
        const eventsHtml = grouped[dateStr].map(e => `
            <div class="calendar-event-item">
                <div class="info">
                    <h4>${e.name}</h4>
                    <p>📍 ${e.venue} · ⏰ ${e.time} · <span class="badge badge-yellow" style="font-size: 9px; padding: 1px 8px;">${e.category}</span></p>
                </div>
                <button class="btn small coral" onclick="cancelRegistration(${DB.registrations.find(r => r.eventId === e.id && r.userId === currentUser.id)?.id})">Cancel</button>
            </div>
        `).join('');
        
        return `
            <div class="calendar-day-block">
                <div class="calendar-date-badge">
                    <span class="day-num">${dayNum}</span>
                    <span class="mon-text">${monText}</span>
                </div>
                <div class="calendar-events-list">
                    ${eventsHtml}
                </div>
            </div>
        `;
    }).join('');
}

function renderCertificatesView() {
    const container = document.getElementById('certificatesList');
    if (!container) return;
    if (!currentUser) return;
    
    const myRegs = getRegistrationsForUser(currentUser.id).filter(r => r.attendanceStatus === 'attended');
    
    if (myRegs.length === 0) {
        container.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align:center; padding: 40px 0;">No certificates issued yet. Certificates are issued after you attend registered events.</p>';
        return;
    }
    
    container.innerHTML = myRegs.map(r => {
        const ev = getEvent(r.eventId);
        if (!ev) return '';
        return `
            <div class="cert-card">
                <div>
                    <span class="badge badge-green" style="font-size: 9px; margin-bottom: 8px;">ISSUED</span>
                    <h4>${ev.name}</h4>
                    <p>Completed on: ${ev.date}</p>
                </div>
                <button class="btn small marigold" onclick="openCertificate(${r.id})">View Certificate</button>
            </div>
        `;
    }).join('');
}

function openCertificate(regId) {
    const reg = DB.registrations.find(r => r.id === regId);
    if (!reg) return;
    const ev = getEvent(reg.eventId);
    const student = DB.users.find(u => u.id === reg.userId);
    if (!ev || !student) return;
    
    document.getElementById('certRecipient').textContent = student.name;
    document.getElementById('certEvent').textContent = ev.name;
    document.getElementById('certVenue').textContent = ev.venue;
    document.getElementById('certDate').textContent = ev.date;
    document.getElementById('certCode').textContent = `ID: ${reg.qrCode}`;
    
    document.getElementById('certificateOverlay').classList.add('open');
}

function closeCertificate() {
    document.getElementById('certificateOverlay').classList.remove('open');
}

// ================================================================
// ADMIN — CHART.JS ANALYTICS GRAPHICS
// ================================================================
function renderAdminCharts() {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    const canvasCat = document.getElementById('categoryChart');
    const canvasReg = document.getElementById('registrationsChart');
    if (!canvasCat || !canvasReg) return;
    
    const categories = ['Technical', 'Cultural', 'Sports', 'Workshops'];
    const counts = categories.map(cat => DB.events.filter(e => e.category === cat).length);
    
    const eventNames = DB.events.map(e => e.name);
    const eventRegs = DB.events.map(e => e.registrations || 0);
    
    if (categoryChartInstance) categoryChartInstance.destroy();
    if (registrationsChartInstance) registrationsChartInstance.destroy();
    
    const colors = ['#FFB627', '#FF5A5F', '#0E5257', '#6C63FF'];
    
    categoryChartInstance = new Chart(canvasCat, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: counts,
                backgroundColor: colors,
                borderColor: '#1B1B1F',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { family: 'Space Grotesk', weight: 'bold' },
                        color: '#1B1B1F'
                    }
                }
            }
        }
    });
    
    registrationsChartInstance = new Chart(canvasReg, {
        type: 'bar',
        data: {
            labels: eventNames,
            datasets: [{
                label: 'Registrations',
                data: eventRegs,
                backgroundColor: '#0E5257',
                borderColor: '#1B1B1F',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0,
                        font: { family: 'JetBrains Mono' },
                        color: '#1B1B1F'
                    },
                    grid: { color: 'rgba(27, 27, 31, 0.08)' }
                },
                x: {
                    ticks: {
                        font: { family: 'Space Grotesk', size: 9 },
                        color: '#1B1B1F'
                    },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ================================================================
// EVENT TICKETS RENDERER
// ================================================================
function renderEventCards(containerId, events, showRegister = true, showCancel = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!events || events.length === 0) {
        container.innerHTML =
            '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px 0;">No events found.</p>';
        return;
    }

    const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

    container.innerHTML = events.map(e => {
        const isFull      = e.registrations >= e.limit;
        const already     = currentUser ? isRegistered(currentUser.id, e.id) : false;
        const pastDeadline = e.deadline && new Date(e.deadline) < new Date();
        const bookmarked   = isBookmarked(e.id);

        let btnHtml = '';
        if (showRegister) {
            if (already)          btnHtml = `<button class="btn small green" disabled>✅ Registered</button>`;
            else if (isFull)      btnHtml = `<button class="btn small" disabled>Full</button>`;
            else if (pastDeadline)btnHtml = `<button class="btn small" disabled>Deadline Passed</button>`;
            else                  btnHtml = `<button class="btn small teal" onclick="registerForEvent(${e.id})">Register</button>`;
        }

        const month = MONTHS[parseInt(e.date.split('-')[1]) - 1] || '';

        let cancelBtn = (showCancel && already)
            ? `<button class="btn small coral" style="margin-top:6px;" onclick="cancelRegistration(${DB.registrations.find(r => r.eventId === e.id && r.userId === currentUser.id)?.id})">Cancel</button>`
            : '';
            
        // If completed (attended), hide cancel button and show feedback button instead
        const reg = currentUser ? DB.registrations.find(r => r.eventId === e.id && r.userId === currentUser.id) : null;
        if (reg && reg.attendanceStatus === 'attended') {
            cancelBtn = reg.rating
                ? `<span class="badge badge-green" style="margin-top:6px; font-size:10px; display:inline-block; text-align:center;">Rated ★${reg.rating}</span>`
                : `<button class="btn small marigold" style="margin-top:6px;" onclick="openFeedbackModal(${reg.id})">⭐ Give Feedback</button>`;
        }

        const adminDelete = (currentUser && currentUser.role === 'admin')
            ? `<button class="btn small coral" style="margin-top:6px;" onclick="deleteEvent(${e.id})">Delete</button>`
            : '';

        // Bookmarks Heart button HTML
        const bookmarkHtml = currentUser && currentUser.role === 'student'
            ? `<button class="bookmark-btn ${bookmarked ? 'active' : ''}" onclick="toggleBookmark(${e.id}, event)">${bookmarked ? '❤️' : '🤍'}</button>`
            : '';

        // Visual Seats Progress calculations
        const seatPct = Math.min((e.registrations / e.limit) * 100, 100);
        const seatsLeft = e.limit - e.registrations;
        
        let seatsAlertHtml = '';
        if (seatsLeft <= 0) {
            seatsAlertHtml = `<span class="seats-alert">FULL</span>`;
        } else if (seatsLeft < 15) {
            seatsAlertHtml = `<span class="seats-alert">Only ${seatsLeft} left!</span>`;
        } else {
            seatsAlertHtml = `<span>${seatsLeft}/${e.limit} remaining</span>`;
        }

        // Dynamic Countdowns
        const diffDays = Math.ceil((new Date(e.date) - new Date()) / (1000 * 60 * 60 * 24));
        let countdownHtml = '';
        if (diffDays > 0) {
            countdownHtml = `<span class="mono" style="font-size: 10px; color: var(--teal); font-weight:700;">Starts in ${diffDays} day${diffDays > 1 ? 's' : ''}</span>`;
        } else if (diffDays === 0) {
            countdownHtml = `<span class="mono" style="font-size: 10px; color: var(--coral); font-weight:700;">Happening TODAY!</span>`;
        } else {
            countdownHtml = `<span class="mono" style="font-size: 10px; color: var(--ink-45);">Completed</span>`;
        }

        const brochureBtn = e.brochure
            ? `<a class="btn small marigold" href="${e.brochure}" download="${e.brochureName || 'brochure'}" style="margin-top:6px; width:100%; justify-content:center; font-size:10px;">📄 View Brochure</a>`
            : '';

        return `
            <div class="ticket reveal">
                ${bookmarkHtml}
                <div class="ticket-main">
                    <span class="ticket-tag tag-${e.category.toLowerCase()}">${e.category}</span>
                    <h4 style="margin-top:4px;">${e.name}</h4>
                    <span class="loc">${e.venue}</span>
                    <span class="text-muted text-small">${e.date} · ${e.time}</span>
                    
                    <!-- Urgency Countdown -->
                    ${countdownHtml}

                    <!-- Seats Progress Bar -->
                    <div class="seats-progress-container">
                        <div class="seats-progress-bar" style="width: ${seatPct}%; background-color: ${seatPct >= 100 ? 'var(--coral)' : seatPct >= 80 ? 'var(--marigold)' : 'var(--teal)'}"></div>
                    </div>
                    <div class="seats-meta">
                        ${seatsAlertHtml}
                    </div>

                    <div style="margin-top: 10px; display:flex; flex-direction:column; gap:4px;">
                        ${btnHtml}
                        ${adminDelete}
                        ${cancelBtn}
                        ${brochureBtn}
                    </div>
                </div>
                <div class="ticket-stub">
                    <span class="day">${e.date.split('-')[2]}</span>
                    <span class="mon">${month}</span>
                    <span class="time">${e.time}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ================================================================
// GENERAL RENDERALL
// ================================================================
function renderAll() {
    const allApproved = DB.events.filter(e => e.status === 'approved');
    let filtered = allApproved;
    if (currentFilter !== 'All') filtered = filtered.filter(e => e.category === currentFilter);

    renderEventCards('homeEventGrid',   filtered.slice(0, 9), true);
    renderEventCards('browseEventGrid', filtered,             true);

    document.getElementById('totalEventsStat').textContent  = allApproved.length;
    document.getElementById('totalStudentsStat').textContent = DB.users.filter(u => u.role === 'student').length;

    renderNotifications();

    if (currentUser) {
        const myRegs   = getRegistrationsForUser(currentUser.id);
        const myEvents = myRegs.map(r => getEvent(r.eventId)).filter(Boolean);
        renderEventCards('myEventsList', myEvents, false, true);

        const upcoming = myRegs.filter(r => {
            const ev = getEvent(r.eventId);
            return ev && new Date(ev.date) >= new Date();
        });

        // Set Student stats
        const bookmarks = getBookmarksForUser(currentUser.id);
        
        const countReg = document.getElementById('dashRegistered');
        const countUpc = document.getElementById('dashUpcoming');
        const countCrt = document.getElementById('dashCertificates');
        const countBkm = document.getElementById('dashBookmarked');
        
        if (countReg) countReg.textContent = myRegs.length;
        if (countUpc) countUpc.textContent = upcoming.length;
        if (countCrt) countCrt.textContent = myRegs.filter(r => r.attendanceStatus === 'attended').length;
        if (countBkm) countBkm.textContent = bookmarks.length;

        // Render Recently Registered Events
        const dashList = document.getElementById('dashEventList');
        if (dashList) {
            dashList.innerHTML = myRegs.slice(0, 5).map(r => {
                const ev = getEvent(r.eventId);
                return ev
                    ? `<div class="text-small" style="padding:8px 0; border-bottom:1px solid var(--line); display:flex; justify-content:space-between;">
                        <span>✅ <strong>${ev.name}</strong></span>
                        <span class="text-muted">${ev.date}</span>
                       </div>`
                    : '';
            }).join('') || '<p class="text-muted">No events registered.</p>';
        }

        // Render Bookmark list in student portal
        const bkmList = document.getElementById('dashBookmarkList');
        if (bkmList) {
            const bkmEvents = bookmarks.map(id => getEvent(id)).filter(Boolean);
            bkmList.innerHTML = bkmEvents.slice(0, 5).map(ev => `
                <div class="text-small" style="padding:8px 0; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center;">
                    <span>❤️ <strong>${ev.name}</strong></span>
                    <button class="btn small small-btn ghost" style="padding:4px 10px; font-size:9px;" onclick="registerForEvent(${ev.id})">Join</button>
                </div>
            `).join('') || '<p class="text-muted">No bookmarked events.</p>';
        }

        // Admin Dashboard updates
        if (currentUser.role === 'admin') {
            const students  = DB.users.filter(u => u.role === 'student');
            const allEvents = DB.events;
            document.getElementById('adminStudents').textContent      = students.length;
            document.getElementById('adminEvents').textContent        = allEvents.length;
            document.getElementById('adminActive').textContent        = allEvents.filter(e => e.status === 'approved').length;
            document.getElementById('adminRegistrations').textContent = DB.registrations.length;

            const tbody = document.getElementById('adminUserTable');
            if (tbody) {
                tbody.innerHTML = DB.users.map(u => `
                    <tr>
                        <td>${u.name}</td>
                        <td>${u.regNumber || '-'}</td>
                        <td>${u.email}</td>
                        <td>${u.department || '-'}</td>
                        <td>${u.year || '-'}</td>
                        <td>${u.phone || '-'}</td>
                        <td>${u.role}</td>
                    </tr>
                `).join('');
            }

            const adminList = document.getElementById('adminEventList');
            if (adminList) {
                adminList.innerHTML = DB.events.map(e => `
                    <div style="padding:10px 0; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                        <div>
                            <strong>${e.name}</strong>
                            <span class="badge badge-${e.category === 'Technical' ? 'yellow' : e.category === 'Cultural' ? 'red' : e.category === 'Sports' ? 'green' : 'purple'}">${e.category}</span>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <span class="text-muted text-small">${e.registrations}/${e.limit}</span>
                            <button class="btn small coral" onclick="deleteEvent(${e.id})">Delete</button>
                        </div>
                    </div>
                `).join('');
            }

            // Render registrations attendance management table
            const tbodyReg = document.getElementById('adminRegistrationsTable');
            if (tbodyReg) {
                tbodyReg.innerHTML = DB.registrations.map(r => {
                    const student = DB.users.find(u => u.id === r.userId);
                    const ev = getEvent(r.eventId);
                    if (!student || !ev) return '';
                    
                    let badgeClass = 'pending';
                    if (r.attendanceStatus === 'attended') badgeClass = 'green';
                    if (r.attendanceStatus === 'absent') badgeClass = 'red';
                    
                    const btnHtml = r.attendanceStatus !== 'attended'
                        ? `<button class="btn small green" style="padding:6px 12px; font-size:10px;" onclick="markAttendance(${r.id}, 'attended')">Mark Attended</button>
                           <button class="btn small coral" style="padding:6px 12px; font-size:10px; margin-left:4px;" onclick="markAttendance(${r.id}, 'absent')">Mark Absent</button>`
                        : `<button class="btn small ghost" style="padding:6px 12px; font-size:10px;" onclick="markAttendance(${r.id}, 'registered')">Reset</button>`;
                        
                    return `
                        <tr>
                            <td><strong>${student.name}</strong></td>
                            <td>${student.regNumber || '-'}</td>
                            <td>${ev.name}</td>
                            <td class="text-small text-muted">${new Date(r.registeredAt).toLocaleDateString()}</td>
                            <td><span class="badge badge-${badgeClass}">${r.attendanceStatus || 'registered'}</span></td>
                            <td>${btnHtml}</td>
                        </tr>
                    `;
                }).join('');
            }

            // Render Chart.js
            setTimeout(renderAdminCharts, 50);
        }
    }

    renderClubs();
    renderCalendarGrid();
    renderLeaderboard();
    updateProfileUI();
}

function updateProfileUI() {
    const section = document.getElementById('profileSection');
    if (currentUser) {
        section.style.display = 'block';
        document.getElementById('profileName').textContent         = currentUser.name;
        document.getElementById('profileRegNo').textContent        = currentUser.regNumber || '-';
        document.getElementById('profileEmail').textContent        = currentUser.email;
        document.getElementById('profileDept').textContent         = currentUser.department || '-';
        document.getElementById('profileYear').textContent         = currentUser.year ? currentUser.year + 'rd Year' : '-';
        const points = currentUser.points || 0;
        const badge = getUserBadgeText(points);
        document.getElementById('profileRole').textContent         = `${currentUser.role.toUpperCase()} · ${points} PTS · ${badge}`;
        document.getElementById('profilePhone').textContent        = currentUser.phone || '-';

        const myRegs = getRegistrationsForUser(currentUser.id);
        document.getElementById('profileRegCount').textContent = myRegs.length;
        const upcoming = myRegs.filter(r => {
            const ev = getEvent(r.eventId);
            return ev && new Date(ev.date) >= new Date();
        });
        document.getElementById('profileUpcomingCount').textContent = upcoming.length;
    } else {
        section.style.display = 'none';
    }
}

// ================================================================
// FILTER & SEARCH
// ================================================================
function filterEvents(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-row .chip').forEach(c =>
        c.classList.toggle('active', c.dataset.filter === filter)
    );
    renderAll();
}

function searchEvents() {
    const query = document.getElementById('homeSearch').value.trim().toLowerCase();
    if (!query) { renderAll(); return; }
    const allApproved = DB.events.filter(e => e.status === 'approved');
    const results = allApproved.filter(e =>
        e.name.toLowerCase().includes(query) ||
        e.venue.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query)
    );
    document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
    const grid = document.getElementById('homeEventGrid');
    if (results.length === 0) {
        grid.innerHTML = `<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px 0;">No events found for "${query}".</p>`;
        return;
    }
    renderEventCards('homeEventGrid', results, true);
}

// ================================================================
// UI HELPERS
// ================================================================
function updateUI() {
    const loginBtn    = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn   = document.getElementById('logoutBtn');
    const userBadge   = document.getElementById('userBadge');
    const userName    = document.getElementById('userName');

    if (currentUser) {
        loginBtn.style.display    = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display   = 'inline-flex';
        userBadge.style.display   = 'flex';
        userName.textContent      = currentUser.name;
    } else {
        loginBtn.style.display    = 'inline-flex';
        registerBtn.style.display = 'inline-flex';
        logoutBtn.style.display   = 'none';
        userBadge.style.display   = 'none';
    }

    document.querySelectorAll('.nav-links a').forEach(link => {
        const page = link.dataset.page;
        let show = false;
        if (!currentUser) {
            show = ['home', 'browse', 'calendar', 'clubs'].includes(page);
        } else if (currentUser.role === 'student') {
            show = ['home', 'browse', 'calendar', 'clubs', 'dashboard', 'myevents'].includes(page);
        } else if (currentUser.role === 'admin') {
            show = ['home', 'browse', 'calendar', 'clubs', 'admin'].includes(page);
        }
        link.style.display = show ? '' : 'none';
    });

    renderAll();
}

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById('page-' + pageId);
    if (page) page.classList.add('active');
    document.querySelectorAll('.nav-links a').forEach(a =>
        a.classList.toggle('active', a.dataset.page === pageId)
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.innerWidth <= 640) {
        document.getElementById('navLinks').style.display = 'none';
    }
    
    // Switch to overview panel when loading dashboard
    if (pageId === 'dashboard') {
        switchDashboardTab('overview');
    } else if (pageId === 'calendar') {
        renderCalendarGrid();
    } else if (pageId === 'clubs') {
        renderClubs();
    } else {
        renderAll();
    }
}

function toggleMenu() {
    const links = document.getElementById('navLinks');
    links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
}

// ================================================================
// EVENT LISTENERS (run after DOM is ready)
// ================================================================
document.addEventListener('DOMContentLoaded', function () {

    // Nav link clicks
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (!currentUser && (page === 'dashboard' || page === 'myevents' || page === 'admin')) {
                showToast('⚠️ Please login first.', 'warning');
                return;
            }
            if (currentUser) {
                if (page === 'admin' && currentUser.role !== 'admin') {
                    showToast('⚠️ Admin access only.', 'error');
                    return;
                }
                if ((page === 'dashboard' || page === 'myevents') && currentUser.role !== 'student') {
                    showToast('⚠️ Student access only.', 'error');
                    return;
                }
            }
            showPage(page);
            if (window.innerWidth <= 640) {
                document.getElementById('navLinks').style.display = 'none';
            }
        });
    });

    // Close overlays when clicking backdrop
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) this.classList.remove('open');
        });
    });
    
    // Close certificate overlay when clicking backdrop
    document.getElementById('certificateOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) this.classList.remove('open');
    });

    // Close notifications panel if clicking outside
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('notifPanel');
        const bell = document.querySelector('.nav-bell');
        if (panel && panel.classList.contains('open') && !panel.contains(e.target) && (!bell || !bell.contains(e.target))) {
            panel.classList.remove('open');
        }
    });

    // Role tabs in login
    document.querySelectorAll('#loginRoleTabs .role-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('#loginRoleTabs .role-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Password match check
    document.getElementById('regPassword')?.addEventListener('input', checkPasswordMatch);
    document.getElementById('regConfirm')?.addEventListener('input',  checkPasswordMatch);

    // IntersectionObserver for reveal animations
    const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('in');
        });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal-on-scroll').forEach(el => io.observe(el));

    // ── INIT ──
    loadData();
    
    // Load theme setting
    const savedTheme = localStorage.getItem('campusTheme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
        const toggleBtn = document.getElementById('themeToggleBtn');
        if (toggleBtn) toggleBtn.textContent = '☀️';
    }
    
    // Load announcement status
    const dismissed = localStorage.getItem('announcementDismissed');
    if (dismissed !== 'true') {
        const banner = document.getElementById('announceBar');
        if (banner) {
            banner.style.display = 'flex';
            const textEl = document.getElementById('announceText');
            if (textEl) textEl.textContent = "📢 Welcome to Campus Connect! Check out the new monthly Calendar and join Campus Clubs!";
        }
    }
    
    updateUI();
    showPage('home');
    console.log('🔑 Admin login: ADMIN001 (select "Admin" role)');
});

function checkPasswordMatch() {
    const pwd     = document.getElementById('regPassword')?.value || '';
    const confirm = document.getElementById('regConfirm')?.value  || '';
    const field   = document.getElementById('regConfirm');
    if (field) {
        if (confirm.length === 0) { field.style.borderColor = 'rgba(27,27,31,.25)'; return; }
        field.style.borderColor = pwd === confirm ? '#0E5257' : '#FF5A5F';
    }
}

// ----- Login & Register Overlay Modals -----
function openLogin() {
    document.getElementById('loginOverlay').classList.add('open');
}
function closeLogin() {
    document.getElementById('loginOverlay').classList.remove('open');
}
function openRegister() {
    document.getElementById('registerOverlay').classList.add('open');
}
function closeRegister() {
    document.getElementById('registerOverlay').classList.remove('open');
}

// ================================================================
// NEW PREMIUM FEATURES IMPLEMENTATION
// ================================================================

// ----- Theme Toggle -----
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (toggleBtn) {
        toggleBtn.textContent = isDark ? '☀️' : '🌙';
    }
    localStorage.setItem('campusTheme', isDark ? 'dark' : 'light');
    showToast(`Switched to ${isDark ? 'Dark' : 'Light'} theme!`, 'info');
}

// ----- Announcements -----
function dismissAnnouncement() {
    const banner = document.getElementById('announceBar');
    if (banner) banner.style.display = 'none';
    localStorage.setItem('announcementDismissed', 'true');
    showToast('Announcement dismissed.', 'info');
}

// ----- Voice Search -----
let voiceRecognition = null;
function toggleVoiceSearch() {
    const btn = document.getElementById('micBtn');
    if (!btn) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        showToast('🎤 Speech recognition is not supported in this browser.', 'warning');
        return;
    }
    
    if (btn.classList.contains('listening')) {
        if (voiceRecognition) voiceRecognition.stop();
        return;
    }
    
    voiceRecognition = new SpeechRecognition();
    voiceRecognition.continuous = false;
    voiceRecognition.interimResults = false;
    voiceRecognition.lang = 'en-US';
    
    voiceRecognition.onstart = () => {
        btn.classList.add('listening');
        btn.textContent = '🛑';
        showToast('🎤 Listening for search keywords...', 'info');
    };
    
    voiceRecognition.onend = () => {
        btn.classList.remove('listening');
        btn.textContent = '🎤';
    };
    
    voiceRecognition.onerror = (e) => {
        console.error(e);
        btn.classList.remove('listening');
        btn.textContent = '🎤';
        showToast('🎤 Voice search error/no audio.', 'error');
    };
    
    voiceRecognition.onresult = (e) => {
        const result = e.results[0][0].transcript;
        const input = document.getElementById('homeSearch');
        if (input) {
            input.value = result;
            showToast(`🎤 Voice Search: "${result}"`, 'success');
            searchEvents();
        }
    };
    
    voiceRecognition.start();
}

// ----- Monthly Calendar Page -----
let calendarCurrentDate = new Date('2026-08-01'); // Focus on August 2026 default events

function changeCalendarMonth(offset) {
    calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + offset);
    renderCalendarGrid();
}

function renderCalendarGrid() {
    const label = document.getElementById('calendarMonthLabel');
    const grid = document.getElementById('calendarGridDays');
    if (!label || !grid) return;
    
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const year = calendarCurrentDate.getFullYear();
    const monthIndex = calendarCurrentDate.getMonth();
    label.textContent = `${MONTHS[monthIndex]} ${year}`;
    
    // Clear grid
    grid.innerHTML = '';
    
    // Get start day of the month
    const startDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    // Add empty placeholders
    for (let i = 0; i < startDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'cal-cell empty';
        grid.appendChild(emptyCell);
    }
    
    // Render day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const cell = document.createElement('div');
        cell.className = 'cal-cell';
        
        const numLabel = document.createElement('span');
        numLabel.className = 'cal-num';
        numLabel.textContent = day;
        cell.appendChild(numLabel);
        
        // Find matching events
        const padMonth = String(monthIndex + 1).padStart(2, '0');
        const padDay = String(day).padStart(2, '0');
        const dateStr = `${year}-${padMonth}-${padDay}`;
        
        const dayEvents = DB.events.filter(e => e.date === dateStr && e.status === 'approved');
        
        dayEvents.forEach(e => {
            const evEl = document.createElement('div');
            evEl.className = `cal-event ${e.category}`;
            evEl.textContent = e.name;
            evEl.title = `${e.name} (${e.time})`;
            evEl.onclick = (event) => {
                event.stopPropagation();
                showCalendarEventDetail(e);
            };
            cell.appendChild(evEl);
        });
        
        grid.appendChild(cell);
    }
}

function showCalendarEventDetail(event) {
    showToast(`📅 Event: "${event.name}" at ${event.venue} on ${event.date}`, 'success');
}

// ----- Club Management -----
function renderClubs() {
    const grid = document.getElementById('clubsGrid');
    if (!grid) return;
    
    if (!currentUser) {
        grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px 0;">Please login to join and view campus clubs.</p>';
        return;
    }
    
    const userRecord = DB.users.find(u => u.id === currentUser.id);
    userRecord.clubs = userRecord.clubs || [];
    
    const clubList = DB.clubs || [];
    if (clubList.length === 0) {
        grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;padding:40px 0;">No active clubs found. Contact an administrator to create one.</p>';
        return;
    }

    grid.innerHTML = clubList.map(club => {
        const isMember = userRecord.clubs.includes(club.id);
        const btnHtml = isMember 
            ? `<button class="btn small ghost" onclick="leaveClub(${club.id})">Leave Club</button>`
            : `<button class="btn small teal" onclick="joinClub(${club.id})">Join Club (+20 pts)</button>`;
            
        return `
            <div class="club-card">
                <span class="badge badge-${club.category === 'Technical' ? 'yellow' : club.category === 'Cultural' ? 'red' : club.category === 'Sports' ? 'green' : 'purple'}" style="font-size:10px; margin-bottom:10px;">${club.category}</span>
                <h3>${club.name}</h3>
                <p style="font-size:13.5px; color:var(--ink-70); margin:8px 0 16px;">${club.desc}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                    <span class="mono" style="font-size:11px; opacity:0.6;">👥 ${club.members + (isMember ? 1 : 0)} members</span>
                    ${btnHtml}
                </div>
            </div>
        `;
    }).join('');
}

function joinClub(clubId) {
    if (!currentUser) { showToast('⚠️ Please login first.', 'warning'); return; }
    if (currentUser.role !== 'student') { showToast('⚠️ Only students can join clubs.', 'warning'); return; }
    
    const userRecord = DB.users.find(u => u.id === currentUser.id);
    if (!userRecord) return;
    
    userRecord.clubs = userRecord.clubs || [];
    if (!userRecord.clubs.includes(clubId)) {
        userRecord.clubs.push(clubId);
        const club = DB.clubs.find(c => c.id === clubId);
        const clubName = club ? club.name : 'Club';
        
        awardPoints(currentUser.id, 20, `Joined club: ${clubName}`);
        showToast('Successfully joined the club! Earned 20 points!', 'success');
        saveData();
        renderClubs();
        renderAll();
    }
}

function leaveClub(clubId) {
    if (!currentUser) { showToast('⚠️ Please login first.', 'warning'); return; }
    if (currentUser.role !== 'student') { showToast('⚠️ Only students can leave clubs.', 'warning'); return; }
    
    const userRecord = DB.users.find(u => u.id === currentUser.id);
    if (!userRecord) return;
    
    userRecord.clubs = userRecord.clubs || [];
    const idx = userRecord.clubs.indexOf(clubId);
    if (idx !== -1) {
        userRecord.clubs.splice(idx, 1);
        showToast('Left the club.', 'info');
        saveData();
        renderClubs();
        renderAll();
    }
}

// ----- Gamification (Points & Badges) -----
function awardPoints(userId, amount, reason) {
    const user = DB.users.find(u => u.id === userId);
    if (!user) return;
    user.points = (user.points || 0) + amount;
    
    addNotification(`🏆 Earned +${amount} points: ${reason}`, 'success');
    saveData();
}

function getUserPoints(userId) {
    const user = DB.users.find(u => u.id === userId);
    return user ? (user.points || 0) : 0;
}

function getUserBadgeText(points) {
    if (points >= 200) return '🏆 Campus Leader';
    if (points >= 120) return '⚡ Active Contributor';
    if (points >= 50)  return '🔥 Event Enthusiast';
    return '🔰 Novice';
}

function renderLeaderboard() {
    const tbody = document.getElementById('leaderboardTableBody');
    if (!tbody) return;
    
    // Sort all students by points desc
    const students = DB.users
        .filter(u => u.role === 'student')
        .map(u => ({
            ...u,
            points: u.points || 0
        }))
        .sort((a, b) => b.points - a.points);
        
    tbody.innerHTML = students.map((s, index) => {
        const rank = index + 1;
        const badge = getUserBadgeText(s.points);
        const isMe = currentUser && s.id === currentUser.id;
        
        return `
            <tr class="${isMe ? 'lb-row me' : 'lb-row'}">
                <td><span class="lb-rank">${rank}</span></td>
                <td><strong>${s.name} ${isMe ? '(You)' : ''}</strong></td>
                <td>${s.department || '-'}</td>
                <td><span class="badge-chip">${badge}</span></td>
                <td><span class="lb-points" style="color:var(--teal); font-weight:700;">${s.points} pts</span></td>
            </tr>
        `;
    }).join('');
}

// ----- Student ID Card -----
function openIdCard() {
    if (!currentUser) return;
    const userRecord = DB.users.find(u => u.id === currentUser.id);
    if (!userRecord) return;
    
    const points = userRecord.points || 0;
    const badge = getUserBadgeText(points);
    
    document.getElementById('idCardName').textContent = userRecord.name;
    document.getElementById('idCardRegNo').textContent = userRecord.regNumber || '-';
    document.getElementById('idCardDept').textContent = userRecord.department || '-';
    document.getElementById('idCardYear').textContent = userRecord.year ? userRecord.year + 'rd Year' : '-';
    document.getElementById('idCardPoints').textContent = `${points} pts (${badge.split(' ')[1]})`;
    
    document.getElementById('idCardOverlay').classList.add('open');
    
    // Render dynamic QR canvas
    setTimeout(() => {
        drawIDCardQR(userRecord.regNumber || 'STUDENT');
    }, 50);
}

function closeIdCard() {
    document.getElementById('idCardOverlay').classList.remove('open');
}

function drawIDCardQR(text) {
    const canvas = document.getElementById('idCardQR');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    
    ctx.clearRect(0,0,size,size);
    
    // Draw outer frame
    ctx.strokeStyle = '#1B1B1F';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, size - 4, size - 4);
    
    // Draw QR Markers (top-left, top-right, bottom-left)
    ctx.fillStyle = '#1B1B1F';
    // Top-left
    ctx.fillRect(8, 8, 20, 20);
    ctx.clearRect(12, 12, 12, 12);
    ctx.fillRect(14, 14, 8, 8);
    
    // Top-right
    ctx.fillRect(size - 28, 8, 20, 20);
    ctx.clearRect(size - 24, 12, 12, 12);
    ctx.fillRect(size - 22, 14, 8, 8);
    
    // Bottom-left
    ctx.fillRect(8, size - 28, 20, 20);
    ctx.clearRect(12, size - 24, 12, 12);
    ctx.fillRect(14, size - 22, 8, 8);
    
    // Draw random barcode squares
    for (let x = 8; x < size - 8; x += 6) {
        for (let y = 8; y < size - 8; y += 6) {
            // Skip markers
            if (x < 32 && y < 32) continue;
            if (x > size - 32 && y < 32) continue;
            if (x < 32 && y > size - 32) continue;
            
            // Random boolean
            if (Math.random() > 0.5) {
                ctx.fillRect(x, y, 4, 4);
            }
        }
    }
}

// ----- Event Feedback Stars Rating -----
let currentFeedbackRating = 0;

function openFeedbackModal(regId) {
    const reg = DB.registrations.find(r => r.id === regId);
    if (!reg) return;
    const ev = getEvent(reg.eventId);
    if (!ev) return;
    
    document.getElementById('feedbackRegId').value = regId;
    document.getElementById('feedbackEventName').textContent = ev.name;
    document.getElementById('feedbackComment').value = '';
    setFeedbackRating(0);
    
    document.getElementById('feedbackOverlay').classList.add('open');
}

function closeFeedbackModal() {
    document.getElementById('feedbackOverlay').classList.remove('open');
}

function setFeedbackRating(rating) {
    currentFeedbackRating = rating;
    const stars = document.querySelectorAll('#feedbackStars span');
    stars.forEach((star, index) => {
        star.classList.toggle('filled', index < rating);
        star.style.color = index < rating ? 'var(--marigold)' : 'var(--ink-45)';
    });
}

function handleFeedbackSubmit(e) {
    e.preventDefault();
    const regId = parseInt(document.getElementById('feedbackRegId').value);
    const comment = document.getElementById('feedbackComment').value.trim();
    
    if (currentFeedbackRating === 0) {
        showToast('⚠️ Please select a star rating.', 'warning');
        return;
    }
    
    const reg = DB.registrations.find(r => r.id === regId);
    if (reg) {
        reg.rating = currentFeedbackRating;
        reg.feedbackComment = comment;
        // Award points
        awardPoints(currentUser.id, 15, `Submitted feedback for event`);
        showToast('Thank you for your feedback! Earned 15 points!', 'success');
        saveData();
        closeFeedbackModal();
        renderAll();
    }
}

// ----- Rule-Based CC Chatbot Assistant -----
function toggleChatPanel() {
    document.getElementById('chatPanel').classList.toggle('open');
    const chatBody = document.getElementById('chatBody');
    chatBody.scrollTop = chatBody.scrollHeight;
}

function handleChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const query = input.value.trim();
    if (!query) return;
    
    // Add User Bubble
    const body = document.getElementById('chatBody');
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = query;
    body.appendChild(userMsg);
    input.value = '';
    body.scrollTop = body.scrollHeight;
    
    // CC Bot Logic Reply after delay
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg bot';
        
        const norm = query.toLowerCase();
        let reply = '';
        if (norm.includes('hi') || norm.includes('hello') || norm.includes('help')) {
            reply = 'Hello! I am your CC Assistant. I can tell you about campus "events", "venues", "clubs", and how to earn leaderboard "points"!';
        } else if (norm.includes('event') || norm.includes('fest') || norm.includes('hackathon')) {
            const list = DB.events.filter(e => e.status === 'approved').map(e => `• ${e.name} (${e.date})`);
            reply = 'Here are our featured events:\n' + list.join('\n');
        } else if (norm.includes('club')) {
            reply = 'We have 4 active clubs: Coding Club, Cultural Society, Sports Board, and IEEE Branch. You can join them in the Clubs tab to earn +20 points!';
        } else if (norm.includes('points') || norm.includes('leaderboard')) {
            reply = 'Earn points: Event Register (+10 pts), Club Join (+20 pts), Admin Present Attendee (+50 pts), Event Feedback (+15 pts). View rankings under Dashboard > Leaderboard!';
        } else if (norm.includes('venue')) {
            reply = 'Common campus venues include the Innovation Hub, Open Air Theatre, Main Ground, and Seminar Hall 3.';
        } else {
            reply = "I'm not fully sure about that. Please browse our Events tab or email support at support@campusconnect.edu!";
        }
        
        botMsg.innerText = reply;
        body.appendChild(botMsg);
        body.scrollTop = body.scrollHeight;
    }, 400);
}
