import type { AttributeId } from '../ir/types';

export type AttributeDefinition = {
  id: AttributeId;
  label: string;
  description: string;
};

export const ATTRIBUTE_DEFINITIONS: AttributeDefinition[] = [
  { id: 'background', label: 'Background', description: 'Fill color behind content' },
  { id: 'text', label: 'Text', description: 'Foreground text color' },
  { id: 'placeholder', label: 'Placeholder', description: 'Placeholder text in inputs' },
  { id: 'border', label: 'Border', description: 'Edge line color' },
  { id: 'outline', label: 'Outline', description: 'Focus ring or outer outline' },
  { id: 'icon', label: 'Icon', description: 'Decorative or informational icon color' },
  { id: 'mark', label: 'Mark', description: 'State indicators (checks, dots)' },
  { id: 'overlay', label: 'Overlay', description: 'Modal backdrop / dim layer' },
  { id: 'track', label: 'Track', description: 'Rail behind a variable element (slider, progress, switch off)' },
  { id: 'fill', label: 'Fill', description: 'Progress or selected portion of a variable element' },
  { id: 'thumb', label: 'Thumb', description: 'Draggable handle on sliders and switches' },
  { id: 'muted', label: 'Muted', description: 'Secondary or de-emphasized foreground/background' },
];
