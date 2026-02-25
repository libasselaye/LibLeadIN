import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { COOKIE_NAME } from '@/lib/constants';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
  }

  return NextResponse.json({ success: true, data: { email: decoded.email } });
}
