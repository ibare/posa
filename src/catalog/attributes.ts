import type { AttributeId } from '../ir/types';

export type AttributeDefinition = {
  id: AttributeId;
};

export const ATTRIBUTE_DEFINITIONS: AttributeDefinition[] = [
  { id: 'background' },
  { id: 'text' },
  { id: 'placeholder' },
  { id: 'border' },
  { id: 'outline' },
  { id: 'icon' },
  { id: 'mark' },
  { id: 'overlay' },
  { id: 'track' },
  { id: 'fill' },
  { id: 'thumb' },
  { id: 'muted' },
];
