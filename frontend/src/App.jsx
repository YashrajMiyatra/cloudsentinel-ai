import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import KpiMetrics from './components/KpiMetrics';
import FindingsList from './components/FindingsList';
import FinOpsSimulator from './components/FinOpsSimulator';
import CodeViewer from './components/CodeViewer';
import CopilotChat from './components/CopilotChat';
import DiffModal from './components/DiffModal';
import UploadModal from './components/UploadModal';
import SettingsModal from './components/SettingsModal';
import HowItWorksModal from './components/HowItWorksModal';
import ExecutiveReportModal from './components/ExecutiveReportModal';
import { ShieldCheck, DollarSign, FileCode, Bot, RefreshCw, Sparkles, CheckCircle2, Wand2, Zap } from 'lucide-react';

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('aws-cloud-sprawl');
  const [scanData, setScanData] = useState(null);
  const [activeTab, setActiveTab] = useState('findings'); // 'findings' | 'simulator' | 'code' | 'copilot'
  const [activeDiffFinding, setActiveDiffFinding] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('cloudsentinel_api_key') || '');
  const [backendOnline, setBackendOnline] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRemediateAll = async () => {
    if (!scanData || !scanData.files) return;
    setIsScanning(true);
    try {
      const res = await fetch('/api/remediate-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: scanData.files })
      });
      if (!res.ok) throw new Error('Remediate-all failed');
      const cleanData = await res.json();
      setScanData(cleanData);
      showToast(`Clean Sweep! Remediated all vulnerabilities. Security Score upgraded to ${cleanData.summary.security_score} (Grade ${cleanData.summary.letter_grade})!`);
    } catch (err) {
      console.error('Auto fix all failed:', err);
      showToast('Auto-fix all failed', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  // Initial load: check health and fetch demo scenarios
  useEffect(() => {
    const initApp = async () => {
      try {
        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          setBackendOnline(true);
        }

        const scenariosRes = await fetch('/api/samples');
        if (scenariosRes.ok) {
          const scData = await scenariosRes.json();
          setScenarios(scData);
          if (scData.length > 0) {
            triggerScan({ scenario_id: scData[0].id });
          }
        }
      } catch (err) {
        console.error('Initial load failed:', err);
        setBackendOnline(false);
      }
    };

    initApp();
  }, []);

  const triggerScan = async (payload) => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Scan failed');
      const data = await res.json();
      setScanData(data);
      setBackendOnline(true);
    } catch (err) {
      console.error('Scan error:', err);
      showToast('Scan failed: could not reach backend server', 'error');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectScenario = (id) => {
    setSelectedScenarioId(id);
    triggerScan({ scenario_id: id });
  };

  const handleScanCustomCode = (files) => {
    setSelectedScenarioId(null);
    triggerScan({ files });
    showToast(`Scanned ${files.length} custom file(s) successfully!`);
  };

  // Apply fix live: mutates the file content in-memory, re-scans, and dynamically improves the score!
  const handleApplyFix = async (finding) => {
    if (!scanData || !scanData.files) return;

    try {
      const targetFile = scanData.files.find(f => f.path === finding.file_path);
      if (!targetFile) return;

      const res = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding_id: finding.id,
          file_path: finding.file_path,
          original_content: targetFile.content,
          api_key: apiKey || null
        })
      });

      if (!res.ok) throw new Error('Remediation request failed');
      const remData = await res.json();

      // Update file content with patched content
      const updatedFiles = scanData.files.map(f => {
        if (f.path === finding.file_path) {
          return { ...f, content: remData.patched_content };
        }
        return f;
      });

      // Re-scan with the patched file
      await triggerScan({ files: updatedFiles });
      showToast(`Applied Autonomous Fix for ${finding.rule_id}! Security posture upgraded.`);
    } catch (err) {
      console.error('Fix application failed:', err);
      showToast('Could not apply fix automatically', 'error');
    }
  };

  const handleUpdateFileContent = (filePath, newContent) => {
    if (!scanData) return;
    const updatedFiles = scanData.files.map(f => {
      if (f.path === filePath) {
        return { ...f, content: newContent };
      }
      return f;
    });
    setScanData(prev => ({ ...prev, files: updatedFiles }));
  };

  const handleExportReport = async () => {
    if (!scanData) return;
    try {
      const res = await fetch('/api/export-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: scanData.summary,
          findings: scanData.findings
        })
      });

      if (!res.ok) throw new Error('Report export failed');
      const data = await res.json();

      // Download as markdown file
      const blob = new Blob([data.markdown_report], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CloudSentinel_Audit_Report_${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Executive Audit Report downloaded successfully!');
    } catch (err) {
      console.error('Report export failed:', err);
      showToast('Failed to export audit report', 'error');
    }
  };

  const handleSaveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('cloudsentinel_api_key', key);
    showToast('API Key saved successfully!');
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        scenarios={scenarios}
        selectedScenarioId={selectedScenarioId}
        onSelectScenario={handleSelectScenario}
        onOpenUpload={() => setIsUploadOpen(true)}
        onExportReport={handleExportReport}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isScanning={isScanning}
        backendOnline={backendOnline}
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom duration-200">
          <div className="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl flex items-center space-x-2.5 text-xs text-white">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* KPI Scorecards */}
        {scanData && <KpiMetrics summary={scanData.summary} />}

        {/* Navigation Tabs Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
          <div className="flex items-center space-x-1 sm:space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('findings')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'findings'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Vulnerabilities & Fixes</span>
              {scanData && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-950/60 text-[10px]">
                  {scanData.summary.total_findings}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'simulator'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>FinOps ROI Simulator</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'code'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <FileCode className="w-4 h-4" />
              <span>Scanned Code Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('copilot')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'copilot'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>AI Copilot (Chat)</span>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {scanData && scanData.summary.total_findings > 0 && (
              <button
                onClick={handleRemediateAll}
                disabled={isScanning}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/25 transition disabled:opacity-40 animate-pulse"
                title="Automatically fix all vulnerabilities and rightsize all compute in 1 click"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Fix All Issues (1-Click)</span>
              </button>
            )}

            {/* Quick Rescan button */}
            <button
              onClick={() => {
                if (scanData && scanData.files) {
                  triggerScan({ files: scanData.files });
                } else if (selectedScenarioId) {
                  triggerScan({ scenario_id: selectedScenarioId });
                }
              }}
              disabled={isScanning}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Re-run Analysis'}</span>
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        {scanData && (
          <div>
            {activeTab === 'findings' && (
              <FindingsList
                findings={scanData.findings}
                onApplyFix={handleApplyFix}
                onViewDiff={(finding) => setActiveDiffFinding(finding)}
              />
            )}

            {activeTab === 'simulator' && <FinOpsSimulator />}

            {activeTab === 'code' && (
              <CodeViewer
                files={scanData.files}
                findings={scanData.findings}
                onUpdateFileContent={handleUpdateFileContent}
                onRescan={() => triggerScan({ files: scanData.files })}
              />
            )}

            {activeTab === 'copilot' && (
              <CopilotChat
                findings={scanData.findings}
                files={scanData.files}
                apiKey={apiKey}
              />
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {activeDiffFinding && (
        <DiffModal
          finding={activeDiffFinding}
          onClose={() => setActiveDiffFinding(null)}
          onApplyFix={handleApplyFix}
        />
      )}

      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onScanCustomCode={handleScanCustomCode}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          apiKey={apiKey}
          onSaveApiKey={handleSaveApiKey}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isHowItWorksOpen && (
        <HowItWorksModal
          onClose={() => setIsHowItWorksOpen(false)}
          onTryDemo={() => handleRemediateAll()}
        />
      )}

      {isReportModalOpen && (
        <ExecutiveReportModal
          summary={scanData?.summary}
          findings={scanData?.findings || []}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CloudSentinel AI &copy; 2026 &bull; Real-World DevSecOps & FinOps Solution</span>
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Powered by FastAPI, React, and Dual-Layer AI Reasoning</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
