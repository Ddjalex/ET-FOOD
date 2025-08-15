class DriverApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.currentOrder = null;
        this.tripState = 'waiting'; // waiting, incoming, active, navigating
        this.isOnline = false;
        this.map = null;
        this.driverLocation = null;
        this.socket = null;
        this.driverId = null;
        this.creditBalance = 0;

        this.init();
    }

    async init() {
        console.log('🚗 Initializing BeU Driver App...');

        // Initialize Telegram WebApp
        this.tg.ready();
        this.tg.expand();

        // Get driver session and ID
        await this.initializeDriverSession();

        // Setup WebSocket connection
        this.setupWebSocket();

        // Setup event listeners
        this.setupEventListeners();

        // UI state will be set by initializeDriverSession based on driver status
        // this.showWaitingScreen(); // Moved to be conditional
    }

    async initializeDriverSession() {
        try {
            // Try to get session from Telegram WebApp data first
            const telegramData = this.tg.initDataUnsafe;
            console.log('🔐 Telegram WebApp data:', telegramData);

            if (telegramData && telegramData.user) {
                // Find driver by telegram ID
                const response = await fetch(`/api/drivers/by-telegram/${telegramData.user.id}`);
                if (response.ok) {
                    const driver = await response.json();
                    
                    if (!driver.isApproved) {
                        this.showPendingApprovalScreen();
                        return;
                    }
                    
                    this.driverId = driver.id;
                    console.log('✅ Driver session initialized from Telegram:', this.driverId);
                    this.updateStatusBadge('offline', 'Click "Go Online" to start');

                    // Load credit balance
                    await this.loadCreditBalance();
                    
                    // Show waiting screen for approved drivers
                    this.showWaitingScreen();
                    return;
                } else if (response.status === 404) {
                    // Driver not found - show registration
                    this.showRegistrationScreen(telegramData.user.id);
                    return;
                }
            }

            // Fallback: Try to get session from API
            const response = await fetch('/api/telegram/session');
            if (response.ok) {
                const data = await response.json();
                if (data.userId) {
                    // Check if this is a driver
                    const driverResponse = await fetch(`/api/drivers/by-user/${data.userId}`);
                    if (driverResponse.ok) {
                        const driver = await driverResponse.json();
                        
                        if (!driver.isApproved) {
                            this.showPendingApprovalScreen();
                            return;
                        }
                        
                        this.driverId = driver.id;
                        console.log('✅ Driver session initialized from API:', this.driverId);
                        this.updateStatusBadge('offline', 'Click "Go Online" to start');

                        // Load credit balance
                        await this.loadCreditBalance();
                        
                        // Show waiting screen for approved drivers
                        this.showWaitingScreen();
                        return;
                    }
                }
            }

            // If we get here, driver is not authenticated
            console.error('❌ Failed to get driver session');
            this.showRegistrationScreen();

        } catch (error) {
            console.error('❌ Error initializing driver session:', error);
            this.showErrorScreen('Connection Error');
        }
    }

    async loadCreditBalance() {
        if (!this.driverId) {
            console.log('❌ Cannot load credit balance: No driver ID');
            return;
        }

        try {
            console.log('💳 Loading credit balance for driver:', this.driverId);
            const response = await fetch(`/api/drivers/${this.driverId}/credit`);

            if (response.ok) {
                const data = await response.json();
                this.creditBalance = data.creditBalance || 0;
                this.updateCreditBalance(this.creditBalance);
                console.log('✅ Credit balance loaded:', this.creditBalance);
            } else {
                console.error('❌ Failed to load credit balance:', response.status);
                this.updateCreditBalance(0);
            }
        } catch (error) {
            console.error('❌ Error loading credit balance:', error);
            this.updateCreditBalance(0);
        }
    }

    updateCreditBalance(balance) {
        this.creditBalance = balance;
        const creditAmountElement = document.getElementById('creditAmount');
        const creditBalanceElement = document.getElementById('creditBalance');

        if (creditAmountElement) {
            creditAmountElement.textContent = `${balance.toFixed(2)} ETB`;
        }

        // Update visual state based on balance
        if (creditBalanceElement) {
            creditBalanceElement.classList.remove('low');
            if (balance < 50) {
                creditBalanceElement.classList.add('low');
            }
        }

        console.log('💳 Credit balance updated to:', balance);
    }

    setupWebSocket() {
        console.log('🔌 Setting up WebSocket connection...');

        try {
            this.socket = io();

            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected');
                this.updateStatusBadge('online', 'Online & Ready');

                // Authenticate with driver ID
                if (this.driverId) {
                    this.socket.emit('authenticate', { userId: this.driverId });
                }
            });

            this.socket.on('disconnect', () => {
                console.log('❌ WebSocket disconnected');
                this.updateStatusBadge('offline', 'Connection Lost');
            });

            // Listen for new order assignments (specific to this driver)
            this.socket.on('new_order_assigned', (orderData) => {
                console.log('🚨 NEW ORDER ASSIGNED:', orderData);
                this.showIncomingOrder(orderData);
                this.playNotificationSound();
                this.showNotification('New Order!', 'You have a new delivery request', 'success');
            });

            // Listen for broadcast orders (available to all drivers)
            this.socket.on('new_available_order', (orderData) => {
                console.log('📢 NEW AVAILABLE ORDER:', orderData);
                this.showIncomingOrder(orderData);
                this.playNotificationSound();
                this.showNotification('Order Available!', 'A new order is available in your area', 'info');
            });

            // Listen for order status updates
            this.socket.on('order_ready_for_pickup', (data) => {
                console.log('📦 Order ready for pickup:', data);
                if (this.currentOrder && this.currentOrder.orderId === data.orderId) {
                    this.updateTripProgress('pickedUp');
                    this.updatePrimaryAction('Navigate to Customer', '🧭');
                    this.showNotification('Order Ready!', 'Order is ready for pickup at restaurant', 'success');
                }
            });

            // Listen for credit balance updates
            this.socket.on('credit_balance_updated', (data) => {
                console.log('💳 Credit balance updated:', data);
                if (data.driverId === this.driverId) {
                    this.updateCreditBalance(data.newBalance);
                    this.showNotification('Credit Updated', `Your balance is now ${data.newBalance} ETB`, 'success');
                }
            });

            // Listen for order updates
            this.socket.on('order_status_updated', (data) => {
                console.log('📋 Order status updated:', data);
                if (this.currentOrder && this.currentOrder.orderId === data.orderId) {
                    this.handleOrderStatusUpdate(data);
                }
            });

        } catch (error) {
            console.error('❌ WebSocket setup failed:', error);
            this.updateStatusBadge('offline', 'Connection Error');
        }
    }

    setupEventListeners() {
        // Tab navigation
        const dashboardTab = document.getElementById('dashboardTab');
        const historyTab = document.getElementById('historyTab');
        const walletTab = document.getElementById('walletTab');

        if (dashboardTab) {
            dashboardTab.addEventListener('click', () => this.switchTab('dashboard'));
        }
        if (historyTab) {
            historyTab.addEventListener('click', () => this.switchTab('history'));
        }
        if (walletTab) {
            walletTab.addEventListener('click', () => this.switchTab('wallet'));
        }

        // Accept order button
        document.getElementById('acceptOrderBtn').addEventListener('click', () => {
            this.acceptOrder();
        });

        // Reject order button
        document.getElementById('rejectOrderBtn').addEventListener('click', () => {
            this.rejectOrder();
        });

        // Primary action button (dynamic based on trip state)
        document.getElementById('primaryActionBtn').addEventListener('click', () => {
            this.handlePrimaryAction();
        });

        // Online/Offline toggle button
        document.getElementById('onlineToggleBtn').addEventListener('click', () => {
            this.toggleOnlineStatus();
        });

        // Wallet functionality
        document.getElementById('withdrawBtn').addEventListener('click', () => {
            this.handleWithdrawRequest();
        });

        document.getElementById('refreshBalanceBtn').addEventListener('click', () => {
            this.loadWalletData();
        });

        // Credit request functionality
        document.getElementById('requestCreditBtn').addEventListener('click', () => {
            this.showCreditRequestModal();
        });

        document.getElementById('closeCreditModal').addEventListener('click', () => {
            this.hideCreditRequestModal();
        });

        document.getElementById('cancelCreditBtn').addEventListener('click', () => {
            this.hideCreditRequestModal();
        });

        document.getElementById('uploadButton').addEventListener('click', () => {
            document.getElementById('paymentScreenshot').click();
        });

        document.getElementById('paymentScreenshot').addEventListener('change', (e) => {
            this.handleScreenshotUpload(e);
        });

        // Credit request form submission
        const creditForm = document.getElementById('creditRequestForm');
        if (creditForm) {
            creditForm.addEventListener('submit', (e) => {
                console.log('📝 Form submit event captured');
                this.handleCreditRequestSubmit(e);
            });
            console.log('✅ Credit request form event listener attached');
        } else {
            console.log('❌ Credit request form not found');
        }

        // Also add direct button click handler as backup
        const submitButton = document.getElementById('submitCreditBtn');
        if (submitButton) {
            submitButton.addEventListener('click', (e) => {
                console.log('🔘 Submit button clicked directly');
                // Prevent default button action
                e.preventDefault();
                // Trigger form submission manually
                const form = document.getElementById('creditRequestForm');
                if (form) {
                    const submitEvent = new Event('submit', { cancelable: true });
                    form.dispatchEvent(submitEvent);
                }
            });
            console.log('✅ Submit button direct click handler attached');
        }


    }

    switchTab(tabName) {
        console.log(`📑 Switching to ${tabName} tab`);

        // Update tab buttons
        document.getElementById('dashboardTab').classList.toggle('active', tabName === 'dashboard');
        document.getElementById('historyTab').classList.toggle('active', tabName === 'history');
        document.getElementById('walletTab').classList.toggle('active', tabName === 'wallet');

        // Update tab content
        document.getElementById('dashboardContent').classList.toggle('active', tabName === 'dashboard');
        document.getElementById('historyContent').classList.toggle('active', tabName === 'history');
        document.getElementById('walletContent').classList.toggle('active', tabName === 'wallet');

        // Load data when tabs are selected
        if (tabName === 'history' && this.driverId) {
            this.loadDriverHistory();
        } else if (tabName === 'wallet' && this.driverId) {
            this.loadWalletData();
        }
    }

    async loadDriverHistory() {
        console.log('📋 Loading driver history...');

        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '<div class="loading-spinner">Loading your delivery history...</div>';

        try {
            const response = await fetch(`/api/drivers/${this.driverId}/history`);
            const result = await response.json();

            if (response.ok && result.success) {
                const history = result.data;

                if (history.length === 0) {
                    historyList.innerHTML = `
                        <div class="no-history">
                            <span class="no-history-icon">📦</span>
                            <h3>No deliveries yet</h3>
                            <p>Your completed deliveries will appear here</p>
                        </div>
                    `;
                    return;
                }

                let historyHTML = '';
                history.forEach(order => {
                    const completedDate = new Date(order.completedAt).toLocaleDateString();
                    const statusClass = order.status === 'delivered' ? 'delivered' : 'cancelled';

                    historyHTML += `
                        <div class="history-item">
                            <div class="history-header">
                                <div class="history-order-number">#${order.orderNumber}</div>
                                <div class="history-earnings">+${order.earnings} ETB</div>
                            </div>
                            <div class="history-details">
                                <div class="history-detail">
                                    <strong>Restaurant:</strong> ${order.restaurantName}
                                </div>
                                <div class="history-detail">
                                    <strong>Customer:</strong> ${order.customerName}
                                </div>
                                <div class="history-detail">
                                    <strong>Total:</strong> ${order.total} ETB
                                </div>
                                <div class="history-detail">
                                    <strong>Items:</strong> ${order.items} items
                                </div>
                            </div>
                            <div class="history-detail">
                                <strong>Address:</strong> ${order.deliveryAddress}
                            </div>
                            <div class="history-detail" style="margin-top: 8px;">
                                <span class="history-status ${statusClass}">${order.status}</span>
                                <span style="float: right; font-size: 12px;">${completedDate}</span>
                            </div>
                        </div>
                    `;
                });

                historyList.innerHTML = historyHTML;
                console.log(`✅ Loaded ${history.length} history items`);

            } else {
                historyList.innerHTML = `
                    <div class="no-history">
                        <span class="no-history-icon">❌</span>
                        <h3>Failed to load history</h3>
                        <p>Please try again later</p>
                    </div>
                `;
            }

        } catch (error) {
            console.error('❌ Error loading driver history:', error);
            historyList.innerHTML = `
                <div class="no-history">
                    <span class="no-history-icon">📡</span>
                    <h3>Connection Error</h3>
                    <p>Could not load delivery history</p>
                </div>
            `;
        }
    }

    showWaitingScreen() {
        console.log('📱 Showing waiting screen');
        this.tripState = 'waiting';

        document.getElementById('waitingScreen').classList.remove('hidden');
        document.getElementById('incomingOrderScreen').classList.add('hidden');
        document.getElementById('activeTripScreen').classList.add('hidden');
    }

    showIncomingOrder(orderData) {
        console.log('🔔 Displaying incoming order:', orderData);
        this.tripState = 'incoming';
        this.currentOrder = orderData;

        // Populate order details
        document.getElementById('incomingOrderNumber').textContent = orderData.orderNumber || 'New Order';
        document.getElementById('incomingEarnings').textContent = `+${(orderData.estimatedEarnings || 50).toFixed(0)} ETB`;
        document.getElementById('incomingRestaurantName').textContent = orderData.restaurantName || 'Restaurant';
        document.getElementById('incomingRestaurantAddress').textContent = orderData.restaurantAddress || 'Restaurant Address';
        document.getElementById('incomingCustomerName').textContent = orderData.customerName || 'Customer';
        document.getElementById('incomingCustomerAddress').textContent = orderData.customerAddress || 'Delivery Address';
        document.getElementById('incomingDistance').textContent = `${orderData.distance || 2.3} km`;

        // Show incoming order screen
        document.getElementById('waitingScreen').classList.add('hidden');
        document.getElementById('incomingOrderScreen').classList.remove('hidden');
        document.getElementById('activeTripScreen').classList.add('hidden');

        // Add fade-in animation
        document.getElementById('incomingOrderCard').classList.add('fade-in');

        // Auto-reject after 30 seconds if no action taken
        setTimeout(() => {
            if (this.tripState === 'incoming') {
                console.log('⏰ Auto-rejecting order due to timeout');
                this.rejectOrder();
            }
        }, 30000);
    }

    async acceptOrder() {
        if (!this.currentOrder) return;

        console.log('✅ Accepting order:', this.currentOrder.orderId);

        // Show loading state
        const acceptBtn = document.getElementById('acceptOrderBtn');
        acceptBtn.classList.add('loading');
        acceptBtn.textContent = 'Accepting...';

        try {
            const response = await fetch(`/api/drivers/orders/${this.currentOrder.orderId}/accept`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    driverId: this.driverId
                })
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Order accepted successfully');
                this.showActiveTripScreen();
                this.showNotification('Order Accepted!', 'Navigate to restaurant to pick up the order', 'success');
            } else {
                console.error('❌ Failed to accept order:', result);
                this.showNotification('Accept Failed', result.message || 'Could not accept order', 'error');
                acceptBtn.classList.remove('loading');
                acceptBtn.textContent = '✅ Accept';
            }
        } catch (error) {
            console.error('❌ Error accepting order:', error);
            this.showNotification('Network Error', 'Could not connect to server', 'error');
            acceptBtn.classList.remove('loading');
            acceptBtn.textContent = '✅ Accept';
        }
    }

    async rejectOrder() {
        if (!this.currentOrder) return;

        console.log('❌ Rejecting order:', this.currentOrder.orderId);

        try {
            const response = await fetch(`/api/drivers/orders/${this.currentOrder.orderId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    driverId: this.driverId
                })
            });

            if (response.ok) {
                console.log('✅ Order rejected successfully');
                this.showNotification('Order Rejected', 'Looking for more orders...', 'info');
            } else {
                console.error('❌ Failed to reject order');
            }
        } catch (error) {
            console.error('❌ Error rejecting order:', error);
        }

        // Return to waiting screen
        this.currentOrder = null;
        this.showWaitingScreen();
    }

    showActiveTripScreen() {
        console.log('📱 Showing active trip screen');
        this.tripState = 'active';

        if (!this.currentOrder) return;

        // Populate active trip details
        document.getElementById('activeOrderNumber').textContent = this.currentOrder.orderNumber || 'Order';
        document.getElementById('activeEarnings').textContent = `+${(this.currentOrder.estimatedEarnings || 50).toFixed(0)} ETB`;
        document.getElementById('activeRestaurantName').textContent = this.currentOrder.restaurantName || 'Restaurant';
        document.getElementById('activeRestaurantAddress').textContent = this.currentOrder.restaurantAddress || 'Restaurant Address';
        document.getElementById('activeCustomerName').textContent = this.currentOrder.customerName || 'Customer';
        document.getElementById('activeCustomerAddress').textContent = this.currentOrder.customerAddress || 'Customer Address';

        // Initialize trip progress
        this.updateTripProgress('toRestaurant');

        // Set initial primary action
        this.updatePrimaryAction('Navigate to Restaurant', '🧭');

        // Show active trip screen
        document.getElementById('waitingScreen').classList.add('hidden');
        document.getElementById('incomingOrderScreen').classList.add('hidden');
        document.getElementById('activeTripScreen').classList.remove('hidden');

        // Initialize map
        this.initializeMap();
    }

    initializeMap() {
        if (!this.currentOrder) return;

        console.log('🗺️ Initializing OpenStreetMap');

        try {
            // Default to Addis Ababa coordinates if no location data
            const restaurantLat = this.currentOrder.restaurantLocation?.latitude || 9.03;
            const restaurantLng = this.currentOrder.restaurantLocation?.longitude || 38.74;
            const customerLat = this.currentOrder.customerLocation?.latitude || 9.02;
            const customerLng = this.currentOrder.customerLocation?.longitude || 38.75;

            // Initialize map centered between restaurant and customer
            const centerLat = (restaurantLat + customerLat) / 2;
            const centerLng = (restaurantLng + customerLng) / 2;

            this.map = L.map('map').setView([centerLat, centerLng], 13);

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Add restaurant marker
            const restaurantIcon = L.divIcon({
                html: '<div style="background: #F59E0B; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🍽️</div>',
                iconSize: [30, 30],
                className: 'custom-div-icon'
            });

            this.restaurantMarker = L.marker([restaurantLat, restaurantLng], { icon: restaurantIcon })
                .addTo(this.map)
                .bindPopup(`<b>${this.currentOrder.restaurantName}</b><br>${this.currentOrder.restaurantAddress}`);

            // Add customer marker
            const customerIcon = L.divIcon({
                html: '<div style="background: #3B82F6; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">🏠</div>',
                iconSize: [30, 30],
                className: 'custom-div-icon'
            });

            this.customerMarker = L.marker([customerLat, customerLng], { icon: customerIcon })
                .addTo(this.map)
                .bindPopup(`<b>${this.currentOrder.customerName}</b><br>${this.currentOrder.customerAddress}`);

            // Add driver location if available
            if (this.driverLocation) {
                this.addDriverMarker();
            }

            // Fit map to show all markers
            const group = new L.featureGroup([this.restaurantMarker, this.customerMarker]);
            this.map.fitBounds(group.getBounds().pad(0.1));

            console.log('✅ Map initialized successfully');

        } catch (error) {
            console.error('❌ Error initializing map:', error);
        }
    }

    addDriverMarker() {
        if (!this.map || !this.driverLocation) return;

        const driverIcon = L.divIcon({
            html: '<div style="background: #10B981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🚗</div>',
            iconSize: [32, 32],
            className: 'custom-div-icon'
        });

        if (this.driverMarker) {
            this.map.removeLayer(this.driverMarker);
        }

        this.driverMarker = L.marker([this.driverLocation.latitude, this.driverLocation.longitude], { icon: driverIcon })
            .addTo(this.map)
            .bindPopup('<b>Your Location</b>');
    }

    updateTripProgress(stage) {
        // Reset all progress steps
        document.querySelectorAll('.progress-step').forEach(step => {
            step.classList.remove('active', 'completed');
        });

        const steps = ['stepAccepted', 'stepToRestaurant', 'stepPickedUp', 'stepDelivered'];

        switch (stage) {
            case 'accepted':
                document.getElementById('stepAccepted').classList.add('completed');
                break;
            case 'toRestaurant':
                document.getElementById('stepAccepted').classList.add('completed');
                document.getElementById('stepToRestaurant').classList.add('active');
                break;
            case 'pickedUp':
                document.getElementById('stepAccepted').classList.add('completed');
                document.getElementById('stepToRestaurant').classList.add('completed');
                document.getElementById('stepPickedUp').classList.add('active');
                break;
            case 'delivered':
                steps.forEach(stepId => {
                    document.getElementById(stepId).classList.add('completed');
                });
                break;
        }
    }

    updatePrimaryAction(text, icon) {
        const btn = document.getElementById('primaryActionBtn');
        btn.innerHTML = `${icon} ${text}`;
        btn.setAttribute('data-action', text.toLowerCase().replace(/ /g, '_'));
    }

    async handlePrimaryAction() {
        const btn = document.getElementById('primaryActionBtn');
        const action = btn.getAttribute('data-action');

        console.log('🎯 Primary action triggered:', action);

        switch (action) {
            case 'navigate_to_restaurant':
                this.navigateToRestaurant();
                break;
            case 'arrived_at_restaurant':
                this.markArrivedAtRestaurant();
                break;
            case 'picked_up_order':
                this.markOrderPickedUp();
                break;
            case 'navigate_to_customer':
                this.navigateToCustomer();
                break;
            case 'mark_delivered':
                this.markOrderDelivered();
                break;
        }
    }

    navigateToRestaurant() {
        if (!this.currentOrder) return;

        const lat = this.currentOrder.restaurantLocation?.latitude || 9.03;
        const lng = this.currentOrder.restaurantLocation?.longitude || 38.74;
        const name = this.currentOrder.restaurantName || 'Restaurant';

        this.openNavigation(lat, lng, name);

        // Update button to "Arrived at Restaurant"
        this.updatePrimaryAction('Arrived at Restaurant', '📍');
    }

    navigateToCustomer() {
        if (!this.currentOrder) return;

        const lat = this.currentOrder.customerLocation?.latitude || 9.02;
        const lng = this.currentOrder.customerLocation?.longitude || 38.75;
        const name = this.currentOrder.customerName || 'Customer';

        this.openNavigation(lat, lng, name);

        // Update button to "Mark as Delivered"
        this.updatePrimaryAction('Mark Delivered', '✅');
    }

    openNavigation(lat, lng, name) {
        // Telegram-compatible navigation approach
        const userAgent = navigator.userAgent.toLowerCase();
        let navigationUrl = '';

        try {
            if (userAgent.includes('android')) {
                // Use Google Maps web URL for Android (works better in Telegram)
                navigationUrl = `https://maps.google.com/maps?daddr=${lat},${lng}&dirflg=d`;
                window.open(navigationUrl, '_blank');

            } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
                // Use Google Maps web URL for iOS (more reliable in Telegram)
                navigationUrl = `https://maps.google.com/maps?daddr=${lat},${lng}&dirflg=d`;
                window.open(navigationUrl, '_blank');

            } else {
                // Web fallback - Google Maps web interface
                navigationUrl = `https://maps.google.com/maps?daddr=${lat},${lng}&dirflg=d`;
                window.open(navigationUrl, '_blank');
            }

            console.log('🧭 Opening navigation to:', name, 'at', lat, lng);
            this.showNotification('Navigation Opened', `Opening maps to ${name}`, 'success');

        } catch (error) {
            console.error('❌ Navigation error:', error);
            // Ultimate fallback to OpenStreetMap
            navigationUrl = `https://www.openstreetmap.org/directions?to=${lat}%2C${lng}`;
            window.open(navigationUrl, '_blank');
            this.showNotification('Navigation Error', 'Using alternative map service', 'warning');
        }
    }

    async markArrivedAtRestaurant() {
        console.log('📍 Driver arrived at restaurant');
        this.updatePrimaryAction('Picked Up Order', '📦');
        this.showNotification('Arrived!', 'Mark as picked up when you get the order', 'info');
    }

    async markOrderPickedUp() {
        if (!this.currentOrder) return;

        console.log('📦 Marking order as picked up');

        try {
            const response = await fetch(`/api/drivers/orders/${this.currentOrder.orderId}/pickup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.updateTripProgress('pickedUp');
                this.updatePrimaryAction('Navigate to Customer', '🧭');
                this.showNotification('Order Picked Up!', 'Now navigate to customer', 'success');
            } else {
                this.showNotification('Error', 'Could not mark as picked up', 'error');
            }
        } catch (error) {
            console.error('❌ Error marking pickup:', error);
            this.showNotification('Network Error', 'Could not update status', 'error');
        }
    }

    async markOrderDelivered() {
        if (!this.currentOrder) return;

        console.log('✅ Marking order as delivered');

        try {
            const response = await fetch(`/api/drivers/orders/${this.currentOrder.orderId}/deliver`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.updateTripProgress('delivered');
                this.showNotification('Delivery Complete!', 'Great job! Looking for more orders...', 'success');

                // Reset to waiting state after a brief celebration
                setTimeout(() => {
                    this.currentOrder = null;
                    this.showWaitingScreen();
                }, 3000);
            } else {
                this.showNotification('Error', 'Could not mark as delivered', 'error');
            }
        } catch (error) {
            console.error('❌ Error marking delivered:', error);
            this.showNotification('Network Error', 'Could not update status', 'error');
        }
    }

    handleOrderStatusUpdate(data) {
        console.log('📋 Handling order status update:', data);

        switch (data.status) {
            case 'ready_for_pickup':
                this.updateTripProgress('pickedUp');
                this.updatePrimaryAction('Navigate to Customer', '🧭');
                this.showNotification('Order Ready!', 'Order is ready for pickup', 'success');
                break;
            case 'picked_up':
                this.updateTripProgress('pickedUp');
                this.updatePrimaryAction('Navigate to Customer', '🧭');
                break;
            case 'delivered':
                this.updateTripProgress('delivered');
                break;
        }
    }

    getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    this.driverLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };

                    console.log('📍 Driver location updated:', this.driverLocation);

                    // Update driver marker on map if active
                    if (this.map && this.tripState === 'active') {
                        this.addDriverMarker();
                    }
                },
                (error) => {
                    console.error('❌ Error getting location:', error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 10000,
                    timeout: 5000
                }
            );
        } else {
            console.error('❌ Geolocation not supported');
        }
    }

    updateStatusBadge(status, text) {
        const badge = document.getElementById('statusBadge');
        badge.className = `status-badge ${status}`;
        badge.textContent = text;

        // Update toggle button to match status
        const toggleBtn = document.getElementById('onlineToggleBtn');
        if (status === 'online') {
            toggleBtn.className = 'online-toggle online';
            toggleBtn.textContent = 'Go Offline';
            this.isOnline = true;
        } else {
            toggleBtn.className = 'online-toggle offline';
            toggleBtn.textContent = 'Go Online';
            this.isOnline = false;
        }
    }

    async toggleOnlineStatus() {
        const toggleBtn = document.getElementById('onlineToggleBtn');

        // Show loading state
        toggleBtn.disabled = true;
        toggleBtn.textContent = this.isOnline ? 'Going Offline...' : 'Going Online...';

        try {
            const newStatus = !this.isOnline;

            // Update driver online status via API
            const response = await fetch('/api/drivers/status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    driverId: this.driverId,
                    isOnline: newStatus,
                    isAvailable: newStatus
                })
            });

            const result = await response.json();

            if (response.ok) {
                console.log(`✅ Driver status updated to: ${newStatus ? 'online' : 'offline'}`);

                if (newStatus) {
                    this.updateStatusBadge('online', 'Online & Ready');
                    this.showNotification('You\'re Online!', 'Ready to receive delivery orders', 'success');
                    // Get current location when going online
                    this.getCurrentLocation();
                } else {
                    this.updateStatusBadge('offline', 'Offline');
                    this.showNotification('You\'re Offline', 'You won\'t receive new orders', 'info');
                }
            } else {
                console.error('❌ Failed to update driver status:', result);
                this.showNotification('Status Update Failed', result.message || 'Could not update status', 'error');
            }
        } catch (error) {
            console.error('❌ Error updating driver status:', error);
            this.showNotification('Network Error', 'Could not connect to server', 'error');
        } finally {
            // Reset button state
            toggleBtn.disabled = false;
        }
    }

    showNotification(title, message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification-popup').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification-popup ${type}`;
        notification.innerHTML = `
            <h4>${title}</h4>
            <p>${message}</p>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 4000);
    }

    playNotificationSound() {
        // Create audio context for notification sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('🔇 Could not play notification sound');
        }
    }

    // Wallet functionality methods
    async loadWalletData() {
        console.log('💰 Loading wallet data...');

        if (!this.driverId) {
            console.error('❌ No driver ID available');
            return;
        }

        try {
            // Load credit balance, wallet balance and earnings summary
            const [creditResponse, balanceResponse, historyResponse] = await Promise.all([
                fetch(`/api/drivers/${this.driverId}/credit`),
                fetch(`/api/drivers/${this.driverId}/wallet/balance`),
                fetch(`/api/drivers/${this.driverId}/history`)
            ]);

            // Handle credit balance data
            if (creditResponse.ok) {
                const creditData = await creditResponse.json();
                this.updateCreditBalance(creditData.creditBalance || 0);
            }

            // Handle balance data
            if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json();
                this.updateWalletBalance(balanceData.balance || 0);
            }

            // Handle earnings summary from history (but don't show transactions)
            if (historyResponse.ok) {
                const historyData = await historyResponse.json();
                if (historyData.success) {
                    this.updateEarningsSummary(historyData.data);
                }
            }

        } catch (error) {
            console.error('❌ Error loading wallet data:', error);
            this.showNotification('Wallet Error', 'Failed to load wallet data', 'error');
        }
    }



    updateWalletBalance(balance) {
        const walletBalance = document.getElementById('walletBalance');
        if (walletBalance) {
            walletBalance.textContent = `${balance.toFixed(2)} ETB`;
        }
    }

    updateEarningsSummary(orders) {
        const totalEarningsEl = document.getElementById('totalEarnings');
        const totalDeliveriesEl = document.getElementById('totalDeliveries');
        const avgEarningEl = document.getElementById('avgEarning');

        if (!orders || orders.length === 0) {
            totalEarningsEl.textContent = '0 ETB';
            totalDeliveriesEl.textContent = '0';
            avgEarningEl.textContent = '0 ETB';
            return;
        }

        const deliveredOrders = orders.filter(order => order.status === 'delivered');
        const totalEarnings = deliveredOrders.reduce((sum, order) => sum + (order.driverEarnings || 0), 0);
        const avgEarning = deliveredOrders.length > 0 ? totalEarnings / deliveredOrders.length : 0;

        totalEarningsEl.textContent = `${totalEarnings.toFixed(2)} ETB`;
        totalDeliveriesEl.textContent = deliveredOrders.length.toString();
        avgEarningEl.textContent = `${avgEarning.toFixed(2)} ETB`;
    }

    showCreditRequestModal() {
        console.log('💰 Opening credit request modal');
        const modal = document.getElementById('creditRequestModal');
        modal.classList.add('show');
        
        // Reset form
        document.getElementById('creditRequestForm').reset();
        document.getElementById('fileName').textContent = '';
        document.getElementById('imagePreview').style.display = 'none';
    }

    hideCreditRequestModal() {
        console.log('💰 Closing credit request modal');
        const modal = document.getElementById('creditRequestModal');
        modal.classList.remove('show');
    }

    handleScreenshotUpload(event) {
        const file = event.target.files[0];
        const fileName = document.getElementById('fileName');
        const imagePreview = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');

        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                this.showNotification('Invalid File', 'Please select an image file', 'error');
                return;
            }

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                this.showNotification('File Too Large', 'Please select an image smaller than 5MB', 'error');
                return;
            }

            fileName.textContent = file.name;
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);

            console.log('📷 Screenshot selected:', file.name);
        }
    }

    async handleCreditRequestSubmit(event) {
        console.log('🔄 Credit request submit triggered');
        event.preventDefault();
        
        try {
            const amountInput = document.getElementById('creditAmount');
            const screenshotInput = document.getElementById('paymentScreenshot');
            
            if (!amountInput || !screenshotInput) {
                console.error('❌ Form elements not found');
                this.showNotification('Form Error', 'Form elements not found', 'error');
                return;
            }

            const amount = amountInput.value.trim();
            const screenshot = screenshotInput.files[0];

            console.log('💰 Form validation - Amount:', amount, 'Type:', typeof amount, 'ParseFloat:', parseFloat(amount));
            console.log('📷 Screenshot:', screenshot ? screenshot.name : 'No file selected');

            // Convert to number and validate
            const numericAmount = parseFloat(amount);
            if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
                console.log('❌ Validation failed - Amount:', amount, 'Numeric:', numericAmount);
                this.showNotification('Invalid Amount', 'Please enter a valid amount', 'error');
                return;
            }

            if (!screenshot) {
                console.log('❌ No screenshot provided');
                this.showNotification('Screenshot Required', 'Please upload a payment screenshot', 'error');
                return;
            }

            console.log('✅ Validation passed. Submitting credit request:', amount, 'ETB');

            // Show loading state
            const submitBtn = document.getElementById('submitCreditBtn');
            submitBtn.classList.add('loading');
            submitBtn.textContent = 'Submitting...';

            // Create form data
            const formData = new FormData();
            formData.append('amount', amount);
            formData.append('screenshot', screenshot);

            const response = await fetch(`/api/drivers/${this.driverId}/credit-request`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                console.log('✅ Credit request submitted successfully');
                this.showNotification('Request Submitted!', 'Your credit request has been sent for approval', 'success');
                this.hideCreditRequestModal();
                
                // Refresh credit balance
                await this.loadCreditBalance();
            } else {
                console.error('❌ Credit request failed:', result);
                this.showNotification('Request Failed', result.message || 'Could not submit request', 'error');
            }

            // Reset button state
            submitBtn.classList.remove('loading');
            submitBtn.textContent = '💰 Submit Request';
        
        } catch (formError) {
            console.error('❌ Form handling error:', formError);
            this.showNotification('Form Error', 'An error occurred while processing the form', 'error');
            
            // Reset button state on error
            const submitBtn = document.getElementById('submitCreditBtn');
            if (submitBtn) {
                submitBtn.classList.remove('loading');
                submitBtn.textContent = '💰 Submit Request';
            }
        }
    }

    async handleWithdrawRequest() {
        console.log('🏦 Handling withdrawal request...');

        // Get current balance first
        try {
            const response = await fetch(`/api/drivers/${this.driverId}/wallet/balance`);
            const balanceData = await response.json();
            const currentBalance = balanceData.balance || 0;

            if (currentBalance <= 0) {
                this.showNotification('No Balance', 'You have no earnings to withdraw', 'info');
                return;
            }

            // Show withdrawal confirmation via Telegram WebApp
            const message = `You have ${currentBalance.toFixed(2)} ETB available for withdrawal.\n\nTo withdraw your earnings:\n1. Contact support via the driver bot\n2. Provide your bank account details\n3. Withdrawals are processed within 24 hours`;

            if (this.tg && this.tg.showPopup) {
                this.tg.showPopup({
                    title: 'Withdrawal Request',
                    message: message,
                    buttons: [
                        { id: 'cancel', type: 'cancel', text: 'Cancel' },
                        { id: 'contact', type: 'default', text: 'Contact Support' }
                    ]
                }, (buttonId) => {
                    if (buttonId === 'contact') {
                        // Open Telegram chat or show contact info
                        this.showNotification('Contact Support', 'Please use the driver bot to contact support for withdrawals', 'info');
                    }
                });
            } else {
                // Fallback for when Telegram WebApp popup is not available
                this.showNotification('Withdrawal Available', `${currentBalance.toFixed(2)} ETB available. Contact support to withdraw.`, 'info');
            }

        } catch (error) {
            console.error('❌ Error handling withdrawal:', error);
            this.showNotification('Withdrawal Error', 'Failed to process withdrawal request', 'error');
        }
    }

    showRegistrationScreen(telegramUserId = null) {
        console.log('📋 Showing registration screen for Telegram user:', telegramUserId);
        
        // Get URL parameters for auto-filling
        const urlParams = new URLSearchParams(window.location.search);
        const phoneNumber = urlParams.get('phone') || '';
        const fullName = urlParams.get('name') || '';
        
        // Get telegram data if available
        const telegramData = this.tg.initDataUnsafe;
        const actualTelegramId = telegramUserId || (telegramData && telegramData.user ? telegramData.user.id : '');
        const telegramUsername = telegramData && telegramData.user ? telegramData.user.username : '';
        const displayName = fullName || (telegramData && telegramData.user ? `${telegramData.user.first_name || ''} ${telegramData.user.last_name || ''}`.trim() : '');
        
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="header">
                <h1>BeU Driver</h1>
                <p>Your delivery partner</p>
            </div>
            <div class="main-content" style="padding: 10px;">
                <div class="registration-form">
                    <div class="form-header">
                        <div class="form-icon">👤</div>
                        <h2>Driver Registration</h2>
                    </div>
                    
                    <form id="driverRegistrationForm">
                        <!-- Profile Picture -->
                        <div class="form-group">
                            <label>Profile Picture</label>
                            <div class="upload-area" id="profileUpload">
                                <div class="upload-content">
                                    <div class="upload-icon">📷</div>
                                    <div class="upload-text">Upload Profile Picture</div>
                                    <div class="upload-subtext">Tap to select image</div>
                                </div>
                                <input type="file" id="profilePicture" accept="image/*" style="display: none;">
                                <div class="image-preview" id="profilePreview" style="display: none;"></div>
                            </div>
                        </div>

                        <!-- Full Name -->
                        <div class="form-group">
                            <label for="fullName">Full Name</label>
                            <input type="text" id="fullName" value="${displayName}" placeholder="Enter your full name" required>
                        </div>

                        <!-- Telegram ID (Read-only) -->
                        <div class="form-group">
                            <div class="telegram-id-display">
                                📱 Telegram ID: ${actualTelegramId} ${telegramUsername ? `(@${telegramUsername})` : ''}
                            </div>
                        </div>

                        <!-- Phone Number -->
                        <div class="form-group">
                            <label for="phoneNumber">Phone Number</label>
                            <input type="tel" id="phoneNumber" value="${phoneNumber}" placeholder="Enter your phone number" required>
                        </div>

                        <!-- New Requirements Banner -->
                        <div style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 16px; border-radius: 12px; margin: 20px 0;">
                            <h4 style="margin: 0 0 8px 0; font-size: 16px;">✅ Updated Requirements</h4>
                            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                                <li>Only motorcycles and bicycles allowed</li>
                                <li>Government ID required (no driving license needed)</li>
                                <li>Motorcycle plate number required for motorcycles only</li>
                            </ul>
                        </div>

                        <!-- Vehicle Type -->
                        <div class="form-group">
                            <label for="vehicleType">Vehicle Type</label>
                            <select id="vehicleType" required>
                                <option value="">Select vehicle type</option>
                                <option value="motorcycle">Motorcycle</option>
                                <option value="bicycle">Bicycle</option>
                            </select>
                        </div>

                        <!-- Vehicle Plate (Only for Motorcycles) -->
                        <div class="form-group" id="vehiclePlateGroup" style="display: none;">
                            <label for="vehiclePlate">Motorcycle Plate Number</label>
                            <input type="text" id="vehiclePlate" placeholder="Enter motorcycle plate number">
                        </div>

                        <!-- Government ID Front -->
                        <div class="form-group">
                            <label>Government ID (Front)</label>
                            <div class="upload-area" id="idFrontUpload">
                                <div class="upload-content">
                                    <div class="upload-icon">📝</div>
                                    <div class="upload-text">Upload Front of Government ID</div>
                                    <div class="upload-subtext">Tap to select image</div>
                                </div>
                                <input type="file" id="idFront" accept="image/*" style="display: none;" required>
                                <div class="image-preview" id="idFrontPreview" style="display: none;"></div>
                            </div>
                        </div>

                        <!-- Government ID Back -->
                        <div class="form-group">
                            <label>Government ID (Back)</label>
                            <div class="upload-area" id="idBackUpload">
                                <div class="upload-content">
                                    <div class="upload-icon">📝</div>
                                    <div class="upload-text">Upload Back of Government ID</div>
                                    <div class="upload-subtext">Tap to select image</div>
                                </div>
                                <input type="file" id="idBack" accept="image/*" style="display: none;" required>
                                <div class="image-preview" id="idBackPreview" style="display: none;"></div>
                            </div>
                        </div>



                        <!-- Submit Button -->
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" id="submitRegistration">
                                🚀 Submit Registration
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add registration form styles
        this.addRegistrationStyles();
        
        // Setup form event listeners
        this.setupRegistrationFormEvents(actualTelegramId);
    }

    showPendingApprovalScreen() {
        console.log('⏳ Showing pending approval screen');
        
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="header">
                <h1>BeU Driver</h1>
                <p>Registration Under Review</p>
            </div>
            <div class="main-content">
                <div class="status-screen">
                    <div class="status-icon waiting">⏳</div>
                    <h2>Application Under Review</h2>
                    <p>Your driver application is being reviewed by our team. This usually takes 24-48 hours.</p>
                    
                    <div style="background: #FEF3C7; padding: 20px; border-radius: 12px; margin: 20px 0;">
                        <p><strong>What happens next?</strong></p>
                        <ol style="text-align: left; margin: 10px 0; padding-left: 20px;">
                            <li>We verify your documents</li>
                            <li>Background check (if required)</li>
                            <li>You'll receive approval notification</li>
                            <li>Start earning with BeU!</li>
                        </ol>
                    </div>
                    
                    <p style="color: #6B7280; font-size: 14px;">
                        You'll receive a notification in the Telegram bot once approved.
                    </p>
                </div>
            </div>
        `;
    }

    showErrorScreen(message) {
        console.log('❌ Showing error screen:', message);
        
        const container = document.querySelector('.container');
        container.innerHTML = `
            <div class="header">
                <h1>BeU Driver</h1>
                <p>Connection Issue</p>
            </div>
            <div class="main-content">
                <div class="status-screen">
                    <div class="status-icon" style="background: #FEF2F2; color: #DC2626;">❌</div>
                    <h2>Connection Error</h2>
                    <p>${message || 'Unable to connect to the server. Please check your internet connection and try again.'}</p>
                    
                    <button class="btn btn-primary" onclick="location.reload()" style="margin-top: 20px;">
                        🔄 Retry
                    </button>
                </div>
            </div>
        `;
    }
    
    addRegistrationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .registration-form {
                background: white;
                border-radius: 16px;
                padding: 20px;
                margin: 10px 0;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            }
            
            .form-header {
                display: flex;
                align-items: center;
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid #E5E7EB;
            }
            
            .form-icon {
                width: 40px;
                height: 40px;
                background: #3B82F6;
                color: white;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                margin-right: 12px;
            }
            
            .form-header h2 {
                font-size: 20px;
                font-weight: 600;
                color: #1F2937;
                margin: 0;
            }
            
            .form-group {
                margin-bottom: 20px;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #374151;
                font-size: 14px;
            }
            
            .form-group input, .form-group select {
                width: 100%;
                padding: 12px;
                border: 2px solid #E5E7EB;
                border-radius: 8px;
                font-size: 16px;
                background: #F9FAFB;
                transition: border-color 0.2s;
            }
            
            .form-group input:focus, .form-group select:focus {
                outline: none;
                border-color: #3B82F6;
                background: white;
            }
            
            .telegram-id-display {
                background: #DBEAFE;
                color: #1E40AF;
                padding: 12px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 500;
                border: 2px solid #93C5FD;
            }
            
            .upload-area {
                border: 2px dashed #10B981;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                background: #F0FDF4;
                min-height: 120px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .upload-area:hover {
                border-color: #059669;
                background: #ECFDF5;
            }
            
            .upload-content {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .upload-icon {
                font-size: 32px;
                margin-bottom: 8px;
                color: #059669;
            }
            
            .upload-text {
                font-size: 16px;
                font-weight: 600;
                color: #065F46;
                margin-bottom: 4px;
            }
            
            .upload-subtext {
                font-size: 12px;
                color: #6B7280;
            }
            
            .image-preview {
                width: 100%;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .image-preview img {
                width: 100%;
                height: 120px;
                object-fit: cover;
                border-radius: 8px;
            }
            
            .form-actions {
                margin-top: 32px;
                padding-top: 20px;
                border-top: 1px solid #E5E7EB;
            }
            
            .form-actions .btn {
                width: 100%;
                padding: 16px;
                font-size: 16px;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }
    
    setupRegistrationFormEvents(telegramUserId) {
        // Setup file upload events (removed 'license' from the list)
        ['profilePicture', 'idFront', 'idBack'].forEach(inputId => {
            const uploadArea = document.getElementById(`${inputId}Upload`) || document.getElementById(`${inputId.replace('Picture', '')}Upload`);
            const fileInput = document.getElementById(inputId);
            const preview = document.getElementById(`${inputId}Preview`) || document.getElementById(`${inputId.replace('Picture', '')}Preview`);
            
            if (uploadArea && fileInput) {
                uploadArea.addEventListener('click', () => fileInput.click());
                
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file && preview) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                            preview.style.display = 'block';
                            uploadArea.querySelector('.upload-content').style.display = 'none';
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        });
        
        // Add vehicle type change event listener
        const vehicleTypeSelect = document.getElementById('vehicleType');
        const vehiclePlateGroup = document.getElementById('vehiclePlateGroup');
        const vehiclePlateInput = document.getElementById('vehiclePlate');
        
        vehicleTypeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'motorcycle') {
                vehiclePlateGroup.style.display = 'block';
                vehiclePlateInput.required = true;
            } else {
                vehiclePlateGroup.style.display = 'none';
                vehiclePlateInput.required = false;
                vehiclePlateInput.value = '';
            }
        });
        
        // Setup form submission
        const form = document.getElementById('driverRegistrationForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitDriverRegistration(telegramUserId);
        });
    }
    
    async submitDriverRegistration(telegramUserId) {
        const submitBtn = document.getElementById('submitRegistration');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '⏳ Submitting...';
        
        try {
            const formData = new FormData();
            formData.append('telegramId', telegramUserId);
            formData.append('name', document.getElementById('fullName').value);
            formData.append('phoneNumber', document.getElementById('phoneNumber').value);
            formData.append('vehicleType', document.getElementById('vehicleType').value);
            
            // Only add plate number if motorcycle is selected
            const vehicleType = document.getElementById('vehicleType').value;
            if (vehicleType === 'motorcycle') {
                formData.append('vehiclePlate', document.getElementById('vehiclePlate').value);
            }
            
            // Add files (removed 'license' from the list)
            const files = ['profilePicture', 'idFront', 'idBack'];
            files.forEach(fileId => {
                const fileInput = document.getElementById(fileId);
                if (fileInput && fileInput.files[0]) {
                    // Map to correct API field names
                    let apiFieldName = fileId;
                    if (fileId === 'profilePicture') apiFieldName = 'profileImage';
                    if (fileId === 'idFront') apiFieldName = 'governmentIdFront';
                    if (fileId === 'idBack') apiFieldName = 'governmentIdBack';
                    
                    formData.append(apiFieldName, fileInput.files[0]);
                }
            });
            
            const response = await fetch('/api/drivers/register', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                this.showPendingApprovalScreen();
                this.showNotification('Registration Submitted', 'Your driver registration has been submitted for review!', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration Failed', error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '🚀 Submit Registration';
        }
    }


}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting BeU Driver App...');
    window.driverApp = new DriverApp();
});