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

  // Get driver ID from URL params or use Telegram WebApp data
  const urlParams = new URLSearchParams(window.location.search);
  const driverId = urlParams.get('driverId');
  const telegramId = urlParams.get('telegramId') || window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
  
  console.log('Driver authentication:', { driverId, telegramId, hasWebApp: !!window.Telegram?.WebApp });
  console.log('Driver data from API:', driverData);
  console.log('Credit status:', creditStatus);
  console.log('Pending request?', pendingRequest);

  // First get driver ID from Telegram ID if needed
  const { data: driverData, isLoading: driverLoading, error: driverError } = useQuery({
    queryKey: ['/api/drivers/by-telegram', telegramId, driverId],
    queryFn: async () => {
      console.log('🔍 Resolving driver ID...', { driverId, telegramId });
      
      if (driverId) {
        console.log('✅ Using direct driver ID:', driverId);
        return { id: driverId }; // Use direct driver ID if available
      }
      
      if (!telegramId) {
        throw new Error('No driver ID or Telegram ID provided');
      }
      
      console.log('🔍 Looking up driver by Telegram ID:', telegramId);
      const response = await fetch(`/api/drivers/by-telegram/${telegramId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Driver lookup failed:', errorText);
        throw new Error(`Driver not found for Telegram ID ${telegramId}`);
      }
      
      const result = await response.json();
      console.log('✅ Driver found:', result);
      return result;
    },
    enabled: !!(driverId || telegramId),
    retry: 2,
    retryDelay: 1000
  });

  const actualDriverId = driverData?.id;

  // Fetch driver profile and credit request status
  const { data: profile, isLoading } = useQuery({
    queryKey: ['/api/drivers/profile', actualDriverId],
    queryFn: async (): Promise<DriverProfile> => {
      const response = await fetch(`/api/drivers/profile?driverId=${actualDriverId}`);
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: !!actualDriverId
  });

  // Fetch credit request status separately
  const { data: creditStatus } = useQuery({
    queryKey: ['/api/drivers/credit-request/status', actualDriverId],
    queryFn: async () => {
      const response = await fetch(`/api/drivers/${actualDriverId}/credit-request/status`);
      if (!response.ok) throw new Error('Failed to fetch credit status');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: !!actualDriverId
  });

  // Submit credit request mutation
  const submitRequestMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('🚀 Starting credit request submission...');
      console.log('📋 Form data:', { 
        amount: formData.get('amount'), 
        screenshot: formData.get('screenshot')?.name || 'No file'
      });
      
      if (!actualDriverId) {
        console.error('❌ No driver ID found:', { actualDriverId, driverId, telegramId });
        throw new Error('Driver ID not found. Please access through proper URL.');
      }
      
      const apiUrl = `/api/drivers/${actualDriverId}/credit-request`;
      console.log('🔗 API URL:', apiUrl);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          body: formData
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || `HTTP ${response.status}: ${response.statusText}`);
          } catch {
            throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
          }
        }
        
        const result = await response.json();
        console.log('✅ Success response:', result);
        return result;
      } catch (networkError) {
        console.error('🌐 Network/Fetch Error:', networkError);
        throw new Error(`Network error: ${networkError.message}. Please check your connection.`);
      }
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
      console.error('💥 Credit request error:', error);
      toast({
        title: "Credit Request Failed",
        description: error.message || "Unknown error occurred. Please try again.",
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

  if (driverLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show error if no driver credentials provided
  if (!driverId && !telegramId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please access this page through your Telegram driver bot or with proper driver credentials.</p>
            <div className="mt-4 text-sm text-gray-600">
              <p>Test URLs:</p>
              <p>• With Driver ID: ?driverId=68a041f9a736236d0512bd91</p>
              <p>• With Telegram ID: ?telegramId=383870190</p>
            </div>
            <Button 
              onClick={() => window.location.href = '?driverId=68a041f9a736236d0512bd91'}
              className="mt-4 w-full"
            >
              Use Test Driver (DJ ALEX)
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error if driver not found
  if (!actualDriverId) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Driver Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Driver credentials not found in database.</p>
            <div className="mt-4 text-sm text-gray-600">
              <p>Provided credentials:</p>
              <p>• Driver ID: {driverId || 'Not provided'}</p>
              <p>• Telegram ID: {telegramId || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>
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
              Please wait for admin approval before submitting a new request.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Debug Info (remove in production) */}
        <Card className="bg-blue-50">
          <CardContent className="pt-4">
            <div className="text-xs space-y-1">
              <div><strong>URL Driver ID:</strong> {driverId || 'None'}</div>
              <div><strong>Telegram ID:</strong> {telegramId || 'None'}</div>
              <div><strong>Resolved Driver ID:</strong> {actualDriverId || 'None'}</div>
              <div><strong>Driver Loading:</strong> {driverLoading ? 'Yes' : 'No'}</div>
              <div><strong>Driver Error:</strong> {driverError?.message || 'None'}</div>
              <div><strong>Pending Request:</strong> {pendingRequest ? 'Yes' : 'No'}</div>
              <div><strong>Current Balance:</strong> {creditStatus?.currentBalance || 0} ETB</div>
              <div><strong>Form Visible:</strong> {!pendingRequest && actualDriverId ? 'Yes' : 'No'}</div>
            </div>
          </CardContent>
        </Card>

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