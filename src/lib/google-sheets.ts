import { Lead, HEADER_TO_KEY } from '@/types/lead';
import type { DashboardStats, ActivityItem } from '@/types/api';

const N8N_BASE_URL = () => process.env.N8N_BASE_URL || '';
const LEADS_WEBHOOK_PATH = () => process.env.N8N_READ_LEADS_WEBHOOK_PATH || '/webhook/api/leads';

function isConfigured(): boolean {
  return !!(process.env.N8N_BASE_URL);
}

export async function getAllLeads(): Promise<Lead[]> {
  if (!isConfigured()) return [];

  const url = `${N8N_BASE_URL()}${LEADS_WEBHOOK_PATH()}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) return [];

    const rows: Record<string, string>[] = await res.json();
    if (!rows || rows.length === 0) return [];

    const leads: Lead[] = rows.map((row, index) => {
      const lead: Partial<Lead> = { rowIndex: index + 2 };
      for (const [header, key] of Object.entries(HEADER_TO_KEY)) {
        (lead as Record<string, string | number>)[key] = row[header] || '';
      }
      return lead as Lead;
    });

    return leads;
  } catch {
    return [];
  }
}

export async function getLeadByName(name: string): Promise<Lead | null> {
  const leads = await getAllLeads();
  return leads.find((l) => l.name === name) || null;
}

export async function getStats(): Promise<DashboardStats> {
  const leads = await getAllLeads();

  const emailsSent = leads.filter((l) => l.status.startsWith('SENT')).length;
  const noEmail = leads.filter((l) => l.status === 'NO_EMAIL').length;
  const pending = leads.filter((l) => l.status === 'PENDING').length;
  const totalProspects = leads.length;
  const sendRate = totalProspects > 0 ? Math.round((emailsSent / totalProspects) * 100) : 0;

  const bySector: Record<string, { total: number; sent: number }> = {};
  leads.forEach((l) => {
    const sector = l.businessSector || l.category || 'Other';
    if (!bySector[sector]) bySector[sector] = { total: 0, sent: 0 };
    bySector[sector].total++;
    if (l.status.startsWith('SENT')) bySector[sector].sent++;
  });

  const recentActivity: ActivityItem[] = leads
    .filter((l) => l.status.startsWith('SENT'))
    .map((l) => {
      const timestamp = l.status.replace('SENT - ', '').trim();
      return {
        name: l.name,
        status: 'SENT',
        sector: l.businessSector || l.category || '',
        timestamp,
      };
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 10);

  return { totalProspects, emailsSent, pending, noEmail, sendRate, bySector, recentActivity };
}
