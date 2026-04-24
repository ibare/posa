import { useCallback, useMemo, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  COMPONENT_GROUPS,
  type ComponentDefinition,
  type ComponentGroupId,
} from '../../../catalog/components';
import { SYMBOL_IDS } from '../../../ir/types';
import type { ComponentId, IR, StateId, SymbolId } from '../../../ir/types';
import { PosaPreviewRoot } from '../../../preview/PosaPreviewRoot';
import { domToSvg } from '../../../preview/svg-export';
import {
  AccordionShape,
  AlertDialogShape,
  AlertShape,
  AvatarShape,
  BadgeShape,
  BreadcrumbShape,
  ButtonShape,
  CalendarShape,
  CardShape,
  CheckboxShape,
  CollapsibleShape,
  CommandShape,
  ContextMenuShape,
  DialogShape,
  DrawerShape,
  DropdownMenuShape,
  HoverCardShape,
  InputGroupShape,
  InputOTPShape,
  InputShape,
  KbdShape,
  LabelShape,
  MenubarShape,
  NativeSelectShape,
  NavigationMenuShape,
  PaginationShape,
  PopoverShape,
  ProgressShape,
  RadioGroupShape,
  SelectShape,
  SeparatorShape,
  SheetShape,
  SidebarShape,
  SkeletonShape,
  SliderShape,
  SpinnerShape,
  SwitchShape,
  TableShape,
  TabsShape,
  TextareaShape,
  ToastShape,
  ToggleShape,
  TooltipShape,
  TypographyShape,
  type AlertVariant,
  type BadgeVariant,
  type ButtonVariant,
  type ToastVariant,
  type TypographyKind,
} from '../../../preview/shapes';
import { useActiveComponentDefs, useGroupLabel } from '../../../store/hooks';
import { useCopySvg } from '../../shared/toast';
import { SectionCard } from './shared';

type Props = { ir: IR };

const DEFAULT: StateId = 'default';

const SYMBOL_SET: Set<string> = new Set(SYMBOL_IDS);

/** symbol-bound variant가 IR에 할당되지 않았으면 그 variant는 숨긴다 (Explore과 동일 규칙). */
function isVisibleVariant(variantId: string, ir: IR): boolean {
  if (!SYMBOL_SET.has(variantId)) return true;
  return ir.symbols[variantId as SymbolId] != null;
}

export function ComponentGallery({ ir }: Props) {
  const { t } = useTranslation('review');
  const components = useActiveComponentDefs();
  const byGroup = useMemo(() => {
    const m = new Map<ComponentGroupId, ComponentDefinition[]>();
    for (const c of components) {
      const arr = m.get(c.group) ?? [];
      arr.push(c);
      m.set(c.group, arr);
    }
    return m;
  }, [components]);

  const activeGroups = COMPONENT_GROUPS.filter((g) => byGroup.has(g.id));

  return (
    <SectionCard
      eyebrow={t('gallery.eyebrow')}
      title={t('gallery.title')}
      description={t('gallery.description')}
    >
      <PosaPreviewRoot ir={ir}>
        <div className="space-y-8">
          {activeGroups.map((group) => {
            const members = byGroup.get(group.id)!;
            return (
              <div key={group.id}>
                <GroupHeading id={group.id} count={members.length} />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {members.map((comp) => (
                    <GalleryTile
                      key={comp.id}
                      component={comp}
                      ir={ir}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PosaPreviewRoot>
    </SectionCard>
  );
}

function GroupHeading({
  id,
  count,
}: {
  id: ComponentGroupId;
  count: number;
}) {
  const { t } = useTranslation('review');
  const label = useGroupLabel(id);
  return (
    <div className="mb-2 flex items-baseline justify-between border-b border-stone-200 pb-1.5">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-stone-500">
        {label}
      </div>
      <div className="font-mono text-[10px] text-stone-400">
        {t('gallery.componentCount', { count })}
      </div>
    </div>
  );
}

function GalleryTile({
  component,
  ir,
}: {
  component: ComponentDefinition;
  ir: IR;
}) {
  const { t } = useTranslation('review');
  const { t: tc } = useTranslation('common');
  const variantCount = component.variants?.length ?? 0;
  const previewRef = useRef<HTMLDivElement>(null);
  const copySvg = useCopySvg();
  const handleCopy = useCallback(async () => {
    const el = previewRef.current;
    if (!el) return;
    const svg = await domToSvg(el);
    await copySvg(svg);
  }, [copySvg]);
  return (
    <div className="group relative rounded-lg border border-stone-200 bg-stone-50/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-mono text-[11px] text-stone-700">
          {component.id}
        </div>
        {variantCount > 0 && (
          <div className="font-mono text-[10px] text-stone-400">
            {t('gallery.variantCount', { count: variantCount })}
          </div>
        )}
      </div>
      <div ref={previewRef} className="flex min-h-[88px] items-start">
        <ComponentPreview component={component} ir={ir} />
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={tc('svgCopy.label')}
        className={[
          'absolute right-2 top-2 rounded-md border border-stone-300 bg-white/90 px-2 py-0.5',
          'font-mono text-[10px] uppercase tracking-wider text-stone-700 shadow-sm backdrop-blur-sm',
          'opacity-0 transition-opacity hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900',
          'group-hover:opacity-100 group-focus-within:opacity-100',
        ].join(' ')}
      >
        {tc('svgCopy.label')}
      </button>
    </div>
  );
}

function ComponentPreview({
  component,
  ir,
}: {
  component: ComponentDefinition;
  ir: IR;
}) {
  const id = component.id as ComponentId;
  const variants =
    component.variants?.filter((v) => isVisibleVariant(v.id, ir)) ?? [];

  switch (id) {
    case 'button':
      return (
        <VariantRow>
          <ButtonShape state={DEFAULT} label="button" />
          {variants.map((v) => (
            <ButtonShape
              key={v.id}
              variant={v.id as ButtonVariant}
              state={DEFAULT}
              label={v.id}
            />
          ))}
        </VariantRow>
      );
    case 'input':
      return <InputShape state={DEFAULT} />;
    case 'card':
      return <CardShape />;
    case 'badge':
      return (
        <VariantRow>
          <BadgeShape label="badge" />
          {variants.map((v) => (
            <BadgeShape
              key={v.id}
              variant={v.id as BadgeVariant}
              label={v.id}
            />
          ))}
        </VariantRow>
      );
    case 'toast':
      return (
        <Stack>
          <ToastShape title="Toast" />
          {variants.map((v) => (
            <ToastShape
              key={v.id}
              variant={v.id as ToastVariant}
              title={`${capitalize(v.id)} toast`}
            />
          ))}
        </Stack>
      );
    case 'alert':
      return (
        <Stack>
          <AlertShape title="Alert" />
          {variants.map((v) => (
            <AlertShape
              key={v.id}
              variant={v.id as AlertVariant}
              title={`${capitalize(v.id)} alert`}
            />
          ))}
        </Stack>
      );
    case 'dialog':
      return <DialogShape />;
    case 'alert-dialog':
      return <AlertDialogShape />;
    case 'sheet':
      return <SheetShape />;
    case 'drawer':
      return <DrawerShape />;
    case 'popover':
      return <PopoverShape />;
    case 'hover-card':
      return <HoverCardShape />;
    case 'tooltip':
      return <TooltipShape />;
    case 'dropdown-menu':
      return <DropdownMenuShape state={DEFAULT} />;
    case 'context-menu':
      return <ContextMenuShape state={DEFAULT} />;
    case 'menubar':
      return <MenubarShape state={DEFAULT} />;
    case 'navigation-menu':
      return <NavigationMenuShape state={DEFAULT} />;
    case 'command':
      return <CommandShape state={DEFAULT} />;
    case 'checkbox':
      return <CheckboxShape state="checked" />;
    case 'radio-group':
      return <RadioGroupShape state="checked" />;
    case 'switch':
      return <SwitchShape state="checked" />;
    case 'toggle':
      return <ToggleShape state={DEFAULT} />;
    case 'slider':
      return <SliderShape state={DEFAULT} />;
    case 'progress':
      return <ProgressShape />;
    case 'textarea':
      return <TextareaShape state={DEFAULT} />;
    case 'input-group':
      return <InputGroupShape state={DEFAULT} />;
    case 'input-otp':
      return <InputOTPShape state={DEFAULT} />;
    case 'native-select':
      return <NativeSelectShape state={DEFAULT} />;
    case 'select':
      return <SelectShape state={DEFAULT} />;
    case 'breadcrumb':
      return <BreadcrumbShape state={DEFAULT} />;
    case 'tabs':
      return <TabsShape state={DEFAULT} />;
    case 'pagination':
      return <PaginationShape state={DEFAULT} />;
    case 'sidebar':
      return <SidebarShape state={DEFAULT} />;
    case 'accordion':
      return <AccordionShape state={DEFAULT} />;
    case 'collapsible':
      return <CollapsibleShape state={DEFAULT} />;
    case 'avatar':
      return <AvatarShape />;
    case 'spinner':
      return <SpinnerShape />;
    case 'skeleton':
      return <SkeletonShape />;
    case 'kbd':
      return <KbdShape />;
    case 'table':
      return <TableShape state={DEFAULT} />;
    case 'calendar':
      return <CalendarShape state={DEFAULT} />;
    case 'separator':
      return <SeparatorShape />;
    case 'label':
      return <LabelShape state={DEFAULT} />;
    default:
      if (id.startsWith('typography-')) {
        const kind = id.slice('typography-'.length) as TypographyKind;
        return <TypographyShape kind={kind} />;
      }
      return null;
  }
}

function VariantRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

function Stack({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col gap-2">{children}</div>;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}
