// Telegram Mini Web App for BeU Delivery
class TelegramFoodApp {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.cart = [];
        this.currentRestaurant = null;
        this.userLocation = null;
        this.sessionData = null;
        this.restaurants = [];
        this.categories = [
            { id: 'pizza', name: 'Pizza', emoji: '🍕' },
            { id: 'burger', name: 'Burgers', emoji: '🍔' },
            { id: 'sushi', name: 'Sushi', emoji: '🍣' },
            { id: 'chinese', name: 'Chinese', emoji: '🥡' },
            { id: 'indian', name: 'Indian', emoji: '🍛' },
            { id: 'dessert', name: 'Desserts', emoji: '🍰' },
            { id: 'healthy', name: 'Healthy', emoji: '🥗' },
            { id: 'coffee', name: 'Coffee', emoji: '☕' }
        ];
        
        this.init();
    }

    async init() {
        // Initialize Telegram Web App
        this.tg.ready();
        this.tg.expand();
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const sessionToken = urlParams.get('session');
        const userId = urlParams.get('userId');
        const lat = parseFloat(urlParams.get('lat'));
        const lng = parseFloat(urlParams.get('lng'));

        if (lat && lng) {
            this.userLocation = { latitude: lat, longitude: lng };
        }

        try {
            // Validate session and get user data
            if (sessionToken && userId) {
                await this.validateSession(sessionToken, this.tg.initDataUnsafe?.user?.id);
            }

            // Check if we need to request contact sharing
            await this.checkContactSharing();

            // Load initial data
            await this.loadInitialData();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Hide loading screen and show app
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to load the app. Please try again.');
        }
    }

    async validateSession(sessionToken, telegramUserId) {
        try {
            const response = await fetch(`/api/telegram/session?sessionToken=${sessionToken}&telegramUserId=${telegramUserId}`);
            if (response.ok) {
                this.sessionData = await response.json();
                if (this.sessionData.location) {
                    this.userLocation = this.sessionData.location;
                    // Get human-readable address for location
                    await this.updateLocationDisplay();
                }
            }
        } catch (error) {
            console.error('Session validation error:', error);
        }
    }

    async reverseGeocode(latitude, longitude) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
            if (response.ok) {
                const data = await response.json();
                if (data.display_name) {
                    // Extract relevant address components
                    const address = data.address;
                    let displayAddress = '';
                    
                    if (address.city || address.town || address.village) {
                        displayAddress = address.city || address.town || address.village;
                    }
                    if (address.suburb || address.neighbourhood) {
                        displayAddress += displayAddress ? `, ${address.suburb || address.neighbourhood}` : (address.suburb || address.neighbourhood);
                    }
                    if (address.country && address.country === 'Ethiopia') {
                        displayAddress += displayAddress ? ', Ethiopia' : 'Ethiopia';
                    }
                    
                    return displayAddress || data.display_name.split(',').slice(0, 3).join(', ');
                }
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
        // Fallback to coordinates if geocoding fails
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }

    async updateLocationDisplay() {
        if (this.userLocation && this.userLocation.latitude && this.userLocation.longitude) {
            const readableAddress = await this.reverseGeocode(this.userLocation.latitude, this.userLocation.longitude);
            const locationElement = document.getElementById('deliveryAddress');
            if (locationElement) {
                locationElement.innerHTML = `📍 ${readableAddress}`;
            }
        }
    }

    async loadInitialData() {
        // Update delivery address with reverse geocoding
        if (this.userLocation) {
            await this.updateLocationDisplay();
        }

        // Load categories
        this.renderCategories();
        
        // Load restaurants
        await this.loadRestaurants();
    }

    renderCategories() {
        const container = document.getElementById('categoriesContainer');
        container.innerHTML = this.categories.map(category => `
            <div class="category-item flex-shrink-0 text-center cursor-pointer" data-category="${category.id}">
                <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-2 hover:bg-primary hover:bg-opacity-10 transition-colors">
                    <span class="text-2xl">${category.emoji}</span>
                </div>
                <span class="text-xs text-gray-600 font-medium">${category.name}</span>
            </div>
        `).join('');
    }

    async loadRestaurants() {
        try {
            // Fetch real restaurant data from API
            const response = await fetch(`/api/telegram/restaurants?lat=${this.userLocation?.latitude || ''}&lng=${this.userLocation?.longitude || ''}`);
            if (!response.ok) {
                throw new Error('Failed to fetch restaurants');
            }
            
            this.restaurants = await response.json();

            this.renderRestaurants();
        } catch (error) {
            console.error('Error loading restaurants:', error);
        }
    }

    renderRestaurants() {
        const container = document.getElementById('restaurantsContainer');
        
        if (!this.restaurants || this.restaurants.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No restaurants available at the moment. Please try again later.</p>';
            return;
        }
        
        container.innerHTML = this.restaurants.map(restaurant => `
            <div class="restaurant-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer" data-restaurant-id="${restaurant.id}">
                <div class="relative">
                    <img src="${restaurant.image}" alt="${restaurant.name}" class="w-full h-32 object-cover" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop'">
                    <div class="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-medium">
                        ${restaurant.deliveryTime || '25-35 min'}
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-gray-800 mb-1">${restaurant.name}</h3>
                    <p class="text-xs text-gray-500 mb-2">${restaurant.address || 'Addis Ababa'}</p>
                    <div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <span>⭐ ${restaurant.rating || 4.5} (${restaurant.reviewCount || 50}+)</span>
                        <span>📍 ${restaurant.distance || '1-3 km'}</span>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-500">${restaurant.deliveryFee ? '$' + restaurant.deliveryFee + ' delivery' : 'Free delivery'}</span>
                        <button class="text-primary text-sm font-medium">View Menu</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupEventListeners() {
        // Restaurant cards
        document.addEventListener('click', (e) => {
            const restaurantCard = e.target.closest('.restaurant-card');
            if (restaurantCard) {
                const restaurantId = restaurantCard.dataset.restaurantId;
                this.openRestaurant(restaurantId);
            }
        });

        // Category filters
        document.addEventListener('click', (e) => {
            const categoryItem = e.target.closest('.category-item');
            if (categoryItem) {
                const category = categoryItem.dataset.category;
                this.filterByCategory(category);
            }
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchRestaurants(e.target.value);
        });

        // Modal controls
        document.getElementById('closeModalBtn').addEventListener('click', () => {
            this.closeRestaurantModal();
        });

        document.getElementById('viewCartBtn').addEventListener('click', () => {
            this.openCartModal();
        });

        document.getElementById('closeCartBtn').addEventListener('click', () => {
            this.closeCartModal();
        });

        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.openCheckoutModal();
        });

        document.getElementById('closeCheckoutBtn').addEventListener('click', () => {
            this.closeCheckoutModal();
        });

        // Checkout form
        document.getElementById('orderForOthersCheckbox').addEventListener('change', (e) => {
            const recipientInfo = document.getElementById('recipientInfo');
            if (e.target.checked) {
                recipientInfo.classList.remove('hidden');
            } else {
                recipientInfo.classList.add('hidden');
            }
        });

        document.getElementById('placeOrderBtn').addEventListener('click', () => {
            this.placeOrder();
        });

        // Add contact sharing button if available
        if (this.tg.requestContact) {
            const contactBtn = document.getElementById('requestContactBtn');
            if (contactBtn) {
                contactBtn.addEventListener('click', () => {
                    this.requestContactSharing();
                });
            }
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.id === 'restaurantModal') {
                this.closeRestaurantModal();
            }
            if (e.target.id === 'cartModal') {
                this.closeCartModal();
            }
            if (e.target.id === 'checkoutModal') {
                this.closeCheckoutModal();
            }
        });
    }

    openRestaurant(restaurantId) {
        this.currentRestaurant = this.restaurants.find(r => r.id === restaurantId);
        if (!this.currentRestaurant) return;

        // Update modal content
        document.getElementById('modalRestaurantName').textContent = this.currentRestaurant.name;
        document.getElementById('modalRating').textContent = `⭐ ${this.currentRestaurant.rating}`;
        document.getElementById('modalDeliveryTime').textContent = this.currentRestaurant.deliveryTime;
        document.getElementById('modalDistance').textContent = this.currentRestaurant.distance;

        // Group menu items by category
        const menuByCategory = {};
        this.currentRestaurant.menu.forEach(item => {
            if (!menuByCategory[item.category]) {
                menuByCategory[item.category] = [];
            }
            menuByCategory[item.category].push(item);
        });

        // Render menu categories
        const categoriesNav = document.getElementById('menuCategoriesNav');
        categoriesNav.innerHTML = Object.keys(menuByCategory).map(category => `
            <button class="menu-category-btn px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap bg-gray-100 text-gray-600 hover:bg-primary hover:text-white transition-colors" data-category="${category}">
                ${category}
            </button>
        `).join('');

        // Render menu items
        const menuContainer = document.getElementById('menuItemsContainer');
        menuContainer.innerHTML = Object.keys(menuByCategory).map(category => `
            <div class="menu-category mb-6" id="category-${category}">
                <h3 class="font-semibold text-gray-800 mb-4">${category}</h3>
                <div class="space-y-4">
                    ${menuByCategory[category].map(item => `
                        <div class="menu-item flex items-center space-x-4 bg-gray-50 rounded-xl p-4">
                            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover">
                            <div class="flex-1">
                                <h4 class="font-medium text-gray-800">${item.name}</h4>
                                <p class="text-sm text-gray-600 mb-2">${item.description}</p>
                                <p class="font-semibold text-primary">${item.price.toFixed(2)} ETB</p>
                            </div>
                            <button class="add-to-cart-btn bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primaryDark transition-colors" data-item-id="${item.id}">
                                Add
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Add event listeners for add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const itemId = e.target.dataset.itemId;
                this.addToCart(itemId);
            });
        });

        // Show modal
        document.getElementById('restaurantModal').classList.remove('hidden');
    }

    closeRestaurantModal() {
        document.getElementById('restaurantModal').classList.add('hidden');
    }

    addToCart(itemId) {
        if (!this.currentRestaurant) return;

        const item = this.currentRestaurant.menu.find(item => item.id === itemId);
        if (!item) return;

        // Check if item already in cart
        const existingItem = this.cart.find(cartItem => cartItem.id === itemId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...item,
                quantity: 1,
                restaurantId: this.currentRestaurant.id,
                restaurantName: this.currentRestaurant.name
            });
        }

        // Update UI with immediate feedback
        this.updateCartUI();
        
        // Show visual feedback for the add action
        this.showAddToCartFeedback(itemId);
    }

    showAddToCartFeedback(itemId) {
        // Find the button that was clicked and show feedback
        const button = document.querySelector(`[data-item-id="${itemId}"]`);
        if (button && button.classList.contains('add-to-cart-btn')) {
            const originalText = button.textContent;
            
            // Add success animation
            button.classList.add('add-btn-success');
            button.textContent = '✓ Added!';
            button.classList.add('bg-green-500', 'hover:bg-green-600', 'text-white');
            button.classList.remove('bg-primary', 'hover:bg-primaryDark');
            
            // Reset after animation
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('bg-green-500', 'hover:bg-green-600', 'add-btn-success');
                button.classList.add('bg-primary', 'hover:bg-primaryDark');
            }, 1200);
        }
    }

    updateCartUI() {
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Update cart display elements
        const cartItemCount = document.getElementById('cartItemCount');
        const cartTotal = document.getElementById('cartTotal');
        const cartContainer = document.getElementById('cartContainer');

        if (itemCount > 0) {
            cartItemCount.textContent = `${itemCount} item${itemCount > 1 ? 's' : ''}`;
            cartTotal.textContent = `${total.toFixed(2)} ETB`;
            
            // Show the cart container with enhanced animation
            const wasHidden = cartContainer.classList.contains('hidden');
            cartContainer.classList.remove('hidden');
            
            if (wasHidden) {
                // First time showing - slide in
                cartContainer.classList.add('cart-slide-in');
                setTimeout(() => {
                    cartContainer.classList.remove('cart-slide-in');
                }, 400);
            } else {
                // Already visible - small bounce to indicate update
                cartContainer.classList.add('cart-bounce');
                setTimeout(() => {
                    cartContainer.classList.remove('cart-bounce');
                }, 600);
            }
            
            cartContainer.style.transform = 'translateY(0)';
            cartContainer.style.opacity = '1';
        } else {
            // Hide the cart container
            cartContainer.style.transform = 'translateY(100%)';
            cartContainer.style.opacity = '0';
            setTimeout(() => {
                if (this.cart.length === 0) {
                    cartContainer.classList.add('hidden');
                }
            }, 300);
        }
    }

    showCartContainer() {
        // This method is now handled within updateCartUI for better consistency
        this.updateCartUI();
    }

    openCartModal() {
        this.renderCartItems();
        document.getElementById('cartModal').classList.remove('hidden');
    }

    closeCartModal() {
        document.getElementById('cartModal').classList.add('hidden');
    }

    renderCartItems() {
        const container = document.getElementById('cartItemsList');
        
        if (this.cart.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Your cart is empty</p>';
        } else {
            container.innerHTML = this.cart.map(item => `
                <div class="cart-item flex items-center space-x-3 bg-gray-50 rounded-xl p-3 mb-3">
                    <img src="${item.image}" alt="${item.name}" class="w-12 h-12 rounded-lg object-cover">
                    <div class="flex-1">
                        <h4 class="font-medium text-gray-800 text-sm">${item.name}</h4>
                        <p class="text-xs text-gray-500">${item.restaurantName}</p>
                        <p class="text-primary font-semibold">${item.price.toFixed(2)} ETB</p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button class="quantity-btn w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300" data-action="decrease" data-item-id="${item.id}">-</button>
                        <span class="font-medium">${item.quantity}</span>
                        <button class="quantity-btn w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primaryDark" data-action="increase" data-item-id="${item.id}">+</button>
                    </div>
                </div>
            `).join('');
        }

        // Add event listeners for quantity buttons
        document.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                const itemId = e.target.dataset.itemId;
                this.updateQuantity(itemId, action);
            });
        });

        this.updateCartSummary();
    }

    updateQuantity(itemId, action) {
        const item = this.cart.find(cartItem => cartItem.id === itemId);
        if (!item) return;

        if (action === 'increase') {
            item.quantity += 1;
        } else if (action === 'decrease') {
            item.quantity -= 1;
            if (item.quantity <= 0) {
                this.cart = this.cart.filter(cartItem => cartItem.id !== itemId);
            }
        }

        this.renderCartItems();
        this.updateCartUI();
        this.showCartContainer();
    }

    updateCartSummary() {
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = 25.00; // 25 ETB delivery fee
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + deliveryFee + tax;

        document.getElementById('cartSubtotal').textContent = `${subtotal.toFixed(2)} ETB`;
        document.getElementById('taxAmount').textContent = `${tax.toFixed(2)} ETB`;
        document.getElementById('finalTotal').textContent = `${total.toFixed(2)} ETB`;
    }

    openCheckoutModal() {
        if (this.cart.length === 0) return;

        // Pre-fill delivery address
        if (this.userLocation) {
            document.getElementById('deliveryAddressInput').value = document.getElementById('deliveryAddress').textContent.replace('📍 ', '');
        }

        // Render checkout order summary
        this.renderCheckoutSummary();
        
        this.closeCartModal();
        document.getElementById('checkoutModal').classList.remove('hidden');
    }

    closeCheckoutModal() {
        document.getElementById('checkoutModal').classList.add('hidden');
    }

    renderCheckoutSummary() {
        const container = document.getElementById('checkoutOrderSummary');
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = 25.00; // 25 ETB delivery fee
        const tax = subtotal * 0.08;
        const total = subtotal + deliveryFee + tax;

        container.innerHTML = `
            ${this.cart.map(item => `
                <div class="flex justify-between">
                    <span>${item.name} x${item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)} ETB</span>
                </div>
            `).join('')}
            <div class="border-t pt-2 mt-2 space-y-1">
                <div class="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)} ETB</span>
                </div>
                <div class="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>${deliveryFee.toFixed(2)} ETB</span>
                </div>
                <div class="flex justify-between">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)} ETB</span>
                </div>
                <div class="flex justify-between font-semibold text-base border-t pt-1">
                    <span>Total</span>
                    <span>${total.toFixed(2)} ETB</span>
                </div>
            </div>
        `;

        document.getElementById('checkoutTotal').textContent = `${total.toFixed(2)} ETB`;
    }

    async placeOrder() {
        if (this.cart.length === 0) return;

        // Collect order data
        const deliveryAddress = document.getElementById('deliveryAddressInput').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const specialInstructions = document.getElementById('specialInstructions').value;
        
        if (!deliveryAddress.trim()) {
            this.showError('Please enter your delivery address');
            return;
        }
        
        let recipientInfo = null;
        if (document.getElementById('orderForOthersCheckbox').checked) {
            recipientInfo = {
                name: document.getElementById('recipientName').value,
                phone: document.getElementById('recipientPhone').value,
                address: document.getElementById('recipientAddress').value || deliveryAddress
            };
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = 25.00; // 25 ETB delivery fee
        const tax = subtotal * 0.08;
        const total = subtotal + deliveryFee + tax;

        // Get customer phone number from form input
        const customerPhone = document.getElementById('customerPhoneInput').value || '+251911234567';

        const orderData = {
            items: this.cart,
            restaurantId: this.cart[0].restaurantId,
            restaurantName: this.cart[0].restaurantName,
            deliveryAddress: {
                address: deliveryAddress,
                latitude: this.userLocation?.latitude || 9.005401, // Default to Addis Ababa coordinates
                longitude: this.userLocation?.longitude || 38.763611,
                phoneNumber: recipientInfo?.phone || customerPhone
            },
            recipientInfo,
            paymentMethod,
            specialInstructions,
            subtotal,
            deliveryFee,
            tax,
            total
        };

        try {
            // Show loading state
            const submitBtn = document.getElementById('placeOrderBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Placing Order...';
            submitBtn.disabled = true;

            // Get URL parameters for session validation
            const urlParams = new URLSearchParams(window.location.search);
            const sessionToken = urlParams.get('session');
            const telegramUserId = this.tg.initDataUnsafe?.user?.id;

            // Submit order to backend
            const response = await fetch('/api/telegram/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionToken,
                    telegramUserId,
                    orderData
                })
            });

            if (!response.ok) {
                throw new Error('Failed to place order');
            }

            const result = await response.json();
            
            // Show success message
            this.showSuccessMessage(`Order #${result.orderNumber} placed successfully! The kitchen staff has been notified.`);
            
            // Also send data back to Telegram bot for chat notification
            this.tg.sendData(JSON.stringify({
                success: true,
                orderId: result.orderId,
                orderNumber: result.orderNumber,
                ...orderData
            }));
            
            // Close modal and reset cart
            this.closeCheckoutModal();
            this.cart = [];
            this.updateCartUI();
            this.showCartContainer();
            
        } catch (error) {
            console.error('Error placing order:', error);
            this.showError('Failed to place order. Please try again.');
        } finally {
            // Reset button state
            const submitBtn = document.getElementById('placeOrderBtn');
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    filterByCategory(category) {
        // Remove active class from all categories
        document.querySelectorAll('.category-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to selected category
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Filter restaurants
        const filteredRestaurants = this.restaurants.filter(restaurant => restaurant.category === category);
        this.renderFilteredRestaurants(filteredRestaurants);
    }

    renderFilteredRestaurants(restaurants) {
        const container = document.getElementById('restaurantsContainer');
        if (restaurants.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No restaurants found in this category</p>';
        } else {
            container.innerHTML = restaurants.map(restaurant => `
                <div class="restaurant-card bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer" data-restaurant-id="${restaurant.id}">
                    <div class="relative">
                        <img src="${restaurant.image}" alt="${restaurant.name}" class="w-full h-32 object-cover">
                        <div class="absolute top-2 right-2 bg-white rounded-full px-2 py-1 text-xs font-medium">
                            ${restaurant.deliveryTime}
                        </div>
                    </div>
                    <div class="p-4">
                        <h3 class="font-semibold text-gray-800 mb-1">${restaurant.name}</h3>
                        <div class="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                            <span>⭐ ${restaurant.rating} (${restaurant.reviewCount})</span>
                            <span>📍 ${restaurant.distance}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-xs text-gray-500">Free delivery</span>
                            <button class="text-primary text-sm font-medium">View Menu</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    searchRestaurants(query) {
        if (!query.trim()) {
            this.renderRestaurants();
            return;
        }

        const filteredRestaurants = this.restaurants.filter(restaurant => 
            restaurant.name.toLowerCase().includes(query.toLowerCase()) ||
            restaurant.menu.some(item => 
                item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.description.toLowerCase().includes(query.toLowerCase())
            )
        );

        this.renderFilteredRestaurants(filteredRestaurants);
    }

    showError(message) {
        // Create and show error toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-xl z-50 fade-in';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showSuccessMessage(message) {
        // Create and show success toast
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 left-4 right-4 bg-green-500 text-white p-4 rounded-xl z-50 fade-in';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    async checkContactSharing() {
        // Check if user has already shared contact
        const userContactInfo = localStorage.getItem('userContactInfo');
        if (!userContactInfo && this.tg.requestContact) {
            // Show contact sharing prompt after a delay
            setTimeout(() => {
                this.showContactPrompt();
            }, 2000);
        } else if (userContactInfo) {
            // Autofill contact information if available
            const contactData = JSON.parse(userContactInfo);
            this.prefillUserData(contactData);
        }
    }

    showContactPrompt() {
        // Create a simple prompt for contact sharing
        const promptDiv = document.createElement('div');
        promptDiv.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        promptDiv.innerHTML = `
            <div class="bg-white rounded-2xl p-6 max-w-sm w-full">
                <div class="text-center mb-4">
                    <div class="w-16 h-16 bg-primary bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                    </div>
                    <h3 class="font-bold text-gray-800 mb-2">Quick Checkout</h3>
                    <p class="text-sm text-gray-600 mb-4">Share your contact to make future orders faster and easier</p>
                </div>
                <button id="shareContactBtn" class="w-full bg-primary text-white py-3 rounded-xl font-semibold mb-3">
                    Share Contact
                </button>
                <button id="skipContactBtn" class="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold">
                    Skip for now
                </button>
            </div>
        `;
        
        document.body.appendChild(promptDiv);
        
        // Event listeners
        document.getElementById('shareContactBtn').addEventListener('click', () => {
            this.requestContactSharing();
            document.body.removeChild(promptDiv);
        });
        
        document.getElementById('skipContactBtn').addEventListener('click', () => {
            document.body.removeChild(promptDiv);
        });
    }

    requestContactSharing() {
        if (this.tg.requestContact) {
            this.tg.requestContact((contact) => {
                if (contact) {
                    // Store contact information
                    const contactData = {
                        phoneNumber: contact.phone_number,
                        firstName: contact.first_name,
                        lastName: contact.last_name || ''
                    };
                    localStorage.setItem('userContactInfo', JSON.stringify(contactData));
                    this.prefillUserData(contactData);
                }
            });
        }
    }

    prefillUserData(contactData) {
        // Autofill phone input when checkout is opened
        const phoneInput = document.getElementById('customerPhoneInput');
        if (phoneInput && contactData.phoneNumber) {
            phoneInput.value = contactData.phoneNumber;
        }
        
        // Store for use in checkout
        this.userContactData = contactData;
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TelegramFoodApp();
});