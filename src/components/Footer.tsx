import { Eyebrow } from './ui';
import { IconBook, IconInfo } from './Icons';
import './Footer.css';

const RECAP = [
  {
    k: 'ε',
    kTone: 'eps',
    title: '任取 ε > 0',
    body: '对手出的招，代表你能容忍 f(x) 离 L 多远。它必须被“任意”给出。',
  },
  {
    k: 'δ',
    kTone: 'del',
    title: '存在 δ > 0',
    body: '我方交的答案，代表 x 需要多靠近 a。它允许依赖 ε，通常写成 δ = δ(ε)。',
  },
  {
    k: '⟹',
    kTone: 'ink',
    title: '0 < |x−a| < δ ⟹ |f(x)−L| < ε',
    body: '核心不等式。左端排除 x = a，所以 f(a) 的取值完全不影响极限。',
  },
];

export default function Footer() {
  return (
    <footer className="ft">
      <div className="ft-inner">
        <div className="ft-recap">
          <Eyebrow icon={<IconBook />} tone="del">
            一页速记
          </Eyebrow>
          <h2 className="ft-title">离开前，把这三行带走</h2>

          <div className="ft-cards">
            {RECAP.map((r) => (
              <article key={r.title} className={`ft-card ft-card-${r.kTone}`}>
                <span className={`ft-card-k ${r.kTone === 'ink' ? 'ft-card-k-ink' : 'mth'}`}>
                  {r.k}
                </span>
                <h3 className="ft-card-title">{r.title}</h3>
                <p className="ft-card-body">{r.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="ft-meta">
          <div className="ft-note">
            <IconInfo />
            <p>
              本站所有曲线均由浏览器实时计算绘制，δ* 由数值二分搜索得出，与解析解可能有微小误差；
              演示目的是建立直觉，严格证明仍需按定义书写。
            </p>
          </div>

          <div className="ft-sign">
            <span className="ft-sign-mark" aria-hidden>
              <span className="mth">ε</span>
              <span className="ft-sign-slash">/</span>
              <span className="mth">δ</span>
            </span>
            <span className="ft-sign-text">
              ε-δ 实验室 · 面向高等数学初学者的一次可视化尝试
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
