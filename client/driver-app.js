class DriverApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.currentOrder = null;
        this.tripState = 'waiting'; // waiting, incoming, active, navigating
        this.map = null;
        this.driverLocation = null;
        this.socket = null;
        this.driverId = null;
        
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
        
        // Get current location
        this.getCurrentLocation();
        
        // Set initial UI state
        this.showWaitingScreen();
    }
    
    async initializeDriverSession() {
        try {
            // Get Telegram WebApp data
            const telegramData = this.tg.initDataUnsafe;
            console.log('🔐 Telegram WebApp data:', telegramData);
            
            if (telegramData && telegramData.user) {
                // Use Telegram user ID as driver ID
                this.driverId = telegramData.user.id.toString();
                console.log('✅ Driver session initialized from Telegram:', this.driverId);
                this.updateStatusBadge('online', 'Online & Ready');
                
                // Store driver info for later use
                this.driverInfo = {
                    id: this.driverId,
                    firstName: telegramData.user.first_name,
                    lastName: telegramData.user.last_name,
                    username: telegramData.user.username
                };
                
                return;
            }
            
            // Fallback: Try to get session from API
            const response = await fetch('/api/telegram/session', {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.userId) {
                    this.driverId = data.userId;
                    console.log('✅ Driver session initialized from API:', this.driverId);
                    this.updateStatusBadge('online', 'Online & Ready');
                    return;
                }
            }
            
            console.error('❌ Failed to get driver session from both Telegram and API');
            this.updateStatusBadge('offline', 'Not Authenticated');
            
        } catch (error) {
            console.error('❌ Error initializing driver session:', error);
            this.updateStatusBadge('offline', 'Connection Error');
        }
    }
    
    setupWebSocket() {
        console.log('🔌 Setting up WebSocket connection...');
        
        try {
            // Use window.location.origin to get the correct host
            const socketUrl = window.location.origin;
            console.log('Connecting to WebSocket at:', socketUrl);
            
            this.socket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                upgrade: true,
                timeout: 10000,
                forceNew: true
            });
            
            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected to', socketUrl);
                this.updateStatusBadge('online', 'Online & Ready');
                
                // Authenticate with driver ID
                if (this.driverId) {
                    this.socket.emit('authenticate', { userId: this.driverId });
                    console.log('🔐 Authenticated with driver ID:', this.driverId);
                }
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('❌ WebSocket connection error:', error);
                this.updateStatusBadge('offline', 'Connection Error');
            });
            
            this.socket.on('disconnect', () => {
                console.log('❌ WebSocket disconnected');
                this.updateStatusBadge('offline', 'Connection Lost');
            });
            
            this.socket.on('reconnect', () => {
                console.log('🔄 WebSocket reconnected');
                this.updateStatusBadge('online', 'Online & Ready');
                
                // Re-authenticate after reconnection
                if (this.driverId) {
                    this.socket.emit('authenticate', { userId: this.driverId });
                }
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
        // Try to open in native map apps first (mobile-first approach)
        const userAgent = navigator.userAgent.toLowerCase();
        let navigationUrl = '';
        
        if (userAgent.includes('android')) {
            // Try Google Maps first on Android
            navigationUrl = `google.navigation:q=${lat},${lng}&mode=d`;
            window.location.href = navigationUrl;
            
            // Fallback to Maps.me after a short delay
            setTimeout(() => {
                navigationUrl = `mapsme://route?sll=${lat},${lng}&saddr=Current%20Location&daddr=${name}`;
                window.location.href = navigationUrl;
            }, 500);
            
        } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
            // Try Apple Maps on iOS
            navigationUrl = `maps://saddr=Current%20Location&daddr=${lat},${lng}`;
            window.location.href = navigationUrl;
            
        } else {
            // Web fallback - open OpenStreetMap with directions
            navigationUrl = `https://www.openstreetmap.org/directions?from=&to=${lat}%2C${lng}`;
            window.open(navigationUrl, '_blank');
        }
        
        console.log('🧭 Opening navigation to:', name, 'at', lat, lng);
        this.showNotification('Navigation Opened', `Navigating to ${name}`, 'info');
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
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting BeU Driver App...');
    window.driverApp = new DriverApp();
});