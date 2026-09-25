import React from 'react';
import { ShieldAlert, Check, X } from 'lucide-react';
import { PendingConfirmation } from '../../types/agent';

interface Props {
  confirmation: PendingConfirmation;
  onConfirm: (decision: 'approve' | 'reject') => void;
  loading: boolean;
}

export const ActionConfirmationCard: React.FC<Props> = ({
  confirmation,
  onConfirm,
  loading,
}) => {
  return (
    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 my-3 space-y-3 max-w-lg">
      <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
        <ShieldAlert className="h-5 w-5" />
        <span>Action Confirmation Required</span>
      </div>

      <p className="text-xs text-slate-200 leading-relaxed">
        {confirmation.warning_message}
      </p>

      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
        <span className="text-slate-500 block mb-0.5 uppercase tracking-wider font-semibold">Action: {confirmation.tool_name}</span>
        <span>{JSON.stringify(confirmation.params, null, 2)}</span>
      </div>

      <div className="flex items-center space-x-3 pt-1">
        <button
          onClick={() => onConfirm('approve')}
          disabled={loading}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-3 rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
          <span>Approve & Execute</span>
        </button>

        <button
          onClick={() => onConfirm('reject')}
          disabled={loading}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 px-3 rounded-xl text-xs transition-all disabled:opacity-50"
        >
          <X className="h-4 w-4" />
          <span>Reject / Cancel</span>
        </button>
      </div>
    </div>
  );
};
