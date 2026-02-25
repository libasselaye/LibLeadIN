'use client';

import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Lead } from '@/types/lead';
import { Mail, MapPin, ExternalLink, Send } from 'lucide-react';

interface ProspectCardProps {
  lead: Lead;
  onDetails: (lead: Lead) => void;
  onSendEmail: (lead: Lead) => void;
}

function getStatusBadge(lead: Lead) {
  if (lead.status.startsWith('SENT')) return <Badge variant="success">Envoye</Badge>;
  if (lead.status === 'NO_EMAIL') return <Badge variant="danger">Pas d&apos;email</Badge>;
  if (lead.status === 'FAILED') return <Badge variant="danger">Echec</Badge>;
  return <Badge variant="warning">En attente</Badge>;
}

export default function ProspectCard({ lead, onDetails, onSendEmail }: ProspectCardProps) {
  const hasEmail = lead.email && lead.email.includes('@');
  const isSent = lead.status.startsWith('SENT');

  return (
    <GlassCard hoverable padding="none" className="flex flex-col">
      <div className="p-5 flex-1 space-y-3 cursor-pointer" onClick={() => onDetails(lead)}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{lead.name || 'Sans nom'}</h3>
            {lead.decisionMaker && (
              <p className="text-sm text-white/50 truncate">{lead.decisionMaker}</p>
            )}
          </div>
          {getStatusBadge(lead)}
        </div>

        {hasEmail && (
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Mail className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}

        {lead.address && (
          <div className="flex items-center gap-2 text-sm text-white/40">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{lead.address}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {lead.category && <Badge>{lead.category}</Badge>}
          {lead.rating && <Badge variant="info">{lead.rating}/5</Badge>}
        </div>
      </div>

      <div className="border-t border-white/[0.06] p-3 flex gap-2">
        <Button variant="secondary" size="sm" className="flex-1" onClick={() => onDetails(lead)}>
          <ExternalLink className="w-3.5 h-3.5" />
          Details
        </Button>
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          disabled={!hasEmail || isSent}
          onClick={() => onSendEmail(lead)}
        >
          <Send className="w-3.5 h-3.5" />
          {isSent ? 'Envoye' : 'Envoyer'}
        </Button>
      </div>
    </GlassCard>
  );
}
