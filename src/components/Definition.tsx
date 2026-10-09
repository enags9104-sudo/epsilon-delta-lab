import { useState } from 'react';
import { Eyebrow, Button } from './ui';
import { IconBook, IconArrowRight, IconArrowLeft, IconTarget, IconSpark, IconInfo } from './Icons';
import { Lim, V, Abs, Eps, Del } from './Math';
import './Definition.css';

interface Step {
  id: string;
  /** 游戏化的角色视角 */
  voice: '我方' | '对手' | '裁判';
  title: string;
  /** 公式片段（用 span 分段高亮） */
  formula: React.ReactNode;
  body: string;
  /** 画布示意说明 */
  visual: string;
  icon: React.ReactNode;
}

const STEPS: Step[] = [
  {
    id: 'goal',
    voice: '我方',
    title: '先定下一个小目标',
    formula: (
      <>
        要证明 <Lim to={<>x→a</>} /> <V>f</V>(<V>x</V>) = <V>L</V>
      </>
    ),
    body:
      '我们想说的其实是一句很朴素的话：当 x 离 a 足够近时，f(x) 就离 L 足够近。问题在于，“足够近”是模糊的。ε-δ 语言的全部工作，就是把这个模糊说法换成两个可以精确比较的正数 ε 与 δ。',
    visual: '画布上的 a 与 L 就是这两个“靶心”。',
    icon: <IconTarget />,
  },
  {
    id: 'eps',
    voice: '对手',
    title: '对手先出招：指定 ε',
    formula: (
      <>
        任取 <Eps /> &gt; 0 &nbsp;——（误差容限）
      </>
    ),
    body:
      'ε 是“你能容忍 f(x) 偏离 L 多少”。注意它由对手任意给出，可以非常大，也可以非常小（比如 0.001），而你必须照单全收。它的几何含义：在 y 轴上以 L 为中心、宽度为 2ε 的一条水平带。',
    visual: '红色水平带 = ε 带。它规定了“允许的输出范围”。',
    icon: <IconTarget />,
  },
  {
    id: 'del',
    voice: '我方',
    title: '我方回应：找一个 δ',
    formula: (
      <>
        存在 <Del /> &gt; 0，使得 0 &lt; <Abs>
          <V>x</V> − <V>a</V>
        </Abs> &lt; <Del /> ⟹ <Abs>
          <V>f</V>(<V>x</V>) − <V>L</V>
        </Abs> &lt; <Eps />
      </>
    ),
    body:
      'δ 是我们手里的“靠近半径”：只要求 x 落在 a 的 δ 邻域内，就能保证 f(x) 落进 ε 带。几何含义：在 x 轴上以 a 为中心、宽度为 2δ 的一条竖直带。注意定义只要求“存在”某个 δ，不需要它是最大的那个。',
    visual: '蓝色竖直带 = δ 带。δ 带与 ε 带的交叠区，就是被“管住”的区域。',
    icon: <IconSpark />,
  },
  {
    id: 'strict',
    voice: '裁判',
    title: '关键细节：为什么是 0 < |x − a|',
    formula: (
      <>
        0 &lt; <Abs>
          <V>x</V> − <V>a</V>
        </Abs> &lt; <Del />
      </>
    ),
    body:
      '左端的不等号把 x = a 本身排除了。这意味着 f(a) 取值多少、有没有定义，都与极限无关。前面那个 (x²−4)/(x−2) 在 a=2 处“挖了个洞”，但极限照样是 4 —— 画布上的空心圆就是这个意思。',
    visual: '观察空心圆所在的位置：它永远不在曲线上，却正是极限要逼近的点。',
    icon: <IconInfo />,
  },
  {
    id: 'win',
    voice: '我方',
    title: '当所有 ε 都能被回应',
    formula: (
      <>
        对<span className="g-ok">任意</span> <Eps /> &gt; 0，
        都<span className="g-ok">存在</span> <Del /> &gt; 0 …
      </>
    ),
    body:
      '一个 ε 找到 δ 不算赢，要“任意 ε 都能找到”才算极限存在。这正是把 ε 一路调小、δ 也必须跟着变小的原因：δ 的大小依赖 ε。当你把 ε 压到 0.05，δ 也得重新找一个更小的值。',
    visual: '把 ε 滑到很小，再点“自动搜索合格 δ”，看 δ 如何被迫一起缩小。',
    icon: <IconTarget />,
  },
  {
    id: 'fail',
    voice: '对手',
    title: '反例：什么时候找不到 δ',
    formula: (
      <>
        ∃ <Eps /> &gt; 0，使<b>任何</b> <Del /> &gt; 0 都失败
      </>
    ),
    body:
      '跳变函数、取整函数、sin(1/(x−a)) 这类函数，无论如何缩小 δ，邻域内总有函数值冲出 ε 带。只要对手能举出一个这样的 ε，极限就不存在。这是 ε-δ 定义的反面写法。',
    visual: '切换到“取整函数”或“高频振荡”，把 ε 调小，点搜索 —— 蓝色的 δ 会来回摆动却稳不下来。',
    icon: <IconBook />,
  },
];

const VOICE_TONE: Record<Step['voice'], string> = {
  我方: 'ok',
  对手: 'eps',
  裁判: 'del',
};

export default function Definition() {
  const [idx, setIdx] = useState(0);
  const step = STEPS[idx];

  return (
    <section className="def" id="definition">
      <header className="def-head">
        <Eyebrow icon={<IconBook />} tone="del">
          逐步拆解 · 严格定义
        </Eyebrow>
        <h2 className="def-title">
          ε-δ 定义，其实是<span className="def-title-em">一场博弈</span>
        </h2>
        <p className="def-lede">
          把定义里的每一句话拆成六步读一遍。你会发现它不是“天书”，而是一场你来我往的攻防：对手不断收紧
          ε，我们不断交出一个能用的 δ。
        </p>
      </header>

      {/* ---------- 步骤轨道 ---------- */}
      <ol className="def-rail" aria-label="定义拆解步骤">
        {STEPS.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={`def-node ${i === idx ? 'is-on' : ''} ${i < idx ? 'is-done' : ''}`}
              onClick={() => setIdx(i)}
              aria-current={i === idx}
              data-testid={`def-node-${i}`}
            >
              <span className="def-node-num mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="def-node-label">{s.title}</span>
            </button>
          </li>
        ))}
      </ol>

      {/* ---------- 步骤详情 ---------- */}
      <div className={`def-panel def-voice-${VOICE_TONE[step.voice]}`} key={step.id}>
        <div className="def-panel-main">
          <div className="def-voice-row">
            <span className={`def-voice def-voice-${VOICE_TONE[step.voice]}`}>
              {step.icon}
              <span>{step.voice}视角</span>
            </span>
            <span className="def-step-count mono">
              {String(idx + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
            </span>
          </div>

          <h3 className="def-panel-title">{step.title}</h3>

          <div className="def-formula">
            <p>{step.formula}</p>
          </div>

          <p className="def-body">{step.body}</p>

          <div className="def-visual">
            <span className="def-visual-tag">在画布上</span>
            <p>{step.visual}</p>
          </div>
        </div>

        <div className="def-panel-nav">
          <Button
            variant="outline"
            icon={<IconArrowLeft />}
            onClick={() => setIdx((v) => Math.max(0, v - 1))}
            disabled={idx === 0}
          >
            上一步
          </Button>
          <div className="def-dots" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.id} className={`def-dot ${i === idx ? 'is-on' : ''}`} />
            ))}
          </div>
          <Button
            variant="solid"
            icon={idx === STEPS.length - 1 ? <IconBook /> : <IconArrowRight />}
            onClick={() => setIdx((v) => (v === STEPS.length - 1 ? 0 : v + 1))}
          >
            {idx === STEPS.length - 1 ? '回到开头' : '下一步'}
          </Button>
        </div>
      </div>

      {/* ---------- 完整定义原文 ---------- */}
      <div className="def-statement">
        <div className="def-statement-side">
          <Eyebrow tone="eps">完整定义</Eyebrow>
          <p className="def-statement-note">
            这就是教材上那段最容易被跳过的黑体字，现在逐字读一遍。
          </p>
        </div>
        <blockquote className="def-quote">
          <p>
            设函数 <V>f</V> 在点 <V>a</V> 的某个去心邻域内有定义。若存在常数 <V>L</V>
            ，使得对<span className="g-eps">任意给定的</span> <Eps /> &gt; 0，总
            <span className="g-del">存在</span> <Del /> &gt; 0，满足
          </p>
          <p className="def-quote-eq">
            0 &lt; <Abs>
              <V>x</V> − <V>a</V>
            </Abs> &lt; <Del /> &nbsp;⟹&nbsp; <Abs>
              <V>f</V>(<V>x</V>) − <V>L</V>
            </Abs> &lt; <Eps />
          </p>
          <p>
            则称 <V>L</V> 为函数 <V>f</V> 当 <V>x</V> → <V>a</V> 时的极限，记作
          </p>
          <p className="def-quote-eq def-quote-final">
            <Lim to={<>x→a</>} /> <V>f</V>(<V>x</V>) = <V>L</V>
          </p>
        </blockquote>
      </div>
    </section>
  );
}
