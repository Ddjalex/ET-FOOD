import { useEffect, useState } from "react";
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShoppingCart, ArrowLeft, Eye, Clock, CheckCircle, Truck } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  restaurantName: string;
  driverName?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  deliveryAddress: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantId?: string;
}

export default function Orders() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadOrders();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setLocation('/admin-login');
      }
    } catch (error) {
      setLocation('/admin-login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order status updated successfully',
        });
        loadOrders();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.restaurantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, text: "Pending", icon: Clock },
      confirmed: { variant: "default" as const, text: "Confirmed", icon: CheckCircle },
      preparing: { variant: "default" as const, text: "Preparing", icon: Clock },
      ready: { variant: "default" as const, text: "Ready", icon: CheckCircle },
      picked_up: { variant: "default" as const, text: "Picked Up", icon: Truck },
      delivered: { variant: "default" as const, text: "Delivered", icon: CheckCircle },
      cancelled: { variant: "destructive" as const, text: "Cancelled", icon: Clock }
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.text}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/superadmin')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Order Management
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {user.firstName} {user.lastName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search and Stats */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  Total: {orders.length}
                </Badge>
                <Badge variant="secondary">
                  Pending: {orders.filter(o => o.status === 'pending').length}
                </Badge>
                <Badge variant="default">
                  Active: {orders.filter(o => ['confirmed', 'preparing', 'ready', 'picked_up'].includes(o.status)).length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Orders ({filteredOrders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>{order.restaurantName}</TableCell>
                      <TableCell>{order.driverName || 'Unassigned'}</TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          {order.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateOrderStatus(order.id, 'confirmed')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredOrders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No orders found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}