import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { argon2id } from '@noble/hashes/argon2.js';

//OWASP recommendations for client-side use
const ARGON2_ITERATIONS = 2;
const ARGON2_MEMORY = 16 * 1024;
const ARGON2_PARALLELISM = 1; //single threaded for browser
const KEY_LENGTH = 32;

/**
 * ciphertext: Base64 encoded
 * nonce: Base64 encoded (96 bits / 12 bytes for GCM)
 * salt: Base64 encoded (128 bits / 16 bytes for Argon2)
 */
export interface EncryptedData {
  ciphertext: string;
  nonce: string;
  salt: string;
}

/**
 * Derives a 256-bit encryption key from a master password using Argon2id
 */
export async function deriveKey(
  masterPassword: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const passwordBytes = new TextEncoder().encode(masterPassword);
  
  // Use argon2id with secure parameters
  const key = argon2id(passwordBytes, salt, {
    t: ARGON2_ITERATIONS,
    m: ARGON2_MEMORY,
    p: ARGON2_PARALLELISM,
    dkLen: KEY_LENGTH,
  });
  
  return key;
}

/**
 * Encrypts data using AES-256-GCM
 */
export async function encrypt(
  plaintext: string,
  masterPassword: string
): Promise<EncryptedData> {
  // Generate random salt for key derivation
  const salt = randomBytes(16);
  
  // Derive encryption key from master password
  const key = await deriveKey(masterPassword, salt);
  
  // Generate random nonce for GCM (96 bits recommended)
  const nonce = randomBytes(12);
  
  // Encrypt using AES-256-GCM
  const plaintextBytes = new TextEncoder().encode(plaintext);
  const cipher = gcm(key, nonce);
  const ciphertext = cipher.encrypt(plaintextBytes);
  
  // Return encrypted data with metadata
  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    nonce: arrayBufferToBase64(nonce),
    salt: arrayBufferToBase64(salt),
  };
}

/**
 * Decrypts data using AES-256-GCM
 */
export async function decrypt(
  encryptedData: EncryptedData,
  masterPassword: string
): Promise<string> {
  try {
    // Decode from base64
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const nonce = base64ToArrayBuffer(encryptedData.nonce);
    const salt = base64ToArrayBuffer(encryptedData.salt);
    
    // Derive the same key using the stored salt
    const key = await deriveKey(masterPassword, salt);
    
    // Decrypt using AES-256-GCM
    const cipher = gcm(key, nonce);
    const plaintextBytes = cipher.decrypt(ciphertext);
    
    // Convert back to string
    return new TextDecoder().decode(plaintextBytes);
  } catch (error) {
    throw new Error('Decryption failed. Invalid master password or corrupted data.');
  }
}

/**
 * Encrypts a password entry (converts object to JSON, then encrypts)
 */
export async function encryptPasswordEntry(
  entry: { domain: string; username: string; password: string },
  masterPassword: string
): Promise<EncryptedData> {
  const json = JSON.stringify(entry);
  return encrypt(json, masterPassword);
}

/**
 * Decrypts a password entry (decrypts, then parses JSON)
 */
export async function decryptPasswordEntry(
  encryptedData: EncryptedData,
  masterPassword: string
): Promise<{ domain: string; username: string; password: string }> {
  const json = await decrypt(encryptedData, masterPassword);
  return JSON.parse(json);
}

/**
 * Verifies if a master password is correct by attempting to decrypt a test value
 */
export async function verifyMasterPassword(
  testEncryptedData: EncryptedData,
  masterPassword: string
): Promise<boolean> {
  try {
    await decrypt(testEncryptedData, masterPassword);
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates a test encrypted value to verify master password later
 */
export async function createPasswordVerifier(
  masterPassword: string
): Promise<EncryptedData> {
  const testValue = 'passman_verification_token';
  return encrypt(testValue, masterPassword);
}

// Helper functions for base64 encoding/decoding
function arrayBufferToBase64(buffer: Uint8Array): string {
  const binary = String.fromCharCode(...buffer);
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
