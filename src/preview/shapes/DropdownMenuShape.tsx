import type { StateId } from '../../ir/types';
import { MenuPanel } from './MenuPanel';

type Props = { state?: StateId };

export function DropdownMenuShape({ state }: Props) {
  return <MenuPanel componentId="dropdown-menu" state={state} />;
}
