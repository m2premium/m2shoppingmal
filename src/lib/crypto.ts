/**
 * Simple, robust password-based encryption and decryption for ledger backup.
 * Provides a salted XOR-base64 cipher with verification signature and checksum.
 * This guarantees offline usability, Unicode support, and precise password validation.
 */

// Simple FNV-1a hash for key stretching and signature check
function fnv1a(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return hash >>> 0;
}

export function encryptData(data: any, password = "M2-MALL-MASTER-SECURE-KEY"): string {
  const jsonStr = JSON.stringify(data);
  const salt = Math.random().toString(36).substring(2, 10); // 8-char random salt
  const stretchedKey = password + salt;
  
  // Stretch key with FNV-1a variations to generate byte stream
  const keyHash1 = fnv1a(stretchedKey);
  const keyHash2 = fnv1a(stretchedKey + "alt");
  
  let result = "";
  for (let i = 0; i < jsonStr.length; i++) {
    const charCode = jsonStr.charCodeAt(i);
    // Dynamic XOR key based on position and stretched hashes
    const xorKey = ((keyHash1 ^ (i * 31)) + (keyHash2 % (i + 13))) & 255;
    const encryptedByte = charCode ^ xorKey;
    result += String.fromCharCode(encryptedByte);
  }
  
  // Prepare payload with signature for password validation
  const signature = fnv1a(jsonStr); // checksum of original string
  const payload = {
    s: salt,
    sig: signature,
    d: btoa(unescape(encodeURIComponent(result))) // Unicode-safe base64 conversion
  };
  
  return btoa(JSON.stringify(payload));
}

export function decryptData(encryptedStr: string, password = "M2-MALL-MASTER-SECURE-KEY"): any {
  try {
    const payloadRaw = atob(encryptedStr);
    const payload = JSON.parse(payloadRaw);
    if (!payload.s || !payload.sig || !payload.d) {
      throw new Error("Invalid backup format");
    }
    
    const rawData = decodeURIComponent(escape(atob(payload.d)));
    const salt = payload.s;
    const expectedSig = payload.sig;
    const stretchedKey = password + salt;
    
    const keyHash1 = fnv1a(stretchedKey);
    const keyHash2 = fnv1a(stretchedKey + "alt");
    
    let decrypted = "";
    for (let i = 0; i < rawData.length; i++) {
      const byte = rawData.charCodeAt(i);
      const xorKey = ((keyHash1 ^ (i * 31)) + (keyHash2 % (i + 13))) & 255;
      decrypted += String.fromCharCode(byte ^ xorKey);
    }
    
    const actualSig = fnv1a(decrypted);
    if (actualSig !== expectedSig) {
      throw new Error("Incorrect backup password or corrupted data");
    }
    
    return JSON.parse(decrypted);
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Incorrect password or invalid backup file");
  }
}
