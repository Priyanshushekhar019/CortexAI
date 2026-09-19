import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Check, Copy, Download, Maximize2, X } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#13151c',
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#818cf8',
    lineColor: '#94a3b8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a'
  },
  securityLevel: 'loose',
});

function MermaidRenderer({ chart }) {
  const containerRef = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        setRenderError(null);
        const id = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        const cleanChart = chart.trim();
        const { svg } = await mermaid.render(id, cleanChart);
        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err) {
        console.warn('Mermaid render error:', err);
        if (isMounted) {
          setRenderError(err.message || 'Invalid diagram format');
        }
      }
    };

    if (chart) {
      renderDiagram();
    }

    return () => {
      isMounted = false;
    };
  }, [chart]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(chart);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadSvg = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (renderError) {
    return (
      <div className="my-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
        <p className="font-semibold mb-1">Diagram Syntax Note</p>
        <pre className="overflow-x-auto text-[11px] opacity-80">{chart}</pre>
      </div>
    );
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111318] shadow-lg">
      <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#161820] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-medium tracking-wide text-slate-300 uppercase">
            Interactive Diagram
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <button
            onClick={copyCode}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 hover:bg-white/[0.08] hover:text-white transition"
            title="Copy Diagram Code"
          >
            {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={downloadSvg}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 hover:bg-white/[0.08] hover:text-white transition"
            title="Download SVG"
          >
            <Download size={13} />
            <span>SVG</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1 hover:bg-white/[0.08] hover:text-white transition"
            title="Full Screen"
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex items-center justify-center p-6 overflow-x-auto min-h-[140px]"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
          <button
            className="absolute top-6 right-6 rounded-full bg-white/10 p-2.5 text-white/80 hover:bg-white/20 hover:text-white transition"
            onClick={() => setIsModalOpen(false)}
          >
            <X size={20} />
          </button>
          <div
            className="max-h-[85vh] max-w-[90vw] overflow-auto rounded-2xl border border-white/10 bg-[#13151c] p-8 shadow-2xl"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </div>
  );
}

export default MermaidRenderer;
