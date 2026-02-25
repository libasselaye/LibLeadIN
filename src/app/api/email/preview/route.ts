import { NextRequest, NextResponse } from 'next/server';
import { generateEmailPreview } from '@/lib/n8n-client';

export async function POST(req: NextRequest) {
  try {
    const { leadName, leadEmail } = await req.json();

    if (!leadName || typeof leadName !== 'string') {
      return NextResponse.json(
        { success: false, error: 'leadName is required' },
        { status: 400 }
      );
    }

    const safeName = leadName.slice(0, 200);
    const safeEmail = typeof leadEmail === 'string' ? leadEmail.slice(0, 200) : '';

    const result = await generateEmailPreview(safeName, safeEmail);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { subject: result.subject, body: result.body },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
