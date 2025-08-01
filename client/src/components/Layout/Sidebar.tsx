import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface SidebarProps {
  user?: any;
}

export function Sidebar({ user }: SidebarProps) {
  const [location] = useLocation();

  const navigationItems = [
    { href: "/", icon: "fas fa-chart-pie", label: "Dashboard", badge: null },
    { href: "/restaurants", icon: "fas fa-store", label: "Restaurants", badge: "24" },
    { href: "/drivers", icon: "fas fa-car", label: "Drivers", badge: "8" },
    { href: "/orders", icon: "fas fa-shopping-bag", label: "Orders", badge: "156" },
    { href: "/customers", icon: "fas fa-users", label: "Customers", badge: null },
    { href: "/payments", icon: "fas fa-credit-card", label: "Payments", badge: null },
    { href: "/analytics", icon: "fas fa-chart-bar", label: "Analytics", badge: null },
  ];

  const systemItems = [
    { href: "/settings", icon: "fas fa-cog", label: "Settings" },
    { href: "/notifications", icon: "fas fa-bell", label: "Notifications", hasNotification: true },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 fixed h-full z-30">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center">
            <i className="fas fa-motorcycle text-white text-lg"></i>
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">BeU Delivery</h1>
            <p className="text-sm text-gray-500">Superadmin</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-6">
        <div className="px-3">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors",
                  location === item.href
                    ? "text-brand-blue bg-blue-50"
                    : "text-gray-700 hover:text-brand-blue hover:bg-gray-50"
                )}
              >
                <i className={cn(item.icon, "mr-3", location === item.href ? "text-brand-blue" : "text-gray-400")}></i>
                {item.label}
                {item.badge && (
                  <span className={cn(
                    "ml-auto text-xs px-2 py-1 rounded-full",
                    item.label === "Drivers" 
                      ? "bg-brand-amber text-white"
                      : item.label === "Orders"
                      ? "bg-brand-emerald text-white"
                      : "bg-gray-200 text-gray-700"
                  )}>
                    {item.badge}
                  </span>
                )}
              </a>
            </Link>
          ))}
        </div>

        {/* System Section */}
        <div className="px-3 mt-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">System</p>
          {systemItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-1 transition-colors",
                  location === item.href
                    ? "text-brand-blue bg-blue-50"
                    : "text-gray-700 hover:text-brand-blue hover:bg-gray-50"
                )}
              >
                <i className={cn(item.icon, "mr-3", location === item.href ? "text-brand-blue" : "text-gray-400")}></i>
                {item.label}
                {item.hasNotification && (
                  <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </a>
            </Link>
          ))}
        </div>
      </nav>

      {/* User Profile */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <i className="fas fa-user text-gray-600 text-sm"></i>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.email || 'admin@beu.et'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
