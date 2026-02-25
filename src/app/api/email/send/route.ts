import { NextRequest, NextResponse } from 'next/server';
import { triggerEmailSend } from '@/lib/n8n-client';
import { buildHtmlEmail } from '@/lib/email-template';

export async function POST(req: NextRequest) {
  try {
    const { leadName, leadEmail, subject, body } = await req.json();

    if (!leadName || !subject || !body) {
      return NextResponse.json(
        { success: false, error: 'leadName, subject and body are required' },
        { status: 400 }
      );
    }

    const safeName = String(leadName).slice(0, 200);
    const safeEmail = typeof leadEmail === 'string' ? leadEmail.slice(0, 200) : '';
    const safeSubject = String(subject).slice(0, 500);
    const safeBody = String(body).slice(0, 10000);

    const htmlBody = buildHtmlEmail(safeBody);

    const result = await triggerEmailSend(safeName, safeEmail, safeSubject, safeBody, htmlBody);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data: { message: 'Email sent successfully' } });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
