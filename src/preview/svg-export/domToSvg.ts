import { extractSvgNodes } from './extract';
import { serializeSvg } from './serialize';

export type DomToSvgOptions = {
  waitForFonts?: boolean;
};

export async function domToSvg(
  element: HTMLElement,
  options: DomToSvgOptions = {},
): Promise<string> {
  const { waitForFonts = true } = options;

  if (
    waitForFonts &&
    typeof document !== 'undefined' &&
    document.fonts?.ready
  ) {
    await document.fonts.ready;
  }

  const extraction = extractSvgNodes(element);
  return serializeSvg(extraction);
}
