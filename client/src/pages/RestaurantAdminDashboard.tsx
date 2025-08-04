import { useState } from 'react';
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
  Users, 
  Utensils, 
  ShoppingCart, 
  DollarSign, 
  Plus, 
  UserPlus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useLocation } from 'wouter';

// Types
interface DashboardStats {
  todayOrders: number;
  todaySales: number;
  totalMenuItems: number;
  activeMenuItems: number;
  pendingOrders: number;
  preparingOrders: number;
}

interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  items?: MenuItem[];
}

interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: string;
  isAvailable: boolean;
  preparationTime?: number;
  ingredients: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  spicyLevel: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'assigned' | 'picked_up' | 'delivered' | 'cancelled';
  items: any[];
  total: string;
  createdAt: string;
  customerNotes?: string;
}

interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

// Form schemas
const menuCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional()
});

const menuItemSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive'),
  isAvailable: z.boolean(),
  preparationTime: z.number().optional(),
  ingredients: z.string().optional(),
  isVegetarian: z.boolean(),
  isVegan: z.boolean(),
  spicyLevel: z.number().min(0).max(5)
});

const staffMemberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Valid email is required')
});

type MenuCategoryFormData = z.infer<typeof menuCategorySchema>;
type MenuItemFormData = z.infer<typeof menuItemSchema>;
type StaffMemberFormData = z.infer<typeof staffMemberSchema>;

function RestaurantAdminDashboardContent() {
  const { user } = useAdminAuth();
  const [, navigate] = useLocation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStaffPassword, setNewStaffPassword] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get user's restaurant ID
  const restaurantId = (user as any)?.restaurantId;

  // Forms
  const categoryForm = useForm<MenuCategoryFormData>({
    resolver: zodResolver(menuCategorySchema),
    defaultValues: { name: '', description: '' }
  });

  const itemForm = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      categoryId: '',
      name: '',
      description: '',
      price: 0,
      isAvailable: true,
      preparationTime: 0,
      ingredients: '',
      isVegetarian: false,
      isVegan: false,
      spicyLevel: 0
    }
  });

  const staffForm = useForm<StaffMemberFormData>({
    resolver: zodResolver(staffMemberSchema),
    defaultValues: { firstName: '', lastName: '', email: '' }
  });

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: [`/api/restaurants/${restaurantId}/dashboard/stats`],
    enabled: !!restaurantId
  });

  const { data: menu = [] } = useQuery<MenuCategory[]>({
    queryKey: [`/api/restaurants/${restaurantId}/menu`],
    enabled: !!restaurantId
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: [`/api/restaurants/${restaurantId}/orders`],
    enabled: !!restaurantId
  });

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: [`/api/restaurants/${restaurantId}/staff`],
    enabled: !!restaurantId
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: MenuCategoryFormData) =>
      fetch(`/api/restaurants/${restaurantId}/menu/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to create category');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/menu`] });
      setIsCategoryDialogOpen(false);
      categoryForm.reset();
      toast({ title: 'Success', description: 'Category created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const createItemMutation = useMutation({
    mutationFn: (data: MenuItemFormData) => {
      const submitData = {
        ...data,
        ingredients: data.ingredients ? data.ingredients.split(',').map(s => s.trim()) : []
      };
      return fetch(`/api/restaurants/${restaurantId}/menu/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to create item');
        }
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/menu`] });
      setIsItemDialogOpen(false);
      itemForm.reset();
      toast({ title: 'Success', description: 'Menu item created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const createStaffMutation = useMutation({
    mutationFn: (data: StaffMemberFormData) =>
      fetch(`/api/restaurants/${restaurantId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to create staff member');
        }
        return res.json();
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/staff`] });
      setIsStaffDialogOpen(false);
      staffForm.reset();
      setNewStaffPassword(data.temporaryPassword);
      toast({ title: 'Success', description: 'Kitchen staff created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      fetch(`/api/restaurants/${restaurantId}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to update order status');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/orders`] });
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/dashboard/stats`] });
      toast({ title: 'Success', description: 'Order status updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/restaurant-admin-login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/restaurant-admin-login');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Password copied to clipboard' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your restaurant operations and menu</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            Welcome, {(user as any)?.firstName || 'Admin'}
          </span>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'menu', label: 'Menu Management' },
          { id: 'orders', label: 'Orders' },
          { id: 'staff', label: 'Staff Management' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              selectedTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.todayOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.pendingOrders || 0} pending, {stats?.preparingOrders || 0} preparing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.todaySales?.toFixed(2) || '0.00'} ETB</div>
                <p className="text-xs text-muted-foreground">
                  Revenue for today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalMenuItems || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.activeMenuItems || 0} available
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Order #{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.items.length} items • {order.total} ETB
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Menu Management Tab */}
      {selectedTab === 'menu' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Menu Management</h2>
            <div className="space-x-2">
              <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Menu Category</DialogTitle>
                    <DialogDescription>
                      Add a new category to organize your menu items
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Appetizers, Main Courses" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={categoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Brief description of this category" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" disabled={createCategoryMutation.isPending}>
                        {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Menu Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Menu Item</DialogTitle>
                    <DialogDescription>
                      Create a new item for your restaurant menu
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...itemForm}>
                    <form onSubmit={itemForm.handleSubmit((data) => createItemMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={itemForm.control}
                        name="categoryId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {menu.map((category) => (
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
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={itemForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Margherita Pizza" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price (ETB)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={itemForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Describe the dish..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={itemForm.control}
                        name="ingredients"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ingredients (comma-separated)</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., tomato, cheese, basil" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={itemForm.control}
                          name="preparationTime"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prep Time (mins)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="15" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="spicyLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spicy Level (0-5)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="5" 
                                  placeholder="0" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex space-x-4">
                        <FormField
                          control={itemForm.control}
                          name="isAvailable"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Available</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="isVegetarian"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Vegetarian</FormLabel>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={itemForm.control}
                          name="isVegan"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel>Vegan</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Button type="submit" disabled={createItemMutation.isPending}>
                        {createItemMutation.isPending ? 'Creating...' : 'Create Menu Item'}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Menu Categories and Items */}
          <div className="space-y-6">
            {menu.map((category) => (
              <Card key={category.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {category.name}
                    <Badge variant={category.isActive ? 'default' : 'secondary'}>
                      {category.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardTitle>
                  {category.description && (
                    <CardDescription>{category.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">{item.name}</h4>
                            {item.isVegetarian && <Badge variant="outline" className="text-xs">Vegetarian</Badge>}
                            {item.isVegan && <Badge variant="outline" className="text-xs">Vegan</Badge>}
                            {item.spicyLevel > 0 && <Badge variant="outline" className="text-xs">🌶️ {item.spicyLevel}</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="font-semibold">{item.price} ETB</span>
                            {item.preparationTime && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {item.preparationTime}min
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={item.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </Badge>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!category.items || category.items.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">No items in this category yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {menu.length === 0 && (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    No menu categories yet. Create your first category to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Orders Tab */}
      {selectedTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Order Management</h2>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>Manage incoming orders and track their status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                      <TableCell>{order.items.length} items</TableCell>
                      <TableCell>{order.total} ETB</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          {order.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'confirmed' })}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'preparing' })}
                            >
                              <Clock className="w-3 h-3" />
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
                            >
                              <AlertCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {orders.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No orders yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Management Tab */}
      {selectedTab === 'staff' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Staff Management</h2>
            <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Kitchen Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Kitchen Staff</DialogTitle>
                  <DialogDescription>
                    Create a new kitchen staff account. A temporary password will be generated.
                  </DialogDescription>
                </DialogHeader>
                <Form {...staffForm}>
                  <form onSubmit={staffForm.handleSubmit((data) => createStaffMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={staffForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={staffForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={staffForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createStaffMutation.isPending}>
                      {createStaffMutation.isPending ? 'Creating...' : 'Create Staff Account'}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Kitchen Staff</CardTitle>
              <CardDescription>Manage your restaurant's kitchen staff members</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.firstName} {member.lastName}
                      </TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {member.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(member.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {staff.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No staff members yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Order Details - #{selectedOrder.orderNumber}</DialogTitle>
              <DialogDescription>
                Order placed on {new Date(selectedOrder.createdAt).toLocaleString()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Status:</span>
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {selectedOrder.status}
                </Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Items:</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 border rounded">
                      <span>{item.name} x{item.quantity}</span>
                      <span>{(item.price * item.quantity).toFixed(2)} ETB</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span>{selectedOrder.total} ETB</span>
              </div>
              {selectedOrder.customerNotes && (
                <div>
                  <h4 className="font-medium mb-2">Customer Notes:</h4>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedOrder.customerNotes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* New Staff Password Dialog */}
      {newStaffPassword && (
        <Dialog open={!!newStaffPassword} onOpenChange={() => setNewStaffPassword('')}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Staff Account Created</DialogTitle>
              <DialogDescription>
                The kitchen staff account has been created successfully. Please share this temporary password with the new staff member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg">{newStaffPassword}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newStaffPassword)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                The staff member should change this password upon first login.
              </p>
              <Button onClick={() => setNewStaffPassword('')} className="w-full">
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function RestaurantAdminDashboard() {
  const { user, isLoading, isAuthenticated } = useAdminAuth();
  const [, navigate] = useLocation();

  // Auth check
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

  if (!isAuthenticated || (user as any)?.role !== 'restaurant_admin') {
    navigate('/restaurant-admin-login');
    return null;
  }

  return <RestaurantAdminDashboardContent />;
}