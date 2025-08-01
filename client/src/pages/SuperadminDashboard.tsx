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
      
      <main className="flex-1 ml-64">
        <TopBar 
          title="Dashboard Overview" 
          subtitle="Real-time system monitoring and management"
          user={user}
        />
        
        <div className="p-6">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <RecentOrders />
            <PendingApprovals />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OrderAnalytics />
            <ActiveDrivers />
          </div>
        </div>
      </main>
    </div>
  );
}
