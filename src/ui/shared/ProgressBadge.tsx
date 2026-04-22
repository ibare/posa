type Props = {
  filled: number;
  total: number;
  label?: string;
};

export function ProgressBadge({ filled, total, label }: Props) {
  const complete = total > 0 && filled >= total;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-mono tabular-nums ${
        complete
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-stone-100 text-stone-700'
      }`}
      title={label}
    >
      {filled}
      <span className="text-stone-400">/</span>
      {total}
    </span>
  );
}
