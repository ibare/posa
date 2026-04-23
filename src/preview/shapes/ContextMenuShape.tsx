import type { StateId } from '../../ir/types';
import { MenuPanel } from './MenuPanel';

type Props = { state?: StateId };

export function ContextMenuShape({ state }: Props) {
  return <MenuPanel componentId="context-menu" state={state} />;
}
