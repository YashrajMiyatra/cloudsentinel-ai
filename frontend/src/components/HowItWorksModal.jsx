import React from 'react';
import { X, Sparkles, FileText, Search, ShieldCheck, DollarSign, ArrowRight, Wand2 } from 'lucide-react';

export default function HowItWorksModal({ onClose, onTryDemo }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                How CloudSentinel AI Works
              </h3>
              <p className="text-xs text-slate-400">
                Think of it like <strong>"Grammarly for Cloud Bills & Passwords"</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Concept Banner */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <span className="font-semibold text-cyan-400 block mb-1 text-sm">
              💡 Why don't you need an active AWS or Cloud connection?
            </span>
            Modern developers set up servers by writing <strong>blueprint text files</strong> (called Terraform or Kubernetes). 
            CloudSentinel inspects this blueprint <em>before</em> it ever reaches Amazon. It checks your requested servers against official cloud pricing models and flags expensive or dangerous lines immediately.
          </div>

          {/* 3 Steps Workflow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h4 className="text-sm font-semibold text-white">Reads Blueprint</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingests Terraform (<code className="text-cyan-300">.tf</code>), Kubernetes YAML, or Dockerfiles.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h4 className="text-sm font-semibold text-white">Detects Leaks & Waste</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Identifies hardcoded passwords, open 0.0.0.0/0 firewalls, and calculates exact monthly dollar waste.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h4 className="text-sm font-semibold text-white">1-Click Auto-Fix</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generates a clean Git code patch. Click <strong>"Apply AI Fix"</strong> to jump to Grade A+!
              </p>
            </div>
          </div>

          {/* Example Diff comparison */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Example: How CloudSentinel Saves $462/mo on a single line of code
            </span>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
              <div className="text-rose-400 bg-rose-950/40 px-2.5 py-1 rounded">
                - instance_type = "m5.4xlarge"  # Wasting $560.64/month on idle compute!
              </div>
              <div className="text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded">
                + instance_type = "t4g.xlarge"   # Saves $462.72/mo with AWS Graviton ARM
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Ready to test? Try our 1-click Auto-Fix!
          </span>
          <button
            onClick={() => {
              onClose();
              if (onTryDemo) onTryDemo();
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-600/25 transition"
          >
            <span>Explore Live Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
