"use client";

import { useEffect } from 'react';

const NetworkInitializer = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.clear();      console.log(
        '%c🎯 Network Filter Active - Use DevTools Network filter: API Backend',
        'background: #00ff00; color: white; padding: 8px 16px; border-radius: 4px; font-weight: bold;'
      );
    }
  }, []);

  return null;
};

export default NetworkInitializer;
