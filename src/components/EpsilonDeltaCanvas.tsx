import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import type { FunctionModel } from '../lib/math';
import { sweep, findDelta } from '../lib/math';
import {
  type Viewport,
  buildCurvePath,
  toScreen,
  toMath,
  visibleX,
  visibleY,
  ticks,
  fmtCompact,
} from '../lib/plot';
import './EpsilonDeltaCanvas.css';

export interface CanvasProps {
  model: FunctionModel;
  epsilon: number;
  delta: number;
  /** δ 是否由系统自动搜索锁定 */
  deltaLocked: boolean;
  /** 拖拽 ε 或 δ 的回调 */
  onEpsilonChange: (v: number) => void;
  onDeltaChange: (v: number) => void;
  onDeltaUnlock: () => void;
  /** 显示“自动搜索 δ”的动画进度 */
  searching: boolean;
  /** 是否处于对比模式（显示失败的反例） */
  showCounterexample: boolean;
  /** 主题强调：高亮哪一侧 */
  highlight: 'none' | 'eps' | 'del';
  /** 是否显示钟形/邻域网格辅助 */
  showCoords: boolean;
}

const VW = 720;
const VH = 520;
const PAD = 40;

/** ε / δ 的取值下限与上限（对数刻度） */
export const EPS_RANGE: [number, number] = [0.03, 1.6];
export const DEL_RANGE: [number, number] = [0.006, 1.5];

const LOG_EPS_MIN = Math.log(EPS_RANGE[0]);
const LOG_EPS_MAX = Math.log(EPS_RANGE[1]);
const LOG_DEL_MIN = Math.log(DEL_RANGE[0]);
const LOG_DEL_MAX = Math.log(DEL_RANGE[1]);

export const epsToSlider = (v: number) =>
  (Math.log(Math.max(v, EPS_RANGE[0])) - LOG_EPS_MIN) / (LOG_EPS_MAX - LOG_EPS_MIN);
export const sliderToEps = (t: number) => Math.exp(LOG_EPS_MIN + t * (LOG_EPS_MAX - LOG_EPS_MIN));
export const delToSlider = (v: number) =>
  (Math.log(Math.max(v, DEL_RANGE[0])) - LOG_DEL_MIN) / (LOG_DEL_MAX - LOG_DEL_MIN);
export const sliderToDel = (t: number) => Math.exp(LOG_DEL_MIN + t * (LOG_DEL_MAX - LOG_DEL_MIN));

export default function EpsilonDeltaCanvas({
  model,
  epsilon,
  delta,
  deltaLocked,
  onEpsilonChange,
  onDeltaChange,
  onDeltaUnlock,
  searching,
  showCounterexample,
  highlight,
  showCoords,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragKind, setDragKind] = useState<null | 'eps' | 'del'>(null);

  // ---- 视野：以 (a, L) 为中心，等比缩放 ----
  // 采样等比例缩放，让 ε/δ 的“方形邻域”直觉成立。
  // 缩放由纵向视野（含最大 ε 余量）决定；横向宽度随之自动确定。
  const vp: Viewport = useMemo(() => {
    const epsMax = EPS_RANGE[1]; // 1.6
    // 纵向需要容纳 ±(ySpan + epsMax)，并留出把手与标注的余量
    const yNeed = model.ySpan + epsMax * 1.35;
    const scale = Math.min(
      (VH - PAD * 2) / (yNeed * 2),
      (VW - PAD * 2) / (yNeed * 2 * 2.15),
    );
    return {
      width: VW,
      height: VH,
      cx: model.a,
      cy: model.limitExists ? model.L : (model.f(model.a + 0.9) + model.f(model.a - 0.9)) / 2 || 0,
      scale,
      pad: PAD,
    };
  }, [model]);

  // ---- 实时判定 ----
  const result = useMemo(
    () => sweep(model, delta, epsilon, 3001),
    [model, delta, epsilon],
  );

  // ---- 自动搜索得到的临界 δ ----
  const autoDelta = useMemo(
    () => findDelta(model, epsilon, 1.5),
    [model, epsilon],
  );

  // ---- 曲线路径 ----
  const curvePath = useMemo(
    () => buildCurvePath(vp, model.f, { samples: 1400, densifyAround: model.a }),
    [vp, model],
  );

  // ---- 坐标轴刻度 ----
  const [xLo, xHi] = visibleX(vp);
  const [, yHi] = visibleY(vp);
  const xTicks = ticks(xLo, xHi, 8);
  const yTicks = ticks(-yHi, yHi, 7);

  const sy0 = toScreen(vp, 0, 0).sy;
  const sx0 = toScreen(vp, 0, 0).sx;

  // ---- 关键几何 ----
  // ε 带的中心高度：极限存在时取 L；不存在时取视野中心
  const centerY = model.limitExists ? model.L : vp.cy;
  const center = toScreen(vp, model.a, centerY);
  const epsTop = toScreen(vp, model.a, centerY + epsilon);
  const epsBot = toScreen(vp, model.a, centerY - epsilon);
  const delLeft = toScreen(vp, model.a - delta, 0);
  const delRight = toScreen(vp, model.a + delta, 0);

  // ε 拖拽把手位置：贴在 ε 带右侧，但不越出画面
  const epsHandleX = Math.min(VW - 16, Math.max(delRight.sx + 18, sx0 + 26));
  // δ 拖拽把手位置：贴近底部，避开坐标轴与 a 标注
  const delHandleY = VH - 34;

  // ---- 拖拽交互 ----
  const dragRef = useRef({ kind: null as null | 'eps' | 'del' });

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const svg = svgRef.current;
      if (!svg || !dragRef.current.kind) return;
      const rect = svg.getBoundingClientRect();
      const sx = ((e.clientX - rect.left) / rect.width) * VW;
      const sy = ((e.clientY - rect.top) / rect.height) * VH;
      const m = toMath(vp, sx, sy);

      if (dragRef.current.kind === 'eps') {
        const raw = Math.abs(m.y - centerY);
        const t = Math.max(0, Math.min(1, epsToSlider(Math.max(raw, EPS_RANGE[0]))));
        onEpsilonChange(sliderToEps(t));
      } else {
        const raw = Math.abs(m.x - model.a);
        const t = Math.max(0, Math.min(1, delToSlider(Math.max(raw, DEL_RANGE[0]))));
        onDeltaChange(sliderToDel(t));
      }
    },
    [vp, model, centerY, onEpsilonChange, onDeltaChange],
  );

  const endDrag = useCallback(() => {
    dragRef.current.kind = null;
    setDragKind(null);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', endDrag);
  }, [handlePointerMove]);

  const startDrag = (kind: 'eps' | 'del') => (e: React.PointerEvent) => {
    e.preventDefault();
    dragRef.current.kind = kind;
    setDragKind(kind);
    if (kind === 'del' && deltaLocked) onDeltaUnlock();
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endDrag);
  };

  useEffect(() => () => endDrag(), [endDrag]);

  const satisfied = result.satisfied;
  const verdictColor = satisfied ? 'var(--ok)' : 'var(--eps)';

  return (
    <div className="edc-wrap">
      <svg
        ref={svgRef}
        className="edc-svg"
        viewBox={`0 0 ${VW} ${VH}`}
        role="img"
        aria-label={`函数 ${model.label} 在 x=${model.a} 附近的 ε-δ 邻域示意图，当前 ε=${epsilon.toFixed(
          3,
        )}，δ=${delta.toFixed(3)}`}
        data-dragging={dragKind ?? 'none'}
      >
        <defs>
          <clipPath id="edc-plot-clip">
            <rect x="0" y="0" width={VW} height={VH} />
          </clipPath>
          <filter id="edc-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#16202e" floodOpacity="0.14" />
          </filter>
          <pattern id="edc-hatch-eps" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="7" stroke="var(--eps)" strokeWidth="1.1" opacity="0.5" />
          </pattern>
        </defs>

        <g clipPath="url(#edc-plot-clip)">
          {/* ---------- 网格 ---------- */}
          <g className="edc-grid">
            {xTicks.map((t) => {
              const { sx } = toScreen(vp, t, 0);
              return <line key={`gx${t}`} x1={sx} y1={0} x2={sx} y2={VH} />;
            })}
            {yTicks.map((t) => {
              const { sy } = toScreen(vp, 0, t);
              return <line key={`gy${t}`} x1={0} y1={sy} x2={VW} y2={sy} />;
            })}
          </g>

          {/* ---------- 坐标轴 ---------- */}
          <g className="edc-axis">
            <line x1={0} y1={sy0} x2={VW} y2={sy0} />
            <line x1={sx0} y1={0} x2={sx0} y2={VH} />
          </g>

          {/* ================= ε 水平带 ================= */}
          <g
            className={`edc-band edc-band-eps ${highlight === 'eps' ? 'is-hot' : ''} ${
              satisfied ? 'is-pass' : 'is-fail'
            }`}
            style={{ '--band-color': 'var(--eps)' } as React.CSSProperties}
          >
            <rect
              x={0}
              y={epsTop.sy}
              width={VW}
              height={Math.max(1, epsBot.sy - epsTop.sy)}
              fill="url(#edc-hatch-eps)"
              opacity={0.55}
            />
            <line className="edc-band-line" x1={0} y1={epsTop.sy} x2={VW} y2={epsTop.sy} />
            <line className="edc-band-line" x1={0} y1={epsBot.sy} x2={VW} y2={epsBot.sy} />
          </g>

          {/* ================= δ 竖直带 ================= */}
          <g
            className={`edc-band edc-band-del ${highlight === 'del' ? 'is-hot' : ''}`}
            style={{ '--band-color': 'var(--del)' } as React.CSSProperties}
          >
            <rect
              x={delLeft.sx}
              y={0}
              width={Math.max(1, delRight.sx - delLeft.sx)}
              height={VH}
              fill="var(--del-band)"
            />
            <line className="edc-band-line" x1={delLeft.sx} y1={0} x2={delLeft.sx} y2={VH} />
            <line className="edc-band-line" x1={delRight.sx} y1={0} x2={delRight.sx} y2={VH} />
          </g>

          {/* ============ 关键交点：δ 带 ∩ ε 带 ============ */}
          <rect
            className={`edc-intersect ${satisfied ? 'is-pass' : 'is-fail'}`}
            x={delLeft.sx}
            y={epsTop.sy}
            width={Math.max(1, delRight.sx - delLeft.sx)}
            height={Math.max(1, epsBot.sy - epsTop.sy)}
            style={{ '--band-color': satisfied ? 'var(--ok)' : 'var(--eps)' } as React.CSSProperties}
          />

          {/* ---------- 函数曲线 ---------- */}
          <path className="edc-curve-halo" d={curvePath} />
          <path className="edc-curve" d={curvePath} />

          {/* 偏差峰值标记 —— 说明“为什么失败/刚好通过” */}
          {Number.isFinite(result.argmax) && result.maxDeviation > 0 && (
            <g className="edc-argmax">
              {(() => {
                const p = toScreen(vp, result.argmax, model.f(result.argmax));
                const base = centerY;
                const bp = toScreen(vp, result.argmax, base);
                return (
                  <>
                    <line x1={p.sx} y1={bp.sy} x2={p.sx} y2={p.sy} strokeDasharray="3 3" />
                    <circle cx={p.sx} cy={p.sy} r={4.2} fill={verdictColor} />
                    <circle cx={p.sx} cy={p.sy} r={8} fill="none" stroke={verdictColor} strokeWidth="1.2" opacity="0.4" />
                  </>
                );
              })()}
            </g>
          )}

          {/* ---------- a 点的空心圆（强调 f(a) 无关） ---------- */}
          <g className="edc-hole">
            {(() => {
              const yAtA = model.f(model.a);
              const showHole = !Number.isFinite(yAtA) || Math.abs(yAtA - (model.limitExists ? model.L : yAtA)) > 1e-9;
              if (!showHole) {
                // 实心点：函数在 a 有定义且值合理
                const p = toScreen(vp, model.a, yAtA);
                if (Number.isFinite(p.sy)) {
                  return <circle cx={p.sx} cy={p.sy} r={5.5} className="edc-dot-solid" />;
                }
                return null;
              }
              const p = toScreen(vp, model.a, model.L);
              return (
                <>
                  <circle cx={p.sx} cy={p.sy} r={6} className="edc-dot-hollow" />
                  <circle cx={p.sx} cy={p.sy} r={11} className="edc-dot-hollow-ring" />
                </>
              );
            })()}
          </g>

          {/* 目标点水平/垂直引导线 */}
          <g className="edc-guide">
            <line x1={sx0} y1={center.sy} x2={VW} y2={center.sy} strokeDasharray="2 5" />
            <line x1={center.sx} y1={sy0} x2={center.sx} y2={0} strokeDasharray="2 5" />
          </g>

          {/* ---------- 坐标刻度标签 ---------- */}
          {showCoords && (
            <g className="edc-tick-label">
              {xTicks.map((t) => {
                const { sx } = toScreen(vp, t, 0);
                if (Math.abs(t - model.a) < 1e-9) return null;
                return (
                  <text key={`tx${t}`} x={sx} y={sy0 + 15} textAnchor="middle">
                    {Math.abs(t) < 1e-9 ? 'O' : String(Number(t.toFixed(2)))}
                  </text>
                );
              })}
              {yTicks.map((t) => {
                const { sy } = toScreen(vp, 0, t);
                if (Math.abs(t) < 1e-9) return null;
                return (
                  <text key={`ty${t}`} x={sx0 - 8} y={sy + 3.5} textAnchor="end">
                    {String(Number(t.toFixed(2)))}
                  </text>
                );
              })}
            </g>
          )}

          {/* ---------- a 与 L 的标注 ---------- */}
          <g className="edc-marker-label">
            <g className="edc-mark-a">
              <line x1={center.sx} y1={sy0} x2={center.sx} y2={sy0 + 6} />
              <text x={center.sx} y={sy0 - 10} textAnchor="middle" className="mth">
                a = {String(Number(model.a.toFixed(2)))}
              </text>
            </g>
            {model.limitExists && (
              <g className="edc-mark-l">
                <line x1={sx0} y1={center.sy} x2={sx0 - 6} y2={center.sy} />
                <text x={sx0 - 10} y={center.sy - 7} textAnchor="end" className="mth">
                  L = {String(Number(model.L.toFixed(2)))}
                </text>
              </g>
            )}
          </g>

          {/* ---------- ε 左侧括号标注 ---------- */}
          <g className="edc-bracket edc-bracket-eps">
            <path
              d={`M ${PAD - 14} ${epsTop.sy} L ${PAD - 14} ${epsBot.sy}`}
            />
            <text
              x={PAD - 20}
              y={(epsTop.sy + epsBot.sy) / 2 + 4}
              textAnchor="end"
            >
              ε
            </text>
          </g>
          {/* ---------- δ 底部括号标注 ---------- */}
          <g className="edc-bracket edc-bracket-del">
            <path d={`M ${delLeft.sx} ${VH - 14} L ${delRight.sx} ${VH - 14}`} />
            <text x={center.sx} y={VH - 20} textAnchor="middle">
              δ
            </text>
          </g>
        </g>

        {/* ================= 拖拽把手（超出裁剪区） ================= */}
        <g
          className={`edc-handle edc-handle-eps ${dragKind === 'eps' ? 'is-drag' : ''}`}
          onPointerDown={startDrag('eps')}
          role="slider"
          aria-label="调节 ε 大小"
          aria-valuemin={EPS_RANGE[0]}
          aria-valuemax={EPS_RANGE[1]}
          aria-valuenow={Number(epsilon.toFixed(3))}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
              onEpsilonChange(sliderToEps(Math.min(1, epsToSlider(epsilon) + 0.04)));
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
              onEpsilonChange(sliderToEps(Math.max(0, epsToSlider(epsilon) - 0.04)));
            }
          }}
          data-testid="handle-eps"
        >
          {/* 透明命中区，扩大可拖拽范围 */}
          <rect
            className="edc-handle-hit"
            x={epsHandleX - 17}
            y={epsTop.sy - 17}
            width={34}
            height={Math.max(34, epsBot.sy - epsTop.sy + 34)}
          />
          <circle cx={epsHandleX} cy={epsTop.sy} r={9} className="edc-handle-dot" />
          <circle cx={epsHandleX} cy={epsBot.sy} r={9} className="edc-handle-dot" />
          <line
            x1={epsHandleX}
            y1={epsTop.sy}
            x2={epsHandleX}
            y2={epsBot.sy}
            className="edc-handle-spine"
          />
          <text x={epsHandleX + 15} y={(epsTop.sy + epsBot.sy) / 2 + 4} className="edc-handle-txt">
            ε
          </text>
        </g>

        <g
          className={`edc-handle edc-handle-del ${dragKind === 'del' ? 'is-drag' : ''} ${
            deltaLocked ? 'is-locked' : ''
          }`}
          onPointerDown={startDrag('del')}
          role="slider"
          aria-label="调节 δ 大小"
          aria-valuemin={DEL_RANGE[0]}
          aria-valuemax={DEL_RANGE[1]}
          aria-valuenow={Number(delta.toFixed(4))}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
              onDeltaChange(sliderToDel(Math.min(1, delToSlider(delta) + 0.04)));
            } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
              onDeltaChange(sliderToDel(Math.max(0, delToSlider(delta) - 0.04)));
            }
          }}
          data-testid="handle-del"
        >
          {/* 透明命中区，扩大可拖拽范围 */}
          <rect
            className="edc-handle-hit"
            x={Math.min(delLeft.sx, delRight.sx) - 17}
            y={delHandleY - 17}
            width={Math.abs(delRight.sx - delLeft.sx) + 34}
            height={34}
          />
          <circle cx={delLeft.sx} cy={delHandleY} r={9} className="edc-handle-dot" />
          <circle cx={delRight.sx} cy={delHandleY} r={9} className="edc-handle-dot" />
          <line
            x1={delLeft.sx}
            y1={delHandleY}
            x2={delRight.sx}
            y2={delHandleY}
            className="edc-handle-spine"
          />
          <text x={center.sx} y={delHandleY - 16} textAnchor="middle" className="edc-handle-txt">
            δ {deltaLocked ? '·锁定' : ''}
          </text>
        </g>
      </svg>

      {/* ---------- 悬浮判读浮层 ---------- */}
      <div className="edc-readout" data-state={satisfied ? 'pass' : 'fail'}>
        <div className="edc-readout-main">
          {searching ? (
            <span className="edc-verdict edc-verdict-searching">
              正在搜索最小的 δ…
            </span>
          ) : satisfied ? (
            <span className="edc-verdict edc-verdict-pass">
              邻域被夹住了：所有 0 &lt; |x−a| &lt; δ 处 |f(x)−L| &lt; ε
            </span>
          ) : (
            <span className="edc-verdict edc-verdict-fail">
              仍有超出 ε 的点，δ 太大了（或被卡住了）
            </span>
          )}
        </div>
        <dl className="edc-metrics">
          <div>
            <dt>最大偏差</dt>
            <dd className="mono" style={{ color: verdictColor }}>
              {fmtCompact(result.maxDeviation, 3)}
            </dd>
          </div>
          <div>
            <dt>ε 阈值</dt>
            <dd className="mono">{fmtCompact(epsilon, 3)}</dd>
          </div>
          <div>
            <dt>临界 δ*</dt>
            <dd className="mono" style={{ color: 'var(--del-deep)' }}>
              {autoDelta === null ? '不存在' : fmtCompact(autoDelta, 3)}
            </dd>
          </div>
          {showCounterexample && model.limitExists && (
            <div>
              <dt>呼吸余量</dt>
              <dd className="mono" style={{ color: 'var(--warn)' }}>
                {autoDelta !== null ? `×${(delta / autoDelta).toFixed(2)}` : '—'}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
