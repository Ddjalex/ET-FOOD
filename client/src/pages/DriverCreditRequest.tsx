import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Upload, Clock, CheckCircle } from 'lucide-react';

interface CreditRequestStatus {
  pending: boolean;
  amount: number | null;
  screenshotUrl: string | null;
  createdAt: string | null;
}

interface DriverProfile {
  id: string;
  name: string;
  creditBalance: number;
  creditRequest: CreditRequestStatus;
}

export default function DriverCreditRequest() {
  const [amount, setAmount] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get driver ID from URL params or localStorage
  const driverId = new URLSearchParams(window.location.search).get('driverId') || 'demo-driver-id';

  // Fetch driver profile and credit request status
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/drivers/profile', driverId],
    queryFn: async (): Promise<DriverProfile> => {
      const response = await fetch(`/api/drivers/profile?driverId=${driverId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    }
  });

  // Fetch credit request status separately
  const { data: creditStatus } = useQuery({
    queryKey: ['/api/drivers/credit-request/status', driverId],
    queryFn: async () => {
      const response = await fetch(`/api/drivers/${driverId}/credit-request/status`);
      if (!response.ok) throw new Error('Failed to fetch credit status');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Submit credit request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/drivers/${driverId}/credit-request`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit credit request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credit Request Submitted",
        description: "Your credit request has been sent to the admin for approval.",
      });
      // Reset form
      setAmount('');
      setScreenshot(null);
      setPreviewUrl(null);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/credit-request/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drivers/profile'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setScreenshot(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      });
      return;
    }

    if (!screenshot) {
      toast({
        title: "Screenshot required",
        description: "Please upload a screenshot of your payment proof.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('screenshot', screenshot);

    submitRequestMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingRequest = creditStatus?.creditRequest?.pending;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Credit Request</h1>
          <p className="text-gray-600">Request credit for cash-on-delivery orders</p>
        </div>

        {/* Current Balance Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {creditStatus?.currentBalance || 0} ETB
            </div>
          </CardContent>
        </Card>

        {/* Pending Request Alert */}
        {pendingRequest && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              You have a pending credit request for {creditStatus.creditRequest.amount} ETB. 
              Please wait for admin approval.
            </AlertDescription>
          </Alert>
        )}

        {/* Credit Request Form */}
        {!pendingRequest && (
          <Card>
            <CardHeader>
              <CardTitle>Request Credit</CardTitle>
              <CardDescription>
                Upload payment proof and request credit for your cash deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount (ETB)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount..."
                    disabled={submitRequestMutation.isPending}
                  />
                </div>

                <div>
                  <Label htmlFor="screenshot">Payment Screenshot</Label>
                  <div className="mt-2">
                    <input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={submitRequestMutation.isPending}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('screenshot')?.click()}
                      className="w-full"
                      disabled={submitRequestMutation.isPending}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {screenshot ? 'Change Screenshot' : 'Upload Screenshot'}
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="mt-4">
                    <Label>Preview:</Label>
                    <div className="mt-2 border rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Payment screenshot preview"
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={submitRequestMutation.isPending || !amount || !screenshot}
                >
                  {submitRequestMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Credit Request'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Request History */}
        {creditStatus?.creditRequest && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Request</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-semibold">{creditStatus.creditRequest.amount} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`flex items-center gap-1 ${pendingRequest ? 'text-yellow-600' : 'text-green-600'}`}>
                    {pendingRequest ? (
                      <>
                        <Clock className="h-4 w-4" />
                        Pending
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Processed
                      </>
                    )}
                  </span>
                </div>
                {creditStatus.creditRequest.createdAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Submitted:</span>
                    <span className="text-sm">{new Date(creditStatus.creditRequest.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}