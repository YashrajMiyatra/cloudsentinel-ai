import React, { useState } from 'react';
import { FileCode, AlertCircle, Edit3, Check, RefreshCw } from 'lucide-react';

export default function CodeViewer({ files, findings, onUpdateFileContent, onRescan }) {
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState('');

  if (!files || files.length === 0) {
    return (
      <div className="p-12 text-center text-slate-500 rounded-xl bg-slate-900 border border-slate-800">
        No scanned files available.
      </div>
    );
  }

  const currentFile = files[activeFileIndex] || files[0];
  const fileLines = (isEditing ? editableContent : currentFile.content).split('\n');

  // Map finding line numbers for current file
  const lineFindingMap = {};
  findings.forEach(f => {
    if (f.file_path === currentFile.path && f.line_number) {
      lineFindingMap[f.line_number] = f;
    }
  });

  const handleStartEditing = () => {
    setEditableContent(currentFile.content);
    setIsEditing(true);
  };

  const handleSaveAndScan = () => {
    onUpdateFileContent(currentFile.path, editableContent);
    setIsEditing(false);
    onRescan();
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden flex flex-col">
      {/* File Tabs & Controls */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        {/* File Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {files.map((f, idx) => (
            <button
              key={f.path}
              onClick={() => {
                setActiveFileIndex(idx);
                setIsEditing(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex items-center space-x-2 ${
                activeFileIndex === idx
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>{f.name}</span>
            </button>
          ))}
        </div>

        {/* Edit / Rescan Controls */}
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <button
              onClick={handleSaveAndScan}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Rescan</span>
            </button>
          ) : (
            <button
              onClick={handleStartEditing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center space-x-1.5 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Code Live</span>
            </button>
          )}
        </div>
      </div>

      {/* Code Editor / Highlighting Area */}
      {isEditing ? (
        <textarea
          value={editableContent}
          onChange={(e) => setEditableContent(e.target.value)}
          className="w-full h-[520px] bg-slate-950 text-slate-200 font-mono text-xs p-4 focus:outline-none resize-none leading-relaxed border-none"
          spellCheck="false"
        />
      ) : (
        <div className="font-mono text-xs overflow-x-auto max-h-[520px] divide-y divide-transparent bg-slate-950 p-2">
          {fileLines.map((line, idx) => {
            const lineNum = idx + 1;
            const findingOnLine = lineFindingMap[lineNum];

            return (
              <div
                key={lineNum}
                className={`flex items-start py-0.5 px-2 rounded transition ${
                  findingOnLine
                    ? 'bg-rose-950/30 border-l-2 border-rose-500'
                    : 'hover:bg-slate-900/60'
                }`}
              >
                {/* Line number */}
                <span className="w-10 text-right pr-4 text-slate-600 select-none flex-shrink-0 text-[11px]">
                  {lineNum}
                </span>

                {/* Line content */}
                <span className={`flex-1 whitespace-pre ${findingOnLine ? 'text-rose-200' : 'text-slate-300'}`}>
                  {line}
                </span>

                {/* Finding flag icon if present */}
                {findingOnLine && (
                  <span
                    title={`${findingOnLine.rule_id}: ${findingOnLine.title}`}
                    className="ml-2 flex items-center text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex-shrink-0"
                  >
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {findingOnLine.rule_id}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
