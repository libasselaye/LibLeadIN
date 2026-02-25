import GlassCard from './GlassCard';
import { cn } from '@/lib/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  suffix?: string;
}

export default function StatCard({ label, value, icon, color = 'text-blue-400', suffix }: StatCardProps) {
  return (
    <GlassCard padding="md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/50">{label}</p>
          <p className="text-3xl font-bold mt-1">
            {value}
            {suffix && <span className="text-lg text-white/40 ml-0.5">{suffix}</span>}
          </p>
        </div>
        <div className={cn('p-2.5 rounded-xl bg-white/[0.05]', color)}>
          {icon}
        </div>
      </div>
    </GlassCard>
  );
}
