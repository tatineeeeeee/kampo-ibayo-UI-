"use client";
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 4000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove toast after duration (unless persistent)
    if (!newToast.persistent) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContainer = ({ toasts, removeToast }: ToastContainerProps) => {
  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastComponent key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

interface ToastComponentProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

const ToastComponent = ({ toast, onRemove }: ToastComponentProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleRemove = () => {
    setIsLeaving(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  const getToastStyles = () => {
    const baseStyles = "pointer-events-auto transform transition-all duration-300 ease-in-out";
    const positionStyles = isVisible && !isLeaving 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";

    switch (toast.type) {
      case 'success':
        return `${baseStyles} ${positionStyles} bg-green-50 border border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} ${positionStyles} bg-red-50 border border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} ${positionStyles} bg-yellow-50 border border-yellow-200 text-yellow-800`;
      case 'info':
        return `${baseStyles} ${positionStyles} bg-blue-50 border border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} ${positionStyles} bg-gray-50 border border-gray-200 text-gray-800`;
    }
  };

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (toast.type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-600`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-600`} />;
      case 'info':
        return <Info className={`${iconClass} text-blue-600`} />;
    }
  };

  const getProgressBarColor = () => {
    switch (toast.type) {
      case 'success': return 'bg-green-600';
      case 'error': return 'bg-red-600';
      case 'warning': return 'bg-yellow-600';
      case 'info': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className={`${getToastStyles()} rounded-lg shadow-lg p-4 min-w-0 relative overflow-hidden`}>
      {/* Progress bar for auto-dismiss */}
      {!toast.persistent && (
        <div className="absolute bottom-0 left-0 h-1 bg-black/10 w-full">
          <div 
            className={`h-full ${getProgressBarColor()} animate-progress-bar`}
            style={{
              animation: `progress ${toast.duration}ms linear forwards`
            }}
          />
        </div>
      )}

      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{toast.title}</div>
          {toast.message && (
            <div className="text-sm opacity-90 mt-1 leading-relaxed">
              {toast.message}
            </div>
          )}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity ml-2"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

// Convenience functions for common toast types
export const useToastHelpers = () => {
  const { showToast } = useToast();

  return {
    success: (title: string, message?: string) => 
      showToast({ type: 'success', title, message }),
    
    error: (title: string, message?: string) => 
      showToast({ type: 'error', title, message, duration: 6000 }),
    
    warning: (title: string, message?: string) => 
      showToast({ type: 'warning', title, message }),
    
    info: (title: string, message?: string) => 
      showToast({ type: 'info', title, message }),

    // Special login success toast
    loginSuccess: (userRole?: string) => {
      const isAdmin = userRole === 'admin';
      showToast({
        type: 'success',
        title: isAdmin ? 'Welcome back, Admin!' : 'Login Successful!',
        message: isAdmin 
          ? 'Redirecting to admin dashboard...' 
          : 'Welcome back to Kampo Ibayo',
        duration: 3000
      });
    },

    // Registration success
    registrationSuccess: () => 
      showToast({
        type: 'success',
        title: 'Account Created Successfully!',
        message: 'Please check your email and verify your account before signing in',
        duration: 6000
      }),

    // Password reset
    passwordResetSent: () =>
      showToast({
        type: 'info',
        title: 'Password Reset Sent',
        message: 'Check your email for reset instructions',
        duration: 5000
      })
  };
};