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
import Drivers from "@/pages/Drivers";
import Orders from "@/pages/Orders";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={SuperadminDashboard} />
          <Route path="/restaurants" component={Restaurants} />
          <Route path="/restaurant" component={RestaurantDashboard} />
          <Route path="/kitchen" component={KitchenDashboard} />
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
