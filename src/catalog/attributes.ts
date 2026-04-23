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
  { id: 'mark', label: 'Mark', description: 'State indicators (checks, dots, thumbs)' },
];
