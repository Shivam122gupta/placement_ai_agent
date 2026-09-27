import React from 'react';

interface Props {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
}

export const MatchScoreGauge: React.FC<Props> = ({
  score,
  size = 140,
  strokeWidth = 10,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  let color = '#8E8E93';
  let label = 'High Skill Gap';
  let badgeStyle = 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';

  if (score >= 80) {
    color = '#FAF8F5';
    label = 'Strong Match';
    badgeStyle = 'bg-white/15 text-[#FAF8F5] border-white/30 font-semibold';
  } else if (score >= 60) {
    color = '#E8E2D6';
    label = 'Moderate Match';
    badgeStyle = 'bg-white/10 text-[#FAF8F5] border-white/20';
  } else if (score >= 40) {
    color = '#C4C0B6';
    label = 'Partial Fit';
    badgeStyle = 'bg-white/5 text-neutral-300 border-white/15';
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
            className="text-white/[0.06]"
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
          <span className="text-3xl font-bold font-mono tracking-tight text-white">{score}%</span>
          <span className="text-[9px] uppercase font-mono tracking-widest text-[#FAF8F5]/80">Match Fit</span>
        </div>
      </div>

      <span className={`mt-3 px-3 py-1 rounded-full text-xs font-mono border ${badgeStyle}`}>
        {label}
      </span>
    </div>
  );
};

