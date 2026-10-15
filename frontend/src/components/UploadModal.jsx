import React, { useState } from 'react';
import { X, Upload, FileCode, Check } from 'lucide-react';

export default function UploadModal({ onClose, onScanCustomCode }) {
  const [fileName, setFileName] = useState('main.tf');
  const [fileContent, setFileContent] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target.result);
    };
    reader.readAsText(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!fileContent.trim()) return;
    onScanCustomCode([{
      name: fileName,
      path: `custom/${fileName}`,
      content: fileContent
    }]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Scan Custom Infrastructure Code
              </h3>
              <p className="text-xs text-slate-400">
                Paste or upload Terraform (.tf), Kubernetes (.yaml), or Dockerfile
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">
                File Name
              </label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. main.tf, k8s.yaml, Dockerfile"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            <div className="pt-5">
              <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition flex items-center space-x-1.5">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".tf,.yaml,.yml,.json,Dockerfile,.env"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              File Content / Paste Code
            </label>
            <textarea
              rows={12}
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Paste Terraform HCL, Kubernetes YAML, or Dockerfile contents here..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 resize-none leading-relaxed"
            />
          </div>

          {/* Footer */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!fileContent.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold disabled:opacity-40 transition shadow-lg shadow-cyan-600/20"
            >
              Run Security & FinOps Scan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
