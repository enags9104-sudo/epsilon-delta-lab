/**
 * ε-δ 数学核心引擎
 * ----------------------------------------------------------
 * 集中放置所有函数模型、极限计算与 ε-δ 判定逻辑，
 * 供交互画布 / 习题 / 反例演示等多个模块复用。
 */

export interface FunctionModel {
  id: string;
  /** 显示用函数式（纯文本，配合 mathit 排版） */
  label: string;
  /** 一句话说明，面向初学者 */
  note: string;
  /** 自变量趋近点 a */
  a: number;
  /** 极限值 L（若极限存在） */
  L: number;
  /** 函数取值；在 x = a 处可能无定义或取到别的值 */
  f: (x: number) => number;
  /** 该点极限是否存在 */
  limitExists: boolean;
  /** 曲线绘制范围（相对 a 的偏移），用于裁剪渐近线等 */
  domain?: (x: number) => boolean;
  /** y 轴建议视野半径，用于自动取景 */
  ySpan: number;
  /** 教学提示 */
  insight: string;
}

/** 数值安全：过滤 NaN / Infinity，便于绘曲线时断线 */
export function finite(y: number): number | null {
  return Number.isFinite(y) ? y : null;
}

export const FUNCTIONS: FunctionModel[] = [
  {
    id: 'linear',
    label: 'f(x) = 2x + 1',
    note: '最简单的连续函数。极限值恰好等于函数值。',
    a: 2,
    L: 5,
    f: (x) => 2 * x + 1,
    limitExists: true,
    ySpan: 3.2,
    insight: '连续函数最友好：把 δ 取成 ε/2 就够了，因为斜率是 2。',
  },
  {
    id: 'quadratic',
    label: 'f(x) = x²  (a = 2)',
    note: '曲线在 a 附近越走越陡，δ 与 ε 的关系不再是常数倍。',
    a: 2,
    L: 4,
    f: (x) => x * x,
    limitExists: true,
    ySpan: 3.4,
    insight: 'x² 在 a=2 附近变化越来越快，所以同样的 ε 需要更小的 δ。',
  },
  {
    id: 'hole',
    label: 'f(x) = (x² − 4) / (x − 2)',
    note: '在 x = 2 处没有定义，但左右两侧都逼近 4。这是极限存在的经典陷阱。',
    a: 2,
    L: 4,
    f: (x) => (x * x - 4) / (x - 2),
    limitExists: true,
    ySpan: 3.4,
    insight: 'a 点本身可以“挖空”。ε-δ 定义根本不关心 f(a)，只关心 0 < |x−a| < δ。',
  },
  {
    id: 'step',
    label: 'f(x) = ⌊x⌋  (取整)',
    note: '在整数点跳跃。跃度 1，无论 ε 多小都无法夹住。',
    a: 2,
    L: 2,
    f: (x) => Math.floor(x),
    limitExists: false,
    ySpan: 2.2,
    insight: '取整函数在整数点跳跃：左侧永远低 1。找 δ 会失败，极限不存在。',
  },
  {
    id: 'jump',
    label: '分段函数 (跳跃间断)',
    note: '左极限 3、右极限 5，两者不等，所以 a 点极限不存在。',
    a: 2,
    L: 0,
    f: (x) => (x < 2 ? 3 : 5),
    limitExists: false,
    ySpan: 3.4,
    insight: '左右极限不同 ⇒ 不存在统一的 L。ε 小于 1 时永远找不到 δ。',
  },
  {
    id: 'highfreq',
    label: 'f(x) = sin(1 / (x − 2))',
    note: '在 a 附近无限振荡。任何 δ 邻域内函数值都扫过 [−1, 1]。',
    a: 2,
    L: 0,
    f: (x) => Math.sin(1 / (x - 2)),
    limitExists: false,
    ySpan: 1.4,
    insight: '越靠近 a 振荡越剧烈，δ 再小都躲不开：这是极限不存在的振荡型反例。',
  },
];

export const FUNCTIONS_BY_ID = Object.fromEntries(
  FUNCTIONS.map((m) => [m.id, m]),
) as Record<string, FunctionModel>;

/** 给定点 a 与 δ，返回考察区间 [a−δ, a+δ]（排除 a 本身由调用方处理） */
export function neighborhood(a: number, delta: number): [number, number] {
  return [a - delta, a + delta];
}

export interface SweepResult {
  /** (a−δ, a+δ) 内尤其排除 a 后，|f(x)−L| 的最大值 */
  maxDeviation: number;
  /** 取得最大偏差的位置 */
  argmax: number;
  /** 是否满足 |f(x)−L| < ε 对所有 0<|x−a|<δ 成立 */
  satisfied: boolean;
  /** 采样点数量，用于置信提示 */
  samples: number;
}

/**
 * 在 (a−δ, a+δ) 上密集采样，求 |f(x) − L| 的上确界近似。
 * 采样刻意避开 a 点（ε-δ 定义要求 0 < |x − a|），
 * 并在 a 附近加密，以捕捉振荡型反例。
 */
export function sweep(
  model: FunctionModel,
  delta: number,
  epsilon: number,
  samples = 4001,
): SweepResult {
  const { a, L, f } = model;
  let maxDeviation = 0;
  let argmax = a;
  const half = samples >> 1;

  for (let i = -half; i <= half; i++) {
    if (i === 0) continue;
    // 在 [−δ, δ] 上采用立方分布，令靠近 a 的采样更密
    const s = i / half; // −1 … 1
    const offset = Math.sign(s) * Math.abs(s) ** 3 * delta;
    const x = a + offset;
    if (x === a) continue;
    const y = f(x);
    if (!Number.isFinite(y)) continue;
    const dev = Math.abs(y - L);
    if (dev > maxDeviation) {
      maxDeviation = dev;
      argmax = x;
    }
  }
  return { maxDeviation, argmax, satisfied: maxDeviation < epsilon, samples };
}

/**
 * 对给定 ε 自动搜索一个可行的 δ（若存在）。
 * 采用向下逼近：从较大的 δ 开始，二分收敛到 |f−L|<ε 的临界点。
 * 对振荡型函数该搜索会自然失败（返回 null），正是我们希望展示的。
 */
export function findDelta(
  model: FunctionModel,
  epsilon: number,
  searchRange: number,
  opts: { strict?: boolean } = {},
): number | null {
  const strict = opts.strict ?? true;
  const margin = strict ? 0.999 : 1;

  const works = (delta: number): boolean => {
    const r = sweep(model, delta, Infinity, 1201);
    return r.maxDeviation < epsilon * margin;
  };

  // 几何下降扫描：等差粗扫会在 ε 很小时（临界 δ 小于一个步长）漏判，
  // 改为每次减半，保证任意小的临界 δ 都能被覆盖
  let good = -1;
  let bad = -1;
  let d = searchRange;
  for (let i = 0; i < 60 && d > 1e-12; i++) {
    if (works(d)) {
      good = d;
      break;
    }
    bad = d;
    d /= 2;
  }

  if (good < 0) return null; // 每个尺度都不合格 ⇒ 极限不存在
  if (bad < 0) return good; // 整个搜索范围都合格

  // 在 (good, bad] 之间二分细化，逼近临界 δ
  for (let i = 0; i < 60 && bad - good > 1e-12; i++) {
    const mid = (good + bad) / 2;
    if (works(mid)) good = mid;
    else bad = mid;
  }
  return good;
}
