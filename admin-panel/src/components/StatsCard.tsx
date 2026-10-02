import React from 'react';
import { LucideIcon, TrendingUp } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
}) => {
  return (
    <div className="bg-[#182230] p-5 rounded-sm border border-[#2a3649] hover:border-[#00ea64]/50 transition-all select-none font-mono text-white shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#94a3b8]">{title}</span>
        <div className="w-9 h-9 rounded-sm bg-[#00ea64]/15 border border-[#00ea64]/30 text-[#00ea64] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#00ea64]" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-3xl font-mono font-extrabold text-white tracking-tight">{value}</span>
        {badgeText && (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-sm border text-[10px] font-mono font-bold bg-[#00ea64]/10 text-[#00ea64] border-[#00ea64]/30 uppercase tracking-wider">
            <TrendingUp className="w-3 h-3 text-[#00ea64]" />
            <span>{badgeText}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#94a3b8] border-t border-[#2a3649] pt-2.5">
          <span>{subtitle}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ea64]" />
        </div>
      )}
    </div>
  );
};
