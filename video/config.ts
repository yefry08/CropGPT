// Everything a non-developer may want to change lives here.

// Public URL of the live platform. While it still holds the placeholder, the capture step stops
// and the video shows [CAPTURA PENDIENTE] instead of the platform.
export const PLATFORM_URL = "[INSERTAR URL PÚBLICA DE LA PLATAFORMA]";
export const CONTACT = "yefrynunez45@gmail.com";

// Language of the narration and of the subtitles burned into the video ("en" | "es").
// Both .srt files are always exported.
export const NARRATION_LANG: "en" | "es" = "en";

// Total length in seconds when there is no narration file. Scene lengths scale with it.
// With assets/narration.mp3 present, the audio decides the length instead.
export const DURATION_S = 90;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Scene boundaries of the 90 s script, in seconds. Scaled to DURATION_S or to the narration.
export const SCENE_BOUNDS_S = [0, 10, 25, 50, 65, 80, 90];

// Figures from the script. When the capture step reads the live counters on the home page,
// those replace the ones it finds (see PROGRESS.md for any mismatch).
export const SCRIPT_FIGURES = {
  countries: 8,
  contracts: 34212,
  anomalies: 2271,
  historicalMillions: 3.55,
};

export const BRAND = { primary: "#667eea", secondary: "#764ba2" };
export const SEVERITY = { high: "#dc2626", review: "#d97706", normal: "#16a34a" };
