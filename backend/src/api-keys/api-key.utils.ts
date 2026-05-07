import crypto from 'crypto';

export const API_KEY_PREFIX = 'ak_';

export function generateApiKeySecret(): string {
  return `${API_KEY_PREFIX}${crypto.randomBytes(24).toString('hex')}`;
}

export function hashApiKeySecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

export function buildApiKeyPreview(prefix: string, last4: string): string {
  return `${prefix}...${last4}`;
}
