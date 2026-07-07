import crypto from 'crypto';

// The session secret from .env is used as the encryption key
const getSecretKey = () => {
  const secret = process.env.SESSION_SECRET || 'a-default-secret-key-that-is-at-least-32-chars-long';
  return crypto.createHash('sha256').update(String(secret)).digest('base64').substring(0, 32);
};

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(getSecretKey()), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string) => {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(getSecretKey()), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
