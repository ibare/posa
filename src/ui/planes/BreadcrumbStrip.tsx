import { usePosaStore, type Layer } from '../../store/posa-store';

const LAYER_LABEL: Record<Layer, string> = {
  z0: 'Z0 · role',
  z1: 'Z1 · slot',
  z2: 'Z2 · state',
};

export function BreadcrumbStrip() {
  const layer = usePosaStore((s) => s.layer);
  const selectedRole = usePosaStore((s) => s.selectedRole);
  const selectedSlot = usePosaStore((s) => s.selectedSlot);
  const jumpToLayer = usePosaStore((s) => s.jumpToLayer);

  const crumbs: { key: string; label: string; onClick: () => void; active: boolean }[] = [
    {
      key: 'z0',
      label: layer === 'z0' ? 'Z0 · root' : 'Z0',
      onClick: () => jumpToLayer('z0'),
      active: layer === 'z0',
    },
  ];
  if (layer !== 'z0' && selectedRole) {
    crumbs.push({
      key: 'z1',
      label: selectedRole,
      onClick: () => jumpToLayer('z1'),
      active: layer === 'z1',
    });
  }
  if (layer === 'z2' && selectedSlot) {
    crumbs.push({
      key: 'z2',
      label: selectedSlot,
      onClick: () => jumpToLayer('z2'),
      active: true,
    });
  }

  return (
    <div className="mx-auto max-w-5xl mb-6 flex items-center gap-2 text-xs font-mono">
      {crumbs.map((c, i) => (
        <span key={c.key} className="flex items-center gap-2">
          {i > 0 && <span className="text-stone-300">·</span>}
          <button
            type="button"
            onClick={c.onClick}
            className={[
              'px-2 py-0.5 rounded transition',
              c.active
                ? 'text-stone-900'
                : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50',
            ].join(' ')}
          >
            {c.label}
          </button>
        </span>
      ))}
      <span className="ml-3 text-[10px] uppercase tracking-[0.2em] text-stone-400">
        {LAYER_LABEL[layer]}
      </span>
    </div>
  );
}
