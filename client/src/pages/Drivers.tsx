import { useAuth } from "@/hooks/useAuth";
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
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Drivers() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["/api/drivers"],
    enabled: isAuthenticated,
  });

  const approveDriverMutation = useMutation({
    mutationFn: async (driverId: string) => {
      await apiRequest("POST", `/api/drivers/${driverId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({ title: "Driver approved successfully" });
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
      toast({ title: "Failed to approve driver", variant: "destructive" });
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

  const filteredDrivers = drivers?.filter((driver: any) => {
    const matchesSearch = driver.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "approved" && driver.isApproved) ||
                         (statusFilter === "pending" && !driver.isApproved) ||
                         (statusFilter === "online" && driver.isOnline) ||
                         (statusFilter === "offline" && !driver.isOnline);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (driver: any) => {
    if (!driver.isApproved) {
      return <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>;
    }
    if (driver.isOnline) {
      if (driver.isAvailable) {
        return <Badge className="bg-green-100 text-green-800">Online & Available</Badge>;
      } else {
        return <Badge className="bg-blue-100 text-blue-800">Online & Busy</Badge>;
      }
    }
    return <Badge className="bg-gray-100 text-gray-800">Offline</Badge>;
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType.toLowerCase()) {
      case 'motorcycle': return 'fas fa-motorcycle';
      case 'bicycle': return 'fas fa-bicycle';
      case 'car': return 'fas fa-car';
      default: return 'fas fa-shipping-fast';
    }
  };

  const pendingCount = drivers?.filter((d: any) => !d.isApproved).length || 0;
  const onlineCount = drivers?.filter((d: any) => d.isOnline && d.isApproved).length || 0;
  const totalCount = drivers?.length || 0;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar user={user} />
      
      <main className="flex-1 ml-64">
        <TopBar 
          title="Drivers Management" 
          subtitle="Manage driver registrations and monitor activity"
          user={user}
        />
        
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                <i className="fas fa-users text-blue-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCount}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Online Drivers</CardTitle>
                <i className="fas fa-circle text-green-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{onlineCount}</div>
                <p className="text-xs text-muted-foreground">Available for deliveries</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <i className="fas fa-clock text-yellow-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingCount}</div>
                <p className="text-xs text-muted-foreground">Awaiting verification</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                <i className="fas fa-star text-yellow-600"></i>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8</div>
                <p className="text-xs text-muted-foreground">Overall rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search drivers..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Drivers Grid */}
          {driversLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-car text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No drivers found</h3>
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "Try adjusting your search criteria" 
                  : "No drivers have registered yet"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map((driver: any) => (
                <Card key={driver.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <i className="fas fa-user text-gray-600"></i>
                        </div>
                        <div>
                          <CardTitle className="text-lg">Driver #{driver.id.slice(0, 8)}</CardTitle>
                          <p className="text-sm text-gray-600">{driver.licenseNumber}</p>
                        </div>
                      </div>
                      {getStatusBadge(driver)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <i className={`${getVehicleIcon(driver.vehicleType)} text-gray-400 mr-2`}></i>
                        <span className="text-sm text-gray-600 capitalize">{driver.vehicleType}</span>
                        <span className="text-sm text-gray-500 ml-2">({driver.vehiclePlate})</span>
                      </div>

                      <div className="flex items-center">
                        <i className="fas fa-map-marker-alt text-gray-400 mr-2"></i>
                        <span className="text-sm text-gray-600">{driver.zone || 'No zone assigned'}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <i className="fas fa-star text-yellow-400 mr-1"></i>
                          <span>{driver.rating || '0.0'}</span>
                        </div>
                        <span className="text-gray-500">{driver.totalDeliveries || 0} deliveries</span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Earnings:</span>
                        <span className="font-medium">₹{driver.totalEarnings || '0.00'}</span>
                      </div>

                      <div className="flex space-x-2 pt-3">
                        {!driver.isApproved && (
                          <Button
                            size="sm"
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            onClick={() => approveDriverMutation.mutate(driver.id)}
                            disabled={approveDriverMutation.isPending}
                          >
                            <i className="fas fa-check mr-1"></i>
                            Approve
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <i className="fas fa-eye mr-1"></i>
                          View
                        </Button>
                        
                        {driver.isApproved && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={driver.isOnline ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          >
                            <i className={`fas ${driver.isOnline ? 'fa-power-off' : 'fa-play'} mr-1`}></i>
                            {driver.isOnline ? 'Suspend' : 'Activate'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
