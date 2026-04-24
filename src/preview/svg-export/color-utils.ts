const RGB_RE = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/;

export function isTransparentColor(value: string | null | undefined): boolean {
  if (!value) return true;
  const v = value.trim();
  if (v === 'transparent') return true;
  if (v === 'rgba(0, 0, 0, 0)') return true;
  const match = v.match(RGB_RE);
  if (match && match[4] !== undefined && parseFloat(match[4]) === 0) return true;
  return false;
}

export function rgbToHex(rgb: string | null | undefined): string | null {
  if (isTransparentColor(rgb)) return null;
  const value = rgb!.trim();
  const match = value.match(RGB_RE);
  if (!match) return value;
  const [, r, g, b, a] = match;
  if (a !== undefined && parseFloat(a) < 1) return value;
  return (
    '#' +
    [r, g, b]
      .map((v) => parseInt(v, 10).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeAttr(s: string): string {
  return escapeXml(s).replace(/"/g, '&quot;');
}
