import { useEffect, useState, useRef } from "react";
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, ArrowLeft, CheckCircle, XCircle, Eye, MapPin, Circle } from "lucide-react";

interface Driver {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber: string;
  telegramId?: string;
  vehicleType?: string;
  licenseNumber?: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected' | 'pending_approval';
  isOnline: boolean;
  isAvailable: boolean;
  isApproved: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  rating: string;
  totalDeliveries: number;
  createdAt: string;
  lastOnline?: string;
}

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  restaurantId?: string;
}

export default function Drivers() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    checkAuth();
    loadDrivers();
    setupWebSocket();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const setupWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected for driver updates');
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle driver status updates
          if (data.type === 'driver_status_updated' && data.data) {
            setDrivers(prevDrivers => 
              prevDrivers.map(driver => 
                driver.id === data.data.id ? { ...driver, ...data.data } : driver
              )
            );
          }
          
          // Handle new driver registrations
          if (data.type === 'driverRegistration' && data.driver) {
            setDrivers(prevDrivers => {
              const existingIndex = prevDrivers.findIndex(d => d.id === data.driver.id);
              if (existingIndex >= 0) {
                return prevDrivers.map((driver, index) => 
                  index === existingIndex ? { ...driver, ...data.driver } : driver
                );
              } else {
                return [...prevDrivers, data.driver];
              }
            });
            
            toast({
              title: 'New Driver Registration',
              description: `${data.driver.name} has registered as a driver`,
            });
          }
          
          // Handle driver location updates
          if (data.type === 'driver_location_updated' && data.driverId) {
            setDrivers(prevDrivers => 
              prevDrivers.map(driver => 
                driver.id === data.driverId 
                  ? { ...driver, currentLocation: data.location }
                  : driver
              )
            );
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket connection closed');
        // Attempt to reconnect after 3 seconds
        setTimeout(setupWebSocket, 3000);
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  };

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

  const loadDrivers = async () => {
    try {
      const response = await fetch('/api/superadmin/drivers', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error('Failed to load drivers:', error);
    }
  };

  const handleApproveDriver = async (driverId: string) => {
    try {
      const response = await fetch(`/api/superadmin/drivers/${driverId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Driver approved successfully',
        });
        // Don't reload - WebSocket will update in real-time
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve driver',
        variant: 'destructive',
      });
    }
  };

  const handleRejectDriver = async (driverId: string) => {
    try {
      const response = await fetch(`/api/superadmin/drivers/${driverId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Driver rejected successfully',
        });
        // Don't reload - WebSocket will update in real-time
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject driver',
        variant: 'destructive',
      });
    }
  };

  const handleBlockDriver = async (driverId: string) => {
    try {
      const response = await fetch(`/api/superadmin/drivers/${driverId}/block`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Driver blocked successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to block driver',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (!confirm('Are you sure you want to delete this driver? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/superadmin/drivers/${driverId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Driver deleted successfully',
        });
        // Remove from local state immediately
        setDrivers(prev => prev.filter(d => d.id !== driverId));
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete driver',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (driver: Driver) => {
    if (driver.status === 'pending_approval' || driver.status === 'pending') {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (!driver.isApproved) {
      return <Badge variant="destructive">Not Approved</Badge>;
    }
    if (driver.status === 'active' && driver.isOnline && driver.isAvailable) {
      return <Badge className="bg-green-500 hover:bg-green-600">Online & Available</Badge>;
    }
    if (driver.status === 'active' && driver.isOnline) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Online</Badge>;
    }
    if (driver.status === 'active') {
      return <Badge variant="outline">Active (Offline)</Badge>;
    }
    return <Badge variant="destructive">Inactive</Badge>;
  };

  const getLocationInfo = (driver: Driver) => {
    if (driver.currentLocation) {
      return (
        <div className="flex items-center text-sm text-green-600">
          <MapPin className="h-4 w-4 mr-1" />
          <span>Location Shared</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Circle className="h-4 w-4 mr-1" />
        <span>No Location</span>
      </div>
    );
  };

  const filteredDrivers = drivers.filter(driver => {
    const driverName = driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
    const matchesSearch = driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (driver.email && driver.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (driver.phoneNumber && driver.phoneNumber.includes(searchTerm));
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            onClick={() => setLocation('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Total: {drivers.length} | Online: {drivers.filter(d => d.isOnline).length}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <CardTitle>Driver Management</CardTitle>
              </div>
              <div className="text-sm text-gray-500">
                Real-time updates enabled
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">
                            {driver.name || `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {driver.telegramId || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{driver.phoneNumber}</div>
                          {driver.email && (
                            <div className="text-gray-500">{driver.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(driver)}
                          {driver.lastOnline && (
                            <div className="text-xs text-gray-500">
                              Last seen: {new Date(driver.lastOnline).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getLocationInfo(driver)}
                        {driver.currentLocation && (
                          <div className="text-xs text-gray-500 mt-1">
                            {driver.currentLocation.lat.toFixed(6)}, {driver.currentLocation.lng.toFixed(6)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Rating: {driver.rating}</div>
                          <div className="text-gray-500">
                            {driver.totalDeliveries} deliveries
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {(driver.status === 'pending' || driver.status === 'pending_approval') && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveDriver(driver.id)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectDriver(driver.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {driver.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBlockDriver(driver.id)}
                              className="text-orange-600 hover:text-orange-700"
                            >
                              Block
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteDriver(driver.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredDrivers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No drivers found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}