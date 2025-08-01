import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import SuperadminDashboard from "@/pages/SuperadminDashboard";
import RestaurantDashboard from "@/pages/RestaurantDashboard";
import KitchenDashboard from "@/pages/KitchenDashboard";
import Restaurants from "@/pages/Restaurants";
import CreateRestaurant from "@/pages/CreateRestaurant";
import Drivers from "@/pages/Drivers";
import Orders from "@/pages/Orders";
import AdminLogin from "@/pages/AdminLogin";
import RestaurantAdminDashboard from "@/pages/RestaurantAdminDashboard";
import Customers from "@/pages/Customers";
import Payments from "@/pages/Payments";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Admin Login Routes - Always accessible */}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/superadmin" component={SuperadminDashboard} />
      <Route path="/admin" component={RestaurantAdminDashboard} />
      <Route path="/kitchen" component={KitchenDashboard} />
      
      {/* Admin Panel Routes */}
      <Route path="/customers" component={Customers} />
      <Route path="/payments" component={Payments} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={Notifications} />
      
      {/* Regular routes with Replit Auth */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={SuperadminDashboard} />
          <Route path="/restaurants" component={Restaurants} />
          <Route path="/restaurants/create" component={CreateRestaurant} />
          <Route path="/restaurant" component={RestaurantDashboard} />
          <Route path="/drivers" component={Drivers} />
          <Route path="/orders" component={Orders} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
