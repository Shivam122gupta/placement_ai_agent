import React, { useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Clock,
  Search,
  UserCheck,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { ToolCallAudit } from '../../types/agent';

interface Props {
  audit: ToolCallAudit;
}

export const ToolExecutionPill: React.FC<Props> = ({ audit }) => {
  const [expanded, setExpanded] = useState(false);

  const getToolIcon = (name: string) => {
    switch (name) {
      case 'get_candidate_profile':
        return <UserCheck className="h-3.5 w-3.5 text-indigo-400" />;
      case 'search_jobs':
        return <Search className="h-3.5 w-3.5 text-blue-400" />;
      case 'match_candidate':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      case 'generate_study_roadmap':
        return <Compass className="h-3.5 w-3.5 text-purple-400" />;
      case 'save_application':
        return <FileCheck2 className="h-3.5 w-3.5 text-amber-400" />;
      default:
        return <Cpu className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="inline-block my-1 mr-2 text-xs">
      <div
        onClick={() => setExpanded(!expanded)}
        className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border cursor-pointer select-none transition-all ${
          audit.is_error
            ? 'bg-red-500/10 border-red-500/30 text-red-300'
            : 'bg-slate-900/90 border-slate-700/80 hover:border-indigo-500/50 text-slate-300'
        }`}
      >
        {getToolIcon(audit.tool_name)}
        <span className="font-mono font-medium">{audit.tool_name}</span>
        <div className="flex items-center space-x-1 text-[10px] text-slate-400">
          <Clock className="h-3 w-3" />
          <span>{Math.round(audit.latency_ms)}ms</span>
        </div>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </div>

      {expanded && (
        <div className="mt-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1.5 max-w-lg shadow-2xl">
          <div className="text-slate-400 font-semibold uppercase tracking-wider">Arguments:</div>
          <div className="text-slate-300 bg-slate-900/80 p-2 rounded-lg break-all">
            {JSON.stringify(audit.params, null, 2)}
          </div>

          <div className="text-slate-400 font-semibold uppercase tracking-wider pt-1">Output Summary:</div>
          <div className="text-indigo-300 bg-slate-900/80 p-2 rounded-lg break-all max-h-32 overflow-y-auto">
            {audit.result_summary}
          </div>
        </div>
      )}
    </div>
  );
};
