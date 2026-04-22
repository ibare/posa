import { useMemo, useState } from 'react';
import { COMPILERS, type CompileResult, type Compiler } from '../../compilers';
import { usePosaStore } from '../../store/posa-store';

export function ExportView() {
  const ir = usePosaStore((s) => s.ir);
  const [selectedId, setSelectedId] = useState<string>(COMPILERS[0].id);
  const [copied, setCopied] = useState(false);

  const selected: Compiler =
    COMPILERS.find((c) => c.id === selectedId) ?? COMPILERS[0];

  const result: CompileResult = useMemo(
    () => selected.compile(ir),
    [selected, ir],
  );

  const primitiveCount = Object.keys(ir.primitives).length;
  const roleCount = Object.keys(ir.roles).length;
  const slotCount = Object.values(ir.slots).filter(
    (s) => Object.keys(s.states).length > 0,
  ).length;

  const isEmpty = primitiveCount === 0 && roleCount === 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permission 없음 — 조용히 무시.
    }
  };

  const handleDownload = () => {
    const blob = new Blob([result.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isEmpty) {
    return (
      <div className="mx-auto max-w-3xl p-10 text-center border border-dashed border-stone-300 rounded-lg">
        <div className="font-display italic text-xl text-stone-700">
          내보낼 내용이 없습니다
        </div>
        <p className="text-sm text-stone-500 mt-2">
          최소 하나의 role에 색을 할당한 후 export할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
      <aside className="space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400 mb-1">
          Compiler
        </div>
        {COMPILERS.map((c) => {
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className={[
                'w-full text-left p-3 rounded border transition',
                active
                  ? 'border-stone-900 bg-stone-900 text-cream'
                  : 'border-stone-200 hover:border-stone-500 text-stone-700',
              ].join(' ')}
            >
              <div className="font-mono text-sm">{c.label}</div>
              <div
                className={[
                  'text-xs mt-0.5 leading-snug',
                  active ? 'text-cream/70' : 'text-stone-500',
                ].join(' ')}
              >
                {c.description}
              </div>
            </button>
          );
        })}

        <div className="mt-4 p-3 rounded border border-stone-200 bg-white/60 text-xs text-stone-600 space-y-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
            이 export는 현재 IR의 스냅샷입니다
          </div>
          <div className="font-mono tabular-nums">
            primitives <span className="text-stone-900">{primitiveCount}</span>
          </div>
          <div className="font-mono tabular-nums">
            roles <span className="text-stone-900">{roleCount}</span>
          </div>
          <div className="font-mono tabular-nums">
            slots w/ state <span className="text-stone-900">{slotCount}</span>
          </div>
        </div>
      </aside>

      <section className="rounded-lg border border-stone-200 bg-white overflow-hidden flex flex-col max-h-[calc(100vh-9rem)]">
        <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-stone-100">
          <div className="min-w-0">
            <div className="font-mono text-xs text-stone-900 break-all">
              {result.filename}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-stone-400">
              {result.language}
            </div>
          </div>
          <div className="flex-none flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="text-xs px-2.5 py-1.5 rounded border border-stone-200 hover:border-stone-500 hover:text-stone-900 text-stone-700 transition"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="text-xs px-2.5 py-1.5 rounded border border-stone-900 bg-stone-900 text-cream hover:opacity-90 transition"
            >
              Download
            </button>
          </div>
        </header>
        <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-stone-800 leading-relaxed whitespace-pre">
          {result.content}
        </pre>
      </section>
    </div>
  );
}
