// Jerarquía visual del brief: dorado = premios, azul eléctrico = IA/tecnología, verde = sostenibilidad, blanco = mensajes.
export const C = {
  bg: "#090C12", bg2: "#111724", line: "rgba(255,255,255,.10)",
  white: "#FFFFFF", dim: "rgba(255,255,255,.62)",
  blue: "#2E8BFF", gold: "#E8B53A", green: "#2FBF71", red: "#E5484D",
};
export const FONT = "Inter, sans-serif";
export const colorOf = (k?: string) => k === "dorado" ? C.gold : k === "verde" ? C.green : k === "azul" ? C.blue : C.white;
export type Orient = "h" | "v";
