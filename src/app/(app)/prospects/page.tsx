'use client';

import { useState, useMemo } from 'react';
import { useLeads } from '@/hooks/useLeads';
import ProspectCard from '@/components/prospects/ProspectCard';
import ProspectDetailModal from '@/components/prospects/ProspectDetailModal';
import EmailConfirmModal from '@/components/email/EmailConfirmModal';
import GlassCard from '@/components/ui/GlassCard';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import type { Lead } from '@/types/lead';
import { Search, Users } from 'lucide-react';

export default function ProspectsPage() {
  const { leads, isLoading, mutate } = useLeads(10000);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailLead, setEmailLead] = useState<Lead | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const extractCity = (address: string): string => {
    if (!address) return '';
    const parts = address.split(',').map((p) => p.trim());
    if (parts.length >= 2) {
      const cityPart = parts[parts.length - 2] || parts[parts.length - 1];
      return cityPart.replace(/^\d{4,5}\s*/, '').trim();
    }
    return address.trim();
  };

  const sectors = useMemo(() => {
    const set = new Set(
      leads.map((l) => (l.businessSector || '').trim()).filter(Boolean)
    );
    return Array.from(set).sort();
  }, [leads]);

  const cities = useMemo(() => {
    const set = new Set(
      leads.map((l) => extractCity(l.address)).filter(Boolean)
    );
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    let result = leads;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q) ||
          l.decisionMaker.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      if (statusFilter === 'SENT') result = result.filter((l) => l.status.startsWith('SENT'));
      else if (statusFilter === 'NO_EMAIL') result = result.filter((l) => !l.email || !l.email.includes('@'));
      else result = result.filter((l) => l.status === statusFilter);
    }

    if (sectorFilter) {
      result = result.filter(
        (l) => (l.businessSector || '').trim() === sectorFilter
      );
    }

    if (cityFilter) {
      result = result.filter(
        (l) => extractCity(l.address) === cityFilter
      );
    }

    return result;
  }, [leads, searchQuery, statusFilter, sectorFilter, cityFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-white/40">Chargement des prospects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Prospects</h1>
          <p className="text-white/40 mt-1">{leads.length} prospects au total</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="success">{leads.filter((l) => l.status.startsWith('SENT')).length} envoyés</Badge>
          <Badge variant="warning">{leads.filter((l) => l.status === 'PENDING').length} en attente</Badge>
        </div>
      </div>

      {/* Filters */}
      <GlassCard padding="md">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            placeholder="Rechercher un prospect..."
            icon={<Search className="w-4 h-4" />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select
            placeholder="Tous les statuts"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'PENDING', label: 'En attente' },
              { value: 'SENT', label: 'Envoye' },
              { value: 'NO_EMAIL', label: 'Pas d\'email' },
            ]}
          />
          <Select
            placeholder="Tous les secteurs"
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            options={sectors.map((s) => ({ value: s, label: s }))}
          />
          <Select
            placeholder="Toutes les villes"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            options={cities.map((c) => ({ value: c, label: c }))}
          />
        </div>
      </GlassCard>

      {/* Grid */}
      {filtered.length === 0 ? (
        <GlassCard padding="lg">
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white/60">Aucun prospect trouve</h3>
            <p className="text-sm text-white/30 mt-1">
              {leads.length === 0
                ? 'Lancez une recherche pour commencer'
                : 'Essayez de modifier vos filtres'}
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lead, i) => (
            <ProspectCard
              key={`${lead.name}-${i}`}
              lead={lead}
              onDetails={setSelectedLead}
              onSendEmail={setEmailLead}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ProspectDetailModal
        lead={selectedLead}
        open={!!selectedLead}
        onClose={() => setSelectedLead(null)}
        onSendEmail={(lead) => {
          setSelectedLead(null);
          setEmailLead(lead);
        }}
      />

      <EmailConfirmModal
        lead={emailLead}
        open={!!emailLead}
        onClose={() => setEmailLead(null)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
