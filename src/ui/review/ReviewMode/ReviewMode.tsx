import { useTranslation } from 'react-i18next';
import { usePosaStore } from '../../../store/posa-store';
import { ColorScheme } from './ColorScheme';
import { ComponentGallery } from './ComponentGallery';
import { SystemHealth } from './SystemHealth';

export function ReviewMode() {
  const ir = usePosaStore((s) => s.ir);
  const { t } = useTranslation('review');

  return (
    <div className="space-y-5">
      <header>
        <h2 className="font-display italic text-3xl leading-tight text-stone-900">
          {t('page.heading')}
        </h2>
        <p className="mt-1 max-w-[70ch] text-[13px] leading-relaxed text-stone-600">
          {t('page.description')}
        </p>
      </header>
      <ColorScheme ir={ir} />
      <ComponentGallery ir={ir} />
      <SystemHealth ir={ir} />
    </div>
  );
}
