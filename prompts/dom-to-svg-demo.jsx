import { useEffect, useRef, useState } from "react";

// ============================================================
// Mock IR tokens for styling (simulate Posa color system)
// ============================================================
const TOKENS = {
  primary: "#2d7a3e",
  primaryHover: "#246632",
  primaryFg: "#ffffff",
  neutral50: "#faf8f3",
  neutral100: "#f5f5f4",
  neutral200: "#e7e5e4",
  neutral300: "#d6d3d1",
  neutral400: "#a8a29e",
  neutral500: "#78716c",
  neutral700: "#44403c",
  neutral900: "#1c1917",
  destructive: "#c53030",
  destructiveFg: "#ffffff",
};

// ============================================================
// Shape components — rendered in HTML, will be measured for SVG
// Each follows Posa rules: no interaction, no pseudo-elements, no shadow
// ============================================================

function ButtonShape({ variant = "primary", label = "Button", state = "default" }) {
  const styles = {
    primary: {
      default: { bg: TOKENS.primary, fg: TOKENS.primaryFg, border: "transparent" },
      hover:   { bg: TOKENS.primaryHover, fg: TOKENS.primaryFg, border: "transparent" },
    },
    secondary: {
      default: { bg: TOKENS.neutral100, fg: TOKENS.neutral900, border: "transparent" },
      hover:   { bg: TOKENS.neutral200, fg: TOKENS.neutral900, border: "transparent" },
    },
    outline: {
      default: { bg: "transparent", fg: TOKENS.neutral900, border: TOKENS.neutral300 },
      hover:   { bg: TOKENS.neutral100, fg: TOKENS.neutral900, border: TOKENS.neutral300 },
    },
    destructive: {
      default: { bg: TOKENS.destructive, fg: TOKENS.destructiveFg, border: "transparent" },
      hover:   { bg: "#a02525", fg: TOKENS.destructiveFg, border: "transparent" },
    },
  };
  const s = styles[variant][state] || styles[variant].default;

  return (
    <div
      data-shape="button"
      data-variant={variant}
      data-state={state}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 16px",
        height: "36px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: 500,
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        backgroundColor: s.bg,
        color: s.fg,
        border: `1px solid ${s.border}`,
        boxSizing: "border-box",
      }}
    >
      {label}
    </div>
  );
}

function BadgeShape({ variant = "primary", label = "Badge" }) {
  const styles = {
    primary:     { bg: TOKENS.primary, fg: TOKENS.primaryFg },
    secondary:   { bg: TOKENS.neutral200, fg: TOKENS.neutral900 },
    destructive: { bg: TOKENS.destructive, fg: TOKENS.destructiveFg },
  };
  const s = styles[variant];

  return (
    <div
      data-shape="badge"
      data-variant={variant}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2px 10px",
        borderRadius: "9999px",
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        backgroundColor: s.bg,
        color: s.fg,
        border: "1px solid transparent",
        boxSizing: "border-box",
      }}
    >
      {label}
    </div>
  );
}

function InputShape({ placeholder = "Enter text...", focused = false }) {
  return (
    <div
      data-shape="input"
      data-focused={focused}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        height: "36px",
        width: "240px",
        borderRadius: "6px",
        fontSize: "14px",
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        backgroundColor: "#ffffff",
        color: TOKENS.neutral400,
        border: `1px solid ${focused ? TOKENS.primary : TOKENS.neutral300}`,
        boxSizing: "border-box",
      }}
    >
      {placeholder}
    </div>
  );
}

function CardShape({ title = "Card title", body = "Card body content goes here." }) {
  return (
    <div
      data-shape="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "24px",
        width: "280px",
        borderRadius: "10px",
        backgroundColor: "#ffffff",
        color: TOKENS.neutral900,
        border: `1px solid ${TOKENS.neutral200}`,
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: 600 }}>{title}</div>
      <div style={{ fontSize: "13px", color: TOKENS.neutral500, lineHeight: 1.5 }}>
        {body}
      </div>
    </div>
  );
}

function ButtonRow() {
  return (
    <div
      data-shape="button-row"
      style={{
        display: "flex",
        gap: "12px",
        alignItems: "center",
        padding: "16px",
        backgroundColor: TOKENS.neutral50,
        borderRadius: "8px",
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
      }}
    >
      <ButtonShape variant="primary" label="Save" />
      <ButtonShape variant="secondary" label="Cancel" />
      <ButtonShape variant="outline" label="Help" />
    </div>
  );
}

function CalendarShape() {
  const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];
  const cells = [];
  cells.push({ label: "28", muted: true });
  cells.push({ label: "29", muted: true });
  cells.push({ label: "30", muted: true });
  for (let d = 1; d <= 30; d++) cells.push({ label: String(d), active: d === 15 });
  let nd = 1;
  while (cells.length < 35) cells.push({ label: String(nd++), muted: true });

  const cellBase = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    borderRadius: "4px",
    fontSize: "11px",
    fontFamily: "'Instrument Sans', system-ui, sans-serif",
  };

  return (
    <div
      data-shape="calendar"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: "4px",
        padding: "12px",
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        color: TOKENS.neutral900,
        border: `1px solid ${TOKENS.neutral200}`,
        fontFamily: "'Instrument Sans', system-ui, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Month header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 4px",
          marginBottom: "4px",
          fontSize: "12px",
        }}
      >
        <span style={{ fontWeight: 500 }}>April 2026</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: TOKENS.neutral400,
          }}
        >
          <span>‹</span>
          <span>›</span>
        </span>
      </div>

      {/* Day-of-week row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 24px)",
          gap: "2px",
        }}
      >
        {DAY_HEADERS.map((d, i) => (
          <span
            key={`h-${i}`}
            style={{
              ...cellBase,
              fontSize: "10px",
              fontWeight: 500,
              color: TOKENS.neutral400,
            }}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Date grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 24px)",
          gap: "2px",
        }}
      >
        {cells.map((c, i) => {
          const style = { ...cellBase };
          if (c.active) {
            style.backgroundColor = TOKENS.primary;
            style.color = TOKENS.primaryFg;
            style.fontWeight = 500;
          } else if (c.muted) {
            style.color = TOKENS.neutral300;
          } else {
            style.color = TOKENS.neutral900;
          }
          return (
            <span key={`c-${i}`} style={style}>
              {c.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// DOM → SVG converter
// Walks rendered DOM tree, extracts geometry + style, emits SVG nodes
// ============================================================

function rgbToHex(rgb) {
  if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return null;
  // Parse "rgb(r, g, b)" or "rgba(r, g, b, a)"
  const match = rgb.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!match) return rgb; // already hex or named color
  const [, r, g, b, a] = match;
  if (a !== undefined && parseFloat(a) < 1) {
    return rgb; // keep as rgba string
  }
  return (
    "#" +
    [r, g, b].map((v) => parseInt(v).toString(16).padStart(2, "0")).join("")
  );
}

function hasVisibleBackground(styles) {
  const bg = styles.backgroundColor;
  if (!bg) return false;
  if (bg === "transparent") return false;
  if (bg === "rgba(0, 0, 0, 0)") return false;
  return true;
}

function hasVisibleBorder(styles) {
  const width = parseFloat(styles.borderTopWidth);
  if (width === 0) return false;
  const color = styles.borderTopColor;
  if (!color || color === "transparent" || color === "rgba(0, 0, 0, 0)") return false;
  return true;
}

function isLeafWithText(el) {
  if (el.nodeType !== Node.ELEMENT_NODE) return false;
  // has no element children, only text nodes
  for (const child of el.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) return false;
  }
  return el.textContent && el.textContent.trim().length > 0;
}

function extractSvgNodes(rootEl) {
  const rootRect = rootEl.getBoundingClientRect();
  const nodes = [];

  function walk(el) {
    if (el.nodeType !== Node.ELEMENT_NODE) return;

    const rect = el.getBoundingClientRect();
    const styles = getComputedStyle(el);
    const x = rect.left - rootRect.left;
    const y = rect.top - rootRect.top;
    const w = rect.width;
    const h = rect.height;

    const radius = parseFloat(styles.borderTopLeftRadius) || 0;
    // SVG rect rx is clamped to half the shorter side — but we preserve for pill shape
    const rx = Math.min(radius, Math.min(w, h) / 2);

    // 1) background rect
    if (hasVisibleBackground(styles)) {
      nodes.push({
        type: "rect",
        x, y, width: w, height: h,
        fill: rgbToHex(styles.backgroundColor),
        rx,
      });
    }

    // 2) border rect
    if (hasVisibleBorder(styles)) {
      const bw = parseFloat(styles.borderTopWidth);
      // inset by half the border width so stroke sits on the geometry edge
      nodes.push({
        type: "rect",
        x: x + bw / 2,
        y: y + bw / 2,
        width: w - bw,
        height: h - bw,
        fill: "none",
        stroke: rgbToHex(styles.borderTopColor),
        strokeWidth: bw,
        rx: Math.max(0, rx - bw / 2),
      });
    }

    // 3) text node (only leaf elements with direct text)
    if (isLeafWithText(el)) {
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = styles.fontWeight;
      const color = rgbToHex(styles.color);
      const fontFamily = styles.fontFamily.replace(/"/g, "'");

      // Compute text position based on text-align + padding
      // For simplicity we use the element's content box
      const padL = parseFloat(styles.paddingLeft);
      const padR = parseFloat(styles.paddingRight);
      const contentW = w - padL - padR;

      let textX = x + padL;
      let textAnchor = "start";
      const textAlign = styles.textAlign;
      const justifyContent = styles.justifyContent;

      if (textAlign === "center" || justifyContent === "center") {
        textX = x + padL + contentW / 2;
        textAnchor = "middle";
      } else if (textAlign === "right" || justifyContent === "flex-end") {
        textX = x + w - padR;
        textAnchor = "end";
      }

      // Y position: approximate baseline from center
      // For single-line text in a flex centered container, text sits vertically centered
      const lineHeight = parseFloat(styles.lineHeight) || fontSize * 1.5;
      const baselineOffset = fontSize * 0.72; // approximate cap height to baseline

      let textY;
      const alignItems = styles.alignItems;
      if (alignItems === "center") {
        textY = y + h / 2 + baselineOffset / 2;
      } else {
        const padT = parseFloat(styles.paddingTop);
        textY = y + padT + baselineOffset;
      }

      nodes.push({
        type: "text",
        x: textX,
        y: textY,
        text: el.textContent.trim(),
        fill: color,
        fontFamily,
        fontSize,
        fontWeight,
        textAnchor,
      });
    }

    // recurse
    for (const child of el.children) {
      walk(child);
    }
  }

  walk(rootEl);
  return { nodes, width: rootRect.width, height: rootRect.height };
}

function serializeSvg({ nodes, width, height }) {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width.toFixed(1)}" height="${height.toFixed(1)}" viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}">`,
  ];

  for (const n of nodes) {
    if (n.type === "rect") {
      const attrs = [
        `x="${n.x.toFixed(2)}"`,
        `y="${n.y.toFixed(2)}"`,
        `width="${n.width.toFixed(2)}"`,
        `height="${n.height.toFixed(2)}"`,
      ];
      if (n.rx > 0) attrs.push(`rx="${n.rx.toFixed(2)}"`);
      if (n.fill) attrs.push(`fill="${n.fill}"`);
      if (n.stroke) {
        attrs.push(`stroke="${n.stroke}"`);
        attrs.push(`stroke-width="${n.strokeWidth}"`);
      }
      parts.push(`  <rect ${attrs.join(" ")} />`);
    } else if (n.type === "text") {
      const attrs = [
        `x="${n.x.toFixed(2)}"`,
        `y="${n.y.toFixed(2)}"`,
        `fill="${n.fill}"`,
        `font-family="${n.fontFamily}"`,
        `font-size="${n.fontSize}"`,
        `font-weight="${n.fontWeight}"`,
      ];
      if (n.textAnchor !== "start") attrs.push(`text-anchor="${n.textAnchor}"`);
      parts.push(`  <text ${attrs.join(" ")}>${escapeXml(n.text)}</text>`);
    }
  }

  parts.push("</svg>");
  return parts.join("\n");
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ============================================================
// Shape registry for the demo
// ============================================================
const SHAPES = [
  {
    id: "button-primary",
    label: "Button · Primary",
    render: () => <ButtonShape variant="primary" label="Save changes" />,
  },
  {
    id: "button-outline",
    label: "Button · Outline",
    render: () => <ButtonShape variant="outline" label="Cancel" />,
  },
  {
    id: "button-destructive",
    label: "Button · Destructive",
    render: () => <ButtonShape variant="destructive" label="Delete" />,
  },
  {
    id: "badge-primary",
    label: "Badge · Primary",
    render: () => <BadgeShape variant="primary" label="New" />,
  },
  {
    id: "badge-secondary",
    label: "Badge · Secondary",
    render: () => <BadgeShape variant="secondary" label="Draft" />,
  },
  {
    id: "input",
    label: "Input · Default",
    render: () => <InputShape placeholder="Enter your name" />,
  },
  {
    id: "input-focused",
    label: "Input · Focused",
    render: () => <InputShape placeholder="Enter your name" focused={true} />,
  },
  {
    id: "card",
    label: "Card",
    render: () => (
      <CardShape
        title="Welcome back"
        body="Sign in with your account to continue."
      />
    ),
  },
  {
    id: "button-row",
    label: "Button Row (flex layout test)",
    render: () => <ButtonRow />,
  },
  {
    id: "calendar",
    label: "Calendar (grid layout test)",
    render: () => <CalendarShape />,
  },
];

// ============================================================
// Main
// ============================================================
export default function DomToSvgDemo() {
  const [selectedId, setSelectedId] = useState("button-primary");
  const [svgCode, setSvgCode] = useState("");
  const [copied, setCopied] = useState(false);
  const htmlRef = useRef(null);
  const shape = SHAPES.find((s) => s.id === selectedId);

  // Convert to SVG whenever rendered element changes
  useEffect(() => {
    if (!htmlRef.current) return;
    // Find the first actual shape element (skip wrapper)
    const target = htmlRef.current.firstElementChild;
    if (!target) return;

    // Wait one frame for fonts/layout to stabilize
    const rafId = requestAnimationFrame(() => {
      const result = extractSvgNodes(target);
      const code = serializeSvg(result);
      setSvgCode(code);
    });
    return () => cancelAnimationFrame(rafId);
  }, [selectedId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(svgCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        body, html { font-family: 'Instrument Sans', system-ui, sans-serif; }
      `}</style>

      <div
        className="min-h-screen text-stone-900 p-8"
        style={{ backgroundColor: "#faf8f3", fontFamily: "'Instrument Sans', system-ui, sans-serif" }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl mb-2" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              DOM → SVG conversion demo
            </h1>
            <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
              Rendered HTML shape on the left, SVG reconstruction on the right.
              The SVG is built by measuring the HTML's DOM geometry and styles — no manual layout engine, just reading what the browser computed.
            </p>
          </div>

          {/* Shape selector */}
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-stone-500 mr-2">
              Shape:
            </span>
            {SHAPES.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className={`px-3 py-1.5 rounded text-xs transition-colors ${
                  selectedId === s.id
                    ? "bg-stone-900 text-stone-50"
                    : "bg-white border border-stone-200 hover:border-stone-400 text-stone-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-5 mb-5">
            {/* HTML original */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-stone-500 mb-4">
                HTML original
              </div>
              <div
                className="flex items-center justify-center min-h-[120px] border border-stone-100 rounded-lg p-8"
                style={{ backgroundColor: "#fafafa" }}
              >
                <div ref={htmlRef}>{shape.render()}</div>
              </div>
            </div>

            {/* SVG result */}
            <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
              <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-stone-500 mb-4">
                SVG reconstruction
              </div>
              <div
                className="flex items-center justify-center min-h-[120px] border border-stone-100 rounded-lg p-8"
                style={{ backgroundColor: "#fafafa" }}
                dangerouslySetInnerHTML={{ __html: svgCode }}
              />
            </div>
          </div>

          {/* SVG code output */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-[0.2em] font-mono text-stone-500">
                Generated SVG
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded text-xs bg-stone-900 text-stone-50 hover:bg-stone-700 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre
              className="text-xs font-mono bg-stone-50 border border-stone-200 rounded p-4 overflow-auto text-stone-800"
              style={{ maxHeight: "400px", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            >
              {svgCode}
            </pre>
          </div>

          {/* Footnote */}
          <div className="mt-6 text-[11px] text-stone-500 leading-relaxed max-w-2xl">
            <p>
              <strong className="text-stone-700">How it works:</strong> Each HTML element is
              measured via <code className="font-mono bg-stone-100 px-1 rounded">getBoundingClientRect()</code>
              and <code className="font-mono bg-stone-100 px-1 rounded">getComputedStyle()</code>. Background, border,
              and text are emitted as SVG primitives. Flex/grid layout is fully resolved by the
              browser before measurement — we never compute positions ourselves.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
