import { useQuery } from "@tanstack/react-query";

export function ActiveDrivers() {
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["/api/drivers/available"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Active Drivers</h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="ml-3">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeDrivers = drivers || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Active Drivers</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <span className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5"></span>
            {activeDrivers.length} Online
          </span>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4 max-h-80 overflow-y-auto">
          {activeDrivers.map((driver: any) => (
            <div key={driver.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-gray-600"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {`Driver ${driver.id.slice(0, 8)}`}
                  </p>
                  <p className={`text-xs ${driver.isAvailable ? 'text-gray-600' : 'text-amber-600'}`}>
                    Zone: {driver.zone || 'Unassigned'} • {driver.isAvailable ? 'Available' : 'On Delivery'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {driver.rating || '5.0'}★
                </p>
                <p className="text-xs text-gray-600">
                  {driver.totalDeliveries || 0} orders
                </p>
              </div>
            </div>
          ))}
          
          {activeDrivers.length === 0 && (
            <div className="text-center py-8">
              <i className="fas fa-car text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">No active drivers online</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
