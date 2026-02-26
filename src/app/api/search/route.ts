import { NextRequest, NextResponse } from 'next/server';
import { triggerSearch } from '@/lib/n8n-client';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.businessSector || !data.city || !data.country) {
      return NextResponse.json(
        { success: false, error: 'Champs requis: businessSector, city, country' },
        { status: 400 }
      );
    }

    const businessSector = String(data.businessSector).slice(0, 100);
    const city = String(data.city).slice(0, 100);
    const address = String(data.address || '').slice(0, 200);
    const country = String(data.country).slice(0, 100);
    const maxLeads = Math.min(Math.max(1, Number(data.maxLeads) || 20), 50);

    const result = await triggerSearch({
      businessSector,
      city,
      address,
      country,
      maxLeads,
      emailLanguage: String(data.emailLanguage || 'French').slice(0, 30),
      emailTone: String(data.emailTone || 'Professional').slice(0, 30),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: { message: result.message } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
