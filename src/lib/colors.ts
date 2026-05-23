const DEFAULT_ACCENT_COLOR = "#D71D29";

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, value));
}

export function normalizeAccentColor(color?: string | null) {
  const normalized = color?.trim();
  if (!normalized) {
    return DEFAULT_ACCENT_COLOR;
  }

  const expanded = normalized.startsWith("#") ? normalized : `#${normalized}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(expanded)) {
    return DEFAULT_ACCENT_COLOR;
  }

  return expanded.toUpperCase();
}

export function hexToRgba(color: string, alpha: number) {
  const normalized = normalizeAccentColor(color);
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);

  return `rgba(${clampChannel(red)}, ${clampChannel(green)}, ${clampChannel(blue)}, ${Math.max(0, Math.min(alpha, 1))})`;
}

export function getContrastTextColor(color: string) {
  const normalized = normalizeAccentColor(color);
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * red) + (0.587 * green) + (0.114 * blue);

  return luminance > 186 ? "#111827" : "#FFFFFF";
}

export { DEFAULT_ACCENT_COLOR };
