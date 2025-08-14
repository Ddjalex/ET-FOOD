import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, Plus, Minus } from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  phoneNumber?: string;
  creditBalance?: number;
  status: string;
  isOnline: boolean;
}

interface DriverCreditManagerProps {
  drivers: Driver[];
}

export function DriverCreditManager({ drivers }: DriverCreditManagerProps) {
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [amount, setAmount] = useState('');
  const [operation, setOperation] = useState<'add' | 'deduct'>('add');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCreditMutation = useMutation({
    mutationFn: async ({ driverId, amount, operation }: { driverId: string; amount: number; operation: 'add' | 'deduct' }) => {
      return apiRequest(`/api/superadmin/drivers/${driverId}/credit`, {
        method: 'POST',
        body: JSON.stringify({ amount, operation }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers'] });
      setAmount('');
      setSelectedDriverId('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update credit',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDriverId) {
      toast({
        title: 'Error',
        description: 'Please select a driver',
        variant: 'destructive',
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount',
        variant: 'destructive',
      });
      return;
    }

    updateCreditMutation.mutate({
      driverId: selectedDriverId,
      amount: amountValue,
      operation,
    });
  };

  const selectedDriver = drivers.find(d => d.id === selectedDriverId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Driver Credit Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Driver Credit Balances */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Current Credit Balances</h3>
          <div className="grid gap-2 max-h-40 overflow-y-auto">
            {drivers.map((driver) => (
              <div key={driver.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{driver.name}</span>
                  <Badge variant={driver.isOnline ? 'default' : 'secondary'}>
                    {driver.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold">
                    {driver.creditBalance?.toFixed(2) || '0.00'} ETB
                  </span>
                  {driver.phoneNumber && (
                    <div className="text-sm text-gray-500">{driver.phoneNumber}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Management Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="driver-select">Select Driver</Label>
            <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.name} ({driver.creditBalance?.toFixed(2) || '0.00'} ETB)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedDriver && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border">
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Current Balance: <strong>{selectedDriver.creditBalance?.toFixed(2) || '0.00'} ETB</strong>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={operation} onValueChange={(value: 'add' | 'deduct') => setOperation(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      Add Credit
                    </div>
                  </SelectItem>
                  <SelectItem value="deduct">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      Deduct Credit
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount (ETB)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className={`w-full ${operation === 'add' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
            disabled={updateCreditMutation.isPending}
          >
            {updateCreditMutation.isPending ? 'Processing...' : 
             operation === 'add' ? 'Add Credit' : 'Deduct Credit'}
          </Button>
        </form>

        {/* Information */}
        <div className="text-sm text-gray-600 dark:text-gray-400 p-3 bg-gray-50 dark:bg-gray-800 rounded">
          <strong>How it works:</strong>
          <ul className="mt-1 space-y-1">
            <li>• Add credit to allow drivers to accept more orders</li>
            <li>• When drivers complete Cash on Delivery orders, the total amount is automatically deducted</li>
            <li>• Drivers keep the cash and "pay" the platform through their credit balance</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}