// Driver App JavaScript
class DriverApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.socket = null;
        this.driverData = null;
        this.currentOrder = null;
        this.isOnline = false;
        
        this.init();
    }

    init() {
        // Wait for Telegram Web App to be ready
        if (window.Telegram && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.tg.ready();
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
            console.log('Telegram Web App initialized');
            console.log('Available Telegram methods:', Object.keys(this.tg));
        } else {
            console.warn('Telegram Web App not available');
        }

        this.setupEventListeners();
        this.loadDriverData();
        this.initializeSocketConnection();
    }

    setupEventListeners() {
        // File upload previews
        document.getElementById('govIdFront').addEventListener('change', (e) => {
            this.handleFilePreview(e, 'govIdFrontPreview');
        });

        document.getElementById('govIdBack').addEventListener('change', (e) => {
            this.handleFilePreview(e, 'govIdBackPreview');
        });
    }

    handleFilePreview(event, previewId) {
        const file = event.target.files[0];
        const preview = document.getElementById(previewId);
        const uploadArea = event.target.closest('.file-upload');

        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
                uploadArea.classList.add('has-file');
            };
            reader.readAsDataURL(file);
        }
    }

    async loadDriverData() {
        try {
            // Get Telegram user data
            const initData = this.tg?.initDataUnsafe;
            
            if (initData?.user) {
                const { first_name, last_name, username, id } = initData.user;
                const fullName = `${first_name} ${last_name || ''}`.trim();
                
                // Store Telegram user data for registration
                this.telegramUser = {
                    id: id.toString(),
                    first_name,
                    last_name,
                    username,
                    fullName
                };
                
                // Pre-fill registration form
                this.autofillRegistrationForm();
                
                // Check if driver exists
                const response = await fetch(`/api/drivers/telegram/${id}`);
                
                if (response.ok) {
                    this.driverData = await response.json();
                    this.showDashboard();
                } else if (response.status === 404) {
                    this.showRegistrationForm();
                } else {
                    console.error('Error loading driver data:', response.status);
                    this.showRegistrationForm();
                }
            } else {
                console.warn('No Telegram user data available');
                this.showRegistrationForm();
            }
        } catch (error) {
            console.error('Error loading driver data:', error);
            this.showRegistrationForm();
        }
    }

    autofillRegistrationForm() {
        // Fill name from Telegram profile
        if (this.telegramUser?.fullName) {
            const nameField = document.getElementById('driverName');
            if (nameField) {
                nameField.value = this.telegramUser.fullName;
                nameField.style.backgroundColor = '#f0f9f4';
                nameField.placeholder = 'Name loaded from Telegram';
            }
        }

        // Add Telegram ID info display for user confirmation
        if (this.telegramUser?.id) {
            const telegramInfo = document.createElement('div');
            telegramInfo.style.cssText = 'background: #e6f3ff; padding: 8px; margin: 8px 0; border-radius: 4px; font-size: 12px; color: #0066cc; border: 1px solid #b3d9ff;';
            telegramInfo.innerHTML = `📱 Telegram ID: ${this.telegramUser.id} ${this.telegramUser.username ? `(@${this.telegramUser.username})` : ''}`;
            
            const nameField = document.getElementById('driverName');
            if (nameField && nameField.parentNode && !document.querySelector('[data-telegram-info]')) {
                telegramInfo.setAttribute('data-telegram-info', 'true');
                nameField.parentNode.insertBefore(telegramInfo, nameField.nextSibling);
            }
        }

        // Setup enhanced phone number request functionality
        this.setupPhoneNumberRequest();
    }

    setupPhoneNumberRequest() {
        const phoneField = document.getElementById('driverPhone');
        if (phoneField) {
            phoneField.placeholder = 'Tap to share your contact';
            phoneField.style.cursor = 'pointer';
            phoneField.readOnly = true;
            
            const requestContact = () => {
                console.log('Contact request initiated');
                
                // Try multiple Telegram contact sharing methods
                if (window.Telegram && window.Telegram.WebApp && typeof window.Telegram.WebApp.requestContact === 'function') {
                    console.log('Using Telegram WebApp.requestContact method');
                    try {
                        window.Telegram.WebApp.requestContact((contact) => {
                            console.log('Contact callback received:', contact);
                            if (contact && contact.phone_number) {
                                phoneField.value = contact.phone_number;
                                phoneField.placeholder = 'Phone number from Telegram';
                                phoneField.style.backgroundColor = '#f0f9f4';
                                phoneField.readOnly = false;
                                console.log('Contact successfully populated:', contact.phone_number);
                            } else {
                                console.log('No contact data received');
                                this.fallbackToManualEntry(phoneField);
                            }
                        });
                    } catch (error) {
                        console.error('Error requesting contact:', error);
                        this.fallbackToManualEntry(phoneField);
                    }
                } else if (this.tg && typeof this.tg.requestContact === 'function') {
                    console.log('Using alternative Telegram requestContact method');
                    try {
                        this.tg.requestContact((contact) => {
                            console.log('Alternative contact callback received:', contact);
                            if (contact && contact.phone_number) {
                                phoneField.value = contact.phone_number;
                                phoneField.placeholder = 'Phone number from Telegram';
                                phoneField.style.backgroundColor = '#f0f9f4';
                                phoneField.readOnly = false;
                            } else {
                                this.fallbackToManualEntry(phoneField);
                            }
                        });
                    } catch (error) {
                        console.error('Error with alternative requestContact:', error);
                        this.fallbackToManualEntry(phoneField);
                    }
                } else {
                    console.log('No contact request methods available, using fallback');
                    this.fallbackToManualEntry(phoneField);
                }
            };
            
            phoneField.addEventListener('click', requestContact);
            phoneField.addEventListener('focus', requestContact);
        }
    }

    fallbackToManualEntry(phoneField) {
        console.log('Falling back to manual entry');
        phoneField.readOnly = false;
        phoneField.placeholder = 'Enter your phone number manually';
        phoneField.style.backgroundColor = '#fff3cd';
        phoneField.style.cursor = 'text';
        phoneField.focus();
        
        // Show a message to the user (avoid duplicates)
        if (!phoneField.parentNode.querySelector('[data-fallback-message]')) {
            const messageDiv = document.createElement('div');
            messageDiv.style.cssText = 'background: #fff3cd; padding: 8px; margin: 8px 0; border-radius: 4px; font-size: 12px; color: #856404;';
            messageDiv.textContent = 'Contact sharing not available. Please enter your phone number manually.';
            messageDiv.setAttribute('data-fallback-message', 'true');
            phoneField.parentNode.insertBefore(messageDiv, phoneField.nextSibling);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 5000);
        }
    }

    showRegistrationForm() {
        document.getElementById('registrationForm').classList.remove('hidden');
        document.getElementById('pendingApproval').classList.add('hidden');
        document.getElementById('driverDashboard').classList.add('hidden');

        // Ensure form is autofilled when shown
        this.autofillRegistrationForm();
    }

    showPendingApproval() {
        document.getElementById('registrationForm').classList.add('hidden');
        document.getElementById('pendingApproval').classList.remove('hidden');
        document.getElementById('driverDashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('registrationForm').classList.add('hidden');
        document.getElementById('pendingApproval').classList.add('hidden');
        document.getElementById('driverDashboard').classList.remove('hidden');

        if (this.driverData) {
            if (this.driverData.status === 'pending_approval') {
                this.showPendingApproval();
                return;
            }

            this.updateDashboardData();
            this.loadAvailableOrders();
            this.loadDeliveryHistory();

            // Show location prompt if not shared
            if (!this.driverData.currentLocation) {
                document.getElementById('locationPrompt').classList.remove('hidden');
            }
        }
    }

    updateDashboardData() {
        if (!this.driverData) return;

        // Update status
        this.isOnline = this.driverData.isOnline;
        document.getElementById('onlineToggle').checked = this.isOnline;
        this.updateStatusIndicator();

        // Update earnings
        document.getElementById('todayEarnings').textContent = `$${this.driverData.todayEarnings || '0.00'}`;
        document.getElementById('weeklyEarnings').textContent = `$${this.driverData.weeklyEarnings || '0.00'}`;
        document.getElementById('totalEarnings').textContent = `$${this.driverData.totalEarnings || '0.00'}`;
        document.getElementById('totalDeliveries').textContent = this.driverData.totalDeliveries || '0';
        document.getElementById('driverRating').textContent = this.driverData.rating || '0.0';
    }

    updateStatusIndicator() {
        const indicator = document.getElementById('statusIndicator');
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');

        if (this.isOnline) {
            indicator.classList.add('online');
            indicator.classList.remove('offline');
            dot.classList.add('online');
            dot.classList.remove('offline');
            text.textContent = 'Online - Ready for Orders';
        } else {
            indicator.classList.add('offline');
            indicator.classList.remove('online');
            dot.classList.add('offline');
            dot.classList.remove('online');
            text.textContent = 'Offline';
        }
    }

    async submitRegistration() {
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            if (!this.telegramUser) {
                throw new Error('Telegram user data not available');
            }

            // Validate required fields
            const driverName = document.getElementById('driverName').value.trim();
            const driverPhone = document.getElementById('driverPhone').value.trim();
            
            if (!driverName) {
                throw new Error('Full name is required');
            }
            
            if (!driverPhone) {
                throw new Error('Phone number is required');
            }

            if (!this.telegramUser.id) {
                throw new Error('Telegram ID is required');
            }

            const formData = new FormData();
            formData.append('telegramId', this.telegramUser.id);
            formData.append('name', driverName);
            formData.append('phoneNumber', driverPhone);

            const govIdFront = document.getElementById('govIdFront').files[0];
            const govIdBack = document.getElementById('govIdBack').files[0];

            let response;
            
            // If files are provided, use the multipart endpoint
            if (govIdFront && govIdBack) {
                formData.append('governmentIdFront', govIdFront);
                formData.append('governmentIdBack', govIdBack);

                response = await fetch('/api/drivers/register', {
                    method: 'POST',
                    body: formData
                });
            } else {
                // Use basic registration endpoint for JSON data
                response = await fetch('/api/drivers/register-basic', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        telegramId: this.telegramUser.id,
                        name: driverName,
                        phoneNumber: driverPhone
                    })
                });
            }

            const data = await response.json();

            if (response.ok) {
                this.driverData = data.driver;
                this.showPendingApproval();
                
                if (this.tg) {
                    this.tg.showAlert('Registration submitted successfully! You will be notified once approved.');
                }
            } else {
                throw new Error(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (this.tg) {
                this.tg.showAlert(error.message);
            } else {
                alert(error.message);
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Registration';
        }
    }

    async toggleOnlineStatus() {
        const isChecked = document.getElementById('onlineToggle').checked;
        
        try {
            const response = await fetch(`/api/drivers/${this.driverData.id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ isOnline: isChecked })
            });

            if (response.ok) {
                this.isOnline = isChecked;
                this.updateStatusIndicator();
                
                if (isChecked && !this.driverData.currentLocation) {
                    document.getElementById('locationPrompt').classList.remove('hidden');
                }
            } else {
                // Revert toggle if request failed
                document.getElementById('onlineToggle').checked = !isChecked;
                throw new Error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            if (this.tg) {
                this.tg.showAlert('Failed to update status');
            }
        }
    }

    async requestLocation() {
        if (this.tg) {
            this.tg.requestLocation((location) => {
                if (location) {
                    this.updateLocation(location.latitude, location.longitude);
                }
            });
        } else {
            // Fallback for web browser
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.updateLocation(position.coords.latitude, position.coords.longitude);
                    },
                    (error) => {
                        console.error('Location error:', error);
                        alert('Please enable location access to receive orders');
                    }
                );
            }
        }
    }

    requestLiveLocation() {
        if (this.tg && this.tg.requestLocation) {
            this.tg.requestLocation((location) => {
                if (location) {
                    this.updateLocation(location.latitude, location.longitude);
                    this.saveLiveLocation(location.latitude, location.longitude);
                }
            });
        } else {
            // Fallback for regular geolocation
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        this.updateLocation(lat, lng);
                        this.saveLiveLocation(lat, lng);
                    },
                    (error) => {
                        console.error('Location error:', error);
                        if (this.tg) {
                            this.tg.showAlert('Please enable location access to receive orders');
                        }
                    }
                );
            }
        }
    }

    async saveLiveLocation(latitude, longitude) {
        try {
            const response = await fetch(`/api/drivers/${this.driverData.id}/live-location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude,
                    longitude,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('Live location saved successfully');
            }
        } catch (error) {
            console.error('Error saving live location:', error);
        }
    }

    async updateLocation(latitude, longitude) {
        try {
            const response = await fetch(`/api/drivers/${this.driverData.id}/location`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    latitude,
                    longitude
                })
            });

            if (response.ok) {
                this.driverData.currentLocation = { lat: latitude, lng: longitude };
                const locationPrompt = document.getElementById('locationPrompt');
                if (locationPrompt) {
                    locationPrompt.classList.add('hidden');
                }
                
                if (this.tg) {
                    this.tg.showAlert('Location updated successfully!');
                }
            } else {
                throw new Error('Failed to update location');
            }
        } catch (error) {
            console.error('Error updating location:', error);
            if (this.tg) {
                this.tg.showAlert('Failed to update location');
            }
        }
    }

    initializeSocketConnection() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            
            if (this.driverData) {
                this.socket.emit('driver-online', this.driverData.id);
            }
        });

        this.socket.on('new-order-available', (order) => {
            this.handleNewOrder(order);
        });

        this.socket.on('order-cancelled', (orderId) => {
            this.removeOrderFromAvailable(orderId);
        });

        this.socket.on('driver-approved', (driverData) => {
            this.driverData = driverData;
            this.showDashboard();
            if (this.tg) {
                this.tg.showAlert('Congratulations! Your driver registration has been approved. Please share your live location to start receiving orders.');
                // Request live location sharing
                this.requestLiveLocation();
            }
        });
    }

    handleNewOrder(order) {
        this.displayAvailableOrder(order);
        this.updateOrderBadge();
        
        if (this.tg) {
            this.tg.showAlert('New order available!');
        }
    }

    displayAvailableOrder(order) {
        const ordersContainer = document.getElementById('availableOrders');
        
        // Remove "no orders" message
        if (ordersContainer.innerHTML.includes('No orders available')) {
            ordersContainer.innerHTML = '';
        }

        const orderCard = this.createOrderCard(order, true);
        ordersContainer.appendChild(orderCard);
    }

    createOrderCard(order, isAvailable = false) {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.id = `order-${order.id}`;

        const estimatedEarnings = this.calculateEarnings(order);
        const distance = this.calculateDistance(order);

        card.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.orderNumber}</div>
                <div class="order-status ${isAvailable ? 'new' : order.status.toLowerCase()}">${isAvailable ? 'New' : order.status}</div>
            </div>
            <div class="order-details">
                <div class="order-detail-item">
                    <span>Restaurant:</span>
                    <span class="order-detail-value">${order.restaurantName}</span>
                </div>
                <div class="order-detail-item">
                    <span>Customer:</span>
                    <span class="order-detail-value">${order.customerName}</span>
                </div>
                <div class="order-detail-item">
                    <span>Distance:</span>
                    <span class="order-detail-value">${distance}</span>
                </div>
                <div class="order-detail-item">
                    <span>Estimated Earnings:</span>
                    <span class="order-detail-value">$${estimatedEarnings}</span>
                </div>
                <div class="order-detail-item">
                    <span>Items:</span>
                    <span class="order-detail-value">${order.items.length} items</span>
                </div>
            </div>
            ${this.createOrderActions(order, isAvailable)}
        `;

        return card;
    }

    createOrderActions(order, isAvailable) {
        if (isAvailable) {
            return `
                <div class="order-actions">
                    <button class="btn btn-success btn-sm" onclick="driverApp.acceptOrder('${order.id}')">
                        Accept Order
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="driverApp.rejectOrder('${order.id}')">
                        Reject
                    </button>
                </div>
            `;
        } else {
            const actions = [];
            
            if (order.status === 'driver_assigned') {
                actions.push(`
                    <button class="btn btn-primary btn-sm" onclick="driverApp.markPickedUp('${order.id}')">
                        Mark as Picked Up
                    </button>
                `);
            }
            
            if (order.status === 'picked_up') {
                actions.push(`
                    <button class="btn btn-success btn-sm" onclick="driverApp.markDelivered('${order.id}')">
                        Mark as Delivered
                    </button>
                `);
            }
            
            // Navigation buttons
            actions.push(`
                <div class="navigation-buttons">
                    <button class="btn btn-outline btn-sm" onclick="driverApp.navigateToRestaurant('${order.id}')">
                        📍 Navigate to Restaurant
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="driverApp.navigateToCustomer('${order.id}')">
                        📍 Navigate to Customer
                    </button>
                </div>
            `);
            
            return `<div class="order-actions">${actions.join('')}</div>`;
        }
    }

    async acceptOrder(orderId) {
        try {
            const response = await fetch(`/api/orders/${orderId}/assign-driver`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ driverId: this.driverData.id })
            });

            if (response.ok) {
                const orderData = await response.json();
                this.currentOrder = orderData.order;
                this.removeOrderFromAvailable(orderId);
                this.displayActiveOrder(orderData.order);
                this.updateOrderBadge();
                
                if (this.tg) {
                    this.tg.showAlert('Order accepted successfully!');
                }
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to accept order');
            }
        } catch (error) {
            console.error('Error accepting order:', error);
            if (this.tg) {
                this.tg.showAlert(error.message);
            }
        }
    }

    async rejectOrder(orderId) {
        this.removeOrderFromAvailable(orderId);
        this.updateOrderBadge();
    }

    removeOrderFromAvailable(orderId) {
        const orderCard = document.getElementById(`order-${orderId}`);
        if (orderCard) {
            orderCard.remove();
        }

        // Show "no orders" message if empty
        const ordersContainer = document.getElementById('availableOrders');
        if (ordersContainer.children.length === 0) {
            ordersContainer.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No orders available at the moment</p>';
        }
    }

    displayActiveOrder(order) {
        const activeSection = document.getElementById('activeOrderSection');
        const activeCard = document.getElementById('activeOrderCard');
        
        activeCard.innerHTML = '';
        activeCard.appendChild(this.createOrderCard(order, false));
        activeSection.classList.remove('hidden');
    }

    async markPickedUp(orderId) {
        await this.updateOrderStatus(orderId, 'picked_up');
    }

    async markDelivered(orderId) {
        await this.updateOrderStatus(orderId, 'delivered');
    }

    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`/api/orders/${orderId}/driver-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status, driverId: this.driverData.id })
            });

            if (response.ok) {
                if (status === 'delivered') {
                    this.currentOrder = null;
                    document.getElementById('activeOrderSection').classList.add('hidden');
                    this.loadDeliveryHistory();
                    this.updateDashboardData(); // Refresh earnings
                }
                
                if (this.tg) {
                    this.tg.showAlert(`Order ${status.replace('_', ' ')} successfully!`);
                }
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update order status');
            }
        } catch (error) {
            console.error('Error updating order status:', error);
            if (this.tg) {
                this.tg.showAlert(error.message);
            }
        }
    }

    navigateToRestaurant(orderId) {
        if (this.currentOrder && this.currentOrder.restaurantLocation) {
            const { lat, lng } = this.currentOrder.restaurantLocation;
            this.openMaps(lat, lng, `Restaurant: ${this.currentOrder.restaurantName}`);
        }
    }

    navigateToCustomer(orderId) {
        if (this.currentOrder && this.currentOrder.deliveryLocation) {
            const { lat, lng } = this.currentOrder.deliveryLocation;
            this.openMaps(lat, lng, `Customer: ${this.currentOrder.customerName}`);
        }
    }

    openMaps(lat, lng, label) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodeURIComponent(label)}`;
        window.open(url, '_blank');
    }

    calculateEarnings(order) {
        // Simple earnings calculation based on order total
        const baseEarnings = parseFloat(order.total) * 0.15; // 15% of order total
        const minEarnings = 2.50; // Minimum earnings per delivery
        return Math.max(baseEarnings, minEarnings).toFixed(2);
    }

    calculateDistance(order) {
        if (!this.driverData.currentLocation || !order.restaurantLocation) {
            return 'Unknown';
        }

        const distance = this.getDistanceBetweenPoints(
            this.driverData.currentLocation.lat,
            this.driverData.currentLocation.lng,
            order.restaurantLocation.lat,
            order.restaurantLocation.lng
        );

        return `${distance.toFixed(1)} km`;
    }

    getDistanceBetweenPoints(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    updateOrderBadge() {
        const badge = document.getElementById('orderBadge');
        const availableCount = document.querySelectorAll('#availableOrders .order-card').length;
        
        if (availableCount > 0) {
            badge.textContent = availableCount.toString();
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    async loadAvailableOrders() {
        try {
            const response = await fetch(`/api/drivers/${this.driverData.id}/orders/available`);
            
            if (response.ok) {
                const data = await response.json();
                const ordersContainer = document.getElementById('availableOrders');
                ordersContainer.innerHTML = '';
                
                if (data.orders.length > 0) {
                    data.orders.forEach(order => {
                        this.displayAvailableOrder(order);
                    });
                } else {
                    ordersContainer.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No orders available at the moment</p>';
                }
                
                this.updateOrderBadge();
            }
        } catch (error) {
            console.error('Error loading available orders:', error);
        }
    }

    async loadDeliveryHistory() {
        try {
            const response = await fetch(`/api/drivers/${this.driverData.id}/deliveries`);
            
            if (response.ok) {
                const data = await response.json();
                const historyContainer = document.getElementById('deliveryHistory');
                historyContainer.innerHTML = '';
                
                if (data.deliveries.length > 0) {
                    data.deliveries.slice(0, 5).forEach(delivery => { // Show last 5
                        const historyItem = this.createDeliveryHistoryItem(delivery);
                        historyContainer.appendChild(historyItem);
                    });
                } else {
                    historyContainer.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">No delivery history yet</p>';
                }
            }
        } catch (error) {
            console.error('Error loading delivery history:', error);
        }
    }

    createDeliveryHistoryItem(delivery) {
        const item = document.createElement('div');
        item.className = 'order-card';
        
        const date = new Date(delivery.deliveryTime).toLocaleDateString();
        const time = new Date(delivery.deliveryTime).toLocaleTimeString();
        
        item.innerHTML = `
            <div class="order-details">
                <div class="order-detail-item">
                    <span>Order #${delivery.orderNumber}</span>
                    <span class="order-detail-value">$${delivery.earnings}</span>
                </div>
                <div class="order-detail-item">
                    <span>Date:</span>
                    <span class="order-detail-value">${date} ${time}</span>
                </div>
                <div class="order-detail-item">
                    <span>Distance:</span>
                    <span class="order-detail-value">${delivery.distance} km</span>
                </div>
            </div>
        `;
        
        return item;
    }
}

// Global functions for onclick handlers
let driverApp;

window.submitRegistration = function() {
    driverApp.submitRegistration();
};

window.toggleOnlineStatus = function() {
    driverApp.toggleOnlineStatus();
};

window.requestLocation = function() {
    driverApp.requestLocation();
};

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    driverApp = new DriverApp();
});

// Make methods available globally for onclick handlers
window.driverApp = null;