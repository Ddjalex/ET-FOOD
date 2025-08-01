import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/Layout/Sidebar";
import { TopBar } from "@/components/Layout/TopBar";
import { StatsCards } from "@/components/Dashboard/StatsCards";
import { RecentOrders } from "@/components/Dashboard/RecentOrders";
import { PendingApprovals } from "@/components/Dashboard/PendingApprovals";
import { OrderAnalytics } from "@/components/Dashboard/OrderAnalytics";
import { ActiveDrivers } from "@/components/Dashboard/ActiveDrivers";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function SuperadminDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { lastMessage } = useWebSocket('/ws');

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

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'order_created':
          toast({
            title: "New Order",
            description: `Order #${lastMessage.data.orderNumber} received`,
          });
          break;
        case 'driver_registered':
          toast({
            title: "New Driver Registration",
            description: "A new driver has registered and needs approval",
          });
          break;
        case 'restaurant_created':
          toast({
            title: "New Restaurant",
            description: `${lastMessage.data.name} has registered`,
          });
          break;
      }
    }
  }, [lastMessage, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar user={user} />
      
      <div className="flex-1 ml-64">
        <TopBar user={user} />
        
        <main className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || 'Admin'}!
            </h1>
            <p className="text-gray-600">
              Here's what's happening with your delivery platform today.
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards />
          
          {/* Restaurant Admin Creation Panel */}
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Create Restaurant Admin</h2>
                  <p className="text-gray-600">Add new restaurant administrators to the system</p>
                </div>
                <button 
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                  onClick={() => window.location.href = '/admin-login'}
                >
                  <span>+</span>
                  <span>Add Admin</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <strong>Total Admins:</strong> 12
                </div>
                <div>
                  <strong>Active Restaurants:</strong> 24
                </div>
                <div>
                  <strong>Pending Approvals:</strong> 3
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RecentOrders />
            <PendingApprovals />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderAnalytics />
            <ActiveDrivers />
          </div>
        </main>
      </div>
    </div>
  );
}
