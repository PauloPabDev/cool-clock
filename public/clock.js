const STORAGE_KEY = "cool-clock-settings";

// System fonts: name → CSS font-family (no Google Fonts request needed)
const SYSTEM_FONTS = {
  "Mono (sistema)": "ui-monospace, monospace",
  "Sans (sistema)": "ui-sans-serif, sans-serif",
  "Serif (sistema)": "ui-serif, serif",
  "Courier New": "'Courier New', monospace",
  "Georgia": "Georgia, serif",
};

const DEFAULTS = {
  fontFamily: "Mono (sistema)",
  backgroundColor: "#050505",
  textColor: "#ffffff",
  fontSize: 120,
  showSeconds: true,
  showMilliseconds: false,
  timezone: "America/Bogota",
  hour12: false,
};

// ---------------------------------------------------------------------------
// Query-param → setting mapping
//
//  ?font=Orbitron
//  ?size=150
//  ?bg=1a1a2e          (hex, with or without #)
//  ?color=00ff88
//  ?seconds=0          (0/1 or false/true)
//  ?ms=1
//  ?us=1
//  ?tz=Asia/Tokyo
//  ?h12=1
// ---------------------------------------------------------------------------
function applyQueryParams(s) {
  const p = new URLSearchParams(window.location.search);

  if (p.has("font")) s.fontFamily = p.get("font");
  if (p.has("size")) s.fontSize = Math.max(10, Math.min(600, Number(p.get("size")) || s.fontSize));
  if (p.has("bg")) s.backgroundColor = normalizeColor(p.get("bg"));
  if (p.has("color")) s.textColor = normalizeColor(p.get("color"));
  if (p.has("seconds")) s.showSeconds = parseBool(p.get("seconds"));
  if (p.has("ms")) s.showMilliseconds = parseBool(p.get("ms"));
  if (p.has("tz")) s.timezone = p.get("tz");
  if (p.has("h12")) s.hour12 = parseBool(p.get("h12"));

  return s;
}

function normalizeColor(val) {
  // Accept "ff0000" or "#ff0000" → "#ff0000"
  val = val.trim();
  if (!val.startsWith("#")) val = "#" + val;
  return val;
}

function parseBool(val) {
  return val === "1" || val === "true";
}

// ---------------------------------------------------------------------------

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function getFontFamily(name) {
  return SYSTEM_FONTS[name] || `'${name}', sans-serif`;
}

function loadGoogleFont(name) {
  if (SYSTEM_FONTS[name]) return Promise.resolve();
  const id = "gf-" + name.replace(/\s+/g, "-").toLowerCase();
  if (document.getElementById(id)) return Promise.resolve();
  return new Promise((resolve) => {
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=" +
      encodeURIComponent(name) +
      ":wght@400;700&display=swap";
    link.onload = resolve;
    link.onerror = resolve;
    document.head.appendChild(link);
  });
}

function applySettings(s) {
  document.body.style.backgroundColor = s.backgroundColor;
  clockEl.style.color = s.textColor;
  clockEl.style.fontFamily = getFontFamily(s.fontFamily);
  clockEl.style.fontSize = s.fontSize + "px";
  clockEl.style.fontVariantNumeric = "tabular-nums";
}

function formatTime(s) {
  const now = new Date();

  const fmt = new Intl.DateTimeFormat("es", {
    timeZone: s.timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: s.showSeconds ? "2-digit" : undefined,
    hour12: s.hour12,
  });

  let str = fmt.format(now);

  if (s.showSeconds && s.showMilliseconds) {
    str += "." + String(Math.floor(now.getMilliseconds() / 100)).padStart(1, "0");
  }

  return str;
}

const clockEl = document.getElementById("clock");

// Query params overlay localStorage; they don't overwrite saved settings
const settings = applyQueryParams(loadSettings());

// Si la URL trajo parámetros, guardarlos para que la config quede persistente
if (window.location.search) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function tick() {
  clockEl.textContent = formatTime(settings);
  requestAnimationFrame(tick);
}

loadGoogleFont(settings.fontFamily).then(() => {
  applySettings(settings);
  requestAnimationFrame(tick);
});
