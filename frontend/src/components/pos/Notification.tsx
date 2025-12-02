'use client';

import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface NotificationProps {
  show: boolean;
  message: string;
  onHide: () => void;
}

export function Notification({ show, message, onHide }: NotificationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onHide();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  return (
    <div className="fixed bottom-16 sm:bottom-20 left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2 bg-green-600 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg z-50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}
