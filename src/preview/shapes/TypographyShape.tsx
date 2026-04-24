import type { CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { slotVarName } from '../slotVarName';

export type TypographyKind =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'p'
  | 'blockquote'
  | 'list'
  | 'inline-code'
  | 'lead'
  | 'large'
  | 'small';

type Props = { kind: TypographyKind };

/**
 * shadcn Typography — 11종을 한 shape에서 분기. 각 kind는 `typography-{kind}.text`
 * slot 하나만 살피고, shadcn docs의 대표 스타일(굵기/크기/장식)을 태그로 구현.
 */
export function TypographyShape({ kind }: Props) {
  const { t } = useTranslation('shapes');
  const slot = `typography-${kind}.text`;
  const style: CSSProperties = {
    color: `var(--${slotVarName(slot, 'default')})`,
  };
  const common = {
    style,
    'data-posa-slot': slot,
    'data-posa-state': 'default',
  } as const;

  switch (kind) {
    case 'h1':
      return (
        <h1 {...common} className="text-3xl font-extrabold tracking-tight">
          {t('typography.h1')}
        </h1>
      );
    case 'h2':
      return (
        <h2 {...common} className="text-2xl font-semibold tracking-tight">
          {t('typography.h2')}
        </h2>
      );
    case 'h3':
      return (
        <h3 {...common} className="text-xl font-semibold tracking-tight">
          {t('typography.h3')}
        </h3>
      );
    case 'h4':
      return (
        <h4 {...common} className="text-base font-semibold tracking-tight">
          {t('typography.h4')}
        </h4>
      );
    case 'p':
      return (
        <p {...common} className="max-w-sm text-sm leading-6">
          {t('typography.paragraph')}
        </p>
      );
    case 'blockquote':
      return (
        <blockquote
          {...common}
          className="max-w-sm border-l-2 border-stone-300 pl-4 text-sm italic"
        >
          {t('typography.blockquote')}
        </blockquote>
      );
    case 'list':
      return (
        <ul {...common} className="ml-5 list-disc space-y-1 text-sm">
          <li>{t('typography.list1')}</li>
          <li>{t('typography.list2')}</li>
          <li>{t('typography.list3')}</li>
        </ul>
      );
    case 'inline-code':
      return (
        <span {...common} className="text-sm">
          {t('typography.inlineCodePrefix')}
          <code className="rounded bg-stone-200/60 px-1.5 py-0.5 font-mono text-[0.85em]">
            @radix-ui/react-dialog
          </code>
          {t('typography.inlineCodeSuffix')}
        </span>
      );
    case 'lead':
      return (
        <p {...common} className="max-w-sm text-lg leading-7">
          {t('typography.lead')}
        </p>
      );
    case 'large':
      return (
        <div {...common} className="text-lg font-semibold">
          {t('typography.large')}
        </div>
      );
    case 'small':
      return (
        <small {...common} className="text-xs font-medium leading-none">
          {t('typography.small')}
        </small>
      );
  }
}
