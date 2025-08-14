import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Eye, Check, X, Clock, DollarSign } from 'lucide-react';

interface CreditRequest {
  id: string;
  driverName: string;
  phoneNumber: string;
  requestedAmount: number;
  screenshotUrl: string;
  createdAt: string;
  currentBalance: number;
}

export default function SuperadminCreditRequests() {
  const [selectedRequest, setSelectedRequest] = useState<CreditRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch pending credit requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['/api/superadmin/credit-requests'],
    queryFn: async () => {
      const response = await fetch('/api/superadmin/credit-requests');
      if (!response.ok) throw new Error('Failed to fetch credit requests');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds for real-time updates
  });

  // Approve credit request mutation
  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/superadmin/credit-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve request');
      }
      return response.json();
    },
    onSuccess: (data, requestId) => {
      toast({
        title: "Credit Request Approved",
        description: `Credit of ${data.approvedAmount} ETB has been added to driver's balance.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/credit-requests'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reject credit request mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const response = await fetch(`/api/superadmin/credit-requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Credit Request Rejected",
        description: "The credit request has been rejected.",
      });
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedRequest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/superadmin/credit-requests'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleApprove = (request: CreditRequest) => {
    approveMutation.mutate(request.id);
  };

  const handleReject = (request: CreditRequest) => {
    setSelectedRequest(request);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({
      requestId: selectedRequest.id,
      reason: rejectionReason
    });
  };

  const requests = requestsData?.requests || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Credit Requests</h1>
            <p className="text-gray-600">Manage driver credit requests with payment proof</p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {requests.length} Pending
          </Badge>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-yellow-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                  <p className="text-2xl font-bold">{requests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-600">Total Requested</p>
                  <p className="text-2xl font-bold">
                    {requests.reduce((sum, req) => sum + req.requestedAmount, 0)} ETB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-600">Avg. Request</p>
                  <p className="text-2xl font-bold">
                    {requests.length > 0 ? Math.round(requests.reduce((sum, req) => sum + req.requestedAmount, 0) / requests.length) : 0} ETB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Credit Requests List */}
        {requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Requests</h3>
                <p className="text-gray-600">All credit requests have been processed.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    
                    {/* Driver Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {request.driverName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{request.driverName}</h3>
                          <p className="text-sm text-gray-600">{request.phoneNumber}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Requested:</span>
                          <span className="font-semibold ml-1 text-green-600">{request.requestedAmount} ETB</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Current Balance:</span>
                          <span className="font-semibold ml-1">{request.currentBalance} ETB</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Submitted:</span>
                          <span className="ml-1">{new Date(request.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Screenshot Preview */}
                    <div className="flex-shrink-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Screenshot
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Payment Screenshot</DialogTitle>
                            <DialogDescription>
                              Payment proof from {request.driverName} for {request.requestedAmount} ETB
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            <img
                              src={request.screenshotUrl}
                              alt="Payment screenshot"
                              className="w-full max-h-96 object-contain rounded-lg border"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(request)}
                        disabled={rejectMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rejection Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Credit Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this credit request from {selectedRequest?.driverName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter reason for rejection..."
                  className="mt-2"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={rejectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmReject}
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Rejecting...
                  </>
                ) : (
                  'Confirm Rejection'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}