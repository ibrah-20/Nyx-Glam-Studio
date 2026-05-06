const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || !window.location.hostname) 
    ? 'http://localhost:5000/api' 
    : `http://${window.location.hostname}:5000/api`;

document.addEventListener('DOMContentLoaded', () => {
    // Current Year for Footer
    document.getElementById('year').textContent = new Date().getFullYear();

    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = mobileBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.classList.remove('ph-list');
            icon.classList.add('ph-x');
        } else {
            icon.classList.remove('ph-x');
            icon.classList.add('ph-list');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            const icon = mobileBtn.querySelector('i');
            icon.classList.remove('ph-x');
            icon.classList.add('ph-list');
        });
    });

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    // Scroll Animation
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Initialize stars
    initStars();
    
    // API INTEGRATION - Booking Form
    initBookingForm();
});

function initStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;
    
    for (let i = 0; i < 70; i++) {
        const star = document.createElement('div');
        const size = Math.random() * 3 + 1;
        const duration = Math.random() * 3 + 2;
        
        star.style.position = 'absolute';
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.backgroundColor = Math.random() > 0.5 ? '#fff' : '#00f3ff';
        star.style.borderRadius = '50%';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.boxShadow = `0 0 ${size * 3}px rgba(255,255,255,0.9)`;
        
        star.animate([
            { opacity: Math.random() * 0.2, transform: 'scale(0.8)' },
            { opacity: Math.random() * 0.8 + 0.5, transform: 'scale(1.5)' },
            { opacity: Math.random() * 0.2, transform: 'scale(0.8)' }
        ], { duration: duration * 1000, iterations: Infinity, delay: Math.random() * 5000, easing: 'ease-in-out' });
        
        starsContainer.appendChild(star);
    }
}

// --- MASSIVE CATALOG & CART LOGIC ---
const CATALOG_DATA = [
    // HAIRCUT
    { id: 1, type: 'service', category: 'haircut', name: 'Basic Trim', duration: 15, price: 15 },
    { id: 2, type: 'service', category: 'haircut', name: 'Fade Cut', duration: 30, price: 25 },
    { id: 3, type: 'service', category: 'haircut', name: 'Taper Cut', duration: 30, price: 25 },
    { id: 4, type: 'service', category: 'haircut', name: 'Skin Fade (Bald Fade)', duration: 45, price: 30 },
    { id: 5, type: 'service', category: 'haircut', name: 'Crew Cut', duration: 20, price: 20 },
    { id: 6, type: 'service', category: 'haircut', name: 'Buzz Cut', duration: 15, price: 15 },
    { id: 7, type: 'service', category: 'haircut', name: 'Undercut', duration: 30, price: 25 },
    { id: 8, type: 'service', category: 'haircut', name: 'Mohawk Fade', duration: 45, price: 35 },
    { id: 9, type: 'service', category: 'haircut', name: 'Textured Crop', duration: 30, price: 28 },
    { id: 10, type: 'service', category: 'haircut', name: 'Line-Up / Edge Up', duration: 15, price: 10 },
    { id: 11, type: 'service', category: 'haircut', name: 'Design Haircut', duration: 45, price: 40 },
    
    // HAIRDRESSING
    { id: 12, type: 'service', category: 'hairdressing', name: 'Box Braids', duration: 180, price: 120 },
    { id: 13, type: 'service', category: 'hairdressing', name: 'Knotless Braids', duration: 240, price: 150 },
    { id: 14, type: 'service', category: 'hairdressing', name: 'Cornrows', duration: 90, price: 60 },
    { id: 15, type: 'service', category: 'hairdressing', name: 'Stitch Braids', duration: 120, price: 80 },
    { id: 16, type: 'service', category: 'hairdressing', name: 'Wash & Blow Dry', duration: 45, price: 35 },
    { id: 17, type: 'service', category: 'hairdressing', name: 'Silk Press', duration: 90, price: 65 },
    { id: 18, type: 'service', category: 'hairdressing', name: 'Deep Conditioning', duration: 30, price: 25 },
    { id: 19, type: 'service', category: 'hairdressing', name: 'Wig Installation', duration: 120, price: 100 },
    { id: 20, type: 'service', category: 'hairdressing', name: 'Hair Coloring', duration: 120, price: 150 },
    
    // NAILS
    { id: 21, type: 'service', category: 'nails', name: 'Basic Manicure', duration: 30, price: 20 },
    { id: 22, type: 'service', category: 'nails', name: 'Gel Manicure', duration: 45, price: 35 },
    { id: 23, type: 'service', category: 'nails', name: 'Acrylic Nails', duration: 90, price: 55 },
    { id: 24, type: 'service', category: 'nails', name: 'Nail Art Design', duration: 30, price: 15 },
    { id: 25, type: 'service', category: 'nails', name: 'Basic Pedicure', duration: 45, price: 30 },
    { id: 26, type: 'service', category: 'nails', name: 'Spa Pedicure', duration: 60, price: 50 },
    { id: 27, type: 'service', category: 'nails', name: 'Callus Removal', duration: 15, price: 10 },
    
    // SKIN CARE
    { id: 28, type: 'product', category: 'skincare', name: 'Garnier Face Wash', price: 12 },
    { id: 29, type: 'product', category: 'skincare', name: 'Micellar Water', price: 10 },
    { id: 30, type: 'product', category: 'skincare', name: 'Hydrating Moisturizer', price: 18 },
    { id: 31, type: 'product', category: 'skincare', name: 'Vitamin C Serum', price: 25 },
    { id: 32, type: 'product', category: 'skincare', name: 'Sunscreen SPF 50', price: 22 },
    
    // HAIR CARE
    { id: 33, type: 'product', category: 'haircare', name: 'Moisturizing Shampoo', price: 15 },
    { id: 34, type: 'product', category: 'haircare', name: 'Deep Conditioner', price: 18 },
    { id: 35, type: 'product', category: 'haircare', name: 'Argan Oil', price: 20 },
    { id: 36, type: 'product', category: 'haircare', name: 'Hair Growth Serum', price: 30 },
    
    // STYLING
    { id: 37, type: 'product', category: 'styling', name: 'Strong Hold Gel', price: 12 },
    { id: 38, type: 'product', category: 'styling', name: 'Edge Control', price: 10 },
    { id: 39, type: 'product', category: 'styling', name: 'Heat Protectant', price: 15 }
];

let cart = [];

async function initBookingForm() {
    const tabs = document.querySelectorAll('.tab-btn');
    const grid = document.getElementById('catalog-grid');
    const cartList = document.getElementById('cart-items');
    const totalPriceEl = document.getElementById('cart-total-price');
    const totalDurationEl = document.getElementById('cart-total-duration');
    const dateInput = document.getElementById('date');
    const timeSelect = document.getElementById('time');
    const submitBtn = document.getElementById('submit-booking-btn');
    const form = document.getElementById('booking-form');

    // Set min date
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);

    // Initialize Catalog
    function renderCatalog(category) {
        grid.innerHTML = '';
        const items = CATALOG_DATA.filter(item => item.category === category);
        
        items.forEach(item => {
            const isAdded = cart.some(cartItem => cartItem.id === item.id);
            const durationHtml = item.type === 'service' ? `<p><i class="ph ph-clock"></i> ${item.duration} mins</p>` : `<p><i class="ph ph-package"></i> Product</p>`;
            
            const card = document.createElement('div');
            card.className = 'catalog-item';
            card.innerHTML = `
                <div>
                    <h4>${item.name}</h4>
                    ${durationHtml}
                </div>
                <div class="item-footer">
                    <span class="item-price">$${item.price.toFixed(2)}</span>
                    <button class="add-btn ${isAdded ? 'added' : ''}" data-id="${item.id}" aria-label="Add item">
                        <i class="ph ${isAdded ? 'ph-check' : 'ph-plus'}"></i>
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });

        // Attach events to buttons
        document.querySelectorAll('.add-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.getAttribute('data-id');
                toggleCartItem(id);
                renderCatalog(category); // re-render to update button state
            });
        });
    }

    // Tab Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderCatalog(tab.getAttribute('data-category'));
        });
    });

    // Cart Logic
    function toggleCartItem(id) {
        id = Number(id); // Ensure id is an integer to match CATALOG_DATA
        const index = cart.findIndex(item => item.id === id);
        if (index > -1) {
            cart.splice(index, 1);
        } else {
            const item = CATALOG_DATA.find(i => i.id === id);
            
            if (!item) return; // safety check

            // Limit: Only 1 service per category
            if (item.type === 'service') {
                if (item.category === 'haircut' || item.category === 'hairdressing') {
                    // Haircut and Hairdressing are mutually exclusive
                    const existingIndex = cart.findIndex(cartItem => cartItem.category === 'haircut' || cartItem.category === 'hairdressing');
                    if (existingIndex > -1) cart.splice(existingIndex, 1);
                } else {
                    const existingIndex = cart.findIndex(cartItem => cartItem.category === item.category);
                    if (existingIndex > -1) cart.splice(existingIndex, 1);
                }
            }
            
            cart.push(item);
        }
        updateCartUI();
        if (dateInput.value) fetchAvailability(dateInput.value); // Re-fetch slots if cart duration changes
    }

    window.removeCartItem = function(id) {
        toggleCartItem(id);
        const activeTab = document.querySelector('.tab-btn.active');
        if(activeTab) renderCatalog(activeTab.getAttribute('data-category'));
    };

    function updateCartUI() {
        cartList.innerHTML = '';
        let total = 0;
        let duration = 0;

        cart.forEach(item => {
            total += item.price;
            if (item.type === 'service') duration += item.duration;

            const li = document.createElement('li');
            li.className = 'cart-item';
            li.innerHTML = `
                <span>${item.name}</span>
                <div>
                    <strong>$${item.price.toFixed(2)}</strong>
                    <button type="button" class="remove-btn" onclick="removeCartItem('${item.id}')"><i class="ph ph-x"></i></button>
                </div>
            `;
            cartList.appendChild(li);
        });

        if (cart.length === 0) {
            cartList.innerHTML = '<li class="empty-cart">Cart is empty. Please select services above.</li>';
        }

        totalPriceEl.textContent = `$${total.toFixed(2)}`;
        totalDurationEl.textContent = `${duration} mins`;
        
        // Validation check for button state
        const checkFormValidity = () => {
            const hasServices = cart.length > 0;
            const hasDate = dateInput.value !== '';
            const hasTime = timeSelect.value !== '' && timeSelect.value !== 'Loading slots...' && !timeSelect.disabled;
            submitBtn.disabled = !(hasServices && hasDate && hasTime);
        };

        // Disable time select if cart has no duration (e.g. only products)
        if (duration === 0 && cart.length > 0) {
            timeSelect.innerHTML = '<option value="00:00" selected>Any Time (Pickup)</option>';
            timeSelect.disabled = false;
        } else if (!dateInput.value) {
            timeSelect.innerHTML = '<option value="" disabled selected>Select date first</option>';
            timeSelect.disabled = true;
        }

        checkFormValidity();
        
        // Add listeners for other inputs to re-check validity
        dateInput.onchange = () => { fetchAvailability(dateInput.value); checkFormValidity(); };
        timeSelect.onchange = checkFormValidity;
        document.getElementById('name').oninput = checkFormValidity;
        document.getElementById('phone').oninput = checkFormValidity;
    }

    // Initial render
    renderCatalog('haircut');
    updateCartUI();

    // Availability Logic
    async function fetchAvailability(date) {
        const totalDuration = cart.reduce((sum, item) => sum + (item.duration || 0), 0);
        if (totalDuration === 0) {
            timeSelect.innerHTML = '<option value="00:00" selected>Any Time (Pickup)</option>';
            timeSelect.disabled = false;
            return;
        }

        timeSelect.innerHTML = '<option value="" disabled selected>Loading slots...</option>';
        timeSelect.disabled = true;

        try {
            const res = await fetch(`${API_BASE}/bookings/availability?date=${date}`);
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to fetch availability');

            timeSelect.innerHTML = '<option value="" disabled selected>Select a time</option>';
            data.slots.forEach(slot => {
                const opt = document.createElement('option');
                opt.value = slot.time;
                opt.textContent = slot.time + (slot.available ? '' : ' (Booked)');
                opt.disabled = !slot.available;
                timeSelect.appendChild(opt);
            });
            timeSelect.disabled = false;
        } catch (err) {
            console.error('Availability Error:', err);
            timeSelect.innerHTML = '<option value="" disabled selected>Error loading slots</option>';
        }
    }

    dateInput.addEventListener('change', (e) => fetchAvailability(e.target.value));

    // Form Submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert('Your cart is empty!');

        const phoneVal = document.getElementById('phone').value.trim();
        if (!/^\+254\d{9}$/.test(phoneVal)) {
            showMessage(form, 'Invalid phone number format. Must start with +254 and be 13 characters long.', 'error');
            return;
        }

        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Processing...';
        submitBtn.disabled = true;

        const oldMsg = document.querySelector('.form-success, .form-error');
        if(oldMsg) oldMsg.remove();

        const payload = {
            customer_name: document.getElementById('name').value.trim(),
            phone: phoneVal,
            service_id: cart[0].id, // Send primary service id
            booking_date: dateInput.value,
            start_time: timeSelect.value,
            location: document.getElementById('location').value,
            payment_method: document.getElementById('payment-method').value
        };

        try {
            const res = await fetch(`${API_BASE}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to book');

            form.reset();
            cart = [];
            updateCartUI();
            const activeTab = document.querySelector('.tab-btn.active');
            if(activeTab) renderCatalog(activeTab.getAttribute('data-category'));
            
            const locName = document.getElementById('location').options[document.getElementById('location').selectedIndex].text;
            const payMethod = payload.payment_method;
            
            let confirmationMsg = `Thank you! Your appointment at ${locName} has been booked!`;
            
            if (payMethod === 'mpesa') {
                confirmationMsg += ` <br><strong>Please check your phone for the M-Pesa STK Push prompt to complete payment.</strong>`;
            } else if (payMethod === 'crypto') {
                confirmationMsg += ` <br><strong>Please send payment to our wallet: <br><code style="background: rgba(255,255,255,0.1); padding: 5px; border-radius: 4px; display: block; margin-top: 5px;">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code></strong>`;
            } else {
                confirmationMsg += ` <br>Payment Method: Pay at Shop (Cash).`;
            }
            
            showMessage(form, confirmationMsg, 'success');
        } catch (err) {
            showMessage(form, err.message, 'error');
        } finally {
            submitBtn.innerHTML = originalBtnHtml;
            submitBtn.disabled = false;
        }
    });
}

function showMessage(form, text, type) {
    const msg = document.createElement('div');
    msg.className = type === 'success' ? 'form-success' : 'form-error';
    msg.innerHTML = `<i class="ph-fill ${type === 'success' ? 'ph-check-circle' : 'ph-x-circle'}"></i><p>${text}</p>`;
    form.appendChild(msg);
    if(type === 'success') {
        setTimeout(() => msg.remove(), 6000);
    }
}
