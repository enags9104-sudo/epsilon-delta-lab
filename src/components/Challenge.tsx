import { useMemo, useState, useEffect } from 'react';
import { Eyebrow, Button } from './ui';
import { IconCheck, IconCross, IconSwords, IconArrowRight, IconReset, IconSpark } from './Icons';
import { FUNCTIONS_BY_ID, findDelta, type FunctionModel } from '../lib/math';
import { fmtCompact } from '../lib/plot';
import './Challenge.css';

interface Round {
  fnId: string;
  epsilon: number;
  /** 四个候选 δ */
  options: number[];
  correctIndex: number;
  /** 临界 δ*（极限不存在时为 null），答题后才揭示 */
  crit: number | null;
  prompt: string;
  explain: string;
}

/** 依据当前函数与 ε，动态生成一题，且候选值保证有唯一最佳答案 */
function makeRound(fnId: string, epsilon: number, seed: number): Round {
  const model: FunctionModel = FUNCTIONS_BY_ID[fnId] ?? FUNCTIONS_BY_ID.hole;
  const crit = findDelta(model, epsilon, 1.5);

  if (crit === null || !model.limitExists) {
    // 极限不存在：正确答案是“没有合格 δ”
    const opts = [0.5, 0.2, 0.05, 0.01];
    return {
      fnId,
      epsilon,
      options: opts,
      correctIndex: -1, // 特指“都不行”
      crit: null,
      prompt: `当 ε = ${fmtCompact(epsilon, 3)} 时，能否找到合格的 δ？`,
      explain: `${model.label} 在 a 点极限不存在。无论 δ 取多小，邻域内总有函数值冲出 ε 带，所以四个选项都不合格 —— 这类题的答案就是“找不到”。`,
    };
  }

  // 正确答案：略小于临界值
  const good = crit * 0.86;
  const bad1 = crit * 1.45; // 明显太大
  const bad2 = crit * 2.6; // 更大
  const bad3 = crit * 0.12; // 太小（虽然合格，但不是“能用的最大”，改为不合格选项）
  // 让三个错误项都是“不合格”（大于临界），只保留一个正确项更清晰
  const opts = [good, bad1, bad2, crit * 3.2];
  // 洗牌（用 seed 保证确定性）
  const order = [0, 1, 2, 3].sort((a, b) => ((a * 9301 + seed * 49297) % 233280) - ((b * 9301 + seed * 49297) % 233280));
  const shuffled = order.map((i) => opts[i]);
  const correctIndex = shuffled.indexOf(good);
  void bad3;

  return {
    fnId,
    epsilon,
    options: shuffled,
    correctIndex,
    crit,
    prompt: `当 ε = ${fmtCompact(epsilon, 3)} 时，哪一个 δ 是合格的？`,
    explain: `临界值 δ* ≈ ${fmtCompact(crit, 3)}。只要 δ ≤ δ* 且 δ > 0，就能保证 0 < |x − a| < δ 时 |f(x) − L| < ε。选项中只有 ${fmtCompact(
      good,
      4,
    )} 满足，其余三个都超过了临界值。`,
  };
}

const ROUND_PLAN: { fnId: string; epsilon: number }[] = [
  { fnId: 'linear', epsilon: 0.6 },
  { fnId: 'quadratic', epsilon: 0.4 },
  { fnId: 'hole', epsilon: 0.25 },
  { fnId: 'jump', epsilon: 0.3 },
  { fnId: 'step', epsilon: 0.2 },
  { fnId: 'highfreq', epsilon: 0.15 },
];

export default function Challenge() {
  const [roundIdx, setRoundIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [seed, setSeed] = useState(7);
  const [score, setScore] = useState({ correct: 0, answered: 0 });
  const [streak, setStreak] = useState(0);

  const plan = ROUND_PLAN[roundIdx % ROUND_PLAN.length];
  const round = useMemo(
    () => makeRound(plan.fnId, plan.epsilon, seed + roundIdx * 13),
    [plan, seed, roundIdx],
  );
  const model = FUNCTIONS_BY_ID[round.fnId];

  useEffect(() => {
    setPicked(null);
  }, [roundIdx]);

  const answered = picked !== null;
  const isCorrect = answerCorrect(picked, round);

  const handlePick = (i: number) => {
    if (answered) return;
    setPicked(i);
    const ok = answerCorrect(i, round);
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), answered: s.answered + 1 }));
    setStreak((s) => (ok ? s + 1 : 0));
  };

  const next = () => {
    setRoundIdx((v) => v + 1);
    setSeed((s) => s + 17);
  };

  return (
    <section className="chg" id="challenge">
      <header className="chg-head">
        <div className="chg-head-text">
          <Eyebrow icon={<IconSwords />} tone="eps">
            找茬挑战
          </Eyebrow>
          <h2 className="chg-title">
            给你一个 <span className="mth g-eps">ε</span>，你能交出合格的{' '}
            <span className="mth g-del">δ</span> 吗
          </h2>
          <p className="chg-lede">
            每一题都给出一个 ε 和四个候选 δ。合格的 δ 必须让整个 δ
            邻域内的函数值都落进 ε 带。注意：有些题的正确答案是“都不行”。
          </p>
        </div>

        <div className="chg-score" aria-live="polite">
          <div className="chg-score-item">
            <span className="chg-score-num mono">
              {score.correct}
              <span className="chg-score-den">/{score.answered}</span>
            </span>
            <span className="chg-score-lbl">答对</span>
          </div>
          <div className="chg-score-item">
            <span className="chg-score-num mono chg-score-streak">{streak}</span>
            <span className="chg-score-lbl">连击</span>
          </div>
        </div>
      </header>

      <div className="chg-card">
        {/* ---------- 题干 ---------- */}
        <div className="chg-qhead">
          <div className="chg-qleft">
            <span className="chg-qno mono">
              Q{String((roundIdx % ROUND_PLAN.length) + 1).padStart(2, '0')}
            </span>
            <div className="chg-qfn">
              <span className="chg-qfn-label mth-up">{model.label}</span>
              <span className="chg-qfn-a">
                a = <span className="mth">{model.a}</span>
                {model.limitExists && (
                  <>
                    {' '}
                    · L = <span className="mth">{model.L}</span>
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="chg-eps-badge">
            <span className="chg-eps-badge-k mth">ε</span>
            <span className="chg-eps-badge-v mono">{fmtCompact(round.epsilon, 3)}</span>
          </div>
        </div>

        <p className="chg-prompt">{round.prompt}</p>

        {/* ---------- 选项 ---------- */}
        <div className="chg-options" role="group" aria-label="选择合格的 δ">
          {round.options.map((opt, i) => {
            const revealed = answered;
            const isRight = i === round.correctIndex;
            const isPicked = picked === i;
            let state = '';
            if (revealed && isRight) state = 'is-right';
            else if (revealed && isPicked) state = 'is-wrong';
            else if (revealed) state = 'is-dim';

            return (
              <button
                key={i}
                type="button"
                className={`chg-option ${state}`}
                onClick={() => handlePick(i)}
                disabled={answered}
                data-testid={`option-${i}`}
                aria-label={`δ = ${fmtCompact(opt, 4)}`}
              >
                <span className="chg-option-key mono">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="chg-option-body">
                  <span className="chg-option-val mono">
                    <span className="mth g-del">δ</span> = {fmtCompact(opt, 4)}
                  </span>
                  <span className="chg-option-ratio">
                    {revealed && round.crit !== null
                      ? `与临界值之比 ×${(opt / Math.max(1e-9, round.crit)).toFixed(2)}`
                      : '合格与否，答题后见分晓'}
                  </span>
                </span>
                <span className="chg-option-mark">
                  {revealed && isRight && <IconCheck />}
                  {revealed && isPicked && !isRight && <IconCross />}
                </span>
              </button>
            );
          })}

          {/* 第五项：都不行 */}
          <button
            type="button"
            className={`chg-option chg-option-none ${
              !answered
                ? ''
                : round.correctIndex === -1
                  ? 'is-right'
                  : picked === -1
                    ? 'is-wrong'
                    : 'is-dim'
            }`}
            onClick={() => {
              if (answered) return;
              setPicked(-1);
              const ok = round.correctIndex === -1;
              setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), answered: s.answered + 1 }));
              setStreak((s) => (ok ? s + 1 : 0));
            }}
            disabled={answered}
            data-testid="option-none"
          >
            <span className="chg-option-key mono">E</span>
            <span className="chg-option-body">
              <span className="chg-option-val">找不到合格的 δ</span>
              <span className="chg-option-ratio">极限不存在时选这一项</span>
            </span>
            <span className="chg-option-mark">
              {answered && round.correctIndex === -1 && <IconCheck />}
              {answered && picked === -1 && round.correctIndex !== -1 && <IconCross />}
            </span>
          </button>
        </div>

        {/* ---------- 解析 ---------- */}
        {answered && (
          <div className={`chg-explain ${isCorrect ? 'is-ok' : 'is-no'}`}>
            <div className="chg-explain-head">
              {isCorrect ? <IconCheck /> : <IconCross />}
              <span>{isCorrect ? '答对了' : '再看一眼'}</span>
            </div>
            <p>{round.explain}</p>
          </div>
        )}

        {/* ---------- 底部操作 ---------- */}
        <div className="chg-foot">
          <div className="chg-foot-hint">
            <IconSpark />
            <span>
              真正的 ε-δ 证明中，δ 往往写成 ε 的表达式，例如 δ = ε/2。
            </span>
          </div>
          <div className="chg-foot-btns">
            <Button
              variant="ghost"
              icon={<IconReset />}
              onClick={() => {
                setPicked(null);
                setSeed((s) => s + 31);
              }}
              disabled={!answered}
            >
              换一组数
            </Button>
            <Button variant="solid" icon={<IconArrowRight />} onClick={next}>
              下一题
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 判定选项是否为正确答案（correctIndex = -1 表示“都不行”） */
function answerCorrect(picked: number | null, round: Round): boolean {
  if (picked === null) return false;
  return picked === round.correctIndex;
}
