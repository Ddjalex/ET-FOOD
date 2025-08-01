import { useQuery } from "@tanstack/react-query";

export function OrderAnalytics() {
  const { data: analytics = {}, isLoading } = useQuery({
    queryKey: ["/api/dashboard/analytics"],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Order Analytics</h3>
          <p className="text-sm text-gray-600 mt-1">Last 7 days performance</p>
        </div>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-6"></div>
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Order Analytics</h3>
        <p className="text-sm text-gray-600 mt-1">Last 7 days performance</p>
      </div>
      <div className="p-6">
        {/* Chart Placeholder */}
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 mb-6">
          <div className="text-center">
            <i className="fas fa-chart-line text-4xl text-gray-400 mb-4"></i>
            <p className="text-gray-500">Order Analytics Chart</p>
            <p className="text-sm text-gray-400">Integration with Chart.js required</p>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              ₹{analytics?.avgOrderValue?.toFixed(0) || 234}
            </p>
            <p className="text-xs text-gray-600">Avg Order Value</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.completionRate || 94}%
            </p>
            <p className="text-xs text-gray-600">Completion Rate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {analytics?.avgDeliveryTime || 28}min
            </p>
            <p className="text-xs text-gray-600">Avg Delivery</p>
          </div>
        </div>
      </div>
    </div>
  );
}
