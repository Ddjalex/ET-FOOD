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
  Package
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

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
            {menuLoading ? (
              <div className="text-center py-8">Loading menu...</div>
            ) : (
              menu.categories.map((category: MenuCategory) => (
                <Card key={category.id}>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>{category.name}</CardTitle>
                      {category.status === 'pending_approval' && (
                        <Badge variant="secondary">Pending Approval</Badge>
                      )}
                    </div>
                    {category.description && (
                      <CardDescription>{category.description}</CardDescription>
                    )}
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
      </div>
    </div>
  );
}