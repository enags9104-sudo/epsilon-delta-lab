/**
 * 数学排版小组件
 * ----------------------------------------------------------
 * 用纯 HTML/CSS 正确渲染极限算子、下标、分式，
 * 避免依赖 KaTeX 这类重型库，同时保持教材级观感。
 */
import type { ReactNode } from 'react';

/** 直立的数学算子：lim / sin / max … */
export function Op({ children }: { children: ReactNode }) {
  return <span className="op">{children}</span>;
}

/** 变量（斜体） */
export function V({ children }: { children: ReactNode }) {
  return <span className="mth">{children}</span>;
}

/** 极限：lim_{x→a} */
export function Lim({ to }: { to: ReactNode }) {
  return (
    <span className="lim">
      <Op>lim</Op>
      <span className="op-sub">{to}</span>
    </span>
  );
}

/** 行内分式 */
export function Frac({ num, den }: { num: ReactNode; den: ReactNode }) {
  return (
    <span className="frac">
      <span className="frac-num">{num}</span>
      <span className="frac-den">{den}</span>
    </span>
  );
}

/** 绝对值 |…| */
export function Abs({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="abs-bar">|</span>
      {children}
      <span className="abs-bar">|</span>
    </>
  );
}

/** ε 变量 */
export function Eps() {
  return <span className="mth g-eps">ε</span>;
}

/** δ 变量 */
export function Del() {
  return <span className="mth g-del">δ</span>;
}
