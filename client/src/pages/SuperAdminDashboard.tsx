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
import { Users, Building2, Truck, DollarSign, Plus, UserPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalRestaurants: number;
  activeRestaurants: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingDrivers: number;
  totalOrders: number;
  revenue: number;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  isApproved: boolean;
  rating: string;
  totalOrders: number;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantId?: string;
  isActive: boolean;
  createdAt: string;
  restaurant?: {
    name: string;
  };
}

// Form schemas
const restaurantFormSchema = z.object({
  name: z.string().min(1, 'Restaurant name is required'),
  address: z.string().min(1, 'Address is required'),
  phoneNumber: z.string().min(1, 'Phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  description: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal(''))
});

const adminFormSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  restaurantId: z.string().min(1, 'Restaurant selection is required')
});

type RestaurantFormData = z.infer<typeof restaurantFormSchema>;
type AdminFormData = z.infer<typeof adminFormSchema>;

export default function SuperAdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRestaurantDialogOpen, setIsRestaurantDialogOpen] = useState(false);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const restaurantForm = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantFormSchema),
    defaultValues: {
      name: '',
      address: '',
      phoneNumber: '',
      email: '',
      description: '',
      imageUrl: ''
    }
  });

  const adminForm = useForm<AdminFormData>({
    resolver: zodResolver(adminFormSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      restaurantId: ''
    }
  });

  // Queries
  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: restaurants = [] } = useQuery<Restaurant[]>({
    queryKey: ['/api/superadmin/restaurants'],
  });

  const { data: admins = [] } = useQuery<AdminUser[]>({
    queryKey: ['/api/superadmin/admins'],
  });

  // Mutations
  const createRestaurantMutation = useMutation({
    mutationFn: (data: RestaurantFormData) => 
      fetch('/api/superadmin/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to create restaurant');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/restaurants'] });
      setIsRestaurantDialogOpen(false);
      restaurantForm.reset();
      toast({
        title: 'Success',
        description: 'Restaurant created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create restaurant',
        variant: 'destructive'
      });
    }
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: AdminFormData) => 
      fetch('/api/superadmin/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || 'Failed to create admin');
        }
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/admins'] });
      setIsAdminDialogOpen(false);
      adminForm.reset();
      toast({
        title: 'Success',
        description: 'Restaurant admin created successfully'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create admin',
        variant: 'destructive'
      });
    }
  });

  const onCreateRestaurant = (data: RestaurantFormData) => {
    createRestaurantMutation.mutate(data);
  };

  const onCreateAdmin = (data: AdminFormData) => {
    createAdminMutation.mutate(data);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage all restaurants, admins, and system operations</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 border-b">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'restaurants', label: 'Restaurants' },
          { id: 'admins', label: 'Admins' }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Restaurants</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{restaurants.length}</div>
                <p className="text-xs text-muted-foreground">
                  {restaurants.filter(r => r.isActive).length} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{admins.length}</div>
                <p className="text-xs text-muted-foreground">
                  {admins.filter(a => a.role === 'restaurant_admin').length} restaurant admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  All time orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.revenue || 0} ETB</div>
                <p className="text-xs text-muted-foreground">
                  Total revenue
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Restaurants</CardTitle>
                <CardDescription>Latest restaurant registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {restaurants.slice(0, 5).map((restaurant) => (
                    <div key={restaurant.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                      </div>
                      <Badge variant={restaurant.isActive ? 'default' : 'secondary'}>
                        {restaurant.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Admins</CardTitle>
                <CardDescription>Latest admin user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {admins.slice(0, 5).map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{admin.firstName} {admin.lastName}</p>
                        <p className="text-sm text-muted-foreground">{admin.email}</p>
                      </div>
                      <Badge variant="outline">
                        {admin.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Restaurants Tab */}
      {selectedTab === 'restaurants' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Restaurant Management</h2>
            
            <Dialog open={isRestaurantDialogOpen} onOpenChange={setIsRestaurantDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Restaurant
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Restaurant</DialogTitle>
                  <DialogDescription>
                    Add a new restaurant to the platform.
                  </DialogDescription>
                </DialogHeader>
                <Form {...restaurantForm}>
                  <form onSubmit={restaurantForm.handleSubmit(onCreateRestaurant)} className="space-y-4">
                    <FormField
                      control={restaurantForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter restaurant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter full address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={restaurantForm.control}
                      name="imageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter logo URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsRestaurantDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRestaurantMutation.isPending}>
                        {createRestaurantMutation.isPending ? 'Creating...' : 'Create Restaurant'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Restaurants</CardTitle>
              <CardDescription>Manage restaurant listings and status</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {restaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{restaurant.name}</p>
                          <p className="text-sm text-muted-foreground">{restaurant.address}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{restaurant.phoneNumber}</p>
                          {restaurant.email && (
                            <p className="text-sm text-muted-foreground">{restaurant.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={restaurant.isActive ? 'default' : 'secondary'}>
                          {restaurant.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{restaurant.totalOrders}</TableCell>
                      <TableCell>⭐ {restaurant.rating}</TableCell>
                      <TableCell>{new Date(restaurant.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admins Tab */}
      {selectedTab === 'admins' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Admin Management</h2>
            
            <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create New Restaurant Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Restaurant Admin</DialogTitle>
                  <DialogDescription>
                    Create a new admin user for a restaurant.
                  </DialogDescription>
                </DialogHeader>
                <Form {...adminForm}>
                  <form onSubmit={adminForm.handleSubmit(onCreateAdmin)} className="space-y-4">
                    <FormField
                      control={adminForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={adminForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adminForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={adminForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adminForm.control}
                      name="restaurantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Restaurant</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a restaurant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {restaurants.map((restaurant) => (
                                <SelectItem key={restaurant.id} value={restaurant.id}>
                                  {restaurant.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createAdminMutation.isPending}>
                        {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Admin Users</CardTitle>
              <CardDescription>Manage admin users and their restaurant assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.firstName} {admin.lastName}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {admin.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {admin.restaurantId ? (
                          restaurants.find(r => r.id === admin.restaurantId)?.name || 'Unknown'
                        ) : (
                          <span className="text-muted-foreground">No restaurant assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.isActive ? 'default' : 'secondary'}>
                          {admin.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(admin.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}