import { useEffect, useRef, useState } from 'react';
import { IconArrowRight, IconSpark, IconScope } from './Icons';
import { Button } from './ui';
import './Hero.css';

/** 首屏极简示意：一条曲线 + 正在呼吸的 ε 带与 δ 带 */
function HeroViz() {
  const [phase, setPhase] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    let t0 = performance.now();
    const loop = (t: number) => {
      const el = (t - t0) / 1000;
      setPhase(el);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  const W = 460;
  const H = 320;
  const cx = W / 2;
  const cy = H / 2;
  const s = 62; // px / unit

  // f(x) = 0.9x + 0.12x³，a = 0，L = 0
  const f = (x: number) => 0.9 * x + 0.12 * x ** 3;

  const eps = 0.62 + 0.34 * Math.sin(phase * 0.9);
  const delta = 0.62 + 0.34 * Math.sin(phase * 0.9 + 1.15);

  const path = (() => {
    let d = '';
    for (let i = 0; i <= 160; i++) {
      const x = -2.4 + (4.8 * i) / 160;
      const y = f(x);
      const px = cx + x * s;
      const py = cy - y * s;
      d += (i === 0 ? 'M ' : 'L ') + px.toFixed(1) + ' ' + py.toFixed(1) + ' ';
    }
    return d.trim();
  })();

  const epsTop = cy - eps * s;
  const epsBot = cy + eps * s;
  const delL = cx - delta * s;
  const delR = cx + delta * s;

  return (
    <svg className="hero-viz" viewBox={`0 0 ${W} ${H}`} aria-hidden focusable="false">
      <defs>
        <pattern id="hv-hatch" width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="6" stroke="var(--eps)" strokeWidth="1" opacity="0.42" />
        </pattern>
        <radialGradient id="hv-glow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="var(--ok)" stopOpacity="0.24" />
          <stop offset="100%" stopColor="var(--ok)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* 网格 */}
      <g className="hv-grid">
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
          <line key={`v${i}`} x1={cx + i * s} y1={0} x2={cx + i * s} y2={H} />
        ))}
        {[-2, -1, 0, 1, 2].map((i) => (
          <line key={`h${i}`} x1={0} y1={cy + i * s} x2={W} y2={cy + i * s} />
        ))}
      </g>

      <line className="hv-axis" x1={0} y1={cy} x2={W} y2={cy} />
      <line className="hv-axis" x1={cx} y1={0} x2={cx} y2={H} />

      {/* ε 带 */}
      <rect className="hv-eps" x={0} y={epsTop} width={W} height={epsBot - epsTop} fill="url(#hv-hatch)" />
      <line className="hv-eps-line" x1={0} y1={epsTop} x2={W} y2={epsTop} />
      <line className="hv-eps-line" x1={0} y1={epsBot} x2={W} y2={epsBot} />

      {/* δ 带 */}
      <rect className="hv-del" x={delL} y={0} width={delR - delL} height={H} />
      <line className="hv-del-line" x1={delL} y1={0} x2={delL} y2={H} />
      <line className="hv-del-line" x1={delR} y1={0} x2={delR} y2={H} />

      {/* 交叠区 */}
      <rect className="hv-intersect" x={delL} y={epsTop} width={delR - delL} height={epsBot - epsTop} />
      <ellipse cx={cx} cy={cy} rx={(delR - delL) / 2 + 16} ry={(epsBot - epsTop) / 2 + 16} fill="url(#hv-glow)" />

      {/* 曲线 */}
      <path className="hv-curve-halo" d={path} />
      <path className="hv-curve" d={path} />

      {/* 空心圆心 */}
      <circle className="hv-hole" cx={cx} cy={cy} r={5.5} />

      {/* 标注 */}
      <text className="hv-lab hv-lab-eps" x={14} y={epsTop - 8}>
        ε
      </text>
      <text className="hv-lab hv-lab-del" x={delR + 8} y={26}>
        δ
      </text>
      <text className="hv-lab hv-lab-a" x={cx + 8} y={cy - 8}>
        a
      </text>
    </svg>
  );
}

export default function Hero({ onJump }: { onJump: (id: string) => void }) {
  return (
    <header className="hero" id="top">
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="hero-brand">
            <span className="hero-brand-mark" aria-hidden>
              <span className="mth">ε</span>
              <span className="hero-brand-slash">/</span>
              <span className="mth">δ</span>
            </span>
            <span className="hero-brand-text">ε-δ 实验室</span>
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line">极限不是“越来越接近”</span>
            <span className="hero-title-line">
              而是一场<span className="hero-title-em">关于任意小的博弈</span>
            </span>
          </h1>

          <p className="hero-lede">
            高等数学最劝退的一页，往往就是 <span className="mth g-eps">ε</span>-
            <span className="mth g-del">δ</span> 定义。这个实验室把它变成可拖动的图形：
            你给定误差容限 <span className="mth g-eps">ε</span>，再亲手找出一个足够小的{' '}
            <span className="mth g-del">δ</span>，让函数曲线乖乖留在允许的带子里。
          </p>

          <div className="hero-actions">
            <Button variant="solid" icon={<IconArrowRight />} onClick={() => onJump('lab')}>
              开始动手实验
            </Button>
            <Button variant="outline" icon={<IconScope />} onClick={() => onJump('definition')}>
              先看定义拆解
            </Button>
          </div>

          <ul className="hero-facts">
            <li>
              <span className="hero-fact-k mth g-eps">ε</span>
              <span className="hero-fact-v">你允许的输出误差</span>
            </li>
            <li>
              <span className="hero-fact-k mth g-del">δ</span>
              <span className="hero-fact-v">你需要的靠近半径</span>
            </li>
            <li>
              <span className="hero-fact-k">
                <IconSpark />
              </span>
              <span className="hero-fact-v">6 个函数 · 可交互反例</span>
            </li>
          </ul>
        </div>

        <div className="hero-art">
          <div className="hero-art-frame">
            <HeroViz />
            <div className="hero-art-caption">
              <span className="mth g-del">δ</span> 带（竖直）× <span className="mth g-eps">ε</span> 带（水平）的交叠区
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
