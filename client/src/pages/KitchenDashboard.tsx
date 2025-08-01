import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sidebar } from "@/components/Layout/Sidebar";
import { TopBar } from "@/components/Layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function KitchenDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { lastMessage } = useWebSocket('/ws');

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

  // Get kitchen orders (confirmed and preparing)
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
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

  // Handle real-time order updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'order_status_updated') {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    }
  }, [lastMessage]);

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

  const kitchenOrders = orders?.filter((order: any) => 
    ['confirmed', 'preparing'].includes(order.status)
  ) || [];

  const confirmedOrders = kitchenOrders.filter((order: any) => order.status === 'confirmed');
  const preparingOrders = kitchenOrders.filter((order: any) => order.status === 'preparing');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderItems = (order: any) => {
    try {
      return Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
    } catch {
      return [];
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 ml-64">
        <TopBar 
          title="Kitchen Dashboard" 
          subtitle="Manage order preparation and cooking status"
          user={user}
        />
        
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders to Start</CardTitle>
                <i className="fas fa-play text-blue-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{confirmedOrders.length}</div>
                <p className="text-xs text-muted-foreground">Ready to cook</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Preparation</CardTitle>
                <i className="fas fa-fire text-orange-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{preparingOrders.length}</div>
                <p className="text-xs text-muted-foreground">Currently cooking</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Prep Time</CardTitle>
                <i className="fas fa-clock text-green-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15min</div>
                <p className="text-xs text-muted-foreground">Target: 12min</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders to Start */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-play text-blue-600 mr-2"></i>
                  Orders to Start ({confirmedOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-32 bg-gray-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : confirmedOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-4xl text-green-300 mb-4"></i>
                    <p className="text-gray-500">All caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {confirmedOrders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-blue-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">#{order.orderNumber}</h4>
                            <p className="text-sm text-gray-600">
                              Ordered: {new Date(order.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        
                        {/* Order Items */}
                        <div className="mb-3">
                          <h5 className="font-medium mb-2">Items:</h5>
                          <div className="space-y-1">
                            {getOrderItems(order).map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                {item.notes && <span className="text-gray-500">({item.notes})</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button 
                          className="w-full"
                          onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'preparing' })}
                          disabled={updateOrderStatusMutation.isPending}
                        >
                          <i className="fas fa-play mr-2"></i>
                          Start Cooking
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orders in Preparation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-fire text-orange-600 mr-2"></i>
                  In Preparation ({preparingOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preparingOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-utensils text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">No orders cooking</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {preparingOrders.map((order: any) => (
                      <div key={order.id} className="border rounded-lg p-4 bg-orange-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">#{order.orderNumber}</h4>
                            <p className="text-sm text-gray-600">
                              Cooking since: {new Date(order.updatedAt).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        
                        {/* Order Items */}
                        <div className="mb-3">
                          <h5 className="font-medium mb-2">Items:</h5>
                          <div className="space-y-1">
                            {getOrderItems(order).map((item: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                {item.notes && <span className="text-gray-500">({item.notes})</span>}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'ready' })}
                          disabled={updateOrderStatusMutation.isPending}
                        >
                          <i className="fas fa-check mr-2"></i>
                          Mark as Ready
                        </Button>
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
