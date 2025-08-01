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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Orders() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { lastMessage } = useWebSocket('/ws');
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

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

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/orders"],
    enabled: isAuthenticated,
  });

  // Handle real-time order updates
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'order_created' || lastMessage.type === 'order_status_updated') {
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        if (lastMessage.type === 'order_created') {
          toast({
            title: "New Order",
            description: `Order #${lastMessage.data.orderNumber} received`,
          });
        }
      }
    }
  }, [lastMessage, toast]);

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

  const filteredOrders = orders?.filter((order: any) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "fas fa-clock" },
      confirmed: { bg: "bg-blue-100", text: "text-blue-800", icon: "fas fa-check" },
      preparing: { bg: "bg-orange-100", text: "text-orange-800", icon: "fas fa-fire" },
      ready: { bg: "bg-green-100", text: "text-green-800", icon: "fas fa-check-circle" },
      assigned: { bg: "bg-purple-100", text: "text-purple-800", icon: "fas fa-motorcycle" },
      picked_up: { bg: "bg-indigo-100", text: "text-indigo-800", icon: "fas fa-shipping-fast" },
      delivered: { bg: "bg-emerald-100", text: "text-emerald-800", icon: "fas fa-check-double" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", icon: "fas fa-times" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const displayStatus = status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
      <Badge className={`${config.bg} ${config.text}`}>
        <i className={`${config.icon} mr-1`}></i>
        {displayStatus}
      </Badge>
    );
  };

  const getOrderItems = (order: any) => {
    try {
      return Array.isArray(order.items) ? order.items : JSON.parse(order.items || '[]');
    } catch {
      return [];
    }
  };

  const statusCounts = {
    total: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'pending').length || 0,
    active: orders?.filter((o: any) => ['confirmed', 'preparing', 'ready', 'assigned', 'picked_up'].includes(o.status)).length || 0,
    delivered: orders?.filter((o: any) => o.status === 'delivered').length || 0,
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 ml-64">
        <TopBar 
          title="Orders Management" 
          subtitle="Monitor and manage all orders in real-time"
          user={user}
        />
        
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <i className="fas fa-shopping-bag text-blue-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.total}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <i className="fas fa-clock text-yellow-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.pending}</div>
                <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
                <i className="fas fa-fire text-orange-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.active}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                <i className="fas fa-check-double text-green-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statusCounts.delivered}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="ready">Ready</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="picked_up">Picked Up</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Orders ({filteredOrders.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No orders found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all" 
                      ? "Try adjusting your search criteria" 
                      : "No orders have been placed yet"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Order ID</th>
                        <th className="text-left py-3 px-4 font-medium">Customer</th>
                        <th className="text-left py-3 px-4 font-medium">Restaurant</th>
                        <th className="text-left py-3 px-4 font-medium">Amount</th>
                        <th className="text-left py-3 px-4 font-medium">Status</th>
                        <th className="text-left py-3 px-4 font-medium">Date</th>
                        <th className="text-left py-3 px-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order: any) => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium">#{order.orderNumber}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{order.customerId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm">{order.restaurantId}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium">₹{order.total}</span>
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => setSelectedOrder(order)}
                                  >
                                    <i className="fas fa-eye mr-1"></i>
                                    View
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Order Details - #{order.orderNumber}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="text-sm font-medium">Customer ID</label>
                                        <p className="text-sm text-gray-600">{order.customerId}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Restaurant ID</label>
                                        <p className="text-sm text-gray-600">{order.restaurantId}</p>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Status</label>
                                        <div className="mt-1">{getStatusBadge(order.status)}</div>
                                      </div>
                                      <div>
                                        <label className="text-sm font-medium">Total Amount</label>
                                        <p className="text-sm text-gray-600">₹{order.total}</p>
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium">Order Items</label>
                                      <div className="mt-2 space-y-2">
                                        {getOrderItems(order).map((item: any, index: number) => (
                                          <div key={index} className="flex justify-between text-sm border-b pb-2">
                                            <span>{item.quantity}x {item.name}</span>
                                            <span>₹{item.price * item.quantity}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <label className="text-sm font-medium">Delivery Address</label>
                                      <p className="text-sm text-gray-600">{order.deliveryAddress}</p>
                                    </div>

                                    {order.customerNotes && (
                                      <div>
                                        <label className="text-sm font-medium">Customer Notes</label>
                                        <p className="text-sm text-gray-600">{order.customerNotes}</p>
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {order.status === 'pending' && (
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => updateOrderStatusMutation.mutate({ orderId: order.id, status: 'confirmed' })}
                                  disabled={updateOrderStatusMutation.isPending}
                                >
                                  <i className="fas fa-check mr-1"></i>
                                  Confirm
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
