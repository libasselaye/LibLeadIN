'use client';

import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import type { Lead } from '@/types/lead';
import { Mail, Phone, MapPin, Globe, Linkedin, User, Star, Send, CheckCircle } from 'lucide-react';

interface Props {
  lead: Lead | null;
  open: boolean;
  onClose: () => void;
  onSendEmail: (lead: Lead) => void;
}

export default function ProspectDetailModal({ lead, open, onClose, onSendEmail }: Props) {
  if (!lead) return null;

  const hasEmail = lead.email && lead.email.includes('@');
  const isSent = lead.status.startsWith('SENT');

  return (
    <Modal open={open} onClose={onClose} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">{lead.name}</h2>
          {lead.decisionMaker && (
            <p className="text-white/50 mt-1">{lead.decisionMaker}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Contact</h3>
            {lead.email && (
              <InfoRow icon={<Mail className="w-4 h-4" />} label={lead.email} href={`mailto:${lead.email}`} />
            )}
            {lead.phone && (
              <InfoRow icon={<Phone className="w-4 h-4" />} label={lead.phone} href={`tel:${lead.phone}`} />
            )}
            {lead.linkedinPerson && (
              <InfoRow icon={<Linkedin className="w-4 h-4" />} label="LinkedIn" href={lead.linkedinPerson} />
            )}
            {lead.address && (
              <InfoRow icon={<MapPin className="w-4 h-4" />} label={lead.address} />
            )}
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Entreprise</h3>
            {lead.name && (
              <InfoRow icon={<User className="w-4 h-4" />} label={lead.name} />
            )}
            {lead.website && (
              <InfoRow icon={<Globe className="w-4 h-4" />} label={lead.website} href={lead.website} />
            )}
            {lead.linkedinCompany && (
              <InfoRow icon={<Linkedin className="w-4 h-4" />} label="Page entreprise" href={lead.linkedinCompany} />
            )}
            {lead.rating && (
              <InfoRow icon={<Star className="w-4 h-4" />} label={`${lead.rating} / 5`} />
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {lead.businessSector && <Badge variant="info">{lead.businessSector}</Badge>}
          {lead.category && <Badge>{lead.category}</Badge>}
          {lead.rating && <Badge variant="info">{lead.rating}/5</Badge>}
        </div>

        {/* Action */}
        <div className="pt-2">
          {isSent ? (
            <Button variant="secondary" size="lg" className="w-full" disabled>
              <CheckCircle className="w-5 h-5" />
              Email deja envoye
            </Button>
          ) : hasEmail ? (
            <Button size="lg" className="w-full" onClick={() => onSendEmail(lead)}>
              <Send className="w-5 h-5" />
              Envoyer un email personnalise
            </Button>
          ) : (
            <Button variant="secondary" size="lg" className="w-full" disabled>
              <Mail className="w-5 h-5" />
              Pas d&apos;email disponible
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({ icon, label, href }: { icon: React.ReactNode; label: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-white/40">{icon}</span>
      <span className="text-sm text-white/80 truncate">{label}</span>
    </div>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:bg-white/[0.03] -mx-2 px-2 rounded-lg transition-colors">
        {content}
      </a>
    );
  }
  return content;
}
