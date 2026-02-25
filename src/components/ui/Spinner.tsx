import { cn } from '@/lib/cn';
import { Loader2 } from 'lucide-react';

export default function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return <Loader2 className={cn('animate-spin text-blue-400', sizeMap[size], className)} />;
}
