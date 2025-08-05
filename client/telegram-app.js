// Telegram Mini Web App for BeU Delivery
class BeUDeliveryApp {
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
                }
            }
        } catch (error) {
            console.error('Session validation error:', error);
        }
    }

    async loadInitialData() {
        // Update delivery address
        if (this.userLocation) {
            const address = await this.getAddressFromCoordinates(this.userLocation.latitude, this.userLocation.longitude);
            document.getElementById('deliveryAddress').textContent = `📍 ${address}`;
        }

        // Load categories
        this.renderCategories();
        
        // Load restaurants
        await this.loadRestaurants();
    }

    async getAddressFromCoordinates(lat, lng) {
        try {
            // In a real app, you'd use a geocoding service
            // For demo purposes, we'll return a formatted address
            return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (error) {
            return 'Your location';
        }
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
                                <p class="font-semibold text-primary">$${item.price.toFixed(2)}</p>
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

        this.updateCartUI();
        this.showCartContainer();
    }

    updateCartUI() {
        const itemCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        document.getElementById('cartItemCount').textContent = `${itemCount} items`;
        document.getElementById('cartTotal').textContent = `$${total.toFixed(2)}`;
    }

    showCartContainer() {
        if (this.cart.length > 0) {
            document.getElementById('cartContainer').classList.remove('hidden');
        } else {
            document.getElementById('cartContainer').classList.add('hidden');
        }
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
                        <p class="text-primary font-semibold">$${item.price.toFixed(2)}</p>
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
        const deliveryFee = 2.50;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + deliveryFee + tax;

        document.getElementById('cartSubtotal').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('taxAmount').textContent = `$${tax.toFixed(2)}`;
        document.getElementById('finalTotal').textContent = `$${total.toFixed(2)}`;
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
        const deliveryFee = 2.50;
        const tax = subtotal * 0.08;
        const total = subtotal + deliveryFee + tax;

        container.innerHTML = `
            ${this.cart.map(item => `
                <div class="flex justify-between">
                    <span>${item.name} x${item.quantity}</span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="border-t pt-2 mt-2 space-y-1">
                <div class="flex justify-between">
                    <span>Subtotal</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>$${deliveryFee.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Tax</span>
                    <span>$${tax.toFixed(2)}</span>
                </div>
                <div class="flex justify-between font-semibold text-base border-t pt-1">
                    <span>Total</span>
                    <span>$${total.toFixed(2)}</span>
                </div>
            </div>
        `;

        document.getElementById('checkoutTotal').textContent = `$${total.toFixed(2)}`;
    }

    async placeOrder() {
        if (this.cart.length === 0) return;

        // Collect order data
        const deliveryAddress = document.getElementById('deliveryAddressInput').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const specialInstructions = document.getElementById('specialInstructions').value;
        
        let recipientInfo = null;
        if (document.getElementById('orderForOthersCheckbox').checked) {
            recipientInfo = {
                name: document.getElementById('recipientName').value,
                phone: document.getElementById('recipientPhone').value,
                address: document.getElementById('recipientAddress').value || deliveryAddress
            };
        }

        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = 2.50;
        const tax = subtotal * 0.08;
        const total = subtotal + deliveryFee + tax;

        const orderData = {
            items: this.cart,
            restaurantId: this.cart[0].restaurantId,
            restaurantName: this.cart[0].restaurantName,
            deliveryAddress: {
                address: deliveryAddress,
                coordinates: this.userLocation
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
            // Send order data back to Telegram bot
            this.tg.sendData(JSON.stringify(orderData));
            
            // Show success message
            this.showSuccessMessage('Order placed successfully! You will receive a confirmation message in the chat.');
            
            // Close modal and reset cart
            this.closeCheckoutModal();
            this.cart = [];
            this.updateCartUI();
            this.showCartContainer();
            
        } catch (error) {
            console.error('Error placing order:', error);
            this.showError('Failed to place order. Please try again.');
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
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BeUDeliveryApp();
});