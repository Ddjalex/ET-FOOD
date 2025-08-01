import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function PendingApprovals() {
  const { toast } = useToast();

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ["/api/drivers"],
  });

  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery({
    queryKey: ["/api/restaurants"],
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
      toast({ title: "Failed to approve driver", variant: "destructive" });
    },
  });

  const approveRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      await apiRequest("POST", `/api/restaurants/${restaurantId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({ title: "Restaurant approved successfully" });
    },
    onError: (error) => {
      toast({ title: "Failed to approve restaurant", variant: "destructive" });
    },
  });

  if (driversLoading || restaurantsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const pendingDrivers = drivers?.filter((driver: any) => !driver.isApproved) || [];
  const pendingRestaurants = restaurants?.filter((restaurant: any) => !restaurant.isApproved) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {/* Pending Drivers */}
          {pendingDrivers.map((driver: any) => (
            <div key={driver.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-car text-amber-600"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Driver Registration</p>
                  <p className="text-xs text-gray-600">{driver.userId}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 text-xs bg-brand-emerald text-white rounded-md hover:bg-emerald-600 transition-colors"
                  onClick={() => approveDriverMutation.mutate(driver.id)}
                  disabled={approveDriverMutation.isPending}
                >
                  <i className="fas fa-check mr-1"></i>Approve
                </button>
                <button className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                  <i className="fas fa-times mr-1"></i>Reject
                </button>
              </div>
            </div>
          ))}

          {/* Pending Restaurants */}
          {pendingRestaurants.map((restaurant: any) => (
            <div key={restaurant.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-store text-blue-600"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Restaurant Onboarding</p>
                  <p className="text-xs text-gray-600">{restaurant.name}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 text-xs bg-brand-emerald text-white rounded-md hover:bg-emerald-600 transition-colors"
                  onClick={() => approveRestaurantMutation.mutate(restaurant.id)}
                  disabled={approveRestaurantMutation.isPending}
                >
                  <i className="fas fa-check mr-1"></i>Approve
                </button>
                <button className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                  <i className="fas fa-times mr-1"></i>Reject
                </button>
              </div>
            </div>
          ))}

          {/* Placeholder for disputes */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-purple-600"></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Dispute Resolution</p>
                <p className="text-xs text-gray-600">Order #ORD-2845</p>
              </div>
            </div>
            <button className="px-3 py-1 text-xs bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors">
              Review
            </button>
          </div>

          {pendingDrivers.length === 0 && pendingRestaurants.length === 0 && (
            <div className="text-center py-8">
              <i className="fas fa-check-circle text-4xl text-green-500 mb-4"></i>
              <p className="text-gray-500">No pending approvals</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
