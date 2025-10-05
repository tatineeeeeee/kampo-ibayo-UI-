// Modern Maintenance Mode Toast Component
"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X, Settings, Clock } from "lucide-react";
import { isMaintenanceMode, getMaintenanceMessage } from "../utils/maintenanceMode";

export default function MaintenanceToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const isActive = await isMaintenanceMode();
        const currentMessage = await getMaintenanceMessage();
        
        if (isActive && !isDismissed) {
          setIsVisible(true);
          setMessage(currentMessage);
        } else if (!isActive) {
          setIsVisible(false);
          setIsDismissed(false); // Reset dismissal when maintenance is turned off
        }
      } catch (error) {
        console.error('Error checking maintenance mode:', error);
        setIsVisible(false);
      }
    };

    // Initial check
    checkMaintenance();

    // Listen for settings changes from admin panel
    const handleSettingsChange = () => {
      setIsDismissed(false); // Reset dismissal on settings change
      checkMaintenance();
    };

    // Check every 5 seconds for changes
    const interval = setInterval(checkMaintenance, 5000);
    
    // Listen for custom events from admin settings
    window.addEventListener('maintenanceSettingsChanged', handleSettingsChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('maintenanceSettingsChanged', handleSettingsChange);
    };
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] pointer-events-none" />
      
      {/* Toast container */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[101] max-w-md w-full mx-4 animate-fadeInDown">
        <div className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 rounded-2xl shadow-2xl border border-red-400/30 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-red-400/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Maintenance Mode</h3>
                <p className="text-red-100 text-sm flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Temporarily unavailable
                </p>
              </div>
            </div>
            <button 
              onClick={handleDismiss}
              className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-white text-sm leading-relaxed mb-4">
              {message}
            </p>
            
            {/* Status indicators */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-100 text-xs">
                <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
                <span>Bookings disabled</span>
              </div>
              <div className="flex items-center gap-1 text-red-100 text-xs">
                <Settings className="w-3 h-3" />
                <span>Admin controlled</span>
              </div>
            </div>
          </div>

          {/* Animated progress bar */}
          <div className="h-1 bg-red-800/50">
            <div className="h-full bg-gradient-to-r from-red-300 to-white animate-pulse"></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        .animate-fadeInDown {
          animation: fadeInDown 0.5s ease-out;
        }
      `}</style>
    </>
  );
}