import { useEffect, useState } from "react";
import { useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Store, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  address: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
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

export default function Restaurants() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
    loadRestaurants();
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

  const loadRestaurants = async () => {
    try {
      const response = await fetch('/api/restaurants', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setRestaurants(data);
      }
    } catch (error) {
      console.error('Failed to load restaurants:', error);
    }
  };

  const handleApproveRestaurant = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/approve`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Restaurant approved successfully',
        });
        loadRestaurants();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve restaurant',
        variant: 'destructive',
      });
    }
  };

  const handleRejectRestaurant = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/reject`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Restaurant rejected successfully',
        });
        loadRestaurants();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject restaurant',
        variant: 'destructive',
      });
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => 
    restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                Restaurant Management
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
                    placeholder="Search restaurants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">
                  Total: {restaurants.length}
                </Badge>
                <Badge variant="secondary">
                  Active: {restaurants.filter(r => r.isActive).length}
                </Badge>
              </div>
            </div>
          </div>

          {/* Restaurants Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Restaurants ({filteredRestaurants.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-medium">{restaurant.name}</TableCell>
                      <TableCell>{restaurant.email}</TableCell>
                      <TableCell>{restaurant.phoneNumber}</TableCell>
                      <TableCell className="max-w-xs truncate">{restaurant.address}</TableCell>
                      <TableCell>
                        <Badge variant={restaurant.isActive ? "default" : "secondary"}>
                          {restaurant.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {!restaurant.isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApproveRestaurant(restaurant.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectRestaurant(restaurant.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            {restaurant.isActive ? "Deactivate" : "Reject"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredRestaurants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No restaurants found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}