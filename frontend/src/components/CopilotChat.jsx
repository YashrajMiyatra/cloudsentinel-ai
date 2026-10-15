import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Sparkles, BookOpen, Lightbulb, CornerDownLeft } from 'lucide-react';

export default function CopilotChat({ findings, files, apiKey }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your **CloudSentinel AI Copilot**. I have loaded your scanned infrastructure files, CIS benchmarks, and FinOps cost models.\n\nAsk me how to remediate any security finding, scope IAM permissions, or rightsize cloud workloads!",
      citations: ['CIS AWS Benchmark 1.4', 'FinOps Foundation']
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestedPrompts = [
    "Why is 0.0.0.0/0 on port 22 dangerous?",
    "How can I cut cloud waste by $500/month?",
    "How to lock down S3 against data leaks?",
    "Explain CIS Kubernetes Benchmark 5.2.1"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.slice(-4),
          active_findings: findings,
          active_files: files,
          api_key: apiKey || null
        })
      });

      if (!res.ok) throw new Error('Failed to get copilot reply');
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          citations: data.citations || []
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I encountered an issue connecting to the inference engine. Please check your backend connection.",
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col h-[650px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center space-x-1.5">
              <span>CloudSentinel Copilot</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-mono">
                RAG v1.4
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Context-aware DevSecOps & FinOps assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>{findings.length} Scanned Findings in Memory</span>
        </div>
      </div>

      {/* Suggested prompts pills */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto">
        <span className="text-[11px] text-slate-400 flex items-center flex-shrink-0">
          <Lightbulb className="w-3 h-3 text-amber-400 mr-1" /> Quick Queries:
        </span>
        {suggestedPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/60 transition whitespace-nowrap flex-shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-3 ${
              m.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-br-xs'
                  : 'bg-slate-950/90 border border-slate-800 text-slate-200 rounded-bl-xs'
              }`}
            >
              <div className="whitespace-pre-line font-sans">
                {m.content}
              </div>

              {/* Citations badges */}
              {m.citations && m.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-slate-400 flex items-center">
                    <BookOpen className="w-3 h-3 mr-1 text-cyan-400" /> Grounded in:
                  </span>
                  {m.citations.map((c, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-750 text-cyan-400 font-mono"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800 w-fit">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>CloudSentinel AI analyzing knowledge base & infrastructure rules...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about security vulnerabilities, rightsizing, CIS benchmarks..."
            className="flex-1 bg-slate-900 border border-slate-850 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold disabled:opacity-40 transition flex items-center space-x-1 shadow-md shadow-cyan-600/20"
          >
            <span>Send</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
