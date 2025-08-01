import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Clock, CheckCircle, AlertCircle, LogOut, ChefHat } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantId?: string;
}

export default function KitchenDashboard() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await apiRequest('/api/admin/me');
      if (response.ok) {
        const userData = await response.json();
        if (userData.role !== 'kitchen_staff') {
          setLocation('/admin-login');
          return;
        }
        setUser(userData);
      } else {
        setLocation('/admin-login');
      }
    } catch (error) {
      setLocation('/admin-login');
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/api/admin/logout', { method: 'POST' });
      setLocation('/admin-login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  // Mock orders data for demonstration
  const orders = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      customerName: 'John Doe',
      items: [
        { name: 'Margherita Pizza', quantity: 1 },
        { name: 'Caesar Salad', quantity: 1 }
      ],
      status: 'pending',
      estimatedTime: '15 min',
      priority: 'normal'
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      customerName: 'Jane Smith',
      items: [
        { name: 'Chicken Burger', quantity: 2 },
        { name: 'French Fries', quantity: 2 }
      ],
      status: 'preparing',
      estimatedTime: '8 min',
      priority: 'high'
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      customerName: 'Mike Johnson',
      items: [
        { name: 'Pasta Carbonara', quantity: 1 }
      ],
      status: 'ready',
      estimatedTime: 'Ready',
      priority: 'normal'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4" />;
      case 'preparing': return <Clock className="h-4 w-4" />;
      case 'ready': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    return priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
           'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <ChefHat className="h-6 w-6 text-orange-600 mr-2" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                BeU Delivery - Kitchen Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Welcome, {user.firstName} {user.lastName}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  Waiting to start
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Preparing</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  In progress
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  Ready for pickup
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Prep Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12m</div>
                <p className="text-xs text-muted-foreground">
                  This week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle>Active Orders</CardTitle>
              <CardDescription>
                Manage and track your kitchen orders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-medium">{order.orderNumber}</h3>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </Badge>
                        {order.priority === 'high' && (
                          <Badge className={getPriorityColor(order.priority)}>
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Customer: {order.customerName}
                      </p>
                      <div className="text-sm">
                        <strong>Items:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {order.items.map((item, index) => (
                            <li key={index}>
                              {item.quantity}x {item.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-sm font-medium">{order.estimatedTime}</span>
                      <div className="flex space-x-2">
                        {order.status === 'pending' && (
                          <Button size="sm" onClick={() => toast({ title: 'Order started', description: `Started preparing ${order.orderNumber}` })}>
                            Start
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button size="sm" variant="outline" onClick={() => toast({ title: 'Order ready', description: `${order.orderNumber} is ready for pickup` })}>
                            Mark Ready
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button size="sm" variant="secondary" disabled>
                            Awaiting Pickup
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}