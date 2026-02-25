import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export function signToken(email: string): string {
  return jwt.sign({ email }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    return decoded;
  } catch {
    return null;
  }
}

export function validateCredentials(email: string, password: string): boolean {
  return (
    email === process.env.AUTH_EMAIL &&
    password === process.env.AUTH_PASSWORD
  );
}
