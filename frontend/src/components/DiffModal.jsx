import React, { useState } from 'react';
import { X, Copy, Check, GitPullRequest, Wand2, ShieldCheck, Sparkles } from 'lucide-react';

export default function DiffModal({ finding, onClose, onApplyFix }) {
  const [copied, setCopied] = useState(false);

  if (!finding) return null;

  const handleCopyPatch = () => {
    navigator.clipboard.writeText(finding.unified_diff || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const diffLines = (finding.unified_diff || '').split('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {finding.rule_id}
                </span>
                <span className="text-xs font-mono text-slate-400">{finding.file_path}</span>
              </div>
              <h3 className="text-base font-semibold text-white mt-0.5">
                {finding.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* PR Title & Description Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Autonomous PR Preview
              </span>
              <span className="text-[11px] text-slate-500 font-mono">branch: cloudsentinel-patch</span>
            </div>
            <div className="font-mono text-xs text-emerald-400 font-medium">
              {finding.pr_title || `fix: remediate ${finding.rule_id}`}
            </div>
            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
              {finding.pr_body || finding.description}
            </p>
          </div>

          {/* Unified Diff View */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unified Git Diff
              </span>
              <button
                onClick={handleCopyPatch}
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Patch'}</span>
              </button>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs p-4 overflow-x-auto leading-relaxed">
              {diffLines.map((line, idx) => {
                let colorClass = 'text-slate-400';
                let bgClass = '';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                  colorClass = 'text-emerald-400';
                  bgClass = 'bg-emerald-950/30 px-1 rounded';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                  colorClass = 'text-rose-400';
                  bgClass = 'bg-rose-950/30 px-1 rounded';
                } else if (line.startsWith('@@')) {
                  colorClass = 'text-cyan-400 font-bold';
                }

                return (
                  <div key={idx} className={`${colorClass} ${bgClass} py-0.5 whitespace-pre`}>
                    {line}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {finding.estimated_monthly_waste > 0 ? (
              <span className="text-emerald-400 font-semibold">
                Applying this fix saves ${finding.estimated_monthly_waste.toFixed(2)}/month
              </span>
            ) : (
              <span>Eliminates {finding.severity.toLowerCase()} risk exposure</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApplyFix(finding);
                onClose();
              }}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition"
            >
              <Wand2 className="w-4 h-4" />
              <span>Apply Fix Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
