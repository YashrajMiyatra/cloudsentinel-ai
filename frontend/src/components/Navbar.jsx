import React from 'react';
import { ShieldAlert, Zap, FileText, Upload, Sparkles, Server, CheckCircle2 } from 'lucide-react';

export default function Navbar({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  onOpenUpload,
  onExportReport,
  onOpenReportModal,
  onOpenHowItWorks,
  onOpenSettings,
  isScanning,
  backendOnline
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/20">
              <img src="/logo.svg" alt="CloudSentinel Logo" className="w-full h-full object-contain" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">CloudSentinel</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous Cloud Cost & DevSecOps Intelligence
            </p>
          </div>
        </div>

        {/* Demo Scenarios Quick Selector */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 px-2 font-medium flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Demo Presets:
          </span>
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              disabled={isScanning}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedScenarioId === sc.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {sc.title.split(' ')[0]} {sc.title.split(' ')[1]}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-2.5">
          <button
            onClick={onOpenHowItWorks}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-700/50 text-cyan-300 hover:text-white hover:bg-cyan-900/60 text-xs font-medium transition"
            title="Learn how CloudSentinel works (Simple Analogy)"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">How It Works</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-200 hover:text-white hover:border-slate-500 text-xs font-medium transition"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Scan Code</span>
          </button>

          <button
            onClick={onOpenReportModal}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/60 text-slate-200 hover:text-white hover:border-slate-500 text-xs font-medium transition"
            title="View printable executive audit report"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Executive Report</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs"
            title="Configure AI model keys"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Settings</span>
          </button>

          {/* Connection status pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 border border-slate-800 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-slate-400 text-[11px] font-mono">
              {backendOnline ? 'API Ready' : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
