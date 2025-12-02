"use client";

import { useEffect } from "react";

interface SecurityLogEntry {
  timestamp: string;
  userId: number | string;
  userName: string;
  action: string;
  targetResource: string;
  targetId: string | number;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
  reason?: string;
  userAgent: string;
  ipAddress?: string;
}

interface SecurityLogProps {
  userId: number | string;
  userName: string;
  action: string;
  targetResource: string;
  targetId: string | number;
  result: 'SUCCESS' | 'DENIED' | 'ERROR';
  reason?: string;
}

export function SecurityLog({ 
  userId, 
  userName, 
  action, 
  targetResource, 
  targetId, 
  result, 
  reason 
}: SecurityLogProps) {
  
  useEffect(() => {
    const logEntry: SecurityLogEntry = {
      timestamp: new Date().toISOString(),
      userId,
      userName,
      action,
      targetResource,
      targetId,
      result,
      reason,
      userAgent: navigator.userAgent,
      ipAddress: undefined // Will be filled by backend
    };
    
    // Log to console for development
    console.log('🔒 Security Log:', logEntry);
    
    // In production, you might want to send this to a security logging service
    // logSecurityEvent(logEntry);
    
  }, [userId, userName, action, targetResource, targetId, result, reason]);
  
  // This component doesn't render anything
  return null;
}

// Helper function to create security logs
export function createSecurityLog(props: SecurityLogProps) {
  return <SecurityLog {...props} />;
}

// Constants for common actions
export const SECURITY_ACTIONS = {
  ACCESS_ATTEMPT: 'ACCESS_ATTEMPT',
  EDIT_ATTEMPT: 'EDIT_ATTEMPT',
  DELETE_ATTEMPT: 'DELETE_ATTEMPT',
  VIEW_ATTEMPT: 'VIEW_ATTEMPT',
  DOWNLOAD_ATTEMPT: 'DOWNLOAD_ATTEMPT',
} as const;

// Constants for resource types
export const RESOURCE_TYPES = {
  BIOGRAFI: 'BIOGRAFI',
  ALUMNI_CARD: 'ALUMNI_CARD',
  BERITA: 'BERITA',
  USER_PROFILE: 'USER_PROFILE',
} as const;

// Constants for results
export const SECURITY_RESULTS = {
  SUCCESS: 'SUCCESS',
  DENIED: 'DENIED',
  ERROR: 'ERROR',
} as const;
