import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import SuperadminDashboard from "@/pages/SuperAdminDashboard";
import RestaurantDashboard from "@/pages/RestaurantDashboard";
import { KitchenDashboard } from "@/pages/KitchenDashboard";
import KitchenLogin from "@/pages/KitchenLogin";
import Restaurants from "@/pages/Restaurants";
import CreateRestaurant from "@/pages/CreateRestaurant";
import Drivers from "@/pages/Drivers";
import Orders from "@/pages/Orders";
import AdminLogin from "@/pages/AdminLogin";
import SuperAdminLogin from "@/pages/SuperAdminLogin";
import RestaurantAdminLogin from "@/pages/RestaurantAdminLogin";
import RestaurantAdminDashboard from "@/pages/RestaurantAdminDashboard";
import Customers from "@/pages/Customers";
import Payments from "@/pages/Payments";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Notifications from "@/pages/Notifications";
import DriverPanel from "@/pages/DriverPanel";
import DriverLogin from "@/pages/DriverLogin";
import DriverRegistration from "@/pages/DriverRegistration";
import { CustomerApp } from "@/pages/CustomerApp";
import DriverCreditRequest from "@/pages/DriverCreditRequest";
import SuperadminCreditRequests from "@/pages/SuperadminCreditRequests";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Admin Routes - Use their own authentication system */}
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/superadmin-login" component={SuperAdminLogin} />
      <Route path="/restaurant-admin-login" component={RestaurantAdminLogin} />
      <Route path="/kitchen-login" component={KitchenLogin} />
      <Route path="/driver-login" component={DriverLogin} />
      <Route path="/register-driver" component={DriverRegistration} />
      <Route path="/superadmin" component={SuperadminDashboard} />
      <Route path="/admin" component={RestaurantAdminDashboard} />
      <Route path="/restaurant-admin" component={RestaurantAdminDashboard} />
      <Route path="/kitchen" component={KitchenDashboard} />
      <Route path="/restaurants" component={Restaurants} />
      <Route path="/restaurants/create" component={CreateRestaurant} />
      <Route path="/drivers" component={Drivers} />
      <Route path="/orders" component={Orders} />
      <Route path="/customers" component={Customers} />
      <Route path="/payments" component={Payments} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/driver-panel" component={DriverPanel} />
      <Route path="/driver-credit-request" component={DriverCreditRequest} />
      <Route path="/superadmin/credit-requests" component={SuperadminCreditRequests} />
      <Route path="/customer" component={CustomerApp} />
      
      {/* Regular routes with Replit Auth */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={SuperadminDashboard} />
          <Route path="/restaurant" component={RestaurantDashboard} />
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
