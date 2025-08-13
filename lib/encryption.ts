import 'server-only';
import crypto from 'crypto';

// Use authenticated encryption
const ALG = 'aes-256-gcm'; // key length is 32 bytes (64 hex chars)

function getKey(): Buffer {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    console.warn('ENCRYPTION_KEY environment variable is not set - using default key for development');
    // Use a default development key (not secure for production)
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
  }
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) throw new Error('Encryption key must be 32 bytes (64 hex characters)');
  return key;
}

export const symmetricEncrypt = (data: string) => {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const ciphertext = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
};

export const symmetricDecrypt = (encrypted: string) => {
  const key = getKey();
  const parts = encrypted.split(':');
  if (parts.length === 3) {
    // New GCM format: iv:tag:ciphertext
    const [ivHex, tagHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const encryptedText = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv(ALG, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
  }
  if (parts.length === 2) {
    // Backward compatibility: old CBC format iv:ciphertext
    const [ivHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(dataHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
    return decrypted.toString('utf8');
  }
  throw new Error('Invalid encrypted payload format');
};
