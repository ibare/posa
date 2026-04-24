export type SvgRectNode = {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string | null;
  stroke?: string | null;
  strokeWidth?: number;
  rx?: number;
};

export type SvgTextNode = {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fill: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  textAnchor: 'start' | 'middle' | 'end';
};

export type SvgNode = SvgRectNode | SvgTextNode;

export type SvgExtraction = {
  nodes: SvgNode[];
  width: number;
  height: number;
};
