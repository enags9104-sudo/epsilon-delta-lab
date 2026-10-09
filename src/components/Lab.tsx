import { useEffect, useMemo, useRef, useState } from 'react';
import EpsilonDeltaCanvas, {
  EPS_RANGE,
  DEL_RANGE,
  epsToSlider,
  sliderToEps,
  delToSlider,
  sliderToDel,
} from './EpsilonDeltaCanvas';
import { Button, LogSlider, Segmented, Toggle, Eyebrow } from './ui';
import {
  IconPlay,
  IconPause,
  IconReset,
  IconLock,
  IconUnlock,
  IconGrid,
  IconDrag,
  IconFlask,
  IconScope,
  IconWave,
} from './Icons';
import { FUNCTIONS, findDelta, sweep, type FunctionModel } from '../lib/math';
import { fmtCompact } from '../lib/plot';
import './Lab.css';

/** 把功能分组的取景缩放（不同函数视野差异大） */
function functionIcon(id: string) {
  switch (id) {
    case 'linear':
    case 'quadratic':
      return <IconScope />;
    case 'hole':
      return <IconFlask />;
    case 'step':
      return <IconGrid />;
    case 'jump':
      return <IconDrag />;
    case 'highfreq':
      return <IconWave />;
    default:
      return <IconScope />;
  }
}

export default function Lab() {
  const [modelId, setModelId] = useState('hole');
  const model = useMemo<FunctionModel>(
    () => FUNCTIONS.find((m) => m.id === modelId) ?? FUNCTIONS[0],
    [modelId],
  );

  const [epsilon, setEpsilon] = useState(0.7);
  const [delta, setDelta] = useState(0.36);
  const [deltaLocked, setDeltaLocked] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showCoords, setShowCoords] = useState(true);
  const [highlight, setHighlight] = useState<'none' | 'eps' | 'del'>('none');
  const [mode, setMode] = useState<'explore' | 'challenge'>('explore');

  /* ---- 切换函数时重置到一个合理初始值 ---- */
  useEffect(() => {
    setEpsilon(0.7);
    const d = model.limitExists ? findDelta(model, 0.7, 1.5) ?? 0.4 : 0.4;
    setDelta(model.limitExists ? Math.min(1.5, d * 1.12) : 0.4);
    setDeltaLocked(false);
  }, [model]);

  /* ---- 自动搜索 δ 的动画 ---- */
  const searchTimer = useRef<number | null>(null);
  const runAutoSearch = () => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    setSearching(true);
    setDeltaLocked(true);
    const t0 = performance.now();
    const target = findDelta(model, epsilon, 1.5);
    const startDelta = Math.max(delta, 1.2);

    const tick = () => {
      const el = performance.now() - t0;
      const p = Math.min(1, el / 900);
      // easeOutCubic
      const e = 1 - Math.pow(1 - p, 3);
      if (target === null) {
        // 不存在时：反复试探并回弹，传达“找不到”
        const wobble = 0.5 + 0.5 * Math.sin(el / 150);
        setDelta(0.2 + 0.9 * wobble);
      } else {
        setDelta(startDelta + (target - startDelta) * e);
      }
      if (p < 1) {
        searchTimer.current = window.setTimeout(tick, 16);
      } else {
        setSearching(false);
        if (target !== null) setDelta(target);
      }
    };
    tick();
  };

  useEffect(() => () => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
  }, []);

  const result = useMemo(() => sweep(model, delta, epsilon, 3001), [model, delta, epsilon]);
  const critical = useMemo(() => findDelta(model, epsilon, 1.5), [model, epsilon]);
  const maxWindow = useMemo(() => {
    // 极限存在时，整个 ε 范围内 δ 的最大可用值（用于“呼吸”提示）
    const d = findDelta(model, EPS_RANGE[1], 1.5);
    return d;
  }, [model]);

  const epsPos = epsToSlider(epsilon);
  const delPos = delToSlider(delta);

  const verdict = result.satisfied;

  return (
    <section className="lab" id="lab">
      <header className="lab-head">
        <div className="lab-head-text">
          <Eyebrow icon={<IconFlask />}>交互实验室</Eyebrow>
          <h2 className="lab-title">
            亲手调一调 <span className="g-eps mth">ε</span> 和{' '}
            <span className="g-del mth">δ</span>
          </h2>
          <p className="lab-lede">
            拖动画面上的红色把手改变 <span className="mth g-eps">ε</span>（容许误差），拖动蓝色把手改变{' '}
            <span className="mth g-del">δ</span>（靠近半径）。
            把两条带子的交叠区域调到完全“包住”曲线，就说明这一组 ε 找到了合格的 δ。
          </p>
        </div>

        <div className="lab-mode">
          <Segmented
            ariaLabel="实验模式"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'explore', label: '自由探索', icon: <IconDrag /> },
              { value: 'challenge', label: '找茬挑战', icon: <IconGrid /> },
            ]}
          />
        </div>
      </header>

      <div className="lab-grid">
        {/* ==================== 左：函数选择 ==================== */}
        <aside className="lab-fnlist" aria-label="选择函数">
          <p className="lab-fnlist-title">选择一个函数</p>
          <div className="fn-tabs">
            {FUNCTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`fn-tab ${m.id === modelId ? 'is-on' : ''} ${
                  m.limitExists ? '' : 'is-singular'
                }`}
                onClick={() => setModelId(m.id)}
                data-testid={`fn-${m.id}`}
              >
                <span className="fn-tab-ico">{functionIcon(m.id)}</span>
                <span className="fn-tab-body">
                  <span className="fn-tab-label mth-up">{m.label}</span>
                  <span className="fn-tab-note">{m.note}</span>
                </span>
                <span className={`fn-tab-flag ${m.limitExists ? 'is-ok' : 'is-no'}`}>
                  {m.limitExists ? '极限存在' : '不存在'}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* ==================== 中：画布 ==================== */}
        <div className="lab-stage">
          <EpsilonDeltaCanvas
            model={model}
            epsilon={epsilon}
            delta={delta}
            deltaLocked={deltaLocked}
            onEpsilonChange={(v) => setEpsilon(v)}
            onDeltaChange={(v) => {
              setDelta(v);
              setDeltaLocked(false);
            }}
            onDeltaUnlock={() => setDeltaLocked(false)}
            searching={searching}
            showCounterexample={mode === 'challenge'}
            highlight={highlight}
            showCoords={showCoords}
          />

          <div className="lab-stage-bar">
            <div className="lab-stage-note">
              <span className="lab-stage-k">当前函数</span>
              <span className="mth-up lab-stage-f">{model.label}</span>
              <span className="lab-stage-sep">·</span>
              <span className="lab-stage-k">
                a = <span className="mth">{model.a}</span>
              </span>
              {model.limitExists && (
                <>
                  <span className="lab-stage-sep">·</span>
                  <span className="lab-stage-k">
                    L = <span className="mth">{model.L}</span>
                  </span>
                </>
              )}
            </div>
            <div className="lab-stage-hint">
              <IconDrag />
              <span>把手可直接拖动</span>
            </div>
          </div>
        </div>

        {/* ==================== 右：控制台 ==================== */}
        <aside className="lab-control" aria-label="参数控制台">
          <div className="ctl-block">
            <div className="ctl-block-head">
              <span className="ctl-dot ctl-dot-eps" />
              <span className="ctl-block-title">误差容限</span>
            </div>
            <LogSlider
              tone="eps"
              label={<span className="mth g-eps">ε</span>}
              value={epsilon}
              position={epsPos}
              display={fmtCompact(epsilon, 3)}
              onChange={(p) => setEpsilon(sliderToEps(p))}
              hint={`范围 ${EPS_RANGE[0]} – ${EPS_RANGE[1]}`}
            />
            <div
              className="ctl-focus"
              onMouseEnter={() => setHighlight('eps')}
              onMouseLeave={() => setHighlight('none')}
            >
              <span className="ctl-focus-label">快捷档位</span>
              <div className="ctl-chips">
                {[0.1, 0.3, 0.7, 1.2].map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`chip ${Math.abs(epsilon - v) < 1e-6 ? 'is-on' : ''}`}
                    onClick={() => setEpsilon(v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="ctl-block">
            <div className="ctl-block-head">
              <span className="ctl-dot ctl-dot-del" />
              <span className="ctl-block-title">靠近半径</span>
              <button
                type="button"
                className="ctl-lock"
                onClick={() => setDeltaLocked((v) => !v)}
                title={deltaLocked ? '解锁 δ，可手动拖动' : '锁定 δ，只调整 ε 观察是否仍满足'}
                aria-pressed={deltaLocked}
              >
                {deltaLocked ? <IconLock /> : <IconUnlock />}
                <span>{deltaLocked ? '已锁定' : '锁定 δ'}</span>
              </button>
            </div>
            <LogSlider
              tone="del"
              label={<span className="mth g-del">δ</span>}
              value={delta}
              position={delPos}
              display={fmtCompact(delta, 4)}
              onChange={(p) => {
                setDelta(sliderToDel(p));
                setDeltaLocked(false);
              }}
              hint={`范围 ${DEL_RANGE[0]} – ${DEL_RANGE[1]}`}
            />
            <div className="ctl-search">
              <Button
                variant="del"
                icon={searching ? <IconPause /> : <IconPlay />}
                onClick={runAutoSearch}
                full
                disabled={searching}
              >
                {searching ? '搜索中…' : '自动搜索合格 δ'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={<IconReset />}
                onClick={() => {
                  setDeltaLocked(false);
                  const d = model.limitExists ? (findDelta(model, epsilon, 1.5) ?? 0.4) : 0.4;
                  setDelta(model.limitExists ? Math.min(1.5, d * 1.12) : d);
                }}
                full
              >
                回到临界值附近
              </Button>
            </div>
          </div>

          <div className="ctl-block ctl-block-verdict">
            <div className="ctl-verdict" data-state={verdict ? 'pass' : 'fail'}>
              <span className="ctl-verdict-mark">{verdict ? '✓' : '✕'}</span>
              <span className="ctl-verdict-text">
                {verdict ? (
                  <>
                    这组 <span className="mth g-eps">ε</span> / <span className="mth g-del">δ</span>{' '}
                    合格
                  </>
                ) : (
                  <>
                    <span className="mth g-del">δ</span> 偏大，还没夹住
                  </>
                )}
              </span>
            </div>

            {model.limitExists ? (
              <p className="ctl-read">
                {critical === null ? (
                  <>
                    当前 ε 下没有找到可行的 δ —— 试试把 ε 调大一点。
                  </>
                ) : verdict ? (
                  <>
                    当前 ε = <span className="mono">{fmtCompact(epsilon, 3)}</span> 时，最大可用 δ* ≈{' '}
                    <span className="mono g-del">{fmtCompact(critical, 3)}</span>。你取的 δ 是{' '}
                    <span className="mono">{fmtCompact(delta, 3)}</span>。
                  </>
                ) : (
                  <>
                    把 δ 缩到 <span className="mono g-del">{fmtCompact(critical, 3)}</span> 以下即可合格
                    —— 只需再小一点点。
                  </>
                )}
              </p>
            ) : (
              <p className="ctl-read ctl-read-warn">
                这个函数在 a 点的极限<span className="g-eps">不存在</span>。无论 δ 取多小，δ 邻域内总有
                |f(x) − L| 超出 ε 的点 —— 这正是 ε-δ 定义在说“找不到就失败”。
              </p>
            )}

            {model.limitExists && maxWindow !== null && (
              <p className="ctl-read ctl-read-fine">
                极限存在的标志：只要 δ 足够小，任何 ε &gt; 0 都能找到对应的 δ。
              </p>
            )}
          </div>

          <div className="ctl-block ctl-block-opts">
            <Toggle
              checked={showCoords}
              onChange={setShowCoords}
              label="显示坐标刻度"
              hint="辅助判断实际数值"
            />
          </div>
        </aside>
      </div>

      <div className="lab-insight">
        <div className="lab-insight-ico">
          <IconFlask />
        </div>
        <div>
          <p className="lab-insight-title">这一条告诉你什么</p>
          <p className="lab-insight-body">{model.insight}</p>
        </div>
      </div>
    </section>
  );
}
