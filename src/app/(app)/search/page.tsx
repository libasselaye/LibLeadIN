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
  Database, Users, Mail, Radar, AtSign, Linkedin, AlertCircle,
} from 'lucide-react';

type ProgressPhase = 'scraping' | 'processing' | 'complete';

interface ProgressState {
  phase: ProgressPhase;
  leadCount: number;
  withEmail: number;
  withoutEmail: number;
  withLinkedin: number;
  initialCount: number;
  maxLeads: number;
  sector: string;
  city: string;
  stableCount: number;
  elapsedSeconds: number;
}

export default function SearchPage() {
  const router = useRouter();
  const { search, isSearching } = useSearch();
  const { toast } = useToast();
  const [tracking, setTracking] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [form, setForm] = useState({
    businessSector: '',
    city: '',
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

  const startTracking = useCallback(async (initialCount: number) => {
    setProgress({
      phase: 'scraping',
      leadCount: 0,
      withEmail: 0,
      withoutEmail: 0,
      withLinkedin: 0,
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
          const currentCount = allLeads.length;

          setProgress((prev) => {
            if (!prev) return prev;
            const newLeads = currentCount - prev.initialCount;
            const newStable = newLeads === prev.leadCount ? prev.stableCount + 1 : 0;

            // Compute detailed stats from the NEW leads only
            const recentLeads = allLeads.slice(prev.initialCount);
            const withEmail = recentLeads.filter((l) => l.email && l.email.includes('@')).length;
            const withoutEmail = recentLeads.filter((l) => !l.email || !l.email.includes('@')).length;
            const withLinkedin = recentLeads.filter(
              (l) => (l.linkedinCompany && l.linkedinCompany.includes('linkedin')) ||
                     (l.linkedinPerson && l.linkedinPerson.includes('linkedin'))
            ).length;

            let phase: ProgressPhase = prev.phase;
            if (newLeads > 0 && phase === 'scraping') {
              phase = 'processing';
            }

            // Search done: stable for 5 polls (15s) with leads, or reached max
            if ((newStable >= 5 && newLeads > 0) || newLeads >= prev.maxLeads) {
              phase = 'complete';
              stopPolling();
            }

            return {
              ...prev,
              leadCount: newLeads,
              withEmail,
              withoutEmail,
              withLinkedin,
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
      toast('Recherche lancee avec succes !', 'success');
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

  // Progress tracker UI
  if (tracking && progress) {
    const percent = progress.maxLeads > 0
      ? Math.min(100, Math.round((progress.leadCount / progress.maxLeads) * 100))
      : 0;

    const steps = [
      {
        id: 'scraping',
        label: 'Scraping Google Places',
        description: `Recherche "${progress.sector}" a ${progress.city}...`,
        icon: Radar,
      },
      {
        id: 'processing',
        label: 'Traitement des leads',
        description: progress.leadCount > 0
          ? `${progress.leadCount} prospect${progress.leadCount > 1 ? 's' : ''} traite${progress.leadCount > 1 ? 's' : ''} — extraction emails, LinkedIn...`
          : 'Extraction emails, LinkedIn, informations...',
        icon: Database,
      },
      {
        id: 'complete',
        label: 'Recherche terminee',
        description: `${progress.leadCount} prospect${progress.leadCount > 1 ? 's' : ''} trouves en ${formatTime(progress.elapsedSeconds)}`,
        icon: CheckCircle2,
      },
    ];

    const phaseOrder: ProgressPhase[] = ['scraping', 'processing', 'complete'];
    const currentIndex = phaseOrder.indexOf(progress.phase);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {progress.phase === 'complete' ? 'Recherche terminee' : 'Recherche en cours'}
          </h1>
          <p className="text-white/40 mt-2">
            {progress.sector} — {progress.city} — {formatTime(progress.elapsedSeconds)}
          </p>
        </div>

        {/* Progress bar */}
        <GlassCard padding="lg">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Progression</span>
              <span className="font-mono text-blue-400">
                {progress.leadCount}/{progress.maxLeads} leads
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  progress.phase === 'complete'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                    : 'bg-gradient-to-r from-blue-600 to-blue-400'
                }`}
                style={{ width: `${progress.phase === 'scraping' && progress.leadCount === 0 ? 3 : percent}%` }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Detailed counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <GlassCard padding="sm">
            <div className="text-center py-2">
              <Users className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
              <p className="text-2xl font-bold">{progress.leadCount}</p>
              <p className="text-xs text-white/40 mt-0.5">Prospects trouves</p>
            </div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-center py-2">
              <AtSign className="w-5 h-5 text-green-400 mx-auto mb-1.5" />
              <p className="text-2xl font-bold">{progress.withEmail}</p>
              <p className="text-xs text-white/40 mt-0.5">Avec email</p>
            </div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-center py-2">
              <AlertCircle className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
              <p className="text-2xl font-bold">{progress.withoutEmail}</p>
              <p className="text-xs text-white/40 mt-0.5">Sans email</p>
            </div>
          </GlassCard>
          <GlassCard padding="sm">
            <div className="text-center py-2">
              <Linkedin className="w-5 h-5 text-sky-400 mx-auto mb-1.5" />
              <p className="text-2xl font-bold">{progress.withLinkedin}</p>
              <p className="text-xs text-white/40 mt-0.5">Avec LinkedIn</p>
            </div>
          </GlassCard>
        </div>

        {/* Steps */}
        <GlassCard padding="lg">
          <div className="space-y-3">
            {steps.map((step) => {
              const stepIndex = phaseOrder.indexOf(step.id as ProgressPhase);
              const isActive = stepIndex === currentIndex;
              const isDone = stepIndex < currentIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-500 ${
                    isActive
                      ? 'bg-blue-600/10 border border-blue-500/20'
                      : isDone
                        ? 'bg-green-600/5 border border-green-500/10'
                        : 'bg-white/[0.02] border border-white/[0.04]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-blue-600/20'
                        : isDone
                          ? 'bg-green-600/20'
                          : 'bg-white/[0.05]'
                    }`}
                  >
                    {isActive && step.id !== 'complete' ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          isDone ? 'text-green-400' : isActive ? 'text-blue-400' : 'text-white/20'
                        }`}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-medium ${
                        isActive ? 'text-white' : isDone ? 'text-green-400/80' : 'text-white/30'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p
                      className={`text-sm mt-0.5 ${
                        isActive || isDone ? 'text-white/50' : 'text-white/20'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                  {isDone && (
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Live feed - last leads found */}
        {progress.phase === 'complete' && progress.leadCount > 0 && (
          <GlassCard padding="lg">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-600/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {progress.leadCount} prospects trouves !
                </p>
                <p className="text-sm text-white/40 mt-1">
                  {progress.withEmail} avec email · {progress.withoutEmail} sans email · {progress.withLinkedin} avec LinkedIn
                </p>
              </div>
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

  // Search form UI (default state)
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Rechercher des prospects</h1>
        <p className="text-white/40 mt-2">Remplissez les criteres pour trouver vos leads ideaux</p>
      </div>

      <GlassCard padding="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Secteur d'activite"
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
            label="Nombre max de leads"
            type="number"
            min={1}
            max={100}
            icon={<Hash className="w-4 h-4" />}
            value={form.maxLeads}
            onChange={(e) => update('maxLeads', parseInt(e.target.value) || 20)}
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
