import type { SearchFormData } from '@/types/search';

const N8N_BASE_URL = () => process.env.N8N_BASE_URL || '';
const REQUEST_TIMEOUT = 30000; // 30 seconds

function fetchWithTimeout(url: string, options: RequestInit, timeout = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function triggerSearch(data: SearchFormData): Promise<{ success: boolean; message: string }> {
  const webhookPath = process.env.N8N_SEARCH_WEBHOOK_PATH || '/webhook/api/search-leads';
  const url = `${N8N_BASE_URL()}${webhookPath}`;

  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'Business Sector': data.businessSector,
        'City': data.city,
        'Country': data.country,
        'Max Leads': data.maxLeads,
        'Email Language': data.emailLanguage,
        'Email Tone': data.emailTone,
      }),
    });

    if (!res.ok) {
      return { success: false, message: 'Erreur du serveur de recherche' };
    }
    return { success: true, message: 'Search triggered successfully' };
  } catch {
    return { success: false, message: 'Impossible de contacter le serveur' };
  }
}

export async function generateEmailPreview(
  leadName: string,
  leadEmail: string
): Promise<{ success: boolean; subject?: string; body?: string; error?: string }> {
  const webhookPath = process.env.N8N_EMAIL_PREVIEW_WEBHOOK_PATH || '/webhook/api/email-preview';
  const url = `${N8N_BASE_URL()}${webhookPath}`;

  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadName, leadEmail }),
    }, 60000); // 60s for AI generation

    if (!res.ok) {
      return { success: false, error: 'Erreur lors de la generation' };
    }

    const data = await res.json();
    return { success: true, subject: data.subject, body: data.body };
  } catch {
    return { success: false, error: 'Impossible de contacter le serveur' };
  }
}

export async function triggerEmailSend(
  leadName: string,
  leadEmail: string,
  subject: string,
  body: string,
  htmlBody: string
): Promise<{ success: boolean; message: string }> {
  const webhookPath = process.env.N8N_SEND_EMAIL_WEBHOOK_PATH || '/webhook/api/send-email';
  const url = `${N8N_BASE_URL()}${webhookPath}`;

  try {
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadName, leadEmail, subject, body, htmlBody }),
    });

    if (!res.ok) {
      return { success: false, message: "Erreur lors de l'envoi" };
    }
    return { success: true, message: 'Email sent successfully' };
  } catch {
    return { success: false, message: 'Impossible de contacter le serveur' };
  }
}
