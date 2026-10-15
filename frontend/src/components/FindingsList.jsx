import React, { useState } from 'react';
import {
  ShieldAlert,
  DollarSign,
  KeyRound,
  FileCode,
  CheckCircle2,
  Wand2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  GitPullRequest
} from 'lucide-react';

export default function FindingsList({ findings, onApplyFix, onViewDiff }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [expandedFindingId, setExpandedFindingId] = useState(null);

  const categories = [
    { id: 'ALL', label: 'All Findings', count: findings.length },
    { id: 'SECURITY', label: 'Security & IaC', count: findings.filter(f => f.category === 'SECURITY').length },
    { id: 'COST_FINOPS', label: 'FinOps Waste', count: findings.filter(f => f.category === 'COST_FINOPS').length },
    { id: 'SECRET_LEAK', label: 'Secret Leaks', count: findings.filter(f => f.category === 'SECRET_LEAK').length },
    { id: 'COMPLIANCE', label: 'Compliance', count: findings.filter(f => f.category === 'COMPLIANCE').length },
  ];

  const filteredFindings = findings.filter(f => {
    if (selectedCategory !== 'ALL' && f.category !== selectedCategory) return false;
    if (selectedSeverity !== 'ALL' && f.severity !== selectedSeverity) return false;
    return true;
  });

  const getSeverityStyle = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'COST_FINOPS':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'SECRET_LEAK':
        return <KeyRound className="w-4 h-4 text-rose-400" />;
      case 'COMPLIANCE':
        return <CheckCircle2 className="w-4 h-4 text-indigo-400" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center space-x-1.5 ${
                selectedCategory === c.id
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <span>{c.label}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-700/60 text-[10px] text-slate-300">
                {c.count}
              </span>
            </button>
          ))}
        </div>

        {/* Severity Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">Severity:</span>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
          </select>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
          <h3 className="text-base font-semibold text-white">All Clear! No Violations Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Your infrastructure code adheres strictly to CIS security benchmarks and FinOps cost best practices.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredFindings.map((finding) => {
            const isExpanded = expandedFindingId === finding.id;
            return (
              <div
                key={finding.id}
                className="rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition overflow-hidden shadow-sm"
              >
                {/* Header row */}
                <div
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer select-none"
                  onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-slate-800/80 mt-0.5">
                      {getCategoryIcon(finding.category)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityStyle(finding.severity)}`}>
                          {finding.severity}
                        </span>
                        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded">
                          {finding.rule_id}
                        </span>
                        {finding.estimated_monthly_waste > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded flex items-center">
                            Save ${finding.estimated_monthly_waste.toFixed(2)}/mo
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono flex items-center">
                          <FileCode className="w-3 h-3 mr-1 inline" />
                          {finding.file_path}:{finding.line_number || 1}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-white tracking-tight">
                        {finding.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 md:line-clamp-1">
                        {finding.description}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-end md:self-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onViewDiff(finding)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center space-x-1"
                    >
                      <GitPullRequest className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Review Diff</span>
                    </button>

                    <button
                      onClick={() => onApplyFix(finding)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-600/20 transition flex items-center space-x-1"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Apply AI Fix</span>
                    </button>

                    <button
                      onClick={() => setExpandedFindingId(isExpanded ? null : finding.id)}
                      className="p-1.5 text-slate-400 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-1.5">
                        <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                          Root Cause Analysis
                        </span>
                        <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          {finding.description}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px]">
                          Recommended Autonomous Fix
                        </span>
                        <p className="text-slate-300 leading-relaxed bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          {finding.remediation_summary}
                        </p>
                      </div>
                    </div>

                    {/* Code comparison snippet */}
                    <div className="space-y-1.5">
                      <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                        Targeted Code Snippet
                      </span>
                      <div className="rounded-lg bg-slate-950 border border-slate-800 p-3 font-mono text-xs overflow-x-auto space-y-1">
                        <div className="text-rose-400 bg-rose-950/30 px-2 py-1 rounded">
                          - {finding.original_snippet}
                        </div>
                        <div className="text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded">
                          + {finding.suggested_snippet}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                      <span>Framework: {finding.compliance_framework}</span>
                      <button
                        onClick={() => onViewDiff(finding)}
                        className="text-cyan-400 hover:underline flex items-center space-x-1"
                      >
                        <span>Open Side-by-Side Diff & PR Preview</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
