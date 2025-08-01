import { useState } from "react";
import { NotificationModal } from "../NotificationModal";

interface TopBarProps {
  title: string;
  subtitle: string;
  user?: any;
}

export function TopBar({ title, subtitle, user }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowNotifications(true)}
            >
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            <div className="w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center">
              <i className="fas fa-user text-sm"></i>
            </div>
          </div>
        </div>
      </header>

      <NotificationModal 
        isOpen={showNotifications} 
        onClose={() => setShowNotifications(false)} 
      />
    </>
  );
}
