export function formatInt(value: number): string {
  return Math.floor(value).toLocaleString('hu-HU');
}

const UNITS: Array<[number, string]> = [
  [1_000_000_000, ' milliárd'],
  [1_000_000, ' millió'],
  [1_000, ' ezer'],
];

export function formatShort(value: number): string {
  const abs = Math.abs(value);
  if (abs < 1000) return String(Math.floor(value));
  let index = UNITS.length - 1;
  for (;;) {
    const [divisor, suffix] = UNITS[index] ?? [1, ''];
    const scaled = value / divisor;
    const rounded = Math.abs(Number(scaled.toFixed(decimalsFor(scaled))));
    if (rounded < 1000 || index === 0) return displayNumber(scaled) + suffix;
    index -= 1;
  }
}

export function formatFt(value: number): string {
  const core = Math.abs(value) >= 1_000_000 ? formatShort(value) : formatInt(value);
  return core + ' Ft';
}

function decimalsFor(n: number): number {
  const abs = Math.abs(n);
  if (abs >= 100) return 0;
  if (abs >= 10) return 1;
  return 2;
}

function displayNumber(n: number): string {
  let s = n.toFixed(decimalsFor(n));
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return s.replace('.', ',');
}
