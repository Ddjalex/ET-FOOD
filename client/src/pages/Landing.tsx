import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <header className="px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-brand-blue rounded-lg flex items-center justify-center">
              <i className="fas fa-motorcycle text-white text-lg"></i>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900">BeU Delivery</h1>
              <p className="text-sm text-gray-500">Ethiopia's Premier Food Delivery</p>
            </div>
          </div>
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-brand-blue hover:bg-blue-700"
          >
            <i className="fas fa-sign-in-alt mr-2"></i>
            Login
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Deliver Food, Connect Communities
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Welcome to BeU Delivery - Ethiopia's leading food delivery platform. 
            Connect restaurants, drivers, and customers through our comprehensive management system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-store text-brand-blue text-2xl"></i>
              </div>
              <CardTitle>Restaurant Management</CardTitle>
              <CardDescription>
                Comprehensive tools for restaurants to manage menus, orders, and kitchen operations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-motorcycle text-brand-emerald text-2xl"></i>
              </div>
              <CardTitle>Driver Network</CardTitle>
              <CardDescription>
                Connect with reliable drivers and manage deliveries with real-time tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fab fa-telegram text-brand-amber text-2xl"></i>
              </div>
              <CardTitle>Telegram Integration</CardTitle>
              <CardDescription>
                Seamless customer and driver experience through Telegram bots and mini-apps
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Powerful Admin Dashboard
              </h3>
              <p className="text-gray-600 mb-6">
                Get real-time insights into your delivery operations with our comprehensive dashboard. 
                Monitor orders, manage approvals, track performance, and analyze business metrics.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <i className="fas fa-check text-brand-emerald mr-3"></i>
                  Real-time order tracking and management
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-brand-emerald mr-3"></i>
                  Driver and restaurant approval workflows
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-brand-emerald mr-3"></i>
                  Analytics and performance insights
                </li>
                <li className="flex items-center">
                  <i className="fas fa-check text-brand-emerald mr-3"></i>
                  Integrated notification system
                </li>
              </ul>
            </div>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <i className="fas fa-chart-line text-6xl text-gray-400 mb-4"></i>
              <p className="text-gray-500">Dashboard Preview</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h3>
          <p className="text-gray-600 mb-8">
            Login to access your dashboard and start managing your delivery operations.
          </p>
          <Button 
            size="lg"
            onClick={() => window.location.href = '/api/login'}
            className="bg-brand-blue hover:bg-blue-700"
          >
            <i className="fas fa-rocket mr-2"></i>
            Access Dashboard
          </Button>
        </div>
      </main>

      <footer className="bg-gray-50 border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 BeU Delivery. Built for Ethiopia's food delivery ecosystem.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
