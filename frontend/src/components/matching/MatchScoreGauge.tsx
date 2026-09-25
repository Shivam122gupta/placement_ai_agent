import React from 'react';

interface Props {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export const MatchScoreGauge: React.FC<Props> = ({
  score,
  size = 140,
  strokeWidth = 12,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = '#EF4444'; // Red for < 50
  let label = 'High Skill Gap';
  let badgeBg = 'bg-red-500/10 text-red-400 border-red-500/20';

  if (score >= 80) {
    color = '#10B981'; // Green
    label = 'Strong Match';
    badgeBg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  } else if (score >= 60) {
    color = '#6366F1'; // Indigo
    label = 'Moderate Match';
    badgeBg = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
  } else if (score >= 40) {
    color = '#F59E0B'; // Amber
    label = 'Partial Fit';
    badgeBg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-800"
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-slate-100">{score}%</span>
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Match Fit</span>
        </div>
      </div>

      <span className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold border ${badgeBg}`}>
        {label}
      </span>
    </div>
  );
};
