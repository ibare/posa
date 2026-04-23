import type { ReactNode } from 'react';

type SectionCardProps = {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
};

export function SectionCard({
  eyebrow,
  title,
  description,
  children,
  id,
}: SectionCardProps) {
  return (
    <section
      id={id}
      className="rounded-xl border border-stone-200 bg-white shadow-sm"
    >
      <header className="border-b border-stone-100 px-6 pt-5 pb-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-stone-400">
          {eyebrow}
        </div>
        <h3 className="mt-1 font-display italic text-2xl leading-tight text-stone-900">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-stone-600 max-w-[68ch]">
            {description}
          </p>
        )}
      </header>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

type SubCardProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

export function SubCard({ title, hint, children }: SubCardProps) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white">
      <div className="flex items-baseline justify-between border-b border-stone-100 px-4 py-2.5">
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-500">
          {title}
        </div>
        {hint && (
          <div className="text-[10px] font-mono text-stone-400">{hint}</div>
        )}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}
