/** Minimal, dependency-free SVG chart generation for the audit report. */

const FONT = "font-family:Arial,Helvetica,sans-serif";

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export function barChart(options: {
  title: string;
  subtitle: string;
  data: BarDatum[];
  width?: number;
  barHeight?: number;
  valueFormat?: (v: number) => string;
  maxValue?: number;
}): string {
  const width = options.width ?? 760;
  const barHeight = options.barHeight ?? 28;
  const gap = 10;
  const labelWidth = 200;
  const chartWidth = width - labelWidth - 90;
  const maxValue = options.maxValue ?? Math.max(...options.data.map((d) => d.value), 1e-9);
  const format = options.valueFormat ?? ((v: number) => v.toFixed(2));
  const top = 62;
  const height = top + options.data.length * (barHeight + gap) + 20;

  const bars = options.data
    .map((d, i) => {
      const y = top + i * (barHeight + gap);
      const barWidth = maxValue > 0 ? Math.max(1, (Math.abs(d.value) / maxValue) * chartWidth) : 1;
      const color = d.color ?? "#3b6ea5";
      return `
    <text x="${labelWidth - 10}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="12" fill="#1c2b3a" style="${FONT}">${escapeXml(d.label)}</text>
    <rect x="${labelWidth}" y="${y}" width="${barWidth.toFixed(1)}" height="${barHeight}" fill="${color}" rx="3" />
    <text x="${labelWidth + barWidth + 8}" y="${y + barHeight / 2 + 4}" font-size="12" fill="#1c2b3a" style="${FONT}">${escapeXml(format(d.value))}</text>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff" />
  <text x="20" y="26" font-size="17" font-weight="700" fill="#0d1b2a" style="${FONT}">${escapeXml(options.title)}</text>
  <text x="20" y="44" font-size="12" fill="#5a6b7a" style="${FONT}">${escapeXml(options.subtitle)}</text>
  ${bars}
</svg>`;
}

export interface GroupedBarSeries {
  name: string;
  color: string;
  values: number[];
}

export function groupedBarChart(options: {
  title: string;
  subtitle: string;
  categories: string[];
  series: GroupedBarSeries[];
  width?: number;
  height?: number;
  valueFormat?: (v: number) => string;
}): string {
  const width = options.width ?? 820;
  const height = options.height ?? 380;
  const marginLeft = 60;
  const marginBottom = 90;
  const marginTop = 60;
  const plotWidth = width - marginLeft - 30;
  const plotHeight = height - marginTop - marginBottom;
  const allValues = options.series.flatMap((s) => s.values);
  const maxValue = Math.max(...allValues, 1e-9);
  const format = options.valueFormat ?? ((v: number) => v.toFixed(1));
  const groupWidth = plotWidth / options.categories.length;
  const barWidth = (groupWidth * 0.8) / options.series.length;

  const bars = options.categories
    .map((category, catIndex) => {
      const groupX = marginLeft + catIndex * groupWidth + groupWidth * 0.1;
      const seriesBars = options.series
        .map((series, seriesIndex) => {
          const value = series.values[catIndex] ?? 0;
          const barHeight = (value / maxValue) * plotHeight;
          const x = groupX + seriesIndex * barWidth;
          const y = marginTop + plotHeight - barHeight;
          return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barWidth - 2).toFixed(1)}" height="${barHeight.toFixed(1)}" fill="${series.color}" />
      <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" font-size="9" text-anchor="middle" fill="#1c2b3a" style="${FONT}">${escapeXml(format(value))}</text>`;
        })
        .join("");
      const labelX = groupX + (groupWidth * 0.8) / 2;
      return `${seriesBars}
    <text x="${labelX.toFixed(1)}" y="${(marginTop + plotHeight + 16).toFixed(1)}" font-size="11" text-anchor="middle" fill="#1c2b3a" style="${FONT}" transform="rotate(20 ${labelX.toFixed(1)} ${(marginTop + plotHeight + 16).toFixed(1)})">${escapeXml(category)}</text>`;
    })
    .join("");

  const legend = options.series
    .map(
      (series, i) =>
        `<rect x="${marginLeft + i * 140}" y="${height - 24}" width="12" height="12" fill="${series.color}" /><text x="${marginLeft + i * 140 + 18}" y="${height - 14}" font-size="11" fill="#1c2b3a" style="${FONT}">${escapeXml(series.name)}</text>`,
    )
    .join("");

  const axisLine = `<line x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${marginLeft + plotWidth}" y2="${marginTop + plotHeight}" stroke="#c7d0d8" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff" />
  <text x="20" y="26" font-size="17" font-weight="700" fill="#0d1b2a" style="${FONT}">${escapeXml(options.title)}</text>
  <text x="20" y="44" font-size="12" fill="#5a6b7a" style="${FONT}">${escapeXml(options.subtitle)}</text>
  ${axisLine}
  ${bars}
  ${legend}
</svg>`;
}

export function scatterChart(options: {
  title: string;
  subtitle: string;
  points: Array<{ x: number; y: number; color?: string }>;
  xLabel: string;
  yLabel: string;
  width?: number;
  height?: number;
}): string {
  const width = options.width ?? 620;
  const height = options.height ?? 480;
  const marginLeft = 60;
  const marginBottom = 50;
  const marginTop = 60;
  const marginRight = 30;
  const plotWidth = width - marginLeft - marginRight;
  const plotHeight = height - marginTop - marginBottom;
  const xs = options.points.map((p) => p.x);
  const ys = options.points.map((p) => p.y);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const scaleX = (x: number) => marginLeft + ((x - xMin) / Math.max(1e-9, xMax - xMin)) * plotWidth;
  const scaleY = (y: number) =>
    marginTop + plotHeight - ((y - yMin) / Math.max(1e-9, yMax - yMin)) * plotHeight;

  const dots = options.points
    .map(
      (p) =>
        `<circle cx="${scaleX(p.x).toFixed(1)}" cy="${scaleY(p.y).toFixed(1)}" r="3" fill="${p.color ?? "#3b6ea5"}" fill-opacity="0.55" />`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="#ffffff" />
  <text x="20" y="26" font-size="17" font-weight="700" fill="#0d1b2a" style="${FONT}">${escapeXml(options.title)}</text>
  <text x="20" y="44" font-size="12" fill="#5a6b7a" style="${FONT}">${escapeXml(options.subtitle)}</text>
  <line x1="${marginLeft}" y1="${marginTop + plotHeight}" x2="${marginLeft + plotWidth}" y2="${marginTop + plotHeight}" stroke="#c7d0d8" />
  <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${marginTop + plotHeight}" stroke="#c7d0d8" />
  <text x="${marginLeft + plotWidth / 2}" y="${height - 12}" font-size="12" text-anchor="middle" fill="#1c2b3a" style="${FONT}">${escapeXml(options.xLabel)}</text>
  <text x="16" y="${marginTop + plotHeight / 2}" font-size="12" text-anchor="middle" fill="#1c2b3a" style="${FONT}" transform="rotate(-90 16 ${marginTop + plotHeight / 2})">${escapeXml(options.yLabel)}</text>
  ${dots}
</svg>`;
}
