import { NextRequest, NextResponse } from 'next/server';
import { getAllLeads } from '@/lib/google-sheets';

const VALID_STATUSES = ['PENDING', 'SENT', 'NO_EMAIL', 'FAILED'];

export async function GET(req: NextRequest) {
  try {
    const leads = await getAllLeads();

    const { searchParams } = req.nextUrl;
    const sector = searchParams.get('sector')?.slice(0, 100);
    const status = searchParams.get('status')?.slice(0, 20);
    const hasEmail = searchParams.get('hasEmail');

    let filtered = leads;

    if (sector) {
      const q = sector.toLowerCase();
      filtered = filtered.filter(
        (l) => l.businessSector.toLowerCase().includes(q) ||
               l.category.toLowerCase().includes(q)
      );
    }
    if (status && VALID_STATUSES.includes(status)) {
      if (status === 'SENT') {
        filtered = filtered.filter((l) => l.status.startsWith('SENT'));
      } else {
        filtered = filtered.filter((l) => l.status === status);
      }
    }
    if (hasEmail === 'true') {
      filtered = filtered.filter((l) => l.email && l.email.includes('@'));
    }
    if (hasEmail === 'false') {
      filtered = filtered.filter((l) => !l.email || !l.email.includes('@'));
    }

    return NextResponse.json({ success: true, data: filtered });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la recuperation des prospects' },
      { status: 500 }
    );
  }
}
