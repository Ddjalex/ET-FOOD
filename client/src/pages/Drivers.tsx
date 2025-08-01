import { useEffect, useState } from "react";
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Truck, ArrowLeft, CheckCircle, XCircle, Eye } from "lucide-react";

interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  vehicleType: string;
  licenseNumber: string;
  status: 'pending' | 'active' | 'inactive' | 'rejected';
  createdAt: string;
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

  useEffect(() => {
    checkAuth();
    loadDrivers();
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

  const loadDrivers = async () => {
    try {
      const response = await fetch('/api/drivers', {
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
      const response = await fetch(`/api/drivers/${driverId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Driver approved successfully',
        });
        loadDrivers();
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
      const response = await fetch(`/api/drivers/${driverId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Driver rejected successfully',
        });
        loadDrivers();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject driver',
        variant: 'destructive',
      });
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || driver.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: "secondary" as const, text: "Pending" },
      active: { variant: "default" as const, text: "Active" },
      inactive: { variant: "outline" as const, text: "Inactive" },
      rejected: { variant: "destructive" as const, text: "Rejected" }
    };
    const config = variants[status as keyof typeof variants] || variants.pending;
    return <Badge variant={config.variant}>{config.text}</Badge>;
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
                Driver Management
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
                    placeholder="Search drivers..."
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
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  Total: {drivers.length}
                </Badge>
                <Badge variant="secondary">
                  Pending: {drivers.filter(d => d.status === 'pending').length}
                </Badge>
                <Badge variant="default">
                  Active: {drivers.filter(d => d.status === 'active').length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Drivers Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2" />
                Drivers ({filteredDrivers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">
                        {driver.firstName} {driver.lastName}
                      </TableCell>
                      <TableCell>{driver.email}</TableCell>
                      <TableCell>{driver.phoneNumber}</TableCell>
                      <TableCell>{driver.vehicleType}</TableCell>
                      <TableCell>{driver.licenseNumber}</TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {driver.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproveDriver(driver.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectDriver(driver.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
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
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}