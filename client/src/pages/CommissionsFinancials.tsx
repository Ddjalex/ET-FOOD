import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Settings, 
  Receipt, 
  Truck,
  Calculator,
  RefreshCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CommissionsFinancials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newRestaurantRate, setNewRestaurantRate] = useState('');
  const [newDriverRate, setNewDriverRate] = useState('');

  // Fetch commission settings
  const { data: commissionSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/commission-settings'],
    refetchInterval: 30000,
  });

  // Fetch financial data
  const { data: financialData, isLoading: financialLoading, refetch: refetchFinancials } = useQuery({
    queryKey: ['/api/admin/financials/commissions'],
    refetchInterval: 60000,
  });

  // Update commission settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: { restaurantCommissionRate: number; driverCommissionRate: number }) => {
      const response = await fetch('/api/admin/update-commission-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update commission settings');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Commission settings updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/commission-settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/financials/commissions'] });
      setNewRestaurantRate('');
      setNewDriverRate('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Set default values when settings load
  useEffect(() => {
    if (commissionSettings && !newRestaurantRate && !newDriverRate) {
      setNewRestaurantRate((commissionSettings as any)?.restaurantCommissionRate?.toString() || '15');
      setNewDriverRate((commissionSettings as any)?.driverCommissionRate?.toString() || '5');
    }
  }, [commissionSettings, newRestaurantRate, newDriverRate]);

  const handleUpdateSettings = () => {
    const restaurantRate = parseFloat(newRestaurantRate);
    const driverRate = parseFloat(newDriverRate);

    if (isNaN(restaurantRate) || restaurantRate < 0 || restaurantRate > 100) {
      toast({
        title: 'Invalid Input',
        description: 'Restaurant commission rate must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    if (isNaN(driverRate) || driverRate < 0 || driverRate > 100) {
      toast({
        title: 'Invalid Input', 
        description: 'Driver commission rate must be between 0 and 100',
        variant: 'destructive',
      });
      return;
    }

    updateSettingsMutation.mutate({
      restaurantCommissionRate: restaurantRate,
      driverCommissionRate: driverRate,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isLoading = settingsLoading || financialLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commissions & Financials</h1>
          <p className="text-muted-foreground">
            Manage commission rates and track platform earnings from every order
          </p>
        </div>
        <Button 
          onClick={() => refetchFinancials()} 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <RefreshCcw className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="settings">Commission Settings</TabsTrigger>
          <TabsTrigger value="orders">Order Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (financialData as any)?.summary ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Commission Earned</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency((financialData as any).summary.totalCommissionEarned)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Platform profit from all orders
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Restaurant Commissions</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency((financialData as any).summary.totalRestaurantCommissions)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total from restaurant fees
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Driver Commissions</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency((financialData as any).summary.totalDriverCommissions)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total from driver fees
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(financialData as any).summary.totalOrders}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {formatCurrency((financialData as any).summary.averageCommissionPerOrder)} per order
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Commission Breakdown</CardTitle>
                  <CardDescription>
                    Current commission rates and their impact
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {commissionSettings && (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Restaurant Commission Rate</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {(commissionSettings as any)?.restaurantCommissionRate || 0}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            = {formatCurrency((financialData as any).summary.totalRestaurantCommissions)} total
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Driver Commission Rate</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-sm">
                            {(commissionSettings as any)?.driverCommissionRate || 0}%
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            = {formatCurrency((financialData as any).summary.totalDriverCommissions)} total
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertDescription>
                No financial data available yet. Complete some orders to see commission tracking.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Commission Rate Settings
              </CardTitle>
              <CardDescription>
                Set commission rates that will be applied to all new orders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {commissionSettings && (
                <div className="space-y-4">
                  <Alert>
                    <Calculator className="h-4 w-4" />
                    <AlertDescription>
                      Current rates: Restaurant {(commissionSettings as any)?.restaurantCommissionRate || 0}%, Driver {(commissionSettings as any)?.driverCommissionRate || 0}%
                      <br />
                      Last updated: {(commissionSettings as any)?.updatedAt ? formatDate((commissionSettings as any).updatedAt) : 'Unknown'}
                    </AlertDescription>
                  </Alert>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-rate">Restaurant Commission Rate (%)</Label>
                      <Input
                        id="restaurant-rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={newRestaurantRate}
                        onChange={(e) => setNewRestaurantRate(e.target.value)}
                        placeholder="15.0"
                      />
                      <p className="text-sm text-muted-foreground">
                        Percentage of order total charged to restaurants
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="driver-rate">Driver Commission Rate (%)</Label>
                      <Input
                        id="driver-rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={newDriverRate}
                        onChange={(e) => setNewDriverRate(e.target.value)}
                        placeholder="5.0"
                      />
                      <p className="text-sm text-muted-foreground">
                        Percentage of order total charged to drivers
                      </p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleUpdateSettings}
                    disabled={updateSettingsMutation.isPending}
                    className="w-full"
                  >
                    {updateSettingsMutation.isPending ? 'Updating...' : 'Update Commission Settings'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Individual Order Commission Breakdown</CardTitle>
              <CardDescription>
                Detailed commission tracking for each completed order
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(financialData as any)?.orderBreakdowns && (financialData as any).orderBreakdowns.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Restaurant</TableHead>
                        <TableHead>Order Total</TableHead>
                        <TableHead>Restaurant Commission</TableHead>
                        <TableHead>Driver Commission</TableHead>
                        <TableHead>Platform Profit</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(financialData as any).orderBreakdowns.map((order: any) => (
                        <TableRow key={order.orderId}>
                          <TableCell className="font-mono text-sm">
                            {order.orderNumber}
                          </TableCell>
                          <TableCell>{order.restaurantName}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(order.total)}
                          </TableCell>
                          <TableCell className="text-blue-600">
                            {formatCurrency(order.restaurantCommission)}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              ({order.restaurantCommissionRate}%)
                            </span>
                          </TableCell>
                          <TableCell className="text-purple-600">
                            {formatCurrency(order.driverCommission)}
                            <br />
                            <span className="text-xs text-muted-foreground">
                              ({order.driverCommissionRate}%)
                            </span>
                          </TableCell>
                          <TableCell className="font-bold text-green-600">
                            {formatCurrency(order.platformProfit)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(order.completedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No completed orders with commission data found yet.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}