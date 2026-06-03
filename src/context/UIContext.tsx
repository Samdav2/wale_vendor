'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

interface UIContextType {
  title: string;
  setTitle: (title: string) => void;
  toast: ToastState | null;
  showToast: (message: string, type?: ToastType) => void;
  clearToast: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState('Dashboard');
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  const clearToast = () => {
    setToast(null);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        clearToast();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <UIContext.Provider value={{ title, setTitle, toast, showToast, clearToast }}>
      {children}
      {toast && (
        <div className="fixed top-4 right-4 z-50 animate-slide-up flex items-center p-4 mb-4 text-sm rounded-lg glass-card border-l-4 shadow-lg border-l-primary" style={{
          borderLeftColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#f59e0b'
        }}>
          <div className="mr-3 font-semibold text-slate-800">
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✗' : '⚠'}
          </div>
          <div className="text-slate-700 font-medium">{toast.message}</div>
          <button onClick={clearToast} className="ml-4 text-slate-400 hover:text-slate-600 focus:outline-none">
            ×
          </button>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
