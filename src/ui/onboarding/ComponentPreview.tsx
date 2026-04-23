import { useMemo, type CSSProperties, type ReactNode } from 'react';
import {
  findComponentBySlotId,
  type ComponentDefinition,
} from '../../catalog/components';
import {
  enumerateAllSlotIds,
  getAttributeFromSlotId,
} from '../../ir/selectors';
import type { AttributeId, ComponentId } from '../../ir/types';
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
  type TypographyKind,
} from '../../preview/shapes';
import { slotVarName } from '../../preview/slotVarName';

/**
 * 온보딩 단계에서 "이 컴포넌트는 이렇게 생겼다" 정도의 실루엣을 보여주기 위한
 * 중립 색 팔레트. IR은 아직 비어 있어 PosaPreviewRoot가 쓰는 UNSET_PLACEHOLDER로는
 * 면이 transparent가 되어 셔이프가 잘 드러나지 않는다. 여기서는 stone 계열로 채워
 * 구조만 인지 가능하도록 한다.
 */
const NEUTRAL_BY_ATTR: Record<AttributeId, string> = {
  background: '#fafaf9', // stone-50
  text: '#44403c', // stone-700
  placeholder: '#a8a29e', // stone-400
  border: '#d6d3d1', // stone-300
  outline: '#78716c', // stone-500
  icon: '#57534e', // stone-600
  mark: '#292524', // stone-800
  overlay: 'rgba(41, 37, 36, 0.25)',
  track: '#e7e5e4', // stone-200
  fill: '#78716c', // stone-500
  thumb: '#ffffff',
  muted: '#e7e5e4', // stone-200
};

function NeutralPreviewRoot({
  component,
  children,
}: {
  component: ComponentDefinition;
  children: ReactNode;
}) {
  const cssVars = useMemo(() => {
    const vars: Record<string, string> = {};
    for (const slotId of enumerateAllSlotIds([component])) {
      const attr = getAttributeFromSlotId(slotId);
      const color = NEUTRAL_BY_ATTR[attr] ?? 'transparent';
      const comp = findComponentBySlotId(slotId);
      if (!comp) continue;
      for (const state of comp.states) {
        vars[`--${slotVarName(slotId, state)}`] = color;
      }
    }
    return vars;
  }, [component]);

  return (
    <div className="w-full h-full" style={cssVars as CSSProperties}>
      {children}
    </div>
  );
}

const TYPOGRAPHY_KINDS: readonly TypographyKind[] = [
  'h1',
  'h2',
  'h3',
  'h4',
  'p',
  'blockquote',
  'list',
  'inline-code',
  'lead',
  'large',
  'small',
] as const;

/**
 * 각 컴포넌트 id가 카드 프리뷰 슬롯에 그려질 대표 shape. 하나만 뽑아 그린다.
 * 큰 overlay류(dialog/sheet/drawer/sidebar)는 scale 축소로 카드에 맞춘다.
 */
function renderShape(id: ComponentId): ReactNode | null {
  if (id.startsWith('typography-')) {
    const kind = id.slice('typography-'.length) as TypographyKind;
    if (!(TYPOGRAPHY_KINDS as readonly string[]).includes(kind)) return null;
    return <TypographyShape kind={kind} />;
  }
  switch (id) {
    case 'button':
      return <ButtonShape variant="primary" label="Button" />;
    case 'input':
      return <InputShape />;
    case 'card':
      return <CardShape />;
    case 'badge':
      return <BadgeShape />;
    case 'toast':
      return <ToastShape />;
    case 'dialog':
      return <DialogShape fill />;
    case 'alert-dialog':
      return <AlertDialogShape fill />;
    case 'sheet':
      return <SheetShape fill />;
    case 'drawer':
      return <DrawerShape fill />;
    case 'popover':
      return <PopoverShape />;
    case 'hover-card':
      return <HoverCardShape />;
    case 'tooltip':
      return <TooltipShape />;
    case 'dropdown-menu':
      return <DropdownMenuShape state="default" />;
    case 'context-menu':
      return <ContextMenuShape state="default" />;
    case 'menubar':
      return <MenubarShape state="default" />;
    case 'navigation-menu':
      return <NavigationMenuShape state="default" />;
    case 'command':
      return <CommandShape state="default" />;
    case 'checkbox':
      return <CheckboxShape state="checked" />;
    case 'radio-group':
      return <RadioGroupShape state="checked" />;
    case 'switch':
      return <SwitchShape state="checked" />;
    case 'toggle':
      return <ToggleShape state="active" />;
    case 'slider':
      return <SliderShape state="default" />;
    case 'progress':
      return <ProgressShape />;
    case 'textarea':
      return <TextareaShape state="default" />;
    case 'input-group':
      return <InputGroupShape state="default" />;
    case 'input-otp':
      return <InputOTPShape state="default" />;
    case 'native-select':
      return <NativeSelectShape state="default" />;
    case 'select':
      return <SelectShape state="default" />;
    case 'breadcrumb':
      return <BreadcrumbShape state="default" />;
    case 'tabs':
      return <TabsShape state="default" />;
    case 'pagination':
      return <PaginationShape state="default" />;
    case 'sidebar':
      return <SidebarShape state="default" />;
    case 'accordion':
      return <AccordionShape state="default" />;
    case 'collapsible':
      return <CollapsibleShape state="default" />;
    case 'alert':
      return <AlertShape variant="info" />;
    case 'avatar':
      return <AvatarShape />;
    case 'spinner':
      return <SpinnerShape />;
    case 'skeleton':
      return <SkeletonShape />;
    case 'kbd':
      return <KbdShape />;
    case 'table':
      return <TableShape state="default" />;
    case 'calendar':
      return <CalendarShape state="default" />;
    case 'separator':
      return <SeparatorShape />;
    case 'label':
      return <LabelShape state="default" />;
  }
  return null;
}

/**
 * 각 컴포넌트 프리뷰 pane의 자연 높이(px). Pinterest 스타일 masonry 그리드 안에서
 * 카드별로 높이가 달라져 실루엣이 컴포넌트 고유 비율에 가깝게 잡히도록 한다.
 * 값이 없으면 DEFAULT_HEIGHT.
 */
const DEFAULT_HEIGHT = 80;
const PREVIEW_HEIGHT: Partial<Record<ComponentId, number>> = {
  // 큰 overlay: 실루엣이 세로로 큰 편이라 여유 있게.
  dialog: 260,
  'alert-dialog': 240,
  sheet: 240,
  drawer: 240,
  sidebar: 280,
  command: 240,
  // 컨테이너/레이아웃.
  calendar: 220,
  accordion: 160,
  collapsible: 120,
  card: 120,
  table: 140,
  // 가로로 긴 레이아웃 — 높이는 중간.
  'navigation-menu': 110,
  menubar: 90,
  tabs: 110,
  pagination: 90,
  breadcrumb: 80,
  'input-otp': 90,
  alert: 100,
  toast: 120,
  // 메뉴/작은 overlay.
  'dropdown-menu': 180,
  'context-menu': 180,
  popover: 160,
  'hover-card': 140,
  tooltip: 90,
  // Typography 중 큰 것.
  'typography-h1': 100,
  'typography-h2': 90,
  'typography-blockquote': 100,
  'typography-list': 110,
};

/** 일부 shape는 기본 크기가 커서 pane을 넘치므로 살짝 축소. */
const SCALE: Partial<Record<ComponentId, number>> = {
  sidebar: 0.85,
  calendar: 0.95,
  toast: 0.7,
  alert: 0.85,
  'input-otp': 0.9,
};

/**
 * Dim stage를 pane 전체에 깔아야 하는 overlay. shape가 `fill` prop으로 자체 stage를
 * w-full/h-full로 렌더하므로, ComponentPreview는 scale-center 래퍼 없이 shape를
 * 직접 pane 안에 absolute-inset-0로 뿌린다.
 */
const FILL_OVERLAY_IDS = new Set<ComponentId>([
  'dialog',
  'alert-dialog',
  'sheet',
  'drawer',
]);

type Props = {
  component: ComponentDefinition;
};

/**
 * 온보딩 카드 내부에 컴포넌트 실루엣을 그리는 pane. 클릭은 부모 카드 버튼으로
 * 흘러가도록 pointer-events-none으로 고정.
 */
export function ComponentPreview({ component }: Props) {
  const shape = renderShape(component.id);
  if (!shape) return null;

  const height = PREVIEW_HEIGHT[component.id] ?? DEFAULT_HEIGHT;
  const isFillOverlay = FILL_OVERLAY_IDS.has(component.id);

  return (
    <div
      className="pointer-events-none relative w-full overflow-hidden rounded-md bg-stone-50 border border-stone-100"
      style={{ height }}
    >
      {isFillOverlay ? (
        <div className="absolute inset-0">
          <NeutralPreviewRoot component={component}>{shape}</NeutralPreviewRoot>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div style={{ transform: `scale(${SCALE[component.id] ?? 1})` }}>
            <NeutralPreviewRoot component={component}>{shape}</NeutralPreviewRoot>
          </div>
        </div>
      )}
    </div>
  );
}
