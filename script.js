const ADMIN_CREDENTIALS = {
    username: "23ee028",
    password: "23ee028mahboob"
};
let bookings = JSON.parse(localStorage.getItem('bookings')) || [];
let lastViewedBookingsCount = 0;
const totalSlots = 50;

const slotAllocation = {
    Car: { range: [1, 25], label: 'car' },
    Bike: { range: [26, 45], label: 'bike' },
    VIP: { range: [46, 50], label: 'vip' },
    Priority: { range: [1, 5], label: 'priority' }
};

// Simulated employee database (replace with backend API in production)
const employees = [
    { barcode: 'EMP123', employeeId: 'EMP123', name: 'John Doe', vehicleType: 'Car', phone: '123-456-7890', vehicleNumber: 'ABC123' },
    { barcode: 'EMP456', employeeId: 'EMP456', name: 'Jane Smith', vehicleType: 'Bike', phone: '987-654-3210', vehicleNumber: 'XYZ789' }
    // Add more employees as needed
];

const elements = {
    loginModal: document.getElementById('login-modal'),
    dashboard: document.getElementById('dashboard'),
    loginForm: document.getElementById('login-form'),
    logoutBtn: document.getElementById('logout-btn'),
    parkingGrid: document.getElementById('parking-grid'),
    slotNumber: document.getElementById('slot-number'),
    bookingForm: document.getElementById('booking-form'),
    historyTable: document.getElementById('history-table'),
    exportExcel: document.getElementById('export-excel'),
    exportPdf: document.getElementById('export-pdf'),
    clock: document.getElementById('clock'),
    slotStats: document.getElementById('slot-stats'),
    totalSlotsDisplay: document.getElementById('total-slots'),
    bookedSlotsDisplay: document.getElementById('booked-slots'),
    availableSlotsDisplay: document.getElementById('available-slots'),
    todayBookingsDisplay: document.getElementById('today-bookings'),
    bookingBadge: document.getElementById('booking-badge'),
    searchInput: document.getElementById('search-input'),
    startDate: document.getElementById('start-date'),
    endDate: document.getElementById('end-date'),
    profileUsername: document.getElementById('profile-username'),
    changePasswordForm: document.getElementById('change-password-form'),
    currentPassword: document.getElementById('current-password'),
    newPassword: document.getElementById('new-password'),
    confirmPassword: document.getElementById('confirm-password'),
    passwordError: document.getElementById('password-error'),
    profilePic: document.getElementById('profile-pic'),
    profilePicUpload: document.getElementById('profile-pic-upload'),
    uploadPicBtn: document.getElementById('upload-pic-btn'),
    vehicleType: document.getElementById('vehicle-type'),
    // Barcode Scanner Elements
    scanBarcodeBtn: document.getElementById('scan-barcode-btn'),
    barcodeScannerContainer: document.getElementById('barcode-scanner-container'),
    barcodeVideo: document.getElementById('barcode-video'),
    stopScanningBtn: document.getElementById('stop-scanning-btn')
};

let mediaStream = null;

// Login
elements.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        elements.loginModal.style.display = 'none';
        elements.dashboard.classList.remove('hidden');
        initializeDashboard();
    } else {
        document.getElementById('login-error').textContent = 'Invalid Username or Password!';
    }
});

elements.logoutBtn.addEventListener('click', () => {
    elements.dashboard.classList.add('hidden');
    elements.loginModal.style.display = 'flex';
    document.getElementById('admin-username').value = '';
    document.getElementById('admin-password').value = '';
});

// Dashboard Initialization
function initializeDashboard() {
    generateSlots();
    populateSlotDropdown();
    setupNavigation();
    updateClock();
    updateStats();
    setInterval(updateClock, 1000);

    // Password change form submission
    elements.changePasswordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentPassword = elements.currentPassword.value;
        const newPassword = elements.newPassword.value;
        const confirmPassword = elements.confirmPassword.value;

        if (currentPassword !== ADMIN_CREDENTIALS.password) {
            elements.passwordError.textContent = 'Current password is incorrect!';
            return;
        }
        if (newPassword !== confirmPassword) {
            elements.passwordError.textContent = 'New passwords do not match!';
            return;
        }
        if (newPassword.length < 8) {
            elements.passwordError.textContent = 'New password must be at least 8 characters long!';
            return;
        }

        ADMIN_CREDENTIALS.password = newPassword;
        elements.passwordError.textContent = 'Password updated successfully!';
        elements.passwordError.style.color = '#28a745';
        e.target.reset();
    });

    // Profile picture upload
    elements.uploadPicBtn.addEventListener('click', () => {
        const file = elements.profilePicUpload.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageData = e.target.result;
                elements.profilePic.src = imageData;
                elements.profilePic.classList.remove('hidden');
                localStorage.setItem('adminProfilePic', imageData);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image to upload.');
        }
    });
}

function generateSlots() {
    elements.parkingGrid.innerHTML = '';
    for (let i = 1; i <= totalSlots; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.slot = i;

        let slotType = '';
        if (i >= slotAllocation.Car.range[0] && i <= slotAllocation.Car.range[1]) slotType = 'car';
        if (i >= slotAllocation.Bike.range[0] && i <= slotAllocation.Bike.range[1]) slotType = 'bike';
        if (i >= slotAllocation.VIP.range[0] && i <= slotAllocation.VIP.range[1]) slotType = 'vip';
        const isPriority = i >= slotAllocation.Priority.range[0] && i <= slotAllocation.Priority.range[1];

        slot.classList.add(slotType);
        if (isPriority) slot.classList.add('priority');

        const booking = bookings.find(b => b.slotNumber === i);
        if (booking) {
            slot.classList.add('booked');
            slot.innerHTML = `
                ${i}
                <span class="tooltip">Booked by ${booking.user.name} (${booking.vehicleType})</span>
                <button class="clear-slot-btn" data-slot="${i}">Clear</button>
            `;
        } else {
            slot.innerHTML = `
                ${i}
                <span class="tooltip">${isPriority ? 'Priority Slot' : slotType.charAt(0).toUpperCase() + slotType.slice(1)}</span>
            `;
        }

        slot.addEventListener('click', () => !slot.classList.contains('booked') && alert(`Slot ${i} selected`));
        elements.parkingGrid.appendChild(slot);
    }

    document.querySelectorAll('.clear-slot-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const slotNumber = parseInt(btn.dataset.slot);
            if (confirm(`Are you sure you want to clear slot ${slotNumber}?`)) {
                bookings = bookings.filter(b => b.slotNumber !== slotNumber);
                localStorage.setItem('bookings', JSON.stringify(bookings));
                updateUI();
            }
        });
    });
}

function populateSlotDropdown() {
    const vehicleType = elements.vehicleType.value;
    elements.slotNumber.innerHTML = '<option value="" disabled selected>Select Slot</option>';

    if (!vehicleType) return;

    const { range } = slotAllocation[vehicleType];
    for (let i = range[0]; i <= range[1]; i++) {
        if (vehicleType === 'Priority' && (i < slotAllocation.Priority.range[0] || i > slotAllocation.Priority.range[1])) continue;
        if (vehicleType !== 'Priority' && i >= slotAllocation.Priority.range[0] && i <= slotAllocation.Priority.range[1]) continue;

        if (!bookings.some(b => b.slotNumber === i)) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Slot ${i}`;
            elements.slotNumber.appendChild(option);
        }
    }
}

// Booking
elements.bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const vehicleType = elements.vehicleType.value;
    if (!vehicleType) {
        alert('Please select a vehicle type!');
        return;
    }

    const slotNumber = parseInt(elements.slotNumber.value);
    const isPrioritySlot = slotNumber >= slotAllocation.Priority.range[0] && slotNumber <= slotAllocation.Priority.range[1];
    if (isPrioritySlot && vehicleType !== 'Priority') {
        alert('This slot is reserved for Priority (Disabled/Emergency) vehicles only!');
        return;
    }
    if (vehicleType === 'Priority' && !isPrioritySlot) {
        alert('Priority vehicles can only be booked in priority slots (1-5)!');
        return;
    }

    const booking = {
        slotNumber,
        vehicleType,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        user: {
            name: document.getElementById('user-name').value,
            phone: document.getElementById('user-phone').value,
            vehicle: document.getElementById('vehicle-number').value
        }
    };
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    updateUI();
    alert(`Slot Number ${booking.slotNumber} has been Booked`);
    e.target.reset();
});

elements.vehicleType.addEventListener('change', populateSlotDropdown);

// Navigation
function setupNavigation() {
    document.querySelectorAll('.sidebar nav li[data-section]').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.sidebar nav li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            document.querySelectorAll('.content-section:not(#overview-section)').forEach(section => section.classList.add('hidden'));
            document.getElementById(`${item.dataset.section}-section`).classList.remove('hidden');
            if (item.dataset.section === 'reports') {
                updateHistory();
                elements.searchInput.addEventListener('input', updateHistory);
                elements.startDate.addEventListener('change', updateHistory);
                elements.endDate.addEventListener('change', updateHistory);
            }
            if (item.dataset.section === 'bookings') {
                lastViewedBookingsCount = bookings.length;
                updateBookingBadge();
            }
            if (item.dataset.section === 'profile') {
                elements.profileUsername.textContent = ADMIN_CREDENTIALS.username;
                const savedPic = localStorage.getElementById('adminProfilePic');
                if (savedPic) {
                    elements.profilePic.src = savedPic;
                    elements.profilePic.classList.remove('hidden');
                }
            }
        });
    });
}

// Reports
function updateHistory() {
    const tbody = document.getElementById('history-table-body');
    const searchTerm = elements.searchInput.value.toLowerCase();
    const startDate = elements.startDate.value ? new Date(elements.startDate.value) : null;
    const endDate = elements.endDate.value ? new Date(elements.endDate.value) : null;

    let filteredBookings = [...bookings];
    if (searchTerm) {
        filteredBookings = filteredBookings.filter(b =>
            b.user.name.toLowerCase().includes(searchTerm) ||
            b.user.vehicle.toLowerCase().includes(searchTerm) ||
            b.user.phone.toLowerCase().includes(searchTerm)
        );
    }
    if (startDate || endDate) {
        filteredBookings = filteredBookings.filter(b => {
            const bookingDate = new Date(b.date.split('/').reverse().join('-'));
            if (startDate && bookingDate < startDate) return false;
            if (endDate && bookingDate > endDate) return false;
            return true;
        });
    }

    const sortedBookings = filteredBookings.sort((a, b) => a.slotNumber - b.slotNumber);
    tbody.innerHTML = sortedBookings.map(b => `
        <tr>
            <td>${b.slotNumber}</td>
            <td>${b.user.name}</td>
            <td>${b.user.vehicle}</td>
            <td>${b.user.phone}</td>
            <td>${b.date}</td>
            <td>${b.time}</td>
            <td>${b.vehicleType}</td>
        </tr>
    `).join('');
}

elements.exportExcel.addEventListener('click', () => {
    if (!bookings.length) return alert('No data to export!');
    const data = bookings.map(b => ({
        Slot: b.slotNumber,
        Date: b.date,
        Time: b.time,
        Name: b.user.name,
        Vehicle: b.user.vehicle,
        Phone: b.user.phone,
        VehicleType: b.vehicleType
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bookings');
    XLSX.writeFile(wb, 'parking_bookings.xlsx');
});

elements.exportPdf.addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text('Parking System Report', 10, 10);
    bookings.forEach((b, i) => {
        doc.text(`Slot ${b.slotNumber}: ${b.user.name} (${b.user.vehicle}, ${b.vehicleType}) - ${b.date} ${b.time}`, 10, 20 + (i * 10));
    });
    doc.save('parking_report.pdf');
});

// Utilities
function updateClock() {
    elements.clock.textContent = new Date().toLocaleString();
}

function updateStats() {
    const today = new Date().toLocaleDateString();
    const todayBookings = bookings.filter(b => b.date === today).length;

    elements.slotStats.textContent = `Booked: ${bookings.length}/${totalSlots}`;
    elements.totalSlotsDisplay.textContent = totalSlots;
    elements.bookedSlotsDisplay.textContent = bookings.length;
    elements.availableSlotsDisplay.textContent = totalSlots - bookings.length;
    elements.todayBookingsDisplay.textContent = todayBookings;
}

function updateBookingBadge() {
    const newBookings = bookings.length - lastViewedBookingsCount;
    if (newBookings > 0) {
        elements.bookingBadge.textContent = newBookings;
        elements.bookingBadge.classList.remove('hidden');
    } else {
        elements.bookingBadge.classList.add('hidden');
    }
}

function updateUI() {
    generateSlots();
    populateSlotDropdown();
    updateStats();
    updateBookingBadge();
    localStorage.setItem('bookings', JSON.stringify(bookings));
}

function findAvailableSlot(vehicleType) {
    const { range } = slotAllocation[vehicleType];
    for (let i = range[0]; i <= range[1]; i++) {
        if (vehicleType === 'Priority' && (i < slotAllocation.Priority.range[0] || i > slotAllocation.Priority.range[1])) continue;
        if (vehicleType !== 'Priority' && i >= slotAllocation.Priority.range[0] && i <= slotAllocation.Priority.range[1]) continue;

        if (!bookings.some(b => b.slotNumber === i)) {
            return i;
        }
    }
    return null;
}

// Barcode Scanning
const startBarcodeScanning = async () => {
    if (!('BarcodeDetector' in window)) {
        alert('Barcode Detection API is not supported in this browser. Please use Chrome or Edge.');
        return;
    }

    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        elements.barcodeVideo.srcObject = mediaStream;
        elements.barcodeScannerContainer.classList.remove('hidden');
        elements.scanBarcodeBtn.classList.add('hidden');

        const barcodeDetector = new BarcodeDetector({ formats: ['code_39', 'ean_13', 'qr_code'] });

        const scan = async () => {
            try {
                const barcodes = await barcodeDetector.detect(elements.barcodeVideo);
                if (barcodes.length > 0) {
                    const barcodeValue = barcodes[0].rawValue;
                    stopBarcodeScanning();
                    handleScannedBarcode(barcodeValue);
                } else {
                    requestAnimationFrame(scan);
                }
            } catch (err) {
                console.error('Error detecting barcode:', err);
                stopBarcodeScanning();
                alert('Error detecting barcode. Please try again.');
            }
        };
        requestAnimationFrame(scan);
    } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Error accessing camera. Please ensure camera permissions are granted.');
    }
};

const stopBarcodeScanning = () => {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    elements.barcodeVideo.srcObject = null;
    elements.barcodeScannerContainer.classList.add('hidden');
    elements.scanBarcodeBtn.classList.remove('hidden');
};

const handleScannedBarcode = (barcodeValue) => {
    // Find the employee based on the scanned barcode
    const employee = employees.find(e => e.barcode === barcodeValue);
    if (!employee) {
        alert('Employee not found! Please ensure the barcode matches a registered employee.');
        return;
    }

    // Automatically book a slot
    const slotNumber = findAvailableSlot(employee.vehicleType);
    if (!slotNumber) {
        alert(`No available slots for ${employee.vehicleType} vehicles!`);
        return;
    }

    const now = new Date();
    const booking = {
        slotNumber,
        vehicleType: employee.vehicleType,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
        user: {
            name: employee.name,
            phone: employee.phone,
            vehicle: employee.vehicleNumber
        }
    };
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    updateUI();
    alert(`Slot ${booking.slotNumber} booked for ${employee.name} (${employee.vehicleType})`);
};

// Event Listeners
elements.scanBarcodeBtn.addEventListener('click', startBarcodeScanning);
elements.stopScanningBtn.addEventListener('click', stopBarcodeScanning);

elements.loginModal.style.display = 'flex';