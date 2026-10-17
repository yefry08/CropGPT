import { Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BRAND } from "../config.ts";

export const INK = "#1a1a2e";
export const MUTED = "#6b7280";
export const GRAD = `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.secondary})`;

export const gradText: React.CSSProperties = { background: GRAD, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" };

// Fades and lifts children in from local frame `at`; optionally out at `until`.
export const Reveal: React.FC<{ at: number; until?: number; children: React.ReactNode; style?: React.CSSProperties; dy?: number }> = ({ at, until, children, style, dy = 18 }) => {
  const f = useCurrentFrame();
  let o = interpolate(f, [at, at + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (until !== undefined) o = Math.min(o, interpolate(f, [until - 8, until], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const y = interpolate(f, [at, at + 12], [dy, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ opacity: o, transform: `translateY(${y}px)`, ...style }}>{children}</div>;
};

export const Chip: React.FC<{ color: string; children: React.ReactNode; size?: number }> = ({ color, children, size = 34 }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "14px 28px", borderRadius: 999, border: `2px solid ${color}33`, background: `${color}12`, color, fontSize: size, fontWeight: 600 }}>
    <span style={{ width: 14, height: 14, borderRadius: 7, background: color }} />
    {children}
  </div>
);

// A real platform capture inside a light browser-style frame, or a clearly labeled placeholder.
export const Capture: React.FC<{ src: string | null; label: string; width: number; height: number; zoomFrom?: number }> = ({ src, label, width, height, zoomFrom = 0 }) => {
  const f = useCurrentFrame();
  const z = interpolate(f, [zoomFrom, zoomFrom + 240], [1, 1.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ width, height, borderRadius: 18, overflow: "hidden", boxShadow: "0 24px 60px rgba(26,26,46,0.16)", border: "1px solid #e5e7eb", background: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ height: 36, background: "#f3f4f6", display: "flex", alignItems: "center", gap: 8, paddingLeft: 16, flexShrink: 0 }}>
        {["#e5e7eb", "#e5e7eb", "#e5e7eb"].map((c, i) => <span key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
      </div>
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {src ? (
          <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", transform: `scale(${z})`, transformOrigin: "top left" }} />
        ) : (
          <div style={{ position: "absolute", inset: 18, border: "3px dashed #d1d5db", borderRadius: 12, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 16, background: "#fafafa" }}>
            <div style={{ fontSize: Math.max(28, width / 22), fontWeight: 800, color: "#9ca3af", letterSpacing: 1 }}>[CAPTURA PENDIENTE]</div>
            <div style={{ fontSize: Math.max(20, width / 48), color: "#9ca3af", fontWeight: 600 }}>{label}</div>
          </div>
        )}
      </div>
    </div>
  );
};
