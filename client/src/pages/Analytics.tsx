import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, ShoppingBag, Download } from 'lucide-react';

interface AnalyticsData {
  ordersByDay: Array<{ date: string; orders: number; revenue: number }>;
  topRestaurants: Array<{ name: string; orders: number; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number; color: string }>;
  customerGrowth: Array<{ month: string; customers: number }>;
}

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await apiRequest(`/api/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sample data for demonstration
  const sampleData: AnalyticsData = {
    ordersByDay: [
      { date: '2024-01-01', orders: 45, revenue: 1250 },
      { date: '2024-01-02', orders: 52, revenue: 1430 },
      { date: '2024-01-03', orders: 38, revenue: 980 },
      { date: '2024-01-04', orders: 61, revenue: 1680 },
      { date: '2024-01-05', orders: 49, revenue: 1320 },
      { date: '2024-01-06', orders: 67, revenue: 1890 },
      { date: '2024-01-07', orders: 71, revenue: 2100 },
    ],
    topRestaurants: [
      { name: 'Habesha Kitchen', orders: 156, revenue: 4200 },
      { name: 'Addis Red Sea', orders: 143, revenue: 3890 },
      { name: 'Lucy Restaurant', orders: 128, revenue: 3456 },
      { name: 'Yod Abyssinia', orders: 112, revenue: 3021 },
      { name: 'Blue Nile', orders: 98, revenue: 2654 },
    ],
    ordersByStatus: [
      { status: 'Completed', count: 234, color: '#10B981' },
      { status: 'Pending', count: 45, color: '#F59E0B' },
      { status: 'Cancelled', count: 12, color: '#EF4444' },
      { status: 'In Progress', count: 23, color: '#3B82F6' },
    ],
    customerGrowth: [
      { month: 'Jul', customers: 120 },
      { month: 'Aug', customers: 145 },
      { month: 'Sep', customers: 168 },
      { month: 'Oct', customers: 195 },
      { month: 'Nov', customers: 223 },
      { month: 'Dec', customers: 267 },
      { month: 'Jan', customers: 298 },
    ],
  };

  const data = analyticsData || sampleData;

  const totalOrders = data.ordersByDay.reduce((sum, day) => sum + day.orders, 0);
  const totalRevenue = data.ordersByDay.reduce((sum, day) => sum + day.revenue, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">Business performance and insights</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setTimeRange('7d')} 
              className={timeRange === '7d' ? 'bg-orange-600 text-white' : ''}>
              7 Days
            </Button>
            <Button variant="outline" onClick={() => setTimeRange('30d')}
              className={timeRange === '30d' ? 'bg-orange-600 text-white' : ''}>
              30 Days
            </Button>
            <Button variant="outline" onClick={() => setTimeRange('90d')}
              className={timeRange === '90d' ? 'bg-orange-600 text-white' : ''}>
              90 Days
            </Button>
            <Button className="bg-orange-600 hover:bg-orange-700">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2% from last period
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Per order average
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.customerGrowth[data.customerGrowth.length - 1]?.customers || 0}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Orders Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Orders Over Time</CardTitle>
              <CardDescription>Daily order volume and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="orders" stroke="#EA580C" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Daily revenue performance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ordersByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#EA580C" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Restaurants */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Restaurants</CardTitle>
              <CardDescription>By order volume and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topRestaurants.map((restaurant, index) => (
                  <div key={restaurant.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{restaurant.name}</p>
                        <p className="text-sm text-gray-500">{restaurant.orders} orders</p>
                      </div>
                    </div>
                    <Badge variant="secondary">${restaurant.revenue.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
              <CardDescription>Current order status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {data.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {data.ordersByStatus.map((status) => (
                  <div key={status.status} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-sm">{status.status}: {status.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}