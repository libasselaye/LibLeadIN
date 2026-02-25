import { NextResponse } from 'next/server';
import { getStats } from '@/lib/google-sheets';

export async function GET() {
  try {
    const stats = await getStats();
    return NextResponse.json({ success: true, data: stats });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la recuperation des statistiques' },
      { status: 500 }
    );
  }
}
