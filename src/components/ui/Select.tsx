'use client';

import { cn } from '@/lib/cn';
import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, icon, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-medium text-white/60">{label}</label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 z-10">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              'w-full appearance-none rounded-xl border border-white/[0.08] bg-white/[0.05] px-4 py-2.5 text-sm text-white',
              'backdrop-blur-xl transition-all duration-200',
              'focus:outline-none focus:border-blue-600/50 focus:ring-1 focus:ring-blue-600/20',
              icon && 'pl-10',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-[#1a1a2e] text-white/60">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a2e]">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';
export default Select;
