import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Plus,
  Edit,
  Eye,
  Timer,
  Play,
  Package,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Type definitions to match our database schema
interface MenuCategory {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface MenuItem {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isAvailable: boolean;
  preparationTime?: number;
  isVegetarian: boolean;
  isVegan: boolean;
  spicyLevel: number;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  restaurantId: string;
  status: string;
  items: any[];
  subtotal: number;
  total: number;
  createdAt: string;
}

// Form schemas for menu management
const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  sortOrder: z.number().min(0).default(0),
});

const menuItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  preparationTime: z.number().min(1).max(120).optional(),
  isVegetarian: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  spicyLevel: z.number().min(0).max(5).default(0),
  isAvailable: z.boolean().default(true),
});

// Kitchen Staff Login Component
function KitchenLoginForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const loginForm = useForm({
    resolver: zodResolver(z.object({
      email: z.string().email('Please enter a valid email'),
      password: z.string().min(1, 'Password is required')
    })),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      toast({ title: 'Login successful' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/me'] });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Login failed', 
        description: error.message || 'Invalid credentials',
        variant: 'destructive' 
      });
    }
  });

  const onSubmit = (data: { email: string; password: string }) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <ChefHat className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Kitchen Staff Login</CardTitle>
          <CardDescription>
            Sign in to access the kitchen dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Enter your email"
                        data-testid="input-email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your password"
                        data-testid="input-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-login"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact your restaurant manager
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Types
interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName?: string;
  items: OrderItem[];
  status: string;
  total: number;
  createdAt: string;
  customerNotes?: string;
  unavailableItems?: string[];
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  isAvailable: boolean;
  status: 'active' | 'pending_approval' | 'rejected';
  preparationTime?: number;
  isVegetarian: boolean;
  isVegan: boolean;
  spicyLevel: number;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  status: 'active' | 'pending_approval' | 'rejected';
  items?: MenuItem[];
}

export function KitchenDashboard() {
  const { user, isLoading, isAuthenticated } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [availabilityCheck, setAvailabilityCheck] = useState<{[key: string]: boolean}>({});
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Type-safe user with proper typing
  const typedUser = user as any;

  // Always call hooks first - never conditionally
  // Get restaurant orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/restaurants', typedUser?.restaurantId, 'orders'],
    enabled: !!typedUser?.restaurantId && isAuthenticated,
  });

  // Get restaurant menu
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['/api/restaurants', typedUser?.restaurantId, 'menu'],
    enabled: !!typedUser?.restaurantId && selectedTab === 'menu' && isAuthenticated,
  });

  // Type-safe menu data
  const menu = menuData as { categories: MenuCategory[], items: MenuItem[] } || { categories: [], items: [] };
  const typedOrders = orders as Order[];

  // Always call mutations (React hooks must be called in same order)
  
  // Category management mutations  
  const addCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof categorySchema>) => {
      const response = await apiRequest('POST', `/api/kitchen/${typedUser?.restaurantId}/menu/categories`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'menu'] });
      toast({ title: 'Category added successfully' });
      setShowAddCategory(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add category', description: error.message, variant: 'destructive' });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof categorySchema> }) => {
      const response = await apiRequest('PUT', `/api/restaurants/${typedUser?.restaurantId}/categories/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'menu'] });
      toast({ title: 'Category updated successfully' });
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update category', description: error.message, variant: 'destructive' });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await apiRequest('DELETE', `/api/restaurants/${typedUser?.restaurantId}/categories/${categoryId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'menu'] });
      toast({ title: 'Category deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete category', description: error.message, variant: 'destructive' });
    }
  });

  // Menu item management mutations
  const addMenuItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof menuItemSchema>) => {
      const response = await apiRequest('POST', `/api/kitchen/${typedUser?.restaurantId}/menu/items`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'menu'] });
      toast({ title: 'Menu item added successfully' });
      setShowAddItem(false);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to add menu item', description: error.message, variant: 'destructive' });
    }
  });

  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof menuItemSchema> }) => {
      const response = await apiRequest('PUT', `/api/restaurants/${typedUser?.restaurantId}/menu-items/${id}`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'menu'] });
      toast({ title: 'Menu item updated successfully' });
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update menu item', description: error.message, variant: 'destructive' });
    }
  });

  const deleteMenuItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await apiRequest('DELETE', `/api/restaurants/${typedUser?.restaurantId}/menu-items/${itemId}`);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'menu'] });
      toast({ title: 'Menu item deleted successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to delete menu item', description: error.message, variant: 'destructive' });
    }
  });

  const checkAvailabilityMutation = useMutation({
    mutationFn: async ({ orderId, unavailableItems }: { orderId: string; unavailableItems: string[] }) => {
      const response = await fetch(`/api/kitchen/${typedUser?.restaurantId}/orders/${orderId}/check-availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unavailableItems }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update availability');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'orders'] });
      toast({ title: 'Order availability updated' });
      setSelectedOrder(null);
      setAvailabilityCheck({});
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update availability', description: error.message, variant: 'destructive' });
    }
  });

  const startPrepareMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/kitchen/${typedUser?.restaurantId}/orders/${orderId}/start-prepare`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to start preparation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'orders'] });
      toast({ title: 'Order preparation started' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to start preparation', description: error.message, variant: 'destructive' });
    }
  });

  const readyForPickupMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/kitchen/${typedUser?.restaurantId}/orders/${orderId}/ready-for-pickup`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to mark order ready');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'orders'] });
      toast({ title: 'Order marked as ready for pickup' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to mark order ready', description: error.message, variant: 'destructive' });
    }
  });

  // Mutation for availability toggle
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) => {
      const response = await fetch(`/api/kitchen/${typedUser?.restaurantId}/menu/items/${itemId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable }),
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to update availability');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/restaurants', typedUser?.restaurantId, 'menu'] });
      toast({ title: 'Item availability updated' });
    },
    onError: (error: any) => {
      toast({ title: 'Failed to update availability', description: error.message, variant: 'destructive' });
    }
  });

  // Conditional rendering AFTER all hooks are called
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <KitchenLoginForm />;
  }

  // Check if user has kitchen staff role
  if (typedUser.role !== 'kitchen_staff') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Only kitchen staff can access this dashboard. You are currently logged in as: {typedUser.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              To access the kitchen dashboard, you need to log in with kitchen staff credentials.
            </p>
            <Button 
              onClick={() => window.location.href = '/admin-login'}
              className="w-full"
            >
              Switch to Kitchen Staff Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCheckAvailability = (order: Order) => {
    setSelectedOrder(order);
    const initialCheck: {[key: string]: boolean} = {};
    order.items.forEach(item => {
      initialCheck[item.id] = true; // Default to available
    });
    setAvailabilityCheck(initialCheck);
  };

  const handleSubmitAvailability = () => {
    if (!selectedOrder) return;
    
    const unavailableItems = Object.entries(availabilityCheck)
      .filter(([_, isAvailable]) => !isAvailable)
      .map(([itemId]) => itemId);

    checkAvailabilityMutation.mutate({
      orderId: selectedOrder.id,
      unavailableItems
    });
  };

  const getOrderStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary', label: 'Pending', icon: Clock },
      confirmed: { variant: 'default', label: 'Confirmed', icon: CheckCircle },
      preparing: { variant: 'default', label: 'Ready to Prepare', icon: ChefHat },
      in_preparation: { variant: 'default', label: 'In Preparation', icon: Timer },
      ready_for_pickup: { variant: 'default', label: 'Ready for Pickup', icon: Package },
      awaiting_admin_intervention: { variant: 'destructive', label: 'Needs Admin', icon: AlertCircle },
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || { variant: 'secondary', label: status, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const renderOrderCard = (order: Order) => (
    <Card key={order.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{order.orderNumber}</CardTitle>
            <CardDescription>
              {new Date(order.createdAt).toLocaleTimeString()} • ${order.total}
            </CardDescription>
          </div>
          {getOrderStatusBadge(order.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium mb-2">Items:</h4>
            <ul className="space-y-1">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${item.price}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {order.customerNotes && (
            <div>
              <h4 className="font-medium mb-1">Customer Notes:</h4>
              <p className="text-sm text-muted-foreground">{order.customerNotes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {order.status === 'confirmed' && (
              <Button
                onClick={() => handleCheckAvailability(order)}
                className="flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Check Availability
              </Button>
            )}
            
            {order.status === 'preparing' && (
              <Button
                onClick={() => startPrepareMutation.mutate(order.id)}
                disabled={startPrepareMutation.isPending}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Start Prepare
              </Button>
            )}
            
            {order.status === 'in_preparation' && (
              <Button
                onClick={() => readyForPickupMutation.mutate(order.id)}
                disabled={readyForPickupMutation.isPending}
                className="flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Ready for Pickup
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Kitchen Dashboard</h1>
          <p className="text-muted-foreground">Manage orders and menu items</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white p-1 rounded-lg border">
            <button
              onClick={() => setSelectedTab('orders')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedTab === 'orders'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Order Queue
            </button>
            <button
              onClick={() => setSelectedTab('menu')}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedTab === 'menu'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              Menu Management
            </button>
          </div>
        </div>

        {/* Orders Tab */}
        {selectedTab === 'orders' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Incoming Orders</CardTitle>
                <CardDescription>Real-time order queue for kitchen preparation</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="text-center py-8">Loading orders...</div>
                ) : typedOrders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders in queue
                  </div>
                ) : (
                  <div className="space-y-4">
                    {typedOrders.map(renderOrderCard)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Menu Tab */}
        {selectedTab === 'menu' && (
          <div className="space-y-6">
            {/* Menu Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">Menu Management</h2>
                <p className="text-muted-foreground">Manage categories and menu items for your restaurant</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddCategory(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Category
                </Button>
                <Button onClick={() => setShowAddItem(true)} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Menu Item
                </Button>
              </div>
            </div>

            {menuLoading ? (
              <div className="text-center py-8">Loading menu...</div>
            ) : menu.categories && menu.categories.length > 0 ? (
              menu.categories.map((category: MenuCategory) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {category.name}
                          {category.status === 'pending_approval' && (
                            <Badge variant="secondary">Pending Approval</Badge>
                          )}
                        </CardTitle>
                        {category.description && (
                          <CardDescription>{category.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this category?')) {
                              deleteCategoryMutation.mutate(category.id);
                            }
                          }}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          disabled={deleteCategoryMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {category.items?.map((item: MenuItem) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{item.name}</h4>
                              {item.status === 'pending_approval' && (
                                <Badge variant="secondary" className="text-xs">Pending</Badge>
                              )}
                              {item.isVegetarian && <Badge variant="outline" className="text-xs">Vegetarian</Badge>}
                              {item.isVegan && <Badge variant="outline" className="text-xs">Vegan</Badge>}
                              {item.spicyLevel > 0 && <Badge variant="outline" className="text-xs">🌶️ {item.spicyLevel}</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="font-semibold">${item.price}</span>
                              {item.preparationTime && (
                                <span className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {item.preparationTime}min
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingItem(item)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this menu item?')) {
                                  deleteMenuItemMutation.mutate(item.id);
                                }
                              }}
                              className="flex items-center gap-1 text-red-600 hover:text-red-700"
                              disabled={deleteMenuItemMutation.isPending}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </Button>
                            <Button
                              variant={item.isAvailable ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleAvailabilityMutation.mutate({ 
                                itemId: item.id, 
                                isAvailable: !item.isAvailable 
                              })}
                              disabled={toggleAvailabilityMutation.isPending || item.status !== 'active'}
                            >
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(!category.items || category.items.length === 0) && (
                        <p className="text-muted-foreground text-center py-4">No items in this category</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No menu categories found
              </div>
            )}
          </div>
        )}

        {/* Availability Check Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Check Item Availability</DialogTitle>
              <DialogDescription>
                Mark which items are available for order {selectedOrder?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedOrder?.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{item.quantity}x {item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant={availabilityCheck[item.id] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAvailabilityCheck(prev => ({ ...prev, [item.id]: true }))}
                    >
                      Available
                    </Button>
                    <Button
                      variant={!availabilityCheck[item.id] ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => setAvailabilityCheck(prev => ({ ...prev, [item.id]: false }))}
                    >
                      Not Available
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitAvailability}
                  disabled={checkAvailabilityMutation.isPending}
                >
                  {checkAvailabilityMutation.isPending ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <CategoryFormDialog
          open={showAddCategory}
          onOpenChange={setShowAddCategory}
          onSubmit={(data) => addCategoryMutation.mutate(data)}
          isLoading={addCategoryMutation.isPending}
          title="Add New Category"
        />

        {/* Edit Category Dialog */}
        <CategoryFormDialog
          open={!!editingCategory}
          onOpenChange={() => setEditingCategory(null)}
          onSubmit={(data) => updateCategoryMutation.mutate({ id: editingCategory!.id, data })}
          isLoading={updateCategoryMutation.isPending}
          title="Edit Category"
          initialData={editingCategory}
        />

        {/* Add Menu Item Dialog */}
        <MenuItemFormDialog
          open={showAddItem}
          onOpenChange={setShowAddItem}
          onSubmit={(data) => addMenuItemMutation.mutate(data)}
          isLoading={addMenuItemMutation.isPending}
          title="Add New Menu Item"
          categories={menu.categories || []}
        />

        {/* Edit Menu Item Dialog */}
        <MenuItemFormDialog
          open={!!editingItem}
          onOpenChange={() => setEditingItem(null)}
          onSubmit={(data) => updateMenuItemMutation.mutate({ id: editingItem!.id, data })}
          isLoading={updateMenuItemMutation.isPending}
          title="Edit Menu Item"
          categories={menu.categories || []}
          initialData={editingItem}
        />
      </div>
    </div>
  );
}

// Category Form Dialog Component
function CategoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  title,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof categorySchema>) => void;
  isLoading: boolean;
  title: string;
  initialData?: MenuCategory | null;
}) {
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      sortOrder: initialData?.sortOrder || 0,
    }
  });

  const handleSubmit = (data: z.infer<typeof categorySchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update category information' : 'Create a new menu category'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Appetizers, Main Courses" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Brief description of this category" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sort Order</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="0"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Menu Item Form Dialog Component
function MenuItemFormDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  title,
  categories,
  initialData
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof menuItemSchema>) => void;
  isLoading: boolean;
  title: string;
  categories: MenuCategory[];
  initialData?: MenuItem | null;
}) {
  const form = useForm({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      categoryId: initialData?.categoryId || '',
      preparationTime: initialData?.preparationTime || undefined,
      isVegetarian: initialData?.isVegetarian || false,
      isVegan: initialData?.isVegan || false,
      spicyLevel: initialData?.spicyLevel || 0,
      isAvailable: initialData?.isAvailable !== false,
    }
  });

  const handleSubmit = (data: z.infer<typeof menuItemSchema>) => {
    onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update menu item information' : 'Add a new item to your menu'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Margherita Pizza" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe the dish, ingredients, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        min="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="preparationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prep Time (minutes)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1"
                        max="120"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        placeholder="15"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="spicyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spicy Level (0-5)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((level) => (
                          <SelectItem key={level} value={level.toString()}>
                            {level === 0 ? 'Not Spicy' : `🌶️ ${level}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Available</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Item is available for ordering
                      </div>
                    </div>
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Dietary Options</div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isVegetarian"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm">Vegetarian</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isVegan"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm">Vegan</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : (initialData ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}