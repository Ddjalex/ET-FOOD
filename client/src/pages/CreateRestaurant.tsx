import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function CreateRestaurant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const [restaurantData, setRestaurantData] = useState({
    name: "",
    description: "",
    address: "",
    phoneNumber: "",
    email: "",
  });

  const [adminData, setAdminData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  const createRestaurantMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/restaurants", {
        restaurantData,
        adminData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "Success",
        description: "Restaurant and admin created successfully",
      });
      setLocation("/restaurants");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create restaurant",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRestaurantMutation.mutate();
  };

  if (user?.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Access denied. Only superadmin can create restaurants.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/restaurants")}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Restaurants
          </Button>
          <h1 className="text-2xl font-bold">Create New Restaurant</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Restaurant Information */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Restaurant Name*</label>
                  <Input
                    required
                    value={restaurantData.name}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter restaurant name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    value={restaurantData.description}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the restaurant"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Address*</label>
                  <Textarea
                    required
                    value={restaurantData.address}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Full restaurant address"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number*</label>
                  <Input
                    required
                    value={restaurantData.phoneNumber}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+251 XXX XXX XXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={restaurantData.email}
                    onChange={(e) => setRestaurantData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="restaurant@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Restaurant Admin Information */}
            <Card>
              <CardHeader>
                <CardTitle>Restaurant Admin Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Admin Email*</label>
                  <Input
                    required
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">First Name*</label>
                  <Input
                    required
                    value={adminData.firstName}
                    onChange={(e) => setAdminData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Last Name*</label>
                  <Input
                    required
                    value={adminData.lastName}
                    onChange={(e) => setAdminData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number*</label>
                  <Input
                    required
                    value={adminData.phoneNumber}
                    onChange={(e) => setAdminData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    placeholder="+251 XXX XXX XXX"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The restaurant admin will be able to:
                    <br />• Manage restaurant orders
                    <br />• Create kitchen staff accounts
                    <br />• Manage menu items
                    <br />• View restaurant analytics
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/restaurants")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createRestaurantMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {createRestaurantMutation.isPending ? "Creating..." : "Create Restaurant & Admin"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}