'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useSearch } from '@/hooks/useSearch';
import { useToast } from '@/components/ui/Toast';
import { LANGUAGES, TONES, COUNTRIES } from '@/types/search';
import type { Lead } from '@/types/lead';
import {
  Briefcase, MapPin, Globe, Hash, Languages, MessageSquare,
  Search as SearchIcon, CheckCircle2, Loader2, ArrowRight,
  Users, AtSign, AlertCircle, ExternalLink, Star,
  Mail, Phone, Navigation,
} from 'lucide-react';

type ProgressPhase = 'scraping' | 'processing' | 'complete';

interface ProgressState {
  phase: ProgressPhase;
  leads: Lead[];
  initialCount: number;
  maxLeads: number;
  sector: string;
  city: string;
  stableCount: number;
  elapsedSeconds: number;
}

/* ─── Mini prospect card for live feed ─── */
function LiveProspectRow({ lead }: { lead: Lead }) {
  const hasEmail = lead.email && lead.email.includes('@');
  const hasLinkedin = (lead.linkedinCompany && lead.linkedinCompany.includes('linkedin')) ||
    (lead.linkedinPerson && lead.linkedinPerson.includes('linkedin'));

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Company initial */}
      <div className="w-9 h-9 rounded-lg bg-blue-600/15 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-blue-400">
          {(lead.name || '?')[0].toUpperCase()}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{lead.name || 'Sans nom'}</p>
        <div className="flex items-center gap-3 mt-0.5">
          {lead.category && (
            <span className="text-xs text-white/30 truncate">{lead.category}</span>
          )}
          {lead.rating && (
            <span className="text-xs text-amber-400/70 flex items-center gap-0.5">
              <Star className="w-3 h-3" />
              {lead.rating}
            </span>
          )}
        </div>
      </div>

      {/* Status icons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {hasEmail ? (
          <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center" title={lead.email}>
            <Mail className="w-3 h-3 text-green-400" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center" title="Pas d'email">
            <Mail className="w-3 h-3 text-white/15" />
          </div>
        )}
        {lead.phone ? (
          <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center" title={lead.phone}>
            <Phone className="w-3 h-3 text-blue-400" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center">
            <Phone className="w-3 h-3 text-white/15" />
          </div>
        )}
        {hasLinkedin ? (
          <div className="w-6 h-6 rounded-full bg-sky-500/10 flex items-center justify-center" title="LinkedIn">
            <ExternalLink className="w-3 h-3 text-sky-400" />
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center">
            <ExternalLink className="w-3 h-3 text-white/15" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const { search, isSearching } = useSearch();
  const { toast } = useToast();
  const [tracking, setTracking] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    businessSector: '',
    city: '',
    address: '',
    country: 'France',
    maxLeads: 20,
    emailLanguage: 'French',
    emailTone: 'Professional',
  });

  const update = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // Auto-scroll feed when new leads arrive
  useEffect(() => {
    if (progress && progress.leads.length > 0) {
      feedEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [progress?.leads.length]);

  const startTracking = useCallback(async (initialCount: number) => {
    setProgress({
      phase: 'scraping',
      leads: [],
      initialCount,
      maxLeads: form.maxLeads,
      sector: form.businessSector,
      city: form.city,
      stableCount: 0,
      elapsedSeconds: 0,
    });
    setTracking(true);

    // Elapsed time timer
    timerRef.current = setInterval(() => {
      setProgress((prev) => prev ? { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 } : prev);
    }, 1000);

    // Poll leads every 3 seconds
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/leads');
        const json = await res.json();
        if (json.success && json.data) {
          const allLeads: Lead[] = json.data;

          setProgress((prev) => {
            if (!prev) return prev;
            const recentLeads = allLeads.slice(prev.initialCount);
            const newCount = recentLeads.length;
            const newStable = newCount === prev.leads.length ? prev.stableCount + 1 : 0;

            let phase: ProgressPhase = prev.phase;
            if (newCount > 0 && phase === 'scraping') {
              phase = 'processing';
            }

            // Done: stable for 5 polls (15s) with leads, or reached max
            if ((newStable >= 5 && newCount > 0) || newCount >= prev.maxLeads) {
              phase = 'complete';
              stopPolling();
            }

            return {
              ...prev,
              leads: recentLeads,
              phase,
              stableCount: newStable,
            };
          });
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);
  }, [form.maxLeads, form.businessSector, form.city, stopPolling]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.businessSector || !form.city) {
      toast('Veuillez remplir le secteur et la ville', 'error');
      return;
    }

    let initialCount = 0;
    try {
      const res = await fetch('/api/leads');
      const json = await res.json();
      if (json.success && json.data) {
        initialCount = json.data.length;
      }
    } catch {
      // continue
    }

    const success = await search(form);
    if (success) {
      toast('Recherche lancée avec succès !', 'success');
      startTracking(initialCount);
    } else {
      toast('Erreur lors du lancement de la recherche', 'error');
    }
  };

  const handleNewSearch = () => {
    stopPolling();
    setTracking(false);
    setProgress(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s.toString().padStart(2, '0')}s` : `${s}s`;
  };

  // ─── PROGRESS TRACKER UI ───
  if (tracking && progress) {
    const leadCount = progress.leads.length;
    const withEmail = progress.leads.filter((l) => l.email && l.email.includes('@')).length;
    const withoutEmail = leadCount - withEmail;
    const withLinkedin = progress.leads.filter(
      (l) => (l.linkedinCompany && l.linkedinCompany.includes('linkedin')) ||
             (l.linkedinPerson && l.linkedinPerson.includes('linkedin'))
    ).length;

    const percent = progress.maxLeads > 0
      ? Math.min(100, Math.round((leadCount / progress.maxLeads) * 100))
      : 0;

    const isComplete = progress.phase === 'complete';
    const isProcessing = progress.phase === 'processing';

    return (
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            {!isComplete && <Loader2 className="w-6 h-6 animate-spin text-blue-400" />}
            {isComplete && <CheckCircle2 className="w-6 h-6 text-green-400" />}
            <h1 className="text-2xl font-bold">
              {isComplete ? 'Recherche terminée' : 'Recherche en cours'}
            </h1>
          </div>
          <p className="text-white/40 text-sm">
            {progress.sector} — {progress.city} — {formatTime(progress.elapsedSeconds)}
          </p>
        </div>

        {/* Progress bar + counters */}
        <GlassCard padding="lg">
          <div className="space-y-4">
            {/* Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/50">
                  {isComplete ? 'Terminé' : isProcessing ? 'Traitement en cours...' : 'Scraping Google Places...'}
                </span>
                <span className={`font-mono ${isComplete ? 'text-green-400' : 'text-blue-400'}`}>
                  {leadCount}/{progress.maxLeads}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    isComplete
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                      : 'bg-gradient-to-r from-blue-600 to-blue-400'
                  }`}
                  style={{ width: `${progress.phase === 'scraping' && leadCount === 0 ? 3 : percent}%` }}
                />
              </div>
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-4 gap-2">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03]">
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold leading-tight">{leadCount}</p>
                  <p className="text-[10px] text-white/35">Trouvés</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03]">
                <AtSign className="w-4 h-4 text-green-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold leading-tight">{withEmail}</p>
                  <p className="text-[10px] text-white/35">Emails</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03]">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold leading-tight">{withoutEmail}</p>
                  <p className="text-[10px] text-white/35">Sans email</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03]">
                <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <p className="text-lg font-bold leading-tight">{withLinkedin}</p>
                  <p className="text-[10px] text-white/35">LinkedIn</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Live prospect feed */}
        <GlassCard padding="lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white/70">
              Prospects trouvés
            </h2>
            {!isComplete && leadCount > 0 && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                En direct
              </span>
            )}
          </div>

          {leadCount === 0 ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/30">
                Recherche de &quot;{progress.sector}&quot; à {progress.city}...
              </p>
              <p className="text-xs text-white/20 mt-1">Les premiers résultats apparaîtront ici</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
              {progress.leads.map((lead, i) => (
                <LiveProspectRow key={`${lead.name}-${i}`} lead={lead} />
              ))}
              <div ref={feedEndRef} />
            </div>
          )}
        </GlassCard>

        {/* Summary when complete */}
        {isComplete && leadCount > 0 && (
          <GlassCard padding="lg" className="border-green-500/10">
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto" />
              <p className="text-lg font-semibold">
                {leadCount} prospect{leadCount > 1 ? 's' : ''} trouvé{leadCount > 1 ? 's' : ''} !
              </p>
              <p className="text-sm text-white/40">
                {withEmail} avec email · {withoutEmail} sans email · {withLinkedin} avec LinkedIn
              </p>
            </div>
          </GlassCard>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={handleNewSearch}>
            Nouvelle recherche
          </Button>
          <Button className="flex-1" onClick={() => router.push('/prospects')}>
            Voir les prospects
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── SEARCH FORM UI ───
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Rechercher des prospects</h1>
        <p className="text-white/40 mt-2">Remplissez les critères pour trouver vos leads idéaux</p>
      </div>

      <GlassCard padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Secteur d'activité"
            placeholder="ex: Restaurant, Dentiste, Immobilier..."
            icon={<Briefcase className="w-4 h-4" />}
            value={form.businessSector}
            onChange={(e) => update('businessSector', e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ville"
              placeholder="ex: Paris"
              icon={<MapPin className="w-4 h-4" />}
              value={form.city}
              onChange={(e) => update('city', e.target.value)}
              required
            />
            <Select
              label="Pays"
              icon={<Globe className="w-4 h-4" />}
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
              options={COUNTRIES.map((c) => ({ value: c, label: c }))}
            />
          </div>

          <Input
            label="Adresse exacte (optionnel)"
            placeholder="ex: 15 Rue de Rivoli, 75001 Paris"
            icon={<Navigation className="w-4 h-4" />}
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
          />
          <p className="text-xs text-white/25 -mt-3 ml-1">
            Précisez une adresse pour centrer la recherche sur un point précis. Sinon, la ville sera utilisée.
          </p>

          <Input
            label="Nombre max de leads"
            type="number"
            min={1}
            icon={<Hash className="w-4 h-4" />}
            value={form.maxLeads}
            onChange={(e) => update('maxLeads', parseInt(e.target.value) || 1)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Langue de l'email"
              icon={<Languages className="w-4 h-4" />}
              value={form.emailLanguage}
              onChange={(e) => update('emailLanguage', e.target.value)}
              options={LANGUAGES.map((l) => ({ value: l, label: l }))}
            />
            <Select
              label="Ton de l'email"
              icon={<MessageSquare className="w-4 h-4" />}
              value={form.emailTone}
              onChange={(e) => update('emailTone', e.target.value)}
              options={TONES.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <Button type="submit" loading={isSearching} size="lg" className="w-full mt-2">
            <SearchIcon className="w-5 h-5" />
            {isSearching ? 'Lancement...' : 'Rechercher des prospects'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
