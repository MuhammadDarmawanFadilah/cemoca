// Simple encryption/decryption utility for obscuring IDs
// This is for obfuscation purposes, not cryptographic security

const SECRET_KEY = process.env.NEXT_PUBLIC_ALUMNI_ID_SECRET_KEY || "alumni_card_secret_2025";

// Simple base64 encoding with a twist to make it less obvious
export function encodeId(id: number | string): string {
  try {
    const idStr = id.toString();
    const timestamp = Date.now().toString(36);
    const combined = `${idStr}:${timestamp}:${SECRET_KEY}`;
    
    // Base64 encode and make URL safe
    const encoded = btoa(combined)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return encoded;
  } catch (error) {
    console.error('Error encoding ID:', error);
    return id.toString();
  }
}

// Decode the obfuscated ID
export function decodeId(encodedId: string): number | null {
  try {
    // Restore base64 padding and characters
    let base64 = encodedId
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const decoded = atob(base64);
    const parts = decoded.split(':');
    
    if (parts.length >= 3 && parts[2] === SECRET_KEY) {
      const id = parseInt(parts[0]);
      return isNaN(id) ? null : id;
    }
    
    return null;
  } catch (error) {
    console.error('Error decoding ID:', error);
    return null;
  }
}

// Check if a string looks like an encoded ID
export function isEncodedId(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  
  // Check if it's a simple number (old format)
  if (/^\d+$/.test(value)) return false;
  
  // Check if it looks like our encoded format
  return /^[A-Za-z0-9_-]+$/.test(value) && value.length > 10;
}

// For backward compatibility - handle both encoded and plain IDs
export function parseId(value: string): number | null {
  if (!value) return null;
  
  // If it's a plain number, return it
  if (/^\d+$/.test(value)) {
    return parseInt(value);
  }
  
  // Otherwise, try to decode it
  return decodeId(value);
}
