/**
 * 坐标系映射工具
 * ----------------------------------------------------------
 * 把数学坐标 (x, y) 与 SVG 视口坐标互相转换，
 * 保持 x / y 等比例缩放（等比），这样 ε / δ 的“正方形邻域”直觉才成立。
 */

export interface Viewport {
  /** SVG 逻辑宽度 */
  width: number;
  /** SVG 逻辑高度 */
  height: number;
  /** 视野中心（数学坐标） */
  cx: number;
  cy: number;
  /** 每单位数学量对应的像素数（x 与 y 共用，保持等比） */
  scale: number;
  /** 内边距 */
  pad: number;
}

export interface ScreenPoint {
  sx: number;
  sy: number;
}

/** 数学坐标 → 屏幕坐标 */
export function toScreen(vp: Viewport, x: number, y: number): ScreenPoint {
  return {
    sx: vp.width / 2 + (x - vp.cx) * vp.scale,
    sy: vp.height / 2 - (y - vp.cy) * vp.scale,
  };
}

/** 屏幕坐标 → 数学坐标 */
export function toMath(vp: Viewport, sx: number, sy: number): { x: number; y: number } {
  return {
    x: vp.cx + (sx - vp.width / 2) / vp.scale,
    y: vp.cy - (sy - vp.height / 2) / vp.scale,
  };
}

/** 当前视口 x 方向可见范围 */
export function visibleX(vp: Viewport): [number, number] {
  const half = vp.width / 2 / vp.scale;
  return [vp.cx - half, vp.cx + half];
}

/** 当前视口 y 方向可见范围 */
export function visibleY(vp: Viewport): [number, number] {
  const half = vp.height / 2 / vp.scale;
  return [vp.cy - half, vp.cy + half];
}

/**
 * 生成函数折线路径。遇到无定义 / 无穷大 / 跳出视野时断开，
 * 得到多段 path（对应 SVG 的 M…L… M…L…）。
 */
export function buildCurvePath(
  vp: Viewport,
  f: (x: number) => number,
  opts: {
    samples?: number;
    /** y 方向允许超出的余量，避免断线过于敏感 */
    yPadRatio?: number;
    /** 是否在 a 点附近加密采样 */
    densifyAround?: number;
  } = {},
): string {
  const samples = opts.samples ?? 900;
  const yPad = (opts.yPadRatio ?? 0.35) * (vp.height / vp.scale);
  const [x0, x1] = visibleX(vp);
  const [, yTop] = visibleY(vp);
  const yMax = yTop + yPad * 0.5;
  const yMin = -yTop - yPad * 0.5;
  const cxHint = opts.densifyAround;

  // 采样点：均匀 + 在 a 附近加密
  const xs: number[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    let x = x0 + (x1 - x0) * t;
    if (cxHint !== undefined) {
      // 轻微向 a 收缩，加密但保持单调
      const d = x - cxHint;
      x = cxHint + d * (0.35 + 0.65 * Math.abs(t - 0.5) * 2);
    }
    xs.push(x);
  }
  xs.sort((a, b) => a - b);

  let d = '';
  let penDown = false;
  for (const x of xs) {
    const y = f(x);
    const inside = Number.isFinite(y) && y >= yMin && y <= yMax;
    if (!inside) {
      penDown = false;
      continue;
    }
    const { sx, sy } = toScreen(vp, x, y);
    if (!penDown) {
      d += `M ${sx.toFixed(2)} ${sy.toFixed(2)} `;
      penDown = true;
    } else {
      d += `L ${sx.toFixed(2)} ${sy.toFixed(2)} `;
    }
  }
  return d.trim();
}

/** 生成“好看”的刻度间隔（1 / 2 / 5 × 10ⁿ） */
export function niceStep(rawStep: number): number {
  const exp = Math.floor(Math.log10(rawStep));
  const base = rawStep / 10 ** exp;
  let mult: number;
  if (base <= 1) mult = 1;
  else if (base <= 2) mult = 2;
  else if (base <= 5) mult = 5;
  else mult = 10;
  return mult * 10 ** exp;
}

/** 生成刻度值数组，覆盖 [lo, hi] */
export function ticks(lo: number, hi: number, target = 10): number[] {
  const step = niceStep((hi - lo) / target);
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 0.001; v += step) {
    out.push(Math.abs(v) < step * 1e-6 ? 0 : v);
  }
  return out;
}

/** 数值 → 简洁字符串（去浮点毛刺） */
export function fmt(v: number, digits = 3): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 1e5 || abs < 1e-4) return v.toExponential(2).replace('e', '×10^');
  const r = Number(v.toFixed(digits));
  return String(r);
}

/** 科学计数法 → 便于展示的形式，如 1.2×10⁻³ */
export function fmtCompact(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const abs = Math.abs(v);
  if (abs >= 0.001 && abs < 100000) {
    return String(Number(v.toFixed(Math.max(digits, 4))));
  }
  const exp = Math.floor(Math.log10(abs));
  const mant = v / 10 ** exp;
  const sup = String(exp)
    .split('')
    .map((c) => (c === '-' ? '⁻' : '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]))
    .join('');
  return `${mant.toFixed(digits)}×10${sup}`;
}
