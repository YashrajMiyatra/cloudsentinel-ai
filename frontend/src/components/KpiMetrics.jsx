import React from 'react';
import { ShieldCheck, DollarSign, AlertTriangle, KeyRound, Cpu, TrendingDown } from 'lucide-react';

export default function KpiMetrics({ summary }) {
  if (!summary) return null;

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 70) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (score >= 50) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-500 border-rose-500/30 bg-rose-500/10';
  };

  const getGradeBadge = (grade) => {
    if (['A+', 'A'].includes(grade)) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
    if (['B', 'C'].includes(grade)) return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Security Posture Score */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Security Posture
          </span>
          <div className="p-2 rounded-xl bg-slate-800/80 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-3">
          <span className="text-4xl font-extrabold text-white tracking-tight">
            {summary.security_score}
          </span>
          <span className="text-slate-400 text-sm">/ 100</span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getGradeBadge(summary.letter_grade)}`}>
            Grade {summary.letter_grade}
          </span>
        </div>

        <div className="mt-4 flex items-center space-x-2 text-xs">
          <span className="text-rose-400 font-medium">{summary.critical_count} Critical</span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400 font-medium">{summary.high_count} High</span>
          <span className="text-slate-600">•</span>
          <span className="text-blue-400 font-medium">{summary.medium_count} Medium</span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${
              summary.security_score >= 80 ? 'bg-emerald-500' : summary.security_score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${summary.security_score}%` }}
          />
        </div>
      </div>

      {/* 2. FinOps Cloud Waste */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Detected Cloud Waste
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            ${summary.total_monthly_waste.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs text-slate-400">/ mo</span>
        </div>

        <div className="mt-3 flex items-center space-x-1.5 text-xs text-emerald-400 font-medium">
          <TrendingDown className="w-4 h-4" />
          <span>Save ${summary.projected_annual_savings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year</span>
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          Rightsizing compute, upgrading gp2 &rarr; gp3 & S3 auto-tiering
        </p>
      </div>

      {/* 3. Findings & Leaks count */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Violations
          </span>
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {summary.total_findings}
          </span>
          <span className="text-xs text-slate-400">anomalies flagged</span>
        </div>

        <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400">
          <span className="text-rose-400 font-mono font-medium">
            {summary.critical_count > 0 ? `${summary.critical_count} actionable leaks` : '0 critical leaks'}
          </span>
          <span>across {summary.scanned_files_count} file(s)</span>
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          Checked against CIS Benchmarks & CWE-798
        </p>
      </div>

      {/* 4. Engine Benchmark & Rules */}
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur relative overflow-hidden group hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Scan Engine Speed
          </span>
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-cyan-400 font-mono tracking-tight">
            {summary.execution_time_ms}
          </span>
          <span className="text-xs text-slate-400">ms execution</span>
        </div>

        <div className="mt-3 flex items-center space-x-1.5 text-xs text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>AST Rule Parser + RAG Reasoner</span>
        </div>

        <p className="mt-2 text-[11px] text-slate-500">
          Zero external latency in local deterministic mode
        </p>
      </div>
    </div>
  );
}
