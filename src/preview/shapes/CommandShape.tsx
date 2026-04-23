import type { StateId } from '../../ir/types';
import { MenuPanel } from './MenuPanel';

type Props = { state?: StateId };

export function CommandShape({ state }: Props) {
  return <MenuPanel componentId="command" state={state} withSearchInput />;
}
