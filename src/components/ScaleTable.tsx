import { useState } from 'react';
import { Eyebrow } from './ui';
import { IconScope, IconCheck, IconCross } from './Icons';
import { FUNCTIONS_BY_ID, findDelta } from '../lib/math';
import { fmtCompact } from '../lib/plot';
import './ScaleTable.css';

/** 在若干 ε 下展示对应的临界 δ，让“δ 依赖 ε”这件事可视化 */
const MODEL_ID = 'quadratic';
const EPS_LIST = [1.2, 0.8, 0.4, 0.2, 0.1, 0.05, 0.02];

export default function ScaleTable() {
  const model = FUNCTIONS_BY_ID[MODEL_ID];
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const rows = EPS_LIST.map((eps) => {
    const d = findDelta(model, eps, 1.5);
    return { eps, delta: d };
  });

  // 用第一行做基准，展示 δ/ε 的比值变化
  const base = rows[0];

  return (
    <section className="sct" id="scale">
      <header className="sct-head">
        <Eyebrow icon={<IconScope />} tone="eps">
          δ 是 ε 的函数
        </Eyebrow>
        <h2 className="sct-title">
          把 <span className="mth g-eps">ε</span> 一次次压小，
          <span className="mth g-del">δ</span> 只能被迫跟着变小
        </h2>
        <p className="sct-lede">
          下表以 <span className="mth-up">{model.label}</span> 为例，算出每个 ε
          对应的最大可用 δ。注意 δ 从来不是一个固定的数 —— 它是“给定 ε 之后才能确定”的量，
          这正是极限存在与“函数值趋于某数”之间的严格差别。
        </p>
      </header>

      <div className="sct-table" role="table" aria-label="ε 与临界 δ 的对应关系">
        <div className="sct-row sct-row-head" role="row">
          <span role="columnheader">误差容限 ε</span>
          <span role="columnheader">最大可用 δ*</span>
          <span role="columnheader">δ* 与 ε 之比</span>
          <span role="columnheader">结论</span>
        </div>

        {rows.map((r, i) => {
          const ratio = r.delta === null ? null : r.delta / r.eps;
          const isHover = hoverIdx === i;
          return (
            <div
              key={r.eps}
              className={`sct-row ${isHover ? 'is-hover' : ''}`}
              role="row"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            >
              <span className="sct-cell" role="cell">
                <span className="mth g-eps">ε</span> ={' '}
                <span className="mono">{fmtCompact(r.eps, 3)}</span>
              </span>
              <span className="sct-cell" role="cell">
                {r.delta === null ? (
                  <span className="sct-none">未找到</span>
                ) : (
                  <>
                    <span className="mth g-del">δ</span>* ={' '}
                    <span className="mono">{fmtCompact(r.delta, 4)}</span>
                  </>
                )}
              </span>
              <span className="sct-cell" role="cell">
                <span className="sct-bar-wrap">
                  <span
                    className={`sct-bar ${ratio !== null && ratio < 1 ? 'is-under' : 'is-over'}`}
                    style={{
                      width: `${Math.min(100, ((ratio ?? 0) / 1.4) * 100)}%`,
                    }}
                  />
                </span>
                <span className="mono sct-ratio">
                  {ratio === null ? '—' : `×${ratio.toFixed(3)}`}
                </span>
              </span>
              <span className="sct-cell" role="cell">
                {r.delta === null ? (
                  <span className="sct-flag sct-flag-no">
                    <IconCross /> 不存在
                  </span>
                ) : (
                  <span className="sct-flag sct-flag-ok">
                    <IconCheck /> 可找到
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="sct-foot">
        <p className="sct-note">
          观察“δ* 与 ε 之比”这一列：它随 ε 变小而下降。这说明 <span className="mth-up">{model.label}</span>{' '}
          在 a 点附近变化得越来越快，所以δ必须比 ε 缩小得更快才行。若换成最简单的线性函数，这一比值会是常数
          （恰为 1/斜率），这也是连续线性函数“最好夹”的原因。
        </p>
        <div className="sct-foot-side">
          <p className="sct-foot-k">基准</p>
          <p className="sct-foot-v mono">
            ε = {fmtCompact(base.eps, 2)} → δ* = {fmtCompact(base.delta ?? 0, 4)}
          </p>
        </div>
      </div>
    </section>
  );
}
