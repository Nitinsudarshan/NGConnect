import crypto from 'crypto';

const SECRET_KEY = process.env.UNSUBSCRIBE_TOKEN_SECRET || 'ngconnect-unsubscribe-secret-dev-key';

export function generateUnsubscribeToken(email: string): string {
  const normalizedEmail = email.trim().toLowerCase();
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(normalizedEmail)
    .digest('hex');
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expectedToken = generateUnsubscribeToken(email);
  try {
    return crypto.timingSafeEqual(Buffer.from(token, 'hex'), Buffer.from(expectedToken, 'hex'));
  } catch (err) {
    return false;
  }
}
