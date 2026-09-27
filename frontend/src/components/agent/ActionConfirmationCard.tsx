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
    <div className="p-5 rounded-2xl bg-[#18181B] border border-[#FAF8F5]/30 my-3 space-y-3 max-w-lg shadow-xl shadow-white/5">
      <div className="flex items-center space-x-2 text-[#FAF8F5] font-bold text-sm">
        <ShieldAlert className="h-5 w-5 text-[#FAF8F5]" />
        <span>Action Confirmation Required</span>
      </div>

      <p className="text-xs text-neutral-200 leading-relaxed font-sans">
        {confirmation.warning_message}
      </p>

      <div className="p-2.5 rounded-xl bg-[#121214] border border-[#FAF8F5]/15 text-[11px] font-mono text-neutral-300">
        <span className="text-[#FAF8F5] block mb-0.5 uppercase tracking-wider font-semibold">Action: {confirmation.tool_name}</span>
        <span>{JSON.stringify(confirmation.params, null, 2)}</span>
      </div>

      <div className="flex items-center space-x-3 pt-1">
        <button
          onClick={() => onConfirm('approve')}
          disabled={loading}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-r from-[#FF6B6B] to-[#FA7268] hover:from-[#FF5252] hover:to-[#F26B5B] text-white font-semibold py-2 px-3 rounded-xl text-xs shadow-lg shadow-[#FF6B6B]/25 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
        >
          <Check className="h-4 w-4" />
          <span>Approve & Execute</span>
        </button>

        <button
          onClick={() => onConfirm('reject')}
          disabled={loading}
          className="flex-1 flex items-center justify-center space-x-1.5 bg-[#121214] hover:bg-[#18181B] border border-[#FAF8F5]/15 text-neutral-300 font-semibold py-2 px-3 rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
        >
          <X className="h-4 w-4" />
          <span>Reject / Cancel</span>
        </button>
      </div>
    </div>
  );
};

