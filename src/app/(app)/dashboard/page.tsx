'use client';

import Link from 'next/link';
import { useStats } from '@/hooks/useStats';
import GlassCard from '@/components/ui/GlassCard';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { Users, Mail, Clock, TrendingUp, Search, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { stats, isLoading } = useStats(15000);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center space-y-4">
          <Spinner size="lg" />
          <p className="text-white/40">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const sectors = Object.entries(stats.bySector);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-white/40 mt-1">Vue d&apos;ensemble de votre prospection</p>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/search">
          <GlassCard hoverable padding="lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-600/10">
                <Search className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Nouvelle recherche</h3>
                <p className="text-sm text-white/40">Trouver de nouveaux prospects</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/20" />
            </div>
          </GlassCard>
        </Link>

        <Link href="/prospects">
          <GlassCard hoverable padding="lg">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Voir les prospects</h3>
                <p className="text-sm text-white/40">{stats.totalProspects} prospects disponibles</p>
              </div>
              <ArrowRight className="w-5 h-5 text-white/20" />
            </div>
          </GlassCard>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total prospects"
          value={stats.totalProspects}
          icon={<Users className="w-5 h-5" />}
          color="text-blue-400"
        />
        <StatCard
          label="Emails envoyes"
          value={stats.emailsSent}
          icon={<Mail className="w-5 h-5" />}
          color="text-emerald-400"
        />
        <StatCard
          label="En attente"
          value={stats.pending}
          icon={<Clock className="w-5 h-5" />}
          color="text-amber-400"
        />
        <StatCard
          label="Taux d'envoi"
          value={stats.sendRate}
          suffix="%"
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-blue-400"
        />
      </div>

      {/* Sector breakdown + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard padding="lg">
          <h3 className="font-semibold mb-4">Par secteur d&apos;activite</h3>
          {sectors.length === 0 ? (
            <p className="text-white/30 text-sm">Aucun prospect pour le moment</p>
          ) : (
            <div className="space-y-3">
              {sectors.map(([sector, data]) => (
                <div key={sector}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white/70">{sector}</span>
                    <span className="text-white/40">{data.sent}/{data.total} emails</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500"
                      style={{ width: `${data.total > 0 ? (data.sent / data.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard padding="lg">
          <h3 className="font-semibold mb-4">Activite recente</h3>
          {stats.recentActivity.length === 0 ? (
            <p className="text-white/30 text-sm">Aucune activite recente</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((activity, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-300">
                    {activity.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.name}</p>
                    <p className="text-xs text-white/30">{activity.sector}</p>
                  </div>
                  <Badge variant="success">Envoye</Badge>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
