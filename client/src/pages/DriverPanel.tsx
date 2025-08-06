import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Package, 
  User, 
  Phone, 
  Star,
  Navigation,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck
} from 'lucide-react';
import { formatDistance } from 'date-fns';

interface Order {
  id: string;
  orderNumber: string;
  restaurantId: string;
  restaurant: {
    name: string;
    address: string;
    phoneNumber: string;
    location: { lat: number; lng: number } | null;
  };
  customer: {
    name: string;
    phoneNumber: string;
  };
  status: string;
  total: number;
  deliveryAddress: string;
  deliveryLocation: { lat: number; lng: number } | null;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  estimatedDeliveryTime: string | null;
  customerNotes: string | null;
  createdAt: string;
}

interface Driver {
  id: string;
  name: string;
  phoneNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  currentLocation: { lat: number; lng: number } | null;
  status: string;
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  todayEarnings: number;
  weeklyEarnings: number;
}

function DriverPanel() {
  const [currentDriverId, setCurrentDriverId] = useState<string>('demo-driver-id');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for driver authentication
  useEffect(() => {
    const driverAuth = localStorage.getItem('driverAuth');
    if (!driverAuth) {
      window.location.href = '/driver-login';
      return;
    }
    
    try {
      const driver = JSON.parse(driverAuth);
      setCurrentDriverId(driver.id);
    } catch (error) {
      console.error('Invalid driver auth data');
      localStorage.removeItem('driverAuth');
      window.location.href = '/driver-login';
    }
  }, []);

  // Fetch driver profile
  const { data: driver, isLoading: driverLoading } = useQuery<Driver>({
    queryKey: ['/api/drivers/profile', currentDriverId],
    queryFn: () => fetch(`/api/drivers/profile?driverId=${currentDriverId}`).then(res => res.json()),
    enabled: !!currentDriverId,
  });

  // Fetch available orders for approved drivers
  const { data: availableOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/drivers/available-orders'],
    enabled: driver?.isApproved && driver?.isOnline,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch assigned orders
  const { data: assignedOrders = [], isLoading: assignedLoading } = useQuery<Order[]>({
    queryKey: ['/api/drivers/assigned-orders', currentDriverId],
    queryFn: () => fetch(`/api/drivers/assigned-orders?driverId=${currentDriverId}`).then(res => res.json()),
    enabled: !!currentDriverId,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Accept order mutation
  const acceptOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await fetch(`/api/drivers/accept-order/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: currentDriverId }),
      });
      if (!response.ok) throw new Error('Failed to accept order');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/available-orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/assigned-orders'] });
      toast({
        title: "Order Accepted",
        description: "You have successfully accepted the delivery order.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await fetch(`/api/drivers/update-order-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (!response.ok) throw new Error('Failed to update order status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/assigned-orders'] });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Toggle availability mutation
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/drivers/toggle-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driverId: currentDriverId }),
      });
      if (!response.ok) throw new Error('Failed to toggle availability');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/profile'] });
      toast({
        title: "Availability Updated",
        description: `You are now ${driver?.isAvailable ? 'unavailable' : 'available'} for deliveries.`,
      });
    },
  });

  const calculateDistance = (location1: { lat: number; lng: number }, location2: { lat: number; lng: number }) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (location2.lat - location1.lat) * Math.PI / 180;
    const dLng = (location2.lng - location1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(location1.lat * Math.PI / 180) * Math.cos(location2.lat * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'ready_for_pickup': 'bg-blue-500',
      'driver_assigned': 'bg-yellow-500',
      'picked_up': 'bg-orange-500',
      'delivered': 'bg-green-500',
      'cancelled': 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getStatusText = (status: string) => {
    const texts = {
      'ready_for_pickup': 'Ready for Pickup',
      'driver_assigned': 'Assigned to You',
      'picked_up': 'Picked Up',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (!driver?.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle>Driver Approval Pending</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your driver account is pending approval from the super admin. 
              You will be able to accept delivery orders once approved.
            </p>
            <Badge variant="secondary" className="text-sm">
              Status: {driver?.status || 'Pending'}
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Driver Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {driver?.name}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge 
                variant={driver?.isOnline ? "default" : "secondary"}
                className="text-sm"
              >
                {driver?.isOnline ? 'Online' : 'Offline'}
              </Badge>
              <Button
                onClick={() => toggleAvailabilityMutation.mutate()}
                variant={driver?.isAvailable ? "destructive" : "default"}
                disabled={toggleAvailabilityMutation.isPending || !driver?.isOnline}
                data-testid="button-toggle-availability"
              >
                {driver?.isAvailable ? 'Go Unavailable' : 'Go Available'}
              </Button>
            </div>
          </div>
        </div>

        {/* Driver Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Rating</p>
                  <p className="text-2xl font-bold" data-testid="text-driver-rating">
                    {driver?.rating || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Deliveries</p>
                  <p className="text-2xl font-bold" data-testid="text-total-deliveries">
                    {driver?.totalDeliveries || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Earnings</p>
                  <p className="text-2xl font-bold" data-testid="text-today-earnings">
                    ${driver?.todayEarnings || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Truck className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Vehicle</p>
                  <p className="text-lg font-semibold" data-testid="text-vehicle-info">
                    {driver?.vehicleType} - {driver?.vehiclePlate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="available" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="available" data-testid="tab-available-orders">
              Available Orders ({availableOrders.length})
            </TabsTrigger>
            <TabsTrigger value="assigned" data-testid="tab-assigned-orders">
              My Orders ({assignedOrders.length})
            </TabsTrigger>
          </TabsList>

          {/* Available Orders */}
          <TabsContent value="available" className="space-y-4">
            {!driver?.isAvailable && (
              <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-yellow-700 dark:text-yellow-300">
                      You need to be available to see and accept orders.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {ordersLoading ? (
              <div className="text-center py-8">
                <p>Loading available orders...</p>
              </div>
            ) : availableOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No orders available for delivery at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {availableOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Order #{order.orderNumber}
                        </CardTitle>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="h-4 w-4" />
                        {formatDistance(new Date(order.createdAt), new Date(), { addSuffix: true })}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Restaurant Info */}
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{order.restaurant.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.restaurant.address}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{order.restaurant.phoneNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <User className="h-5 w-5 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{order.customer.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {order.deliveryAddress}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-4 w-4" />
                            <span className="text-sm">{order.customer.phoneNumber}</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2">
                        <p className="font-medium text-sm">Order Items:</p>
                        <div className="space-y-1">
                          {order.items.slice(0, 3).map((item, index) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.name}</span>
                              <span>${item.price.toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-sm text-gray-500">
                              +{order.items.length - 3} more items
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Distance and Total */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4" />
                          {driver?.currentLocation && order.restaurant.location ? (
                            <span>
                              {calculateDistance(driver.currentLocation, order.restaurant.location).toFixed(1)} km away
                            </span>
                          ) : (
                            <span>Distance N/A</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Customer Notes */}
                      {order.customerNotes && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Customer Notes:</strong> {order.customerNotes}
                          </p>
                        </div>
                      )}

                      {/* Accept Button */}
                      <Button
                        onClick={() => acceptOrderMutation.mutate(order.id)}
                        disabled={acceptOrderMutation.isPending}
                        className="w-full"
                        data-testid={`button-accept-order-${order.id}`}
                      >
                        {acceptOrderMutation.isPending ? 'Accepting...' : 'Accept Order'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Assigned Orders */}
          <TabsContent value="assigned" className="space-y-4">
            {assignedLoading ? (
              <div className="text-center py-8">
                <p>Loading your orders...</p>
              </div>
            ) : assignedOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    You have no assigned orders at the moment.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {assignedOrders.map((order) => (
                  <Card key={order.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          Order #{order.orderNumber}
                        </CardTitle>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Restaurant and Customer Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <MapPin className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">Pickup from</p>
                            <p className="text-sm">{order.restaurant.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {order.restaurant.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <User className="h-5 w-5 text-green-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium">Deliver to</p>
                            <p className="text-sm">{order.customer.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {order.deliveryAddress}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {order.status === 'driver_assigned' && (
                          <Button
                            onClick={() => updateOrderStatusMutation.mutate({
                              orderId: order.id,
                              status: 'picked_up'
                            })}
                            disabled={updateOrderStatusMutation.isPending}
                            className="flex-1"
                            data-testid={`button-pickup-${order.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Picked Up
                          </Button>
                        )}
                        
                        {order.status === 'picked_up' && (
                          <Button
                            onClick={() => updateOrderStatusMutation.mutate({
                              orderId: order.id,
                              status: 'delivered'
                            })}
                            disabled={updateOrderStatusMutation.isPending}
                            className="flex-1"
                            data-testid={`button-deliver-${order.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark as Delivered
                          </Button>
                        )}

                        {['driver_assigned', 'picked_up'].includes(order.status) && (
                          <Button
                            onClick={() => updateOrderStatusMutation.mutate({
                              orderId: order.id,
                              status: 'cancelled'
                            })}
                            disabled={updateOrderStatusMutation.isPending}
                            variant="destructive"
                            data-testid={`button-cancel-${order.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Order Total */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">Order Total:</span>
                        <span className="text-lg font-bold" data-testid={`text-order-total-${order.id}`}>
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default DriverPanel;