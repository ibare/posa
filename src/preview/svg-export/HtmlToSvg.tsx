import { useEffect, useRef, useState, type ReactNode } from 'react';
import { domToSvg } from './domToSvg';

type Props = {
  children: ReactNode;
  signature: unknown;
};

/**
 * 자식 서브트리를 실제 DOM에 한 번 그린 뒤 domToSvg 로 변환해 SVG 로 표시한다.
 * HTML 측정용 루트는 `visibility: hidden` 로 남겨 레이아웃만 유지하고
 * 그 자리에 absolute 로 SVG 를 덮는다. signature 가 바뀌면 재측정한다.
 */
export function HtmlToSvg({ children, signature }: Props) {
  const htmlRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    const el = htmlRef.current;
    if (!el) return;
    let cancelled = false;
    const id = requestAnimationFrame(async () => {
      const code = await domToSvg(el);
      if (!cancelled) setSvg(code);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [signature]);

  return (
    <div className="relative inline-block">
      <div
        ref={htmlRef}
        aria-hidden={svg != null}
        style={svg != null ? { visibility: 'hidden' } : undefined}
      >
        {children}
      </div>
      {svg != null && (
        <div
          className="absolute inset-0 flex items-start"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )}
    </div>
  );
}
