import { useEffect, useState } from 'react';
import './TopBar.css';

const NAV = [
  { id: 'lab', label: '实验室' },
  { id: 'definition', label: '定义拆解' },
  { id: 'scale', label: 'ε → δ 表' },
  { id: 'challenge', label: '找茬挑战' },
];

export default function TopBar({ onJump }: { onJump: (id: string) => void }) {
  const [active, setActive] = useState('lab');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(
      Boolean,
    ) as HTMLElement[];
    if (!sections.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        // 取最靠上的可见区块
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <nav className={`topbar ${scrolled ? 'is-scrolled' : ''}`} aria-label="页面导航">
      <div className="topbar-inner">
        <button type="button" className="topbar-brand" onClick={() => onJump('top')}>
          <span className="topbar-mark" aria-hidden>
            <span className="mth">ε</span>
            <span className="topbar-mark-slash">/</span>
            <span className="mth">δ</span>
          </span>
          <span className="topbar-name">ε-δ 实验室</span>
        </button>

        <ul className="topbar-nav">
          {NAV.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`topbar-link ${active === n.id ? 'is-on' : ''}`}
                onClick={() => onJump(n.id)}
                aria-current={active === n.id}
              >
                {n.label}
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className="topbar-cta" onClick={() => onJump('lab')}>
          开始实验
        </button>
      </div>
    </nav>
  );
}
