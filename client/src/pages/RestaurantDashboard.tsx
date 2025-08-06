import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/Layout/Sidebar";
import { TopBar } from "@/components/Layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { isUnauthorizedError } from "@/lib/authUtils";
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

export default function RestaurantDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { lastMessage } = useWebSocket('/ws');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Get restaurant orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  // Get restaurant menu items
  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ["/api/restaurants", user?.restaurantId, "menu-items"],
    enabled: isAuthenticated && !!user?.restaurantId,
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Failed to update order status", variant: "destructive" });
    },
  });

  // Update menu item availability
  const updateMenuItemMutation = useMutation({
    mutationFn: async ({ itemId, isAvailable }: { itemId: string, isAvailable: boolean }) => {
      await apiRequest("PUT", `/api/menu-items/${itemId}`, { isAvailable });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants", user?.restaurantId, "menu-items"] });
      toast({ title: "Menu item updated successfully" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({ title: "Failed to update menu item", variant: "destructive" });
    },
  });

  // Setup Socket.IO connection for real-time notifications
  useEffect(() => {
    if (isAuthenticated && user?.id && user?.restaurantId) {
      console.log('Setting up Socket.IO connection for restaurant admin...');
      
      const newSocket = io({
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Socket.IO connected:', newSocket.id);
        setIsConnected(true);
        
        // Authenticate with the server
        newSocket.emit('authenticate', { userId: user.id });
      });

      newSocket.on('authenticated', (data) => {
        console.log('Socket.IO authenticated:', data);
        toast({
          title: "Connected",
          description: "Real-time notifications enabled",
        });
      });

      newSocket.on('disconnect', () => {
        console.log('Socket.IO disconnected');
        setIsConnected(false);
      });

      // Listen for new orders
      newSocket.on('new_order', (orderData) => {
        console.log('New order received:', orderData);
        toast({
          title: "🔔 New Order!",
          description: `Order ${orderData.orderNumber} - $${orderData.total}`,
        });
        
        // Refresh orders list
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        queryClient.invalidateQueries({ queryKey: ['/api/restaurants', user?.restaurantId, 'orders'] });
      });

      // Listen for kitchen staff notifications
      newSocket.on('order_confirmed_by_kitchen', (data) => {
        toast({
          title: "✅ Kitchen Confirmed",
          description: `Order ${data.orderNumber}: ${data.action}`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      });

      newSocket.on('order_preparation_started', (data) => {
        toast({
          title: "👨‍🍳 Preparation Started",
          description: `Order ${data.orderNumber}: ${data.action}`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      });

      newSocket.on('order_ready_for_pickup', (data) => {
        toast({
          title: "🍽️ Ready for Pickup",
          description: `Order ${data.orderNumber}: ${data.action}`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      });

      newSocket.on('order_needs_attention', (data) => {
        toast({
          title: "⚠️ Admin Attention Required",
          description: `Order ${data.orderNumber}: ${data.action}`,
          variant: "destructive",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user?.id, user?.restaurantId, queryClient, toast]);

  // Handle real-time order updates from WebSocket (fallback)
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'order_created') {
        toast({
          title: "🔔 New Order!",
          description: `Order #${lastMessage.data.orderNumber} received`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", user?.restaurantId, "orders"] });
      } else if (lastMessage.type === 'order_status_updated') {
        const statusMessages = {
          confirmed: "Order confirmed and sent to kitchen",
          preparing: "Kitchen started preparing",
          in_preparation: "Order is being prepared",
          ready_for_pickup: "Order ready for pickup/delivery",
          awaiting_admin_intervention: "Needs admin attention"
        };
        
        toast({
          title: "📋 Order Status Updated",
          description: `Order #${lastMessage.data.orderNumber}: ${statusMessages[lastMessage.data.status] || lastMessage.data.status}`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        queryClient.invalidateQueries({ queryKey: ["/api/restaurants", user?.restaurantId, "orders"] });
      }
    }
  }, [lastMessage, toast, queryClient, user?.restaurantId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const pendingOrders = orders?.filter((order: any) => order.status === 'pending') || [];
  const activeOrders = orders?.filter((order: any) => ['confirmed', 'preparing', 'ready'].includes(order.status)) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 ml-64">
        <TopBar 
          title="Restaurant Dashboard" 
          subtitle="Manage your orders and menu items"
          user={user}
        />
        
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <i className="fas fa-clock text-yellow-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingOrders.length}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <i className="fas fa-fire text-orange-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeOrders.length}</div>
                <p className="text-xs text-muted-foreground">Being prepared</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Menu Items</CardTitle>
                <i className="fas fa-utensils text-blue-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{menuItems?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total items</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                <i className="fas fa-dollar-sign text-green-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹0</div>
                <p className="text-xs text-muted-foreground">+0% from yesterday</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Management */}
            <Card>
              <CardHeader>
                <CardTitle>Incoming Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : pendingOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No pending orders</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingOrders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold">#{order.orderNumber}</h4>
                            <p className="text-sm text-gray-600">₹{order.total}</p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'confirmed' })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                            disabled={updateOrderStatusMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Menu Management */}
            <Card>
              <CardHeader>
                <CardTitle>Menu Management</CardTitle>
              </CardHeader>
              <CardContent>
                {menuLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : !menuItems || menuItems.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-utensils text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No menu items</p>
                    <Button className="mt-4">Add Menu Items</Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {menuItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h5 className="font-medium">{item.name}</h5>
                          <p className="text-sm text-gray-600">₹{item.price}</p>
                        </div>
                        <Switch
                          checked={item.isAvailable}
                          onCheckedChange={(checked) => 
                            updateMenuItemMutation.mutate({ itemId: item.id, isAvailable: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
