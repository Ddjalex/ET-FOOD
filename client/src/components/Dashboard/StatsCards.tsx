import { useQuery } from "@tanstack/react-query";

export function StatsCards() {
  const { data: stats = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      title: "Total Orders",
      value: stats?.totalOrders || 0,
      change: "+12% from last month",
      icon: "fas fa-shopping-bag",
      iconBg: "bg-blue-100",
      iconColor: "text-brand-blue",
      changeColor: "text-brand-emerald"
    },
    {
      title: "Revenue",
      value: `₹${stats?.revenue?.toLocaleString() || 0}`,
      change: "+8% from last week",
      icon: "fas fa-dollar-sign",
      iconBg: "bg-emerald-100",
      iconColor: "text-brand-emerald",
      changeColor: "text-brand-emerald"
    },
    {
      title: "Active Restaurants",
      value: stats?.activeRestaurants || 0,
      change: `${stats?.totalRestaurants - stats?.activeRestaurants || 0} pending approval`,
      icon: "fas fa-store",
      iconBg: "bg-amber-100",
      iconColor: "text-brand-amber",
      changeColor: "text-gray-500"
    },
    {
      title: "Active Drivers",
      value: stats?.activeDrivers || 0,
      change: `${stats?.pendingDrivers || 0} pending approval`,
      icon: "fas fa-car",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      changeColor: "text-brand-amber"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
              <i className={`${stat.icon} ${stat.iconColor} text-xl`}></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className={`text-sm ${stat.changeColor}`}>{stat.change}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
