import crypto from 'crypto';

function getUnsubscribeSecretKey(): string {
  const secret = process.env.UNSUBSCRIBE_TOKEN_SECRET;
  if (!secret) {
    throw new Error('UNSUBSCRIBE_TOKEN_SECRET environment variable is not configured.');
  }
  return secret;
}

export function generateUnsubscribeToken(email: string): string {
  const secretKey = getUnsubscribeSecretKey();
  const normalizedEmail = email.trim().toLowerCase();
  return crypto
    .createHmac('sha256', secretKey)
    .update(normalizedEmail)
    .digest('hex');
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  try {
    const expectedToken = generateUnsubscribeToken(email);
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expectedToken, 'hex'));
  } catch (err) {
    return false;
  }
}
