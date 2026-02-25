'use client';

import { cn } from '@/lib/cn';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface GlassCardProps {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}

const paddingMap = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hoverable = false, padding = 'md', children, onClick }, ref) => {
    if (hoverable) {
      return (
        <motion.div
          ref={ref}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          onClick={onClick}
          className={cn(
            'rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl',
            'cursor-pointer transition-colors hover:bg-white/[0.08] hover:border-white/[0.15]',
            paddingMap[padding],
            className
          )}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl',
          paddingMap[padding],
          className
        )}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';
export default GlassCard;
