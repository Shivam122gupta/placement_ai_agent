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
    <div className="glass-card p-6 rounded-3xl border border-[#33322E] relative overflow-hidden group select-none bg-[#1E1E1B]">
      {/* Background Claude Terracotta Ambient Glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#DA7756]/10 rounded-full blur-2xl group-hover:bg-[#DA7756]/20 transition-all duration-500" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-bold uppercase tracking-wider text-[#A6A49B] font-mono">{title}</span>
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#DA7756]/20 to-[#C86443]/10 text-[#DA7756] border border-[#DA7756]/30 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-6 h-6 text-[#DA7756]" />
        </div>
      </div>

      <div className="mt-5 flex items-baseline justify-between relative z-10">
        <span className="text-4xl font-serif font-bold text-[#F4F3EE] tracking-tight">{value}</span>
        {badgeText && (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full border text-xs font-bold bg-[#DA7756]/15 text-[#DA7756] border-[#DA7756]/30 uppercase tracking-wider">
            <TrendingUp className="w-3 h-3 text-[#DA7756]" />
            <span>{badgeText}</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div className="mt-3 flex items-center justify-between text-xs text-[#A6A49B] border-t border-[#33322E] pt-3 relative z-10 font-medium">
          <span>{subtitle}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#DA7756]" />
        </div>
      )}
    </div>
  );
};
