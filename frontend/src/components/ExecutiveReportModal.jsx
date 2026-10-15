import React from 'react';
import { X, Printer, ShieldCheck, Download, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

export default function ExecutiveReportModal({ summary, findings, onClose }) {
  if (!summary) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 print:p-0 print:bg-white">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Executive Audit & Compliance Summary</h3>
              <p className="text-xs text-slate-400">Ready for leadership presentation and compliance verification</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="p-8 space-y-6 overflow-y-auto flex-1 font-sans print:p-6">
          {/* Document Header */}
          <div className="border-b border-slate-800 pb-6 print:border-slate-300">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider print:text-blue-600">
                  CloudSentinel Autonomous Audit Report
                </span>
                <h1 className="text-2xl font-bold text-white print:text-slate-900 mt-1">
                  Infrastructure Security & FinOps Health Evaluation
                </h1>
                <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                  Generated automatically &bull; Date: {new Date().toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 print:text-slate-600">Overall Grade</span>
                <div className="text-3xl font-extrabold text-white print:text-slate-900">
                  {summary.letter_grade} ({summary.security_score}/100)
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-100 print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
                Total Violations
              </span>
              <div className="text-xl font-bold text-white print:text-slate-900 mt-1">
                {summary.total_findings}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-100 print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
                Critical Leaks
              </span>
              <div className="text-xl font-bold text-rose-400 print:text-red-600 mt-1">
                {summary.critical_count}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-100 print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
                Monthly Waste
              </span>
              <div className="text-xl font-bold text-emerald-400 print:text-green-700 mt-1">
                ${summary.total_monthly_waste.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 print:bg-slate-100 print:border-slate-300">
              <span className="text-[10px] uppercase font-bold text-slate-400 print:text-slate-600">
                Projected Annual ROI
              </span>
              <div className="text-xl font-bold text-cyan-400 print:text-blue-700 mt-1">
                ${summary.projected_annual_savings.toFixed(0)}
              </div>
            </div>
          </div>

          {/* Findings Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white print:text-slate-900 uppercase tracking-wider">
              Itemized Vulnerability & Waste Register
            </h3>

            <div className="border border-slate-800 rounded-xl overflow-hidden print:border-slate-300 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                  <tr>
                    <th className="p-3">Severity</th>
                    <th className="p-3">Rule / ID</th>
                    <th className="p-3">Title & File</th>
                    <th className="p-3 text-right">Monthly Waste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200">
                  {findings.map((f, i) => (
                    <tr key={i} className="hover:bg-slate-950/40">
                      <td className="p-3 font-bold font-mono">
                        <span className={f.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}>
                          {f.severity}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-cyan-400 print:text-blue-600">{f.rule_id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-white print:text-slate-900">{f.title}</div>
                        <div className="text-[11px] text-slate-400 print:text-slate-600 font-mono">
                          {f.file_path}:{f.line_number || 1}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 print:text-green-700">
                        {f.estimated_monthly_waste > 0 ? `$${f.estimated_monthly_waste.toFixed(2)}/mo` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 print:hidden">
          <span>CloudSentinel AI &bull; Compliant with CIS AWS & Kubernetes Hardening Baselines</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
